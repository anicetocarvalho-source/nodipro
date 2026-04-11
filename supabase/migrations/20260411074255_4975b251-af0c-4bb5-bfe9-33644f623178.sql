
-- Step 1: Remove management permissions from observer
DELETE FROM public.role_permissions 
WHERE role = 'observer' 
AND permission_id IN (
  SELECT id FROM public.permissions WHERE name IN ('budget.view', 'report.view', 'portfolio.view')
);

-- Step 2: Create function to promote org owner to admin
CREATE OR REPLACE FUNCTION public.promote_org_owner_to_admin(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.user_roles SET role = 'admin' WHERE user_id = _user_id;
END;
$$;
