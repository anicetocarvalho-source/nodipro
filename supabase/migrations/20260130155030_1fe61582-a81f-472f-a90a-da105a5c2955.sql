-- Fix portfolios table RLS policies: change 'projects' (plural) to 'project' (singular)

-- 1. Drop existing policies with wrong permission names
DROP POLICY IF EXISTS "Managers can delete portfolios" ON public.portfolios;
DROP POLICY IF EXISTS "Managers can insert portfolios" ON public.portfolios;
DROP POLICY IF EXISTS "Managers can update portfolios" ON public.portfolios;

-- 2. Recreate policies with correct singular permission names
CREATE POLICY "Managers can delete portfolios"
ON public.portfolios
FOR DELETE
USING (has_permission(auth.uid(), 'project.delete'));

CREATE POLICY "Managers can insert portfolios"
ON public.portfolios
FOR INSERT
WITH CHECK (has_permission(auth.uid(), 'project.create'));

CREATE POLICY "Managers can update portfolios"
ON public.portfolios
FOR UPDATE
USING (has_permission(auth.uid(), 'project.edit'));