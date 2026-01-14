-- Drop existing public policies on projects table
DROP POLICY IF EXISTS "Allow public read on projects" ON public.projects;
DROP POLICY IF EXISTS "Allow public insert on projects" ON public.projects;
DROP POLICY IF EXISTS "Allow public update on projects" ON public.projects;
DROP POLICY IF EXISTS "Allow public delete on projects" ON public.projects;

-- Drop existing public policies on tasks table
DROP POLICY IF EXISTS "Allow public read on tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow public insert on tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow public update on tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow public delete on tasks" ON public.tasks;

-- Drop existing public policies on team_members table
DROP POLICY IF EXISTS "Allow public read on team_members" ON public.team_members;
DROP POLICY IF EXISTS "Allow public insert on team_members" ON public.team_members;
DROP POLICY IF EXISTS "Allow public update on team_members" ON public.team_members;
DROP POLICY IF EXISTS "Allow public delete on team_members" ON public.team_members;

-- Drop existing public policies on subtasks table
DROP POLICY IF EXISTS "Allow public read on subtasks" ON public.subtasks;
DROP POLICY IF EXISTS "Allow public insert on subtasks" ON public.subtasks;
DROP POLICY IF EXISTS "Allow public update on subtasks" ON public.subtasks;
DROP POLICY IF EXISTS "Allow public delete on subtasks" ON public.subtasks;

-- ==========================================
-- NEW SECURE POLICIES FOR PROJECTS
-- ==========================================

-- Authenticated users can view all projects
CREATE POLICY "Authenticated users can view projects"
ON public.projects FOR SELECT
TO authenticated
USING (true);

-- Users with projects.create permission can create projects
CREATE POLICY "Users with permission can create projects"
ON public.projects FOR INSERT
TO authenticated
WITH CHECK (has_permission(auth.uid(), 'projects.create'));

-- Users with projects.edit permission can update projects
CREATE POLICY "Users with permission can update projects"
ON public.projects FOR UPDATE
TO authenticated
USING (has_permission(auth.uid(), 'projects.edit'));

-- Users with projects.delete permission can delete projects
CREATE POLICY "Users with permission can delete projects"
ON public.projects FOR DELETE
TO authenticated
USING (has_permission(auth.uid(), 'projects.delete'));

-- ==========================================
-- NEW SECURE POLICIES FOR TASKS
-- ==========================================

-- Authenticated users can view tasks
CREATE POLICY "Authenticated users can view tasks"
ON public.tasks FOR SELECT
TO authenticated
USING (true);

-- Users with tasks.create permission can create tasks
CREATE POLICY "Users with permission can create tasks"
ON public.tasks FOR INSERT
TO authenticated
WITH CHECK (has_permission(auth.uid(), 'tasks.create'));

-- Users with tasks.edit permission can update tasks
CREATE POLICY "Users with permission can update tasks"
ON public.tasks FOR UPDATE
TO authenticated
USING (has_permission(auth.uid(), 'tasks.edit'));

-- Users with tasks.delete permission can delete tasks
CREATE POLICY "Users with permission can delete tasks"
ON public.tasks FOR DELETE
TO authenticated
USING (has_permission(auth.uid(), 'tasks.delete'));

-- ==========================================
-- NEW SECURE POLICIES FOR TEAM_MEMBERS
-- ==========================================

-- Authenticated users can view team members
CREATE POLICY "Authenticated users can view team_members"
ON public.team_members FOR SELECT
TO authenticated
USING (true);

-- Users with team.manage permission can create team members
CREATE POLICY "Users with permission can create team_members"
ON public.team_members FOR INSERT
TO authenticated
WITH CHECK (has_permission(auth.uid(), 'team.manage'));

-- Users with team.manage permission can update team members
CREATE POLICY "Users with permission can update team_members"
ON public.team_members FOR UPDATE
TO authenticated
USING (has_permission(auth.uid(), 'team.manage'));

-- Users with team.manage permission can delete team members
CREATE POLICY "Users with permission can delete team_members"
ON public.team_members FOR DELETE
TO authenticated
USING (has_permission(auth.uid(), 'team.manage'));

-- ==========================================
-- NEW SECURE POLICIES FOR SUBTASKS
-- ==========================================

-- Authenticated users can view subtasks
CREATE POLICY "Authenticated users can view subtasks"
ON public.subtasks FOR SELECT
TO authenticated
USING (true);

-- Users with tasks.create permission can create subtasks
CREATE POLICY "Users with permission can create subtasks"
ON public.subtasks FOR INSERT
TO authenticated
WITH CHECK (has_permission(auth.uid(), 'tasks.create'));

-- Users with tasks.edit permission can update subtasks
CREATE POLICY "Users with permission can update subtasks"
ON public.subtasks FOR UPDATE
TO authenticated
USING (has_permission(auth.uid(), 'tasks.edit'));

-- Users with tasks.delete permission can delete subtasks
CREATE POLICY "Users with permission can delete subtasks"
ON public.subtasks FOR DELETE
TO authenticated
USING (has_permission(auth.uid(), 'tasks.delete'));