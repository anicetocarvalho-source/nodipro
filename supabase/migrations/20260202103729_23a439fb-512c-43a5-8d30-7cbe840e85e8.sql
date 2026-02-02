-- Update RLS policies on portfolios table to use NEW portfolio-specific permissions
DROP POLICY IF EXISTS "Users with permission can create portfolios" ON public.portfolios;
DROP POLICY IF EXISTS "Users with permission can edit portfolios" ON public.portfolios;
DROP POLICY IF EXISTS "Users with permission can delete portfolios" ON public.portfolios;

-- Also drop old policies that might still exist
DROP POLICY IF EXISTS "Managers can delete portfolios" ON public.portfolios;
DROP POLICY IF EXISTS "Managers can insert portfolios" ON public.portfolios;
DROP POLICY IF EXISTS "Managers can update portfolios" ON public.portfolios;

-- Create new policies using portfolio-specific permissions
CREATE POLICY "Users with permission can create portfolios"
ON public.portfolios
FOR INSERT
WITH CHECK (has_permission(auth.uid(), 'portfolio.create'));

CREATE POLICY "Users with permission can edit portfolios"
ON public.portfolios
FOR UPDATE
USING (has_permission(auth.uid(), 'portfolio.edit'));

CREATE POLICY "Users with permission can delete portfolios"
ON public.portfolios
FOR DELETE
USING (has_permission(auth.uid(), 'portfolio.delete'));