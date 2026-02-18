
-- Create subscription status enum
CREATE TYPE public.subscription_status AS ENUM ('trial', 'active', 'past_due', 'cancelled', 'expired');

-- Subscription plans table
CREATE TABLE public.subscription_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price_monthly NUMERIC(10,2) NOT NULL DEFAULT 0,
  price_yearly NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  max_projects INTEGER NOT NULL DEFAULT 3,
  max_members INTEGER NOT NULL DEFAULT 5,
  max_storage_gb INTEGER NOT NULL DEFAULT 1,
  max_portfolios INTEGER NOT NULL DEFAULT 0,
  features JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read plans"
  ON public.subscription_plans FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only admins can manage plans"
  ON public.subscription_plans FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Organization subscriptions table
CREATE TABLE public.organization_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  status public.subscription_status NOT NULL DEFAULT 'trial',
  trial_ends_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_period_end TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  cancelled_at TIMESTAMPTZ,
  cancel_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_org_subscriptions_active ON public.organization_subscriptions(organization_id) WHERE status IN ('trial', 'active');

ALTER TABLE public.organization_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can read their subscription"
  ON public.organization_subscriptions FOR SELECT
  USING (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));

CREATE POLICY "Org admins can manage subscription"
  ON public.organization_subscriptions FOR ALL
  USING (public.is_org_admin(auth.uid(), organization_id));

-- Trigger for updated_at
CREATE TRIGGER update_org_subscriptions_updated_at
  BEFORE UPDATE ON public.organization_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Quota checking function
CREATE OR REPLACE FUNCTION public.check_org_quota(
  _org_id UUID,
  _resource_type TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_plan RECORD;
  v_current_count INTEGER;
  v_max_allowed INTEGER;
  v_can_create BOOLEAN;
BEGIN
  SELECT sp.* INTO v_plan
  FROM organization_subscriptions os
  JOIN subscription_plans sp ON sp.id = os.plan_id
  WHERE os.organization_id = _org_id
    AND os.status IN ('trial', 'active')
  ORDER BY os.created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('allowed', false, 'current', 0, 'max', 0, 'reason', 'no_subscription');
  END IF;

  CASE _resource_type
    WHEN 'project' THEN
      SELECT COUNT(*) INTO v_current_count FROM projects WHERE organization_id = _org_id;
      v_max_allowed := v_plan.max_projects;
    WHEN 'member' THEN
      SELECT COUNT(*) INTO v_current_count FROM organization_members WHERE organization_id = _org_id;
      v_max_allowed := v_plan.max_members;
    WHEN 'portfolio' THEN
      SELECT COUNT(*) INTO v_current_count FROM portfolios WHERE organization_id = _org_id;
      v_max_allowed := v_plan.max_portfolios;
    ELSE
      RETURN jsonb_build_object('allowed', false, 'current', 0, 'max', 0, 'reason', 'unknown_resource');
  END CASE;

  v_can_create := (v_max_allowed = -1) OR (v_current_count < v_max_allowed);

  RETURN jsonb_build_object(
    'allowed', v_can_create,
    'current', v_current_count,
    'max', v_max_allowed,
    'plan_name', v_plan.name,
    'plan_slug', v_plan.slug
  );
END;
$$;

-- Seed plans
INSERT INTO public.subscription_plans (name, slug, description, price_monthly, price_yearly, max_projects, max_members, max_storage_gb, max_portfolios, features, sort_order) VALUES
('Free', 'free', 'Para equipas pequenas que estão a começar', 0, 0, 3, 5, 1, 0,
 '{"kanban": true, "gantt": false, "evm": false, "logframe": false, "risks": true, "kpis": false, "procurement": false, "change_requests": false, "budget_advanced": false, "reports": false, "scrum": false, "api_access": false, "stakeholders": false, "briefings": false}'::jsonb, 1),
('Starter', 'starter', 'Para equipas em crescimento', 29, 290, 10, 15, 5, 2,
 '{"kanban": true, "gantt": true, "evm": false, "logframe": false, "risks": true, "kpis": true, "procurement": false, "change_requests": false, "budget_advanced": true, "reports": true, "scrum": true, "api_access": false, "stakeholders": true, "briefings": true}'::jsonb, 2),
('Professional', 'professional', 'Para organizações que precisam de tudo', 79, 790, 50, 50, 25, 10,
 '{"kanban": true, "gantt": true, "evm": true, "logframe": true, "risks": true, "kpis": true, "procurement": true, "change_requests": true, "budget_advanced": true, "reports": true, "scrum": true, "api_access": false, "stakeholders": true, "briefings": true}'::jsonb, 3),
('Enterprise', 'enterprise', 'Para grandes organizações com necessidades avançadas', 199, 1990, -1, -1, 100, -1,
 '{"kanban": true, "gantt": true, "evm": true, "logframe": true, "risks": true, "kpis": true, "procurement": true, "change_requests": true, "budget_advanced": true, "reports": true, "scrum": true, "api_access": true, "stakeholders": true, "briefings": true}'::jsonb, 4);
