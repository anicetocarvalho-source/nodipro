-- Fix programs table RLS policies: change 'projects' (plural) to 'project' (singular)

-- 1. Drop existing policies with wrong permission names
DROP POLICY IF EXISTS "Managers can delete programs" ON public.programs;
DROP POLICY IF EXISTS "Managers can insert programs" ON public.programs;
DROP POLICY IF EXISTS "Managers can update programs" ON public.programs;

-- 2. Recreate policies with correct singular permission names
CREATE POLICY "Managers can delete programs"
ON public.programs
FOR DELETE
USING (has_permission(auth.uid(), 'project.delete'));

CREATE POLICY "Managers can insert programs"
ON public.programs
FOR INSERT
WITH CHECK (has_permission(auth.uid(), 'project.create'));

CREATE POLICY "Managers can update programs"
ON public.programs
FOR UPDATE
USING (has_permission(auth.uid(), 'project.edit'));