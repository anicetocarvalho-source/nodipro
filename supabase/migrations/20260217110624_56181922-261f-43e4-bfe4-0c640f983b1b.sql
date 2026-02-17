
-- LogFrame Levels: Objectivo Geral -> Objectivo Específico -> Resultado -> Actividade
CREATE TABLE public.logframe_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.logframe_levels(id) ON DELETE CASCADE,
  level_type TEXT NOT NULL CHECK (level_type IN ('goal', 'purpose', 'output', 'activity')),
  narrative TEXT NOT NULL,
  means_of_verification TEXT,
  assumptions TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- LogFrame Indicators linked to levels
CREATE TABLE public.logframe_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level_id UUID NOT NULL REFERENCES public.logframe_levels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  unit TEXT,
  baseline_value NUMERIC,
  baseline_date DATE,
  target_value NUMERIC,
  target_date DATE,
  current_value NUMERIC,
  data_source TEXT,
  frequency TEXT CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'semi_annual', 'annual')),
  responsible TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.logframe_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logframe_indicators ENABLE ROW LEVEL SECURITY;

-- RLS for logframe_levels
CREATE POLICY "Org members can view logframe levels" ON public.logframe_levels
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = logframe_levels.project_id
      AND p.organization_id IN (SELECT get_user_org_ids(auth.uid()))
    )
  );

CREATE POLICY "Users with permission can create logframe levels" ON public.logframe_levels
  FOR INSERT WITH CHECK (
    has_permission(auth.uid(), 'project.edit') AND
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = logframe_levels.project_id
      AND p.organization_id IN (SELECT get_user_org_ids(auth.uid()))
    )
  );

CREATE POLICY "Users with permission can update logframe levels" ON public.logframe_levels
  FOR UPDATE USING (
    has_permission(auth.uid(), 'project.edit') AND
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = logframe_levels.project_id
      AND p.organization_id IN (SELECT get_user_org_ids(auth.uid()))
    )
  );

CREATE POLICY "Users with permission can delete logframe levels" ON public.logframe_levels
  FOR DELETE USING (
    has_permission(auth.uid(), 'project.delete') AND
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = logframe_levels.project_id
      AND p.organization_id IN (SELECT get_user_org_ids(auth.uid()))
    )
  );

-- RLS for logframe_indicators
CREATE POLICY "Org members can view logframe indicators" ON public.logframe_indicators
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM logframe_levels l
      JOIN projects p ON p.id = l.project_id
      WHERE l.id = logframe_indicators.level_id
      AND p.organization_id IN (SELECT get_user_org_ids(auth.uid()))
    )
  );

CREATE POLICY "Users with permission can create logframe indicators" ON public.logframe_indicators
  FOR INSERT WITH CHECK (
    has_permission(auth.uid(), 'project.edit') AND
    EXISTS (
      SELECT 1 FROM logframe_levels l
      JOIN projects p ON p.id = l.project_id
      WHERE l.id = logframe_indicators.level_id
      AND p.organization_id IN (SELECT get_user_org_ids(auth.uid()))
    )
  );

CREATE POLICY "Users with permission can update logframe indicators" ON public.logframe_indicators
  FOR UPDATE USING (
    has_permission(auth.uid(), 'project.edit') AND
    EXISTS (
      SELECT 1 FROM logframe_levels l
      JOIN projects p ON p.id = l.project_id
      WHERE l.id = logframe_indicators.level_id
      AND p.organization_id IN (SELECT get_user_org_ids(auth.uid()))
    )
  );

CREATE POLICY "Users with permission can delete logframe indicators" ON public.logframe_indicators
  FOR DELETE USING (
    has_permission(auth.uid(), 'project.delete') AND
    EXISTS (
      SELECT 1 FROM logframe_levels l
      JOIN projects p ON p.id = l.project_id
      WHERE l.id = logframe_indicators.level_id
      AND p.organization_id IN (SELECT get_user_org_ids(auth.uid()))
    )
  );
