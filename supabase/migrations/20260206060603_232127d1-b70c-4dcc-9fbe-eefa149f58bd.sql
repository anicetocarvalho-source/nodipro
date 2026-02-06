
-- =====================================================
-- FIX PERMISSIVE RLS POLICIES - ENFORCE ORG ISOLATION
-- =====================================================

-- 1. PORTFOLIOS: Replace permissive SELECT with org-filtered
DROP POLICY IF EXISTS "Authenticated users can view portfolios" ON public.portfolios;
CREATE POLICY "Users can view org portfolios"
  ON public.portfolios FOR SELECT
  USING (
    organization_id IN (SELECT get_user_org_ids(auth.uid()))
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- Tighten write policies with org check
DROP POLICY IF EXISTS "Users with permission can create portfolios" ON public.portfolios;
CREATE POLICY "Users with permission can create portfolios"
  ON public.portfolios FOR INSERT
  WITH CHECK (
    has_permission(auth.uid(), 'portfolio.create'::text)
    AND (organization_id IS NULL OR organization_id IN (SELECT get_user_org_ids(auth.uid())))
  );

DROP POLICY IF EXISTS "Users with permission can edit portfolios" ON public.portfolios;
CREATE POLICY "Users with permission can edit portfolios"
  ON public.portfolios FOR UPDATE
  USING (
    has_permission(auth.uid(), 'portfolio.edit'::text)
    AND organization_id IN (SELECT get_user_org_ids(auth.uid()))
  );

DROP POLICY IF EXISTS "Users with permission can delete portfolios" ON public.portfolios;
CREATE POLICY "Users with permission can delete portfolios"
  ON public.portfolios FOR DELETE
  USING (
    has_permission(auth.uid(), 'portfolio.delete'::text)
    AND organization_id IN (SELECT get_user_org_ids(auth.uid()))
  );

-- 2. PROGRAMS: Replace permissive SELECT with org-filtered via portfolios
DROP POLICY IF EXISTS "Authenticated users can view programs" ON public.programs;
DROP POLICY IF EXISTS "Users can view programs" ON public.programs;
CREATE POLICY "Users can view org programs"
  ON public.programs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM portfolios p
      WHERE p.id = programs.portfolio_id
      AND p.organization_id IN (SELECT get_user_org_ids(auth.uid()))
    )
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- Consolidate duplicate write policies with org check
DROP POLICY IF EXISTS "Managers can insert programs" ON public.programs;
DROP POLICY IF EXISTS "Users can create programs" ON public.programs;
CREATE POLICY "Users can create org programs"
  ON public.programs FOR INSERT
  WITH CHECK (
    (has_permission(auth.uid(), 'program.create'::text) OR has_permission(auth.uid(), 'project.create'::text))
    AND EXISTS (
      SELECT 1 FROM portfolios p
      WHERE p.id = programs.portfolio_id
      AND p.organization_id IN (SELECT get_user_org_ids(auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Managers can update programs" ON public.programs;
DROP POLICY IF EXISTS "Users can update programs" ON public.programs;
CREATE POLICY "Users can update org programs"
  ON public.programs FOR UPDATE
  USING (
    (has_permission(auth.uid(), 'program.edit'::text) OR has_permission(auth.uid(), 'project.edit'::text))
    AND EXISTS (
      SELECT 1 FROM portfolios p
      WHERE p.id = programs.portfolio_id
      AND p.organization_id IN (SELECT get_user_org_ids(auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Managers can delete programs" ON public.programs;
DROP POLICY IF EXISTS "Users can delete programs" ON public.programs;
CREATE POLICY "Users can delete org programs"
  ON public.programs FOR DELETE
  USING (
    (has_permission(auth.uid(), 'program.delete'::text) OR has_permission(auth.uid(), 'project.delete'::text))
    AND EXISTS (
      SELECT 1 FROM portfolios p
      WHERE p.id = programs.portfolio_id
      AND p.organization_id IN (SELECT get_user_org_ids(auth.uid()))
    )
  );

-- 3. DOCUMENTS: Replace permissive SELECT with org-filtered via projects
DROP POLICY IF EXISTS "Authenticated users can view documents" ON public.documents;
CREATE POLICY "Users can view org documents"
  ON public.documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = documents.project_id
      AND p.organization_id IN (SELECT get_user_org_ids(auth.uid()))
    )
    OR (project_id IS NULL AND auth.uid() IS NOT NULL)
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- Tighten write policies with org check
DROP POLICY IF EXISTS "Users with permission can create documents" ON public.documents;
CREATE POLICY "Users with permission can create documents"
  ON public.documents FOR INSERT
  WITH CHECK (
    has_permission(auth.uid(), 'project.edit'::text)
    AND (
      project_id IS NULL
      OR EXISTS (
        SELECT 1 FROM projects p
        WHERE p.id = documents.project_id
        AND p.organization_id IN (SELECT get_user_org_ids(auth.uid()))
      )
    )
  );

DROP POLICY IF EXISTS "Users with permission can update documents" ON public.documents;
CREATE POLICY "Users with permission can update documents"
  ON public.documents FOR UPDATE
  USING (
    has_permission(auth.uid(), 'project.edit'::text)
    AND (
      project_id IS NULL
      OR EXISTS (
        SELECT 1 FROM projects p
        WHERE p.id = documents.project_id
        AND p.organization_id IN (SELECT get_user_org_ids(auth.uid()))
      )
    )
  );

DROP POLICY IF EXISTS "Users with permission can delete documents" ON public.documents;
CREATE POLICY "Users with permission can delete documents"
  ON public.documents FOR DELETE
  USING (
    has_permission(auth.uid(), 'project.delete'::text)
    AND (
      project_id IS NULL
      OR EXISTS (
        SELECT 1 FROM projects p
        WHERE p.id = documents.project_id
        AND p.organization_id IN (SELECT get_user_org_ids(auth.uid()))
      )
    )
  );

-- 4. TASK_DEPENDENCIES: Replace permissive SELECT with org-filtered via tasks→projects
DROP POLICY IF EXISTS "Authenticated users can view task dependencies" ON public.task_dependencies;
CREATE POLICY "Users can view org task dependencies"
  ON public.task_dependencies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN projects p ON p.id = t.project_id
      WHERE t.id = task_dependencies.task_id
      AND p.organization_id IN (SELECT get_user_org_ids(auth.uid()))
    )
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- Tighten write policies with org check
DROP POLICY IF EXISTS "Users with permission can create task dependencies" ON public.task_dependencies;
CREATE POLICY "Users with permission can create task dependencies"
  ON public.task_dependencies FOR INSERT
  WITH CHECK (
    has_permission(auth.uid(), 'task.create'::text)
    AND EXISTS (
      SELECT 1 FROM tasks t
      JOIN projects p ON p.id = t.project_id
      WHERE t.id = task_dependencies.task_id
      AND p.organization_id IN (SELECT get_user_org_ids(auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Users with permission can update task dependencies" ON public.task_dependencies;
CREATE POLICY "Users with permission can update task dependencies"
  ON public.task_dependencies FOR UPDATE
  USING (
    has_permission(auth.uid(), 'task.edit'::text)
    AND EXISTS (
      SELECT 1 FROM tasks t
      JOIN projects p ON p.id = t.project_id
      WHERE t.id = task_dependencies.task_id
      AND p.organization_id IN (SELECT get_user_org_ids(auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Users with permission can delete task dependencies" ON public.task_dependencies;
CREATE POLICY "Users with permission can delete task dependencies"
  ON public.task_dependencies FOR DELETE
  USING (
    has_permission(auth.uid(), 'task.delete'::text)
    AND EXISTS (
      SELECT 1 FROM tasks t
      JOIN projects p ON p.id = t.project_id
      WHERE t.id = task_dependencies.task_id
      AND p.organization_id IN (SELECT get_user_org_ids(auth.uid()))
    )
  );

-- 5. COST_CATEGORIES: Keep SELECT readable (shared reference data), restrict management to admins
DROP POLICY IF EXISTS "Managers can manage cost categories" ON public.cost_categories;
CREATE POLICY "Admins can manage cost categories"
  ON public.cost_categories FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 6. BUDGET_ENTRIES: Tighten write policies with org check via projects
DROP POLICY IF EXISTS "Users with permission can create budget entries" ON public.budget_entries;
CREATE POLICY "Users with permission can create budget entries"
  ON public.budget_entries FOR INSERT
  WITH CHECK (
    has_permission(auth.uid(), 'project.edit'::text)
    AND EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = budget_entries.project_id
      AND p.organization_id IN (SELECT get_user_org_ids(auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Users with permission can update budget entries" ON public.budget_entries;
CREATE POLICY "Users with permission can update budget entries"
  ON public.budget_entries FOR UPDATE
  USING (
    has_permission(auth.uid(), 'project.edit'::text)
    AND EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = budget_entries.project_id
      AND p.organization_id IN (SELECT get_user_org_ids(auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Users with permission can delete budget entries" ON public.budget_entries;
CREATE POLICY "Users with permission can delete budget entries"
  ON public.budget_entries FOR DELETE
  USING (
    has_permission(auth.uid(), 'project.delete'::text)
    AND EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = budget_entries.project_id
      AND p.organization_id IN (SELECT get_user_org_ids(auth.uid()))
    )
  );
