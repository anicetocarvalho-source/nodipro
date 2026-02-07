
-- =====================================================
-- MÓDULO 1: Hierarquia Épicos → Histórias → Tarefas
-- Evoluir o sistema actual de tasks
-- =====================================================

-- Adicionar campos de hierarquia à tabela tasks
ALTER TABLE public.tasks 
  ADD COLUMN item_type text NOT NULL DEFAULT 'task',
  ADD COLUMN parent_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL,
  ADD COLUMN story_points integer DEFAULT 0,
  ADD COLUMN sprint_id uuid;

-- Index para hierarquia
CREATE INDEX idx_tasks_parent_id ON public.tasks(parent_id);
CREATE INDEX idx_tasks_item_type ON public.tasks(item_type);
CREATE INDEX idx_tasks_sprint_id ON public.tasks(sprint_id);

-- =====================================================
-- MÓDULO 2: Sprints
-- =====================================================

CREATE TABLE public.sprints (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  goal text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text NOT NULL DEFAULT 'planning',
  velocity integer DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- FK para sprint_id na tabela tasks
ALTER TABLE public.tasks 
  ADD CONSTRAINT tasks_sprint_id_fkey 
  FOREIGN KEY (sprint_id) REFERENCES public.sprints(id) ON DELETE SET NULL;

-- =====================================================
-- MÓDULO 3: Sprint Retrospetivas
-- =====================================================

CREATE TABLE public.sprint_retrospectives (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sprint_id uuid NOT NULL REFERENCES public.sprints(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'open',
  facilitator_id uuid,
  facilitator_name text,
  summary text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE TABLE public.retrospective_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  retrospective_id uuid NOT NULL REFERENCES public.sprint_retrospectives(id) ON DELETE CASCADE,
  category text NOT NULL,
  content text NOT NULL,
  author_id uuid,
  author_name text,
  votes_count integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.retrospective_votes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id uuid NOT NULL REFERENCES public.retrospective_items(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(item_id, user_id)
);

CREATE TABLE public.retrospective_feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  retrospective_id uuid NOT NULL REFERENCES public.sprint_retrospectives(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  user_name text,
  satisfaction_rating integer,
  velocity_rating integer,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(retrospective_id, user_id)
);

-- Validation trigger for ratings (instead of CHECK constraints)
CREATE OR REPLACE FUNCTION public.validate_retrospective_feedback()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.satisfaction_rating IS NOT NULL AND (NEW.satisfaction_rating < 1 OR NEW.satisfaction_rating > 5) THEN
    RAISE EXCEPTION 'satisfaction_rating must be between 1 and 5';
  END IF;
  IF NEW.velocity_rating IS NOT NULL AND (NEW.velocity_rating < 1 OR NEW.velocity_rating > 5) THEN
    RAISE EXCEPTION 'velocity_rating must be between 1 and 5';
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER validate_feedback_ratings
  BEFORE INSERT OR UPDATE ON public.retrospective_feedback
  FOR EACH ROW EXECUTE FUNCTION public.validate_retrospective_feedback();

CREATE TABLE public.retrospective_actions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  retrospective_id uuid NOT NULL REFERENCES public.sprint_retrospectives(id) ON DELETE CASCADE,
  description text NOT NULL,
  assignee_id uuid,
  assignee_name text,
  status text NOT NULL DEFAULT 'pending',
  due_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =====================================================
-- MÓDULO 4: Briefings de Projeto
-- =====================================================

CREATE TABLE public.project_briefings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'draft',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.briefing_modules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  briefing_id uuid NOT NULL REFERENCES public.project_briefings(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text,
  level integer NOT NULL DEFAULT 0,
  parent_id uuid REFERENCES public.briefing_modules(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  module_type text DEFAULT 'section',
  status text DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- =====================================================
-- RLS - Row Level Security para todas as tabelas
-- =====================================================

ALTER TABLE public.sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sprint_retrospectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retrospective_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retrospective_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retrospective_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retrospective_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_briefings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.briefing_modules ENABLE ROW LEVEL SECURITY;

-- Sprints RLS
CREATE POLICY "Org members can view sprints" ON public.sprints FOR SELECT
  USING (project_id IN (SELECT id FROM public.projects WHERE organization_id IN (SELECT get_user_org_ids(auth.uid()))));
CREATE POLICY "Org members can create sprints" ON public.sprints FOR INSERT
  WITH CHECK (project_id IN (SELECT id FROM public.projects WHERE organization_id IN (SELECT get_user_org_ids(auth.uid()))));
CREATE POLICY "Org members can update sprints" ON public.sprints FOR UPDATE
  USING (project_id IN (SELECT id FROM public.projects WHERE organization_id IN (SELECT get_user_org_ids(auth.uid()))));
CREATE POLICY "Org members can delete sprints" ON public.sprints FOR DELETE
  USING (project_id IN (SELECT id FROM public.projects WHERE organization_id IN (SELECT get_user_org_ids(auth.uid()))));

-- Sprint Retrospectives RLS
CREATE POLICY "Org members can view retrospectives" ON public.sprint_retrospectives FOR SELECT
  USING (project_id IN (SELECT id FROM public.projects WHERE organization_id IN (SELECT get_user_org_ids(auth.uid()))));
CREATE POLICY "Org members can create retrospectives" ON public.sprint_retrospectives FOR INSERT
  WITH CHECK (project_id IN (SELECT id FROM public.projects WHERE organization_id IN (SELECT get_user_org_ids(auth.uid()))));
CREATE POLICY "Org members can update retrospectives" ON public.sprint_retrospectives FOR UPDATE
  USING (project_id IN (SELECT id FROM public.projects WHERE organization_id IN (SELECT get_user_org_ids(auth.uid()))));
CREATE POLICY "Org members can delete retrospectives" ON public.sprint_retrospectives FOR DELETE
  USING (project_id IN (SELECT id FROM public.projects WHERE organization_id IN (SELECT get_user_org_ids(auth.uid()))));

-- Retrospective Items RLS
CREATE POLICY "Org members can view retro items" ON public.retrospective_items FOR SELECT
  USING (retrospective_id IN (SELECT id FROM public.sprint_retrospectives WHERE project_id IN (SELECT id FROM public.projects WHERE organization_id IN (SELECT get_user_org_ids(auth.uid())))));
CREATE POLICY "Org members can create retro items" ON public.retrospective_items FOR INSERT
  WITH CHECK (retrospective_id IN (SELECT id FROM public.sprint_retrospectives WHERE project_id IN (SELECT id FROM public.projects WHERE organization_id IN (SELECT get_user_org_ids(auth.uid())))));
CREATE POLICY "Org members can update retro items" ON public.retrospective_items FOR UPDATE
  USING (retrospective_id IN (SELECT id FROM public.sprint_retrospectives WHERE project_id IN (SELECT id FROM public.projects WHERE organization_id IN (SELECT get_user_org_ids(auth.uid())))));
CREATE POLICY "Org members can delete retro items" ON public.retrospective_items FOR DELETE
  USING (retrospective_id IN (SELECT id FROM public.sprint_retrospectives WHERE project_id IN (SELECT id FROM public.projects WHERE organization_id IN (SELECT get_user_org_ids(auth.uid())))));

-- Retrospective Votes RLS
CREATE POLICY "Users can view votes" ON public.retrospective_votes FOR SELECT
  USING (item_id IN (SELECT id FROM public.retrospective_items WHERE retrospective_id IN (SELECT id FROM public.sprint_retrospectives WHERE project_id IN (SELECT id FROM public.projects WHERE organization_id IN (SELECT get_user_org_ids(auth.uid()))))));
CREATE POLICY "Users can vote" ON public.retrospective_votes FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can remove vote" ON public.retrospective_votes FOR DELETE
  USING (user_id = auth.uid());

-- Retrospective Feedback RLS
CREATE POLICY "Org members can view feedback" ON public.retrospective_feedback FOR SELECT
  USING (retrospective_id IN (SELECT id FROM public.sprint_retrospectives WHERE project_id IN (SELECT id FROM public.projects WHERE organization_id IN (SELECT get_user_org_ids(auth.uid())))));
CREATE POLICY "Users can submit feedback" ON public.retrospective_feedback FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own feedback" ON public.retrospective_feedback FOR UPDATE
  USING (user_id = auth.uid());

-- Retrospective Actions RLS
CREATE POLICY "Org members can view actions" ON public.retrospective_actions FOR SELECT
  USING (retrospective_id IN (SELECT id FROM public.sprint_retrospectives WHERE project_id IN (SELECT id FROM public.projects WHERE organization_id IN (SELECT get_user_org_ids(auth.uid())))));
CREATE POLICY "Org members can manage actions" ON public.retrospective_actions FOR INSERT
  WITH CHECK (retrospective_id IN (SELECT id FROM public.sprint_retrospectives WHERE project_id IN (SELECT id FROM public.projects WHERE organization_id IN (SELECT get_user_org_ids(auth.uid())))));
CREATE POLICY "Org members can update actions" ON public.retrospective_actions FOR UPDATE
  USING (retrospective_id IN (SELECT id FROM public.sprint_retrospectives WHERE project_id IN (SELECT id FROM public.projects WHERE organization_id IN (SELECT get_user_org_ids(auth.uid())))));

-- Project Briefings RLS
CREATE POLICY "Org members can view briefings" ON public.project_briefings FOR SELECT
  USING (project_id IN (SELECT id FROM public.projects WHERE organization_id IN (SELECT get_user_org_ids(auth.uid()))));
CREATE POLICY "Org members can create briefings" ON public.project_briefings FOR INSERT
  WITH CHECK (project_id IN (SELECT id FROM public.projects WHERE organization_id IN (SELECT get_user_org_ids(auth.uid()))));
CREATE POLICY "Org members can update briefings" ON public.project_briefings FOR UPDATE
  USING (project_id IN (SELECT id FROM public.projects WHERE organization_id IN (SELECT get_user_org_ids(auth.uid()))));
CREATE POLICY "Org members can delete briefings" ON public.project_briefings FOR DELETE
  USING (project_id IN (SELECT id FROM public.projects WHERE organization_id IN (SELECT get_user_org_ids(auth.uid()))));

-- Briefing Modules RLS
CREATE POLICY "Org members can view briefing modules" ON public.briefing_modules FOR SELECT
  USING (briefing_id IN (SELECT id FROM public.project_briefings WHERE project_id IN (SELECT id FROM public.projects WHERE organization_id IN (SELECT get_user_org_ids(auth.uid())))));
CREATE POLICY "Org members can create briefing modules" ON public.briefing_modules FOR INSERT
  WITH CHECK (briefing_id IN (SELECT id FROM public.project_briefings WHERE project_id IN (SELECT id FROM public.projects WHERE organization_id IN (SELECT get_user_org_ids(auth.uid())))));
CREATE POLICY "Org members can update briefing modules" ON public.briefing_modules FOR UPDATE
  USING (briefing_id IN (SELECT id FROM public.project_briefings WHERE project_id IN (SELECT id FROM public.projects WHERE organization_id IN (SELECT get_user_org_ids(auth.uid())))));
CREATE POLICY "Org members can delete briefing modules" ON public.briefing_modules FOR DELETE
  USING (briefing_id IN (SELECT id FROM public.project_briefings WHERE project_id IN (SELECT id FROM public.projects WHERE organization_id IN (SELECT get_user_org_ids(auth.uid())))));

-- =====================================================
-- Triggers para updated_at
-- =====================================================
CREATE TRIGGER update_sprints_updated_at 
  BEFORE UPDATE ON public.sprints 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_briefings_updated_at 
  BEFORE UPDATE ON public.project_briefings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_briefing_modules_updated_at 
  BEFORE UPDATE ON public.briefing_modules 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Realtime
-- =====================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.sprints;
ALTER PUBLICATION supabase_realtime ADD TABLE public.retrospective_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.retrospective_votes;
