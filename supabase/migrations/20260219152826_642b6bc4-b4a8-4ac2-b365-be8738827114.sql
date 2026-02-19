
-- Table for platform-level admins (separate from org admins)
CREATE TABLE public.platform_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;

-- Only platform admins can see this table
CREATE POLICY "Platform admins can view" ON public.platform_admins
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Security definer function to check platform admin status
CREATE OR REPLACE FUNCTION public.is_platform_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.platform_admins
    WHERE user_id = _user_id
  )
$$;

-- Get all organizations with counts for superadmin
CREATE OR REPLACE FUNCTION public.get_all_organizations()
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  entity_type text,
  sector_name text,
  created_at timestamptz,
  member_count bigint,
  project_count bigint,
  plan_name text,
  plan_slug text,
  subscription_status text,
  trial_ends_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_platform_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT
    o.id,
    o.name,
    o.slug,
    o.entity_type::text,
    s.name AS sector_name,
    o.created_at,
    (SELECT COUNT(*) FROM organization_members om WHERE om.organization_id = o.id) AS member_count,
    (SELECT COUNT(*) FROM projects p WHERE p.organization_id = o.id) AS project_count,
    sp.name AS plan_name,
    sp.slug AS plan_slug,
    os.status::text AS subscription_status,
    os.trial_ends_at
  FROM organizations o
  LEFT JOIN sectors s ON s.id = o.sector_id
  LEFT JOIN LATERAL (
    SELECT os2.* FROM organization_subscriptions os2
    WHERE os2.organization_id = o.id
    ORDER BY os2.created_at DESC LIMIT 1
  ) os ON true
  LEFT JOIN subscription_plans sp ON sp.id = os.plan_id
  ORDER BY o.created_at DESC;
END;
$$;

-- Get all pending payments globally
CREATE OR REPLACE FUNCTION public.get_all_pending_payments()
RETURNS TABLE (
  id uuid,
  organization_id uuid,
  organization_name text,
  plan_id text,
  plan_name text,
  reference_code text,
  amount numeric,
  currency text,
  billing_period text,
  status text,
  created_at timestamptz,
  expires_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_platform_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT
    pr.id,
    pr.organization_id,
    o.name AS organization_name,
    pr.plan_id::text,
    sp.name AS plan_name,
    pr.reference_code,
    pr.amount,
    pr.currency,
    pr.billing_period,
    pr.status::text,
    pr.created_at,
    pr.expires_at
  FROM payment_references pr
  JOIN organizations o ON o.id = pr.organization_id
  LEFT JOIN subscription_plans sp ON sp.id = pr.plan_id
  ORDER BY pr.created_at DESC;
END;
$$;

-- Get platform metrics
CREATE OR REPLACE FUNCTION public.get_platform_metrics()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  IF NOT public.is_platform_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT jsonb_build_object(
    'total_organizations', (SELECT COUNT(*) FROM organizations),
    'total_members', (SELECT COUNT(*) FROM organization_members),
    'active_subscriptions', (SELECT COUNT(*) FROM organization_subscriptions WHERE status = 'active'),
    'trial_subscriptions', (SELECT COUNT(*) FROM organization_subscriptions WHERE status = 'trial'),
    'expired_subscriptions', (SELECT COUNT(*) FROM organization_subscriptions WHERE status = 'expired'),
    'pending_payments', (SELECT COUNT(*) FROM payment_references WHERE status = 'pending'),
    'confirmed_payments', (SELECT COUNT(*) FROM payment_references WHERE status = 'confirmed'),
    'total_revenue', (SELECT COALESCE(SUM(amount), 0) FROM payment_references WHERE status = 'confirmed'),
    'plan_distribution', (
      SELECT COALESCE(jsonb_agg(row_to_json(d)), '[]'::jsonb)
      FROM (
        SELECT sp.name AS plan_name, sp.slug AS plan_slug, COUNT(os.id) AS count
        FROM subscription_plans sp
        LEFT JOIN organization_subscriptions os ON os.plan_id = sp.id AND os.status IN ('active', 'trial')
        GROUP BY sp.name, sp.slug
        ORDER BY sp.slug
      ) d
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- Allow platform admins to confirm/cancel any payment
CREATE OR REPLACE FUNCTION public.platform_confirm_payment(_payment_id uuid, _notes text DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment RECORD;
BEGIN
  IF NOT public.is_platform_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT * INTO v_payment FROM payment_references WHERE id = _payment_id AND status = 'pending';
  IF NOT FOUND THEN RETURN false; END IF;

  UPDATE payment_references SET
    status = 'confirmed',
    confirmed_by = auth.uid(),
    confirmed_at = now(),
    notes = _notes
  WHERE id = _payment_id;

  -- Activate subscription
  UPDATE organization_subscriptions SET
    plan_id = v_payment.plan_id,
    status = 'active',
    payment_method = 'reference_multicaixa',
    updated_at = now()
  WHERE organization_id = v_payment.organization_id
    AND status IN ('trial', 'active')
  ;

  IF NOT FOUND THEN
    INSERT INTO organization_subscriptions (organization_id, plan_id, status, payment_method)
    VALUES (v_payment.organization_id, v_payment.plan_id, 'active', 'reference_multicaixa');
  END IF;

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.platform_cancel_payment(_payment_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_platform_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  UPDATE payment_references SET status = 'cancelled' WHERE id = _payment_id AND status = 'pending';
  RETURN FOUND;
END;
$$;

-- Allow platform admins to change any org subscription
CREATE OR REPLACE FUNCTION public.platform_change_subscription(_org_id uuid, _plan_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_platform_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  UPDATE organization_subscriptions SET
    plan_id = _plan_id,
    status = 'active',
    updated_at = now()
  WHERE organization_id = _org_id
    AND status IN ('trial', 'active');

  IF NOT FOUND THEN
    INSERT INTO organization_subscriptions (organization_id, plan_id, status)
    VALUES (_org_id, _plan_id, 'active');
  END IF;

  RETURN true;
END;
$$;

-- Add RLS policies for platform admins to read cross-org data
CREATE POLICY "Platform admins can view all organizations"
  ON public.organizations FOR SELECT TO authenticated
  USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can view all subscriptions"
  ON public.organization_subscriptions FOR SELECT TO authenticated
  USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can view all payments"
  ON public.payment_references FOR SELECT TO authenticated
  USING (public.is_platform_admin(auth.uid()));
