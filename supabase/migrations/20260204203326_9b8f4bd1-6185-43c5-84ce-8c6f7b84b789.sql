-- Insert program-specific permissions
INSERT INTO public.permissions (name, category, description)
VALUES 
  ('program.create', 'program', 'Criar novos programas'),
  ('program.edit', 'program', 'Editar programas existentes'),
  ('program.delete', 'program', 'Eliminar programas')
ON CONFLICT (name) DO NOTHING;

-- Assign program permissions to admin, portfolio_manager and manager roles
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'admin'::app_role, id FROM public.permissions 
WHERE name IN ('program.create', 'program.edit', 'program.delete')
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role, permission_id)
SELECT 'portfolio_manager'::app_role, id FROM public.permissions 
WHERE name IN ('program.create', 'program.edit', 'program.delete')
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role, permission_id)
SELECT 'manager'::app_role, id FROM public.permissions 
WHERE name IN ('program.create', 'program.edit', 'program.delete')
ON CONFLICT DO NOTHING;

-- Drop existing programs RLS policies
DROP POLICY IF EXISTS "Users can view programs" ON public.programs;
DROP POLICY IF EXISTS "Users can create programs" ON public.programs;
DROP POLICY IF EXISTS "Users can update programs" ON public.programs;
DROP POLICY IF EXISTS "Users can delete programs" ON public.programs;

-- Create new granular RLS policies for programs
CREATE POLICY "Users can view programs" ON public.programs
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create programs" ON public.programs
FOR INSERT TO authenticated
WITH CHECK (public.has_permission(auth.uid(), 'program.create'));

CREATE POLICY "Users can update programs" ON public.programs
FOR UPDATE TO authenticated
USING (public.has_permission(auth.uid(), 'program.edit'))
WITH CHECK (public.has_permission(auth.uid(), 'program.edit'));

CREATE POLICY "Users can delete programs" ON public.programs
FOR DELETE TO authenticated
USING (public.has_permission(auth.uid(), 'program.delete'));