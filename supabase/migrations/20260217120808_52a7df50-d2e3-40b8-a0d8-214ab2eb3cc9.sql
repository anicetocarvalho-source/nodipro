
-- ============================================
-- 1. STAKEHOLDERS TABLE
-- ============================================
CREATE TABLE public.stakeholders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id),
  name TEXT NOT NULL,
  organization_name TEXT,
  role TEXT,
  email TEXT,
  phone TEXT,
  influence INTEGER DEFAULT 3 CHECK (influence >= 1 AND influence <= 5),
  interest INTEGER DEFAULT 3 CHECK (interest >= 1 AND interest <= 5),
  category TEXT DEFAULT 'external' CHECK (category IN ('internal', 'external', 'government', 'donor', 'community', 'partner')),
  engagement_strategy TEXT,
  communication_frequency TEXT DEFAULT 'monthly' CHECK (communication_frequency IN ('daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'as_needed')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'engaged', 'disengaged')),
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.stakeholders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stakeholders_select" ON public.stakeholders FOR SELECT TO authenticated
  USING (project_id IN (SELECT id FROM public.projects WHERE organization_id IN (SELECT public.get_user_org_ids(auth.uid()))));

CREATE POLICY "stakeholders_insert" ON public.stakeholders FOR INSERT TO authenticated
  WITH CHECK (project_id IN (SELECT id FROM public.projects WHERE organization_id IN (SELECT public.get_user_org_ids(auth.uid()))));

CREATE POLICY "stakeholders_update" ON public.stakeholders FOR UPDATE TO authenticated
  USING (project_id IN (SELECT id FROM public.projects WHERE organization_id IN (SELECT public.get_user_org_ids(auth.uid()))));

CREATE POLICY "stakeholders_delete" ON public.stakeholders FOR DELETE TO authenticated
  USING (project_id IN (SELECT id FROM public.projects WHERE organization_id IN (SELECT public.get_user_org_ids(auth.uid()))));

CREATE TRIGGER update_stakeholders_updated_at BEFORE UPDATE ON public.stakeholders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 2. CHANGE REQUESTS TABLE
-- ============================================
CREATE TABLE public.change_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  justification TEXT,
  change_type TEXT DEFAULT 'scope' CHECK (change_type IN ('scope', 'schedule', 'budget', 'resource', 'quality', 'other')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  impact_description TEXT,
  impact_scope TEXT,
  impact_schedule TEXT,
  impact_budget NUMERIC,
  status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'approved', 'rejected', 'deferred', 'implemented')),
  requested_by UUID,
  requested_by_name TEXT,
  reviewed_by UUID,
  reviewed_by_name TEXT,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  implemented_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.change_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "change_requests_select" ON public.change_requests FOR SELECT TO authenticated
  USING (project_id IN (SELECT id FROM public.projects WHERE organization_id IN (SELECT public.get_user_org_ids(auth.uid()))));

CREATE POLICY "change_requests_insert" ON public.change_requests FOR INSERT TO authenticated
  WITH CHECK (project_id IN (SELECT id FROM public.projects WHERE organization_id IN (SELECT public.get_user_org_ids(auth.uid()))));

CREATE POLICY "change_requests_update" ON public.change_requests FOR UPDATE TO authenticated
  USING (project_id IN (SELECT id FROM public.projects WHERE organization_id IN (SELECT public.get_user_org_ids(auth.uid()))));

CREATE POLICY "change_requests_delete" ON public.change_requests FOR DELETE TO authenticated
  USING (project_id IN (SELECT id FROM public.projects WHERE organization_id IN (SELECT public.get_user_org_ids(auth.uid()))));

CREATE TRIGGER update_change_requests_updated_at BEFORE UPDATE ON public.change_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 3. PROJECT BASELINES TABLE
-- ============================================
CREATE TABLE public.project_baselines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  baseline_number INTEGER NOT NULL DEFAULT 1,
  name TEXT NOT NULL,
  description TEXT,
  baseline_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  schedule_snapshot JSONB,
  budget_snapshot JSONB,
  scope_snapshot JSONB,
  created_by UUID,
  created_by_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.project_baselines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "baselines_select" ON public.project_baselines FOR SELECT TO authenticated
  USING (project_id IN (SELECT id FROM public.projects WHERE organization_id IN (SELECT public.get_user_org_ids(auth.uid()))));

CREATE POLICY "baselines_insert" ON public.project_baselines FOR INSERT TO authenticated
  WITH CHECK (project_id IN (SELECT id FROM public.projects WHERE organization_id IN (SELECT public.get_user_org_ids(auth.uid()))));

CREATE POLICY "baselines_update" ON public.project_baselines FOR UPDATE TO authenticated
  USING (project_id IN (SELECT id FROM public.projects WHERE organization_id IN (SELECT public.get_user_org_ids(auth.uid()))));

CREATE POLICY "baselines_delete" ON public.project_baselines FOR DELETE TO authenticated
  USING (project_id IN (SELECT id FROM public.projects WHERE organization_id IN (SELECT public.get_user_org_ids(auth.uid()))));

-- ============================================
-- 4. USER SETTINGS TABLE
-- ============================================
CREATE TABLE public.user_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_settings_select" ON public.user_settings FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "user_settings_insert" ON public.user_settings FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_settings_update" ON public.user_settings FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 5. AUDIT TRIGGERS (automatic logging)
-- ============================================
CREATE OR REPLACE FUNCTION public.audit_trigger_func()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_user_name TEXT;
  v_action TEXT;
  v_target_id TEXT;
  v_target_name TEXT;
  v_old_value TEXT;
  v_new_value TEXT;
BEGIN
  v_user_id := auth.uid();
  SELECT full_name INTO v_user_name FROM public.profiles WHERE user_id = v_user_id LIMIT 1;

  IF TG_OP = 'INSERT' THEN
    v_action := 'create';
    v_target_id := NEW.id::text;
    v_target_name := COALESCE(NEW.name, NEW.title, v_target_id);
    v_new_value := row_to_json(NEW)::text;
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'update';
    v_target_id := NEW.id::text;
    v_target_name := COALESCE(NEW.name, NEW.title, v_target_id);
    v_old_value := row_to_json(OLD)::text;
    v_new_value := row_to_json(NEW)::text;
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'delete';
    v_target_id := OLD.id::text;
    v_target_name := COALESCE(OLD.name, OLD.title, v_target_id);
    v_old_value := row_to_json(OLD)::text;
  END IF;

  INSERT INTO public.audit_logs (user_id, user_name, action, target_type, target_id, target_name, old_value, new_value)
  VALUES (COALESCE(v_user_id, '00000000-0000-0000-0000-000000000000'), v_user_name, v_action, TG_TABLE_NAME, v_target_id, v_target_name, v_old_value, v_new_value);

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$;

-- Apply audit triggers to critical tables
CREATE TRIGGER audit_projects AFTER INSERT OR UPDATE OR DELETE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_tasks AFTER INSERT OR UPDATE OR DELETE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_budget_entries AFTER INSERT OR UPDATE OR DELETE ON public.budget_entries
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_documents AFTER INSERT OR UPDATE OR DELETE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_risks AFTER INSERT OR UPDATE OR DELETE ON public.risks
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_procurement_plans AFTER INSERT OR UPDATE OR DELETE ON public.procurement_plans
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_contracts AFTER INSERT OR UPDATE OR DELETE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_change_requests AFTER INSERT OR UPDATE OR DELETE ON public.change_requests
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_stakeholders AFTER INSERT OR UPDATE OR DELETE ON public.stakeholders
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_logframe_levels AFTER INSERT OR UPDATE OR DELETE ON public.logframe_levels
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.stakeholders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.change_requests;
