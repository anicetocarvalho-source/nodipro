-- Helper function: check if project belongs to user's org
CREATE OR REPLACE FUNCTION public.project_in_user_orgs(_project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM projects p
    WHERE p.id = _project_id
    AND p.organization_id IN (SELECT get_user_org_ids(auth.uid()))
  )
$$;

-- =============================================
-- 1. PROJECTS: Replace permissive SELECT with org-scoped
-- =============================================
DROP POLICY IF EXISTS "Authenticated users can view projects" ON projects;
CREATE POLICY "Users can view org projects" ON projects
  FOR SELECT TO authenticated
  USING (
    organization_id IN (SELECT get_user_org_ids(auth.uid()))
    OR is_platform_admin(auth.uid())
  );

DROP POLICY IF EXISTS "Users with permission can update projects" ON projects;
CREATE POLICY "Users with permission can update projects" ON projects
  FOR UPDATE TO authenticated
  USING (
    has_permission(auth.uid(), 'project.edit')
    AND organization_id IN (SELECT get_user_org_ids(auth.uid()))
  );

DROP POLICY IF EXISTS "Users with permission can delete projects" ON projects;
CREATE POLICY "Users with permission can delete projects" ON projects
  FOR DELETE TO authenticated
  USING (
    has_permission(auth.uid(), 'project.delete')
    AND organization_id IN (SELECT get_user_org_ids(auth.uid()))
  );

DROP POLICY IF EXISTS "Users with permission can create projects" ON projects;
CREATE POLICY "Users with permission can create projects" ON projects
  FOR INSERT TO authenticated
  WITH CHECK (
    has_permission(auth.uid(), 'project.create')
    AND organization_id IN (SELECT get_user_org_ids(auth.uid()))
  );

-- =============================================
-- 2. TASKS: Replace permissive SELECT with org-scoped via project
-- =============================================
DROP POLICY IF EXISTS "Authenticated users can view tasks" ON tasks;
CREATE POLICY "Users can view org tasks" ON tasks
  FOR SELECT TO authenticated
  USING (project_in_user_orgs(project_id));

DROP POLICY IF EXISTS "Users with permission can create tasks" ON tasks;
CREATE POLICY "Users with permission can create tasks" ON tasks
  FOR INSERT TO authenticated
  WITH CHECK (has_permission(auth.uid(), 'task.create') AND project_in_user_orgs(project_id));

DROP POLICY IF EXISTS "Users with permission can update tasks" ON tasks;
CREATE POLICY "Users with permission can update tasks" ON tasks
  FOR UPDATE TO authenticated
  USING (has_permission(auth.uid(), 'task.edit') AND project_in_user_orgs(project_id));

DROP POLICY IF EXISTS "Users with permission can delete tasks" ON tasks;
CREATE POLICY "Users with permission can delete tasks" ON tasks
  FOR DELETE TO authenticated
  USING (has_permission(auth.uid(), 'task.delete') AND project_in_user_orgs(project_id));

-- =============================================
-- 3. TEAM_MEMBERS: Replace permissive SELECT with org-scoped
-- =============================================
DROP POLICY IF EXISTS "Authenticated users can view team_members" ON team_members;
CREATE POLICY "Users can view org team members" ON team_members
  FOR SELECT TO authenticated
  USING (project_in_user_orgs(project_id));

DROP POLICY IF EXISTS "Users with permission can create team_members" ON team_members;
CREATE POLICY "Users with permission can manage team members" ON team_members
  FOR INSERT TO authenticated
  WITH CHECK (has_permission(auth.uid(), 'team.manage') AND project_in_user_orgs(project_id));

DROP POLICY IF EXISTS "Users with permission can update team_members" ON team_members;
CREATE POLICY "Users with permission can update team members" ON team_members
  FOR UPDATE TO authenticated
  USING (has_permission(auth.uid(), 'team.manage') AND project_in_user_orgs(project_id));

DROP POLICY IF EXISTS "Users with permission can delete team_members" ON team_members;
CREATE POLICY "Users with permission can delete team members" ON team_members
  FOR DELETE TO authenticated
  USING (has_permission(auth.uid(), 'team.manage') AND project_in_user_orgs(project_id));

-- =============================================
-- 4. SUBTASKS: Replace permissive SELECT with org-scoped via task->project
-- =============================================
DROP POLICY IF EXISTS "Authenticated users can view subtasks" ON subtasks;
CREATE POLICY "Users can view org subtasks" ON subtasks
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks t
      WHERE t.id = subtasks.task_id
      AND project_in_user_orgs(t.project_id)
    )
  );

DROP POLICY IF EXISTS "Users with permission can create subtasks" ON subtasks;
CREATE POLICY "Users with permission can create subtasks" ON subtasks
  FOR INSERT TO authenticated
  WITH CHECK (
    has_permission(auth.uid(), 'task.create')
    AND EXISTS (
      SELECT 1 FROM tasks t
      WHERE t.id = subtasks.task_id
      AND project_in_user_orgs(t.project_id)
    )
  );

DROP POLICY IF EXISTS "Users with permission can update subtasks" ON subtasks;
CREATE POLICY "Users with permission can update subtasks" ON subtasks
  FOR UPDATE TO authenticated
  USING (
    has_permission(auth.uid(), 'task.edit')
    AND EXISTS (
      SELECT 1 FROM tasks t
      WHERE t.id = subtasks.task_id
      AND project_in_user_orgs(t.project_id)
    )
  );

