
-- =====================
-- RISKS TABLE
-- =====================
CREATE TABLE public.risks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  probability TEXT NOT NULL DEFAULT 'medium' CHECK (probability IN ('low','medium','high')),
  impact TEXT NOT NULL DEFAULT 'medium' CHECK (impact IN ('low','medium','high')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','mitigated','closed','accepted')),
  category TEXT,
  owner_name TEXT,
  owner_id UUID,
  mitigation TEXT,
  contingency TEXT,
  trigger_conditions TEXT,
  due_date DATE,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.risks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view risks" ON public.risks
  FOR SELECT USING (
    project_id IN (SELECT p.id FROM projects p WHERE p.organization_id IN (SELECT get_user_org_ids(auth.uid())))
  );

CREATE POLICY "Users with permission can manage risks" ON public.risks
  FOR ALL USING (
    has_permission(auth.uid(), 'project.edit') AND
    project_id IN (SELECT p.id FROM projects p WHERE p.organization_id IN (SELECT get_user_org_ids(auth.uid())))
  );

CREATE TRIGGER update_risks_updated_at BEFORE UPDATE ON public.risks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================
-- LESSONS LEARNED TABLE
-- =====================
CREATE TABLE public.lessons_learned (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  lesson_type TEXT NOT NULL DEFAULT 'success' CHECK (lesson_type IN ('success','improvement','failure')),
  tags TEXT[] DEFAULT '{}',
  author_name TEXT,
  author_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.lessons_learned ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view lessons" ON public.lessons_learned
  FOR SELECT USING (
    project_id IN (SELECT p.id FROM projects p WHERE p.organization_id IN (SELECT get_user_org_ids(auth.uid())))
  );

CREATE POLICY "Users with permission can manage lessons" ON public.lessons_learned
  FOR ALL USING (
    has_permission(auth.uid(), 'project.edit') AND
    project_id IN (SELECT p.id FROM projects p WHERE p.organization_id IN (SELECT get_user_org_ids(auth.uid())))
  );

CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON public.lessons_learned
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================
-- KPI DEFINITIONS TABLE
-- =====================
CREATE TABLE public.kpi_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  unit TEXT DEFAULT '%',
  target_value NUMERIC,
  warning_threshold NUMERIC,
  critical_threshold NUMERIC,
  direction TEXT NOT NULL DEFAULT 'higher_is_better' CHECK (direction IN ('higher_is_better','lower_is_better')),
  frequency TEXT DEFAULT 'monthly' CHECK (frequency IN ('daily','weekly','monthly','quarterly','annual')),
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.kpi_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view KPIs" ON public.kpi_definitions
  FOR SELECT USING (
    organization_id IN (SELECT get_user_org_ids(auth.uid()))
    OR project_id IN (SELECT p.id FROM projects p WHERE p.organization_id IN (SELECT get_user_org_ids(auth.uid())))
  );

CREATE POLICY "Users with permission can manage KPIs" ON public.kpi_definitions
  FOR ALL USING (
    has_permission(auth.uid(), 'project.edit') AND (
      organization_id IN (SELECT get_user_org_ids(auth.uid()))
      OR project_id IN (SELECT p.id FROM projects p WHERE p.organization_id IN (SELECT get_user_org_ids(auth.uid())))
    )
  );

CREATE TRIGGER update_kpi_definitions_updated_at BEFORE UPDATE ON public.kpi_definitions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================
-- KPI MEASUREMENTS TABLE
-- =====================
CREATE TABLE public.kpi_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kpi_id UUID NOT NULL REFERENCES public.kpi_definitions(id) ON DELETE CASCADE,
  value NUMERIC NOT NULL,
  measured_at DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  measured_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.kpi_measurements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view KPI measurements" ON public.kpi_measurements
  FOR SELECT USING (
    kpi_id IN (SELECT id FROM kpi_definitions WHERE
      organization_id IN (SELECT get_user_org_ids(auth.uid()))
      OR project_id IN (SELECT p.id FROM projects p WHERE p.organization_id IN (SELECT get_user_org_ids(auth.uid())))
    )
  );

CREATE POLICY "Users with permission can manage KPI measurements" ON public.kpi_measurements
  FOR ALL USING (
    has_permission(auth.uid(), 'project.edit') AND
    kpi_id IN (SELECT id FROM kpi_definitions WHERE
      organization_id IN (SELECT get_user_org_ids(auth.uid()))
      OR project_id IN (SELECT p.id FROM projects p WHERE p.organization_id IN (SELECT get_user_org_ids(auth.uid())))
    )
  );

-- =====================
-- EXTEND TEAM_MEMBERS with org-level fields
-- =====================
ALTER TABLE public.team_members
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id),
  ADD COLUMN IF NOT EXISTS user_id UUID,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS department TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'available' CHECK (status IN ('available','busy','away','offline'));
