
-- Annual Work Plans (PTA/AWP)
CREATE TABLE public.annual_work_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  year INTEGER NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  total_budget NUMERIC NOT NULL DEFAULT 0,
  total_executed NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.awp_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  work_plan_id UUID NOT NULL REFERENCES public.annual_work_plans(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  quarter TEXT NOT NULL DEFAULT 'Q1',
  planned_budget NUMERIC NOT NULL DEFAULT 0,
  executed_budget NUMERIC NOT NULL DEFAULT 0,
  physical_target NUMERIC DEFAULT 0,
  physical_achieved NUMERIC DEFAULT 0,
  responsible TEXT,
  status TEXT NOT NULL DEFAULT 'planned',
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_awp_org ON public.annual_work_plans(organization_id);
CREATE INDEX idx_awp_year ON public.annual_work_plans(year);
CREATE INDEX idx_awp_activities_plan ON public.awp_activities(work_plan_id);

-- Timestamps triggers
CREATE TRIGGER update_annual_work_plans_updated_at
  BEFORE UPDATE ON public.annual_work_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_awp_activities_updated_at
  BEFORE UPDATE ON public.awp_activities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Audit triggers
CREATE TRIGGER audit_annual_work_plans
  AFTER INSERT OR UPDATE OR DELETE ON public.annual_work_plans
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_awp_activities
  AFTER INSERT OR UPDATE OR DELETE ON public.awp_activities
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- RLS
ALTER TABLE public.annual_work_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.awp_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view work plans"
  ON public.annual_work_plans FOR SELECT
  USING (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));

CREATE POLICY "Org members can create work plans"
  ON public.annual_work_plans FOR INSERT
  WITH CHECK (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));

CREATE POLICY "Org members can update work plans"
  ON public.annual_work_plans FOR UPDATE
  USING (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));

CREATE POLICY "Org members can delete work plans"
  ON public.annual_work_plans FOR DELETE
  USING (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));

-- AWP Activities: access through work plan's org
CREATE POLICY "Org members can view activities"
  ON public.awp_activities FOR SELECT
  USING (work_plan_id IN (
    SELECT id FROM public.annual_work_plans WHERE organization_id IN (SELECT public.get_user_org_ids(auth.uid()))
  ));

CREATE POLICY "Org members can create activities"
  ON public.awp_activities FOR INSERT
  WITH CHECK (work_plan_id IN (
    SELECT id FROM public.annual_work_plans WHERE organization_id IN (SELECT public.get_user_org_ids(auth.uid()))
  ));

CREATE POLICY "Org members can update activities"
  ON public.awp_activities FOR UPDATE
  USING (work_plan_id IN (
    SELECT id FROM public.annual_work_plans WHERE organization_id IN (SELECT public.get_user_org_ids(auth.uid()))
  ));

CREATE POLICY "Org members can delete activities"
  ON public.awp_activities FOR DELETE
  USING (work_plan_id IN (
    SELECT id FROM public.annual_work_plans WHERE organization_id IN (SELECT public.get_user_org_ids(auth.uid()))
  ));

-- Organization-level audit log access function
CREATE OR REPLACE FUNCTION public.get_org_audit_logs(
  _org_id UUID,
  _limit INTEGER DEFAULT 50,
  _offset INTEGER DEFAULT 0,
  _action_filter TEXT DEFAULT NULL,
  _target_filter TEXT DEFAULT NULL,
  _search TEXT DEFAULT NULL
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
  IF NOT public.is_org_member(auth.uid(), _org_id) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Filter audit logs to only those related to this org's resources
  SELECT COUNT(*) INTO v_total
  FROM audit_logs al
  WHERE al.user_id IN (SELECT om.user_id FROM organization_members om WHERE om.organization_id = _org_id)
    AND (_action_filter IS NULL OR al.action = _action_filter)
    AND (_target_filter IS NULL OR al.target_type = _target_filter)
    AND (_search IS NULL OR al.user_name ILIKE '%' || _search || '%' OR al.target_name ILIKE '%' || _search || '%');

  SELECT jsonb_build_object(
    'total', v_total,
    'logs', (
      SELECT COALESCE(jsonb_agg(row_to_json(l)), '[]'::jsonb)
      FROM (
        SELECT al.id, al.action, al.target_type, al.target_id, al.target_name,
               al.user_id, al.user_name, al.created_at
        FROM audit_logs al
        WHERE al.user_id IN (SELECT om.user_id FROM organization_members om WHERE om.organization_id = _org_id)
          AND (_action_filter IS NULL OR al.action = _action_filter)
          AND (_target_filter IS NULL OR al.target_type = _target_filter)
          AND (_search IS NULL OR al.user_name ILIKE '%' || _search || '%' OR al.target_name ILIKE '%' || _search || '%')
        ORDER BY al.created_at DESC
        LIMIT _limit OFFSET _offset
      ) l
    )
  ) INTO result;

  RETURN result;
END;
$$;
