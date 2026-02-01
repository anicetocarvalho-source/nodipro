-- 1. Insert new portfolio-specific permissions
INSERT INTO public.permissions (name, description, category) VALUES
  ('portfolio.create', 'Criar portfólios', 'portfolio'),
  ('portfolio.edit', 'Editar portfólios', 'portfolio'),
  ('portfolio.delete', 'Eliminar portfólios', 'portfolio')
ON CONFLICT (name) DO NOTHING;

-- 2. Grant these permissions to admin and portfolio_manager roles
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'portfolio_manager', id FROM public.permissions WHERE name IN ('portfolio.create', 'portfolio.edit', 'portfolio.delete')
ON CONFLICT DO NOTHING;

-- 3. Update RLS policies on portfolios table to use new specific permissions
DROP POLICY IF EXISTS "Managers can delete portfolios" ON public.portfolios;
DROP POLICY IF EXISTS "Managers can insert portfolios" ON public.portfolios;
DROP POLICY IF EXISTS "Managers can update portfolios" ON public.portfolios;

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