DROP POLICY IF EXISTS "Users with permission can delete subtasks" ON subtasks;
CREATE POLICY "Users with permission can delete subtasks" ON subtasks
  FOR DELETE TO authenticated
  USING (
    has_permission(auth.uid(), 'task.delete')
    AND EXISTS (
      SELECT 1 FROM tasks t
      WHERE t.id = subtasks.task_id
      AND project_in_user_orgs(t.project_id)
    )
  );

-- =============================================
-- 5. DOCUMENT_VERSIONS: Replace permissive SELECT with org-scoped
-- =============================================
DROP POLICY IF EXISTS "Authenticated users can view versions" ON document_versions;
CREATE POLICY "Users can view org document versions" ON document_versions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM documents d
      LEFT JOIN projects p ON p.id = d.project_id
      WHERE d.id = document_versions.document_id
      AND (d.project_id IS NULL OR p.organization_id IN (SELECT get_user_org_ids(auth.uid())))
    )
  );

-- =============================================
-- 6. DOCUMENT_COMMENTS: Replace permissive SELECT with org-scoped
-- =============================================
DROP POLICY IF EXISTS "Authenticated users can view comments" ON document_comments;
CREATE POLICY "Users can view org document comments" ON document_comments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM documents d
      LEFT JOIN projects p ON p.id = d.project_id
      WHERE d.id = document_comments.document_id
      AND (d.project_id IS NULL OR p.organization_id IN (SELECT get_user_org_ids(auth.uid())))
    )
  );

-- =============================================
-- 7. DOCUMENT_WORKFLOWS: Replace permissive SELECT with org-scoped
-- =============================================
DROP POLICY IF EXISTS "Authenticated users can view workflows" ON document_workflows;
CREATE POLICY "Users can view org document workflows" ON document_workflows
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM documents d
      LEFT JOIN projects p ON p.id = d.project_id
      WHERE d.id = document_workflows.document_id
      AND (d.project_id IS NULL OR p.organization_id IN (SELECT get_user_org_ids(auth.uid())))
    )
  );

-- =============================================
-- 8. USER_ROLES: Restrict to own role or admin
-- =============================================
DROP POLICY IF EXISTS "Users can view all roles" ON user_roles;
CREATE POLICY "Users can view own role or admin can view all" ON user_roles
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR has_role(auth.uid(), 'admin')
    OR is_platform_admin(auth.uid())
  );

-- =============================================
-- 9. BUDGET_ALERTS: Fix UPDATE/DELETE to be org-scoped
-- =============================================
DROP POLICY IF EXISTS "Users with permission can update budget alerts" ON budget_alerts;
CREATE POLICY "Users with permission can update budget alerts" ON budget_alerts
  FOR UPDATE TO authenticated
  USING (
    has_permission(auth.uid(), 'project.edit')
    AND project_in_user_orgs(project_id)
  );

DROP POLICY IF EXISTS "Users with permission can delete budget alerts" ON budget_alerts;
CREATE POLICY "Users with permission can delete budget alerts" ON budget_alerts
  FOR DELETE TO authenticated
  USING (
    has_permission(auth.uid(), 'project.delete')
    AND project_in_user_orgs(project_id)
  );

-- =============================================
-- 10. BUDGET_SNAPSHOTS: Fix ALL policy to be org-scoped
-- =============================================
DROP POLICY IF EXISTS "Users with permission can manage budget snapshots" ON budget_snapshots;
CREATE POLICY "Users with permission can manage budget snapshots" ON budget_snapshots
  FOR ALL TO authenticated
  USING (
    has_permission(auth.uid(), 'project.edit')
    AND project_in_user_orgs(project_id)
  )
  WITH CHECK (
    has_permission(auth.uid(), 'project.edit')
    AND project_in_user_orgs(project_id)
  );

-- =============================================
-- 11. ORGANIZATIONS: Fix buggy DELETE policy
-- =============================================
DROP POLICY IF EXISTS "Org owners can delete organizations" ON organizations;
CREATE POLICY "Org owners can delete organizations" ON organizations
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organizations.id
      AND om.user_id = auth.uid()
      AND om.role = 'owner'
    )
  );

-- =============================================
-- 12. DATA VALIDATION TRIGGERS
-- =============================================
CREATE OR REPLACE FUNCTION public.validate_project_data()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.progress IS NOT NULL AND (NEW.progress < 0 OR NEW.progress > 100) THEN
    RAISE EXCEPTION 'progress must be between 0 and 100';
  END IF;
  IF NEW.budget IS NOT NULL AND NEW.budget < 0 THEN
    RAISE EXCEPTION 'budget cannot be negative';
  END IF;
  IF NEW.spent IS NOT NULL AND NEW.spent < 0 THEN
    RAISE EXCEPTION 'spent cannot be negative';
  END IF;
  IF NEW.start_date IS NOT NULL AND NEW.end_date IS NOT NULL AND NEW.end_date < NEW.start_date THEN
    RAISE EXCEPTION 'end_date must be after start_date';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_project_before_save ON projects;
CREATE TRIGGER validate_project_before_save
  BEFORE INSERT OR UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION validate_project_data();