
-- Enum for project methodology
CREATE TYPE public.project_methodology AS ENUM ('waterfall', 'scrum', 'kanban', 'hybrid');

-- Enum for Scrum roles
CREATE TYPE public.scrum_role AS ENUM ('product_owner', 'scrum_master', 'dev_team');

-- Add methodology column to projects
ALTER TABLE public.projects 
ADD COLUMN methodology public.project_methodology NOT NULL DEFAULT 'waterfall';

-- Scrum configuration per project (DoD, sprint defaults, etc.)
CREATE TABLE public.project_scrum_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  default_sprint_duration_days INTEGER NOT NULL DEFAULT 14,
  definition_of_done TEXT[] DEFAULT '{}',
  sprint_planning_duration_hours NUMERIC(4,1) DEFAULT 2,
  daily_standup_duration_minutes INTEGER DEFAULT 15,
  sprint_review_duration_hours NUMERIC(4,1) DEFAULT 1,
  retrospective_duration_hours NUMERIC(4,1) DEFAULT 1.5,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id)
);

-- Scrum roles assigned to team members
CREATE TABLE public.project_scrum_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_name TEXT,
  scrum_role public.scrum_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, user_id, scrum_role)
);

-- Enable RLS
ALTER TABLE public.project_scrum_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_scrum_roles ENABLE ROW LEVEL SECURITY;

-- RLS for project_scrum_config (same pattern as team_members using org-based access)
CREATE POLICY "Users can view scrum config for org projects"
ON public.project_scrum_config
FOR SELECT
TO authenticated
USING (
  project_id IN (
    SELECT p.id FROM public.projects p
    WHERE p.organization_id IN (SELECT public.get_user_org_ids(auth.uid()))
  )
);

CREATE POLICY "Managers can insert scrum config"
ON public.project_scrum_config
FOR INSERT
TO authenticated
WITH CHECK (
  project_id IN (
    SELECT p.id FROM public.projects p
    WHERE p.organization_id IN (SELECT public.get_user_org_ids(auth.uid()))
  )
);

CREATE POLICY "Managers can update scrum config"
ON public.project_scrum_config
FOR UPDATE
TO authenticated
USING (
  project_id IN (
    SELECT p.id FROM public.projects p
    WHERE p.organization_id IN (SELECT public.get_user_org_ids(auth.uid()))
  )
);

CREATE POLICY "Managers can delete scrum config"
ON public.project_scrum_config
FOR DELETE
TO authenticated
USING (
  project_id IN (
    SELECT p.id FROM public.projects p
    WHERE p.organization_id IN (SELECT public.get_user_org_ids(auth.uid()))
  )
);

-- RLS for project_scrum_roles
CREATE POLICY "Users can view scrum roles for org projects"
ON public.project_scrum_roles
FOR SELECT
TO authenticated
USING (
  project_id IN (
    SELECT p.id FROM public.projects p
    WHERE p.organization_id IN (SELECT public.get_user_org_ids(auth.uid()))
  )
);

CREATE POLICY "Managers can insert scrum roles"
ON public.project_scrum_roles
FOR INSERT
TO authenticated
WITH CHECK (
  project_id IN (
    SELECT p.id FROM public.projects p
    WHERE p.organization_id IN (SELECT public.get_user_org_ids(auth.uid()))
  )
);

CREATE POLICY "Managers can update scrum roles"
ON public.project_scrum_roles
FOR UPDATE
TO authenticated
USING (
  project_id IN (
    SELECT p.id FROM public.projects p
    WHERE p.organization_id IN (SELECT public.get_user_org_ids(auth.uid()))
  )
);

CREATE POLICY "Managers can delete scrum roles"
ON public.project_scrum_roles
FOR DELETE
TO authenticated
USING (
  project_id IN (
    SELECT p.id FROM public.projects p
    WHERE p.organization_id IN (SELECT public.get_user_org_ids(auth.uid()))
  )
);

-- Trigger for updated_at on scrum_config
CREATE TRIGGER update_project_scrum_config_updated_at
BEFORE UPDATE ON public.project_scrum_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
