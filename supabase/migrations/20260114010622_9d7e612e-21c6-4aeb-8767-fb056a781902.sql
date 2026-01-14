-- Corrigir as políticas RLS para usar os nomes de permissões corretos (task.* em vez de tasks.*)

-- Drop existing incorrect policies for tasks table
DROP POLICY IF EXISTS "Users with permission can create tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users with permission can update tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users with permission can delete tasks" ON public.tasks;

-- Recreate with correct permission names
CREATE POLICY "Users with permission can create tasks" 
ON public.tasks 
FOR INSERT 
WITH CHECK (has_permission(auth.uid(), 'task.create'));

CREATE POLICY "Users with permission can update tasks" 
ON public.tasks 
FOR UPDATE 
USING (has_permission(auth.uid(), 'task.edit'));

CREATE POLICY "Users with permission can delete tasks" 
ON public.tasks 
FOR DELETE 
USING (has_permission(auth.uid(), 'task.delete'));

-- Drop existing incorrect policies for subtasks table
DROP POLICY IF EXISTS "Users with permission can create subtasks" ON public.subtasks;
DROP POLICY IF EXISTS "Users with permission can update subtasks" ON public.subtasks;
DROP POLICY IF EXISTS "Users with permission can delete subtasks" ON public.subtasks;

-- Recreate with correct permission names
CREATE POLICY "Users with permission can create subtasks" 
ON public.subtasks 
FOR INSERT 
WITH CHECK (has_permission(auth.uid(), 'task.create'));

CREATE POLICY "Users with permission can update subtasks" 
ON public.subtasks 
FOR UPDATE 
USING (has_permission(auth.uid(), 'task.edit'));

CREATE POLICY "Users with permission can delete subtasks" 
ON public.subtasks 
FOR DELETE 
USING (has_permission(auth.uid(), 'task.delete'));

-- Drop existing incorrect policies for projects table
DROP POLICY IF EXISTS "Users with permission can create projects" ON public.projects;
DROP POLICY IF EXISTS "Users with permission can update projects" ON public.projects;
DROP POLICY IF EXISTS "Users with permission can delete projects" ON public.projects;

-- Recreate with correct permission names
CREATE POLICY "Users with permission can create projects" 
ON public.projects 
FOR INSERT 
WITH CHECK (has_permission(auth.uid(), 'project.create'));

CREATE POLICY "Users with permission can update projects" 
ON public.projects 
FOR UPDATE 
USING (has_permission(auth.uid(), 'project.edit'));

CREATE POLICY "Users with permission can delete projects" 
ON public.projects 
FOR DELETE 
USING (has_permission(auth.uid(), 'project.delete'));