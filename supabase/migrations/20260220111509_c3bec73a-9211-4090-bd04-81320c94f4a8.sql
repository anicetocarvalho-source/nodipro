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

  SELECT COALESCE(SUM(sp.price_monthly), 0) INTO v_mrr
  FROM organization_subscriptions os
  JOIN subscription_plans sp ON sp.id = os.plan_id
  WHERE os.status = 'active';

  v_churn_rate := CASE WHEN v_total_orgs > 0
    THEN (
      SELECT COUNT(*)::numeric FROM organization_subscriptions WHERE status IN ('expired', 'cancelled')
    ) / v_total_orgs * 100
    ELSE 0 END;

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
          to_char(m.month, 'YYYY-MM') AS month,
          (SELECT COUNT(*) FROM organizations o WHERE date_trunc('month', o.created_at) = m.month) AS new_orgs,
          COALESCE((
            SELECT SUM(pr.amount)
            FROM payment_references pr
            WHERE pr.status = 'confirmed'
              AND date_trunc('month', pr.confirmed_at) = m.month
          ), 0) AS revenue
        FROM generate_series(
          date_trunc('month', now()) - interval '5 months',
          date_trunc('month', now()),
          interval '1 month'
        ) AS m(month)
      ) mg
    )
  ) INTO result;

  RETURN result;
END;
$$;