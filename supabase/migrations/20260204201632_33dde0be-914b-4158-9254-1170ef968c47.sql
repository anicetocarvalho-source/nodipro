
-- Assign portfolio.create, portfolio.edit, portfolio.delete to appropriate roles
-- Get permission IDs and insert into role_permissions

-- Admin gets all portfolio permissions
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'admin'::app_role, id FROM public.permissions WHERE name IN ('portfolio.create', 'portfolio.edit', 'portfolio.delete')
ON CONFLICT DO NOTHING;

-- Portfolio Manager gets all portfolio permissions  
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'portfolio_manager'::app_role, id FROM public.permissions WHERE name IN ('portfolio.create', 'portfolio.edit', 'portfolio.delete')
ON CONFLICT DO NOTHING;

-- Manager gets all portfolio permissions (they manage projects, often need to manage portfolios too)
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'manager'::app_role, id FROM public.permissions WHERE name IN ('portfolio.create', 'portfolio.edit', 'portfolio.delete')
ON CONFLICT DO NOTHING;
