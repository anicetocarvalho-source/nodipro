
-- ============================================================
-- 1. RPC: get_org_detail_for_admin — Detalhe de organização
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_org_detail_for_admin(_org_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result jsonb;
BEGIN
  IF NOT public.is_platform_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT jsonb_build_object(
    'organization', (
      SELECT row_to_json(o_data)
      FROM (
        SELECT o.id, o.name, o.slug, o.entity_type::text, o.description, o.website, o.country,
               o.created_at, o.logo_url, o.size::text,
               s.name AS sector_name,
               pv.name AS province_name
        FROM organizations o
        LEFT JOIN sectors s ON s.id = o.sector_id
        LEFT JOIN provinces pv ON pv.id = o.province_id
        WHERE o.id = _org_id
      ) o_data
    ),
    'members', (
      SELECT COALESCE(jsonb_agg(row_to_json(m_data) ORDER BY m_data.joined_at), '[]'::jsonb)
      FROM (
        SELECT om.user_id, om.role::text, om.joined_at, om.is_primary,
               p.full_name, p.avatar_url
        FROM organization_members om
        LEFT JOIN profiles p ON p.user_id = om.user_id
        WHERE om.organization_id = _org_id
      ) m_data
    ),
    'projects', (
      SELECT COALESCE(jsonb_agg(row_to_json(p_data) ORDER BY p_data.created_at DESC), '[]'::jsonb)
      FROM (
        SELECT pr.id, pr.name, pr.status, pr.progress, pr.budget, pr.spent, pr.created_at
        FROM projects pr
        WHERE pr.organization_id = _org_id
      ) p_data
    ),
    'payments', (
      SELECT COALESCE(jsonb_agg(row_to_json(pay_data) ORDER BY pay_data.created_at DESC), '[]'::jsonb)
      FROM (
        SELECT pr.id, pr.reference_code, pr.amount, pr.currency, pr.status::text,
               pr.billing_period, pr.created_at, pr.confirmed_at,
               sp.name AS plan_name
        FROM payment_references pr
        LEFT JOIN subscription_plans sp ON sp.id = pr.plan_id
        WHERE pr.organization_id = _org_id
      ) pay_data
    ),
    'subscription', (
      SELECT row_to_json(sub_data)
      FROM (
        SELECT os.id, os.status::text, os.trial_ends_at, os.current_period_start,
               os.current_period_end, os.payment_method::text,
               sp.name AS plan_name, sp.slug AS plan_slug,
               sp.max_projects, sp.max_members, sp.max_storage_gb, sp.max_portfolios
        FROM organization_subscriptions os
        JOIN subscription_plans sp ON sp.id = os.plan_id
        WHERE os.organization_id = _org_id
        ORDER BY os.created_at DESC LIMIT 1
      ) sub_data
    ),
    'quotas', (
      SELECT jsonb_build_object(
        'projects', (SELECT COUNT(*) FROM projects WHERE organization_id = _org_id),
        'members', (SELECT COUNT(*) FROM organization_members WHERE organization_id = _org_id),
        'portfolios', (SELECT COUNT(*) FROM portfolios WHERE organization_id = _org_id)
      )
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- ============================================================
-- 2. RPC: get_platform_metrics — Actualizada com MRR, churn, ARPU, monthly_growth
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_platform_metrics()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result jsonb;
  v_active_subs INTEGER;
  v_total_orgs INTEGER;
  v_mrr NUMERIC;
  v_churn_rate NUMERIC;
  v_arpu NUMERIC;
BEGIN
  IF NOT public.is_platform_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT COUNT(*) INTO v_total_orgs FROM organizations;
  SELECT COUNT(*) INTO v_active_subs FROM organization_subscriptions WHERE status = 'active';

  -- MRR: sum of monthly prices for active subscriptions
  SELECT COALESCE(SUM(sp.price_monthly), 0) INTO v_mrr
  FROM organization_subscriptions os
  JOIN subscription_plans sp ON sp.id = os.plan_id
  WHERE os.status = 'active';

  -- Churn rate: expired+cancelled / total orgs
  v_churn_rate := CASE WHEN v_total_orgs > 0
    THEN (
      SELECT COUNT(*)::numeric FROM organization_subscriptions WHERE status IN ('expired', 'cancelled')
    ) / v_total_orgs * 100
    ELSE 0 END;

  -- ARPU
  v_arpu := CASE WHEN v_active_subs > 0
    THEN v_mrr / v_active_subs
    ELSE 0 END;

  SELECT jsonb_build_object(
    'total_organizations', v_total_orgs,
    'total_members', (SELECT COUNT(*) FROM organization_members),
    'active_subscriptions', v_active_subs,
    'trial_subscriptions', (SELECT COUNT(*) FROM organization_subscriptions WHERE status = 'trial'),
    'expired_subscriptions', (SELECT COUNT(*) FROM organization_subscriptions WHERE status = 'expired'),
    'pending_payments', (SELECT COUNT(*) FROM payment_references WHERE status = 'pending'),
    'confirmed_payments', (SELECT COUNT(*) FROM payment_references WHERE status = 'confirmed'),
    'total_revenue', (SELECT COALESCE(SUM(amount), 0) FROM payment_references WHERE status = 'confirmed'),
    'mrr', v_mrr,
    'churn_rate', ROUND(v_churn_rate, 1),
    'arpu', ROUND(v_arpu, 0),
    'plan_distribution', (
      SELECT COALESCE(jsonb_agg(row_to_json(d)), '[]'::jsonb)
      FROM (
        SELECT sp.name AS plan_name, sp.slug AS plan_slug, COUNT(os.id) AS count
        FROM subscription_plans sp
        LEFT JOIN organization_subscriptions os ON os.plan_id = sp.id AND os.status IN ('active', 'trial')
        GROUP BY sp.name, sp.slug
        ORDER BY sp.slug
      ) d
    ),
    'monthly_growth', (
      SELECT COALESCE(jsonb_agg(row_to_json(mg) ORDER BY mg.month), '[]'::jsonb)
      FROM (
        SELECT
          to_char(date_trunc('month', o.created_at), 'YYYY-MM') AS month,
          COUNT(*) AS new_orgs,
          COALESCE((
            SELECT SUM(pr.amount)
            FROM payment_references pr
            WHERE pr.status = 'confirmed'
              AND date_trunc('month', pr.confirmed_at) = date_trunc('month', o.created_at)
          ), 0) AS revenue
        FROM organizations o
        WHERE o.created_at >= date_trunc('month', now()) - interval '5 months'
        GROUP BY date_trunc('month', o.created_at)
      ) mg
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- ============================================================
-- 3. RPCs: CRUD de planos de subscrição
-- ============================================================
CREATE OR REPLACE FUNCTION public.platform_create_plan(
  _name text, _slug text, _description text,
  _price_monthly numeric, _price_yearly numeric, _currency text,
  _max_projects integer, _max_members integer, _max_storage_gb integer,
  _max_portfolios integer, _features jsonb, _sort_order integer
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF NOT public.is_platform_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  INSERT INTO subscription_plans (name, slug, description, price_monthly, price_yearly, currency,
    max_projects, max_members, max_storage_gb, max_portfolios, features, sort_order)
  VALUES (_name, _slug, _description, _price_monthly, _price_yearly, _currency,
    _max_projects, _max_members, _max_storage_gb, _max_portfolios, _features, _sort_order)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.platform_update_plan(
  _plan_id uuid, _name text, _slug text, _description text,
  _price_monthly numeric, _price_yearly numeric, _currency text,
  _max_projects integer, _max_members integer, _max_storage_gb integer,
  _max_portfolios integer, _features jsonb, _sort_order integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.is_platform_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  UPDATE subscription_plans SET
    name = _name, slug = _slug, description = _description,
    price_monthly = _price_monthly, price_yearly = _price_yearly, currency = _currency,
    max_projects = _max_projects, max_members = _max_members, max_storage_gb = _max_storage_gb,
    max_portfolios = _max_portfolios, features = _features, sort_order = _sort_order
  WHERE id = _plan_id;

  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.platform_toggle_plan(_plan_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.is_platform_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  UPDATE subscription_plans SET is_active = NOT is_active WHERE id = _plan_id;
  RETURN FOUND;
END;
$$;

-- ============================================================
-- 4. RPC: get_platform_audit_logs — logs de auditoria com filtros e paginação
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_platform_audit_logs(
  _limit integer DEFAULT 50,
  _offset integer DEFAULT 0,
  _action_filter text DEFAULT NULL,
  _target_filter text DEFAULT NULL,
  _search text DEFAULT NULL,
  _date_from timestamptz DEFAULT NULL,
  _date_to timestamptz DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result jsonb;
  v_total bigint;
BEGIN
  IF NOT public.is_platform_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT COUNT(*) INTO v_total
  FROM audit_logs al
  WHERE (_action_filter IS NULL OR al.action = _action_filter)
    AND (_target_filter IS NULL OR al.target_type = _target_filter)
    AND (_search IS NULL OR al.user_name ILIKE '%' || _search || '%' OR al.target_name ILIKE '%' || _search || '%')
    AND (_date_from IS NULL OR al.created_at >= _date_from)
    AND (_date_to IS NULL OR al.created_at <= _date_to);

  SELECT jsonb_build_object(
    'total', v_total,
    'logs', (
      SELECT COALESCE(jsonb_agg(row_to_json(l)), '[]'::jsonb)
      FROM (
        SELECT al.id, al.action, al.target_type, al.target_id, al.target_name,
               al.user_id, al.user_name, al.old_value, al.new_value,
               al.created_at, al.ip_address
        FROM audit_logs al
        WHERE (_action_filter IS NULL OR al.action = _action_filter)
          AND (_target_filter IS NULL OR al.target_type = _target_filter)
          AND (_search IS NULL OR al.user_name ILIKE '%' || _search || '%' OR al.target_name ILIKE '%' || _search || '%')
          AND (_date_from IS NULL OR al.created_at >= _date_from)
          AND (_date_to IS NULL OR al.created_at <= _date_to)
        ORDER BY al.created_at DESC
        LIMIT _limit OFFSET _offset
      ) l
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- ============================================================
-- 5. RLS: audit_logs SELECT for platform admins
-- ============================================================
CREATE POLICY "Platform admins can view all audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (public.is_platform_admin(auth.uid()));
