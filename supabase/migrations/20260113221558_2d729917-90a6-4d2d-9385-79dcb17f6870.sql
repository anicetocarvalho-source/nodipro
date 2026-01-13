-- Step 3: Assign permissions to roles and create helper functions

-- Admin gets everything
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'admin'::app_role, id FROM public.permissions;

-- Manager (legacy role -> equivalent to portfolio_manager)
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'manager'::app_role, id FROM public.permissions 
WHERE name IN (
  'project.view', 'project.create', 'project.edit', 'project.archive',
  'portfolio.view', 'portfolio.manage', 'portfolio.reports',
  'task.view', 'task.create', 'task.edit', 'task.assign',
  'document.view', 'document.upload', 'document.approve',
  'budget.view', 'budget.edit',
  'team.view', 'team.manage', 'team.invite',
  'report.view', 'report.create', 'report.export'
);

-- Portfolio Manager
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'portfolio_manager'::app_role, id FROM public.permissions 
WHERE name IN (
  'project.view', 'project.create', 'project.edit', 'project.archive',
  'portfolio.view', 'portfolio.manage', 'portfolio.reports',
  'task.view', 'task.create', 'task.edit', 'task.assign',
  'document.view', 'document.upload', 'document.approve',
  'budget.view', 'budget.edit',
  'team.view', 'team.manage', 'team.invite',
  'report.view', 'report.create', 'report.export'
);

-- Project Manager
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'project_manager'::app_role, id FROM public.permissions 
WHERE name IN (
  'project.view', 'project.edit',
  'portfolio.view',
  'task.view', 'task.create', 'task.edit', 'task.delete', 'task.assign',
  'document.view', 'document.upload', 'document.delete',
  'budget.view', 'budget.edit',
  'team.view', 'team.manage',
  'report.view', 'report.create', 'report.export'
);

-- Member
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'member'::app_role, id FROM public.permissions 
WHERE name IN (
  'project.view',
  'task.view', 'task.create', 'task.edit',
  'document.view', 'document.upload',
  'budget.view',
  'team.view',
  'report.view'
);

-- Observer (read-only)
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'observer'::app_role, id FROM public.permissions 
WHERE name IN (
  'project.view', 'portfolio.view', 'task.view',
  'document.view', 'budget.view', 'team.view', 'report.view'
);

-- Update get_user_role function for new roles hierarchy
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY 
    CASE role 
      WHEN 'admin' THEN 1 
      WHEN 'portfolio_manager' THEN 2
      WHEN 'manager' THEN 3
      WHEN 'project_manager' THEN 4
      WHEN 'member' THEN 5
      WHEN 'observer' THEN 6
    END
  LIMIT 1
$$;

-- Create function to check if user has specific permission
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission text, _project_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role app_role;
  has_perm boolean;
  override_granted boolean;
BEGIN
  SELECT role INTO user_role FROM public.user_roles WHERE user_id = _user_id LIMIT 1;
  
  IF user_role IS NULL THEN RETURN false; END IF;
  
  SELECT EXISTS (
    SELECT 1 FROM public.role_permissions rp
    JOIN public.permissions p ON p.id = rp.permission_id
    WHERE rp.role = user_role AND p.name = _permission
  ) INTO has_perm;
  
  SELECT granted INTO override_granted
  FROM public.user_permission_overrides upo
  JOIN public.permissions p ON p.id = upo.permission_id
  WHERE upo.user_id = _user_id AND p.name = _permission
    AND (upo.project_id = _project_id OR upo.project_id IS NULL)
  ORDER BY CASE WHEN upo.project_id = _project_id THEN 0 ELSE 1 END
  LIMIT 1;
  
  IF override_granted IS NOT NULL THEN RETURN override_granted; END IF;
  
  RETURN has_perm;
END;
$$;

-- Create function to get all permissions for a user
CREATE OR REPLACE FUNCTION public.get_user_permissions(_user_id uuid)
RETURNS TABLE(permission_name text, category text, granted boolean)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role app_role;
BEGIN
  SELECT role INTO user_role FROM public.user_roles WHERE user_id = _user_id LIMIT 1;
  
  IF user_role IS NULL THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    p.name,
    p.category,
    COALESCE(
      (SELECT upo.granted 
       FROM public.user_permission_overrides upo 
       WHERE upo.user_id = _user_id AND upo.permission_id = p.id
       LIMIT 1),
      (rp.permission_id IS NOT NULL)
    ) as granted
  FROM public.permissions p
  LEFT JOIN public.role_permissions rp ON rp.permission_id = p.id AND rp.role = user_role;
END;
$$;