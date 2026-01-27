-- Recreate the INSERT policy for organizations to ensure it works
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON public.organizations;

-- Simple policy: any authenticated user can create an organization
-- The created_by field should match the authenticated user
CREATE POLICY "Authenticated users can create organizations"
ON public.organizations
FOR INSERT
WITH CHECK (
    auth.uid() IS NOT NULL AND 
    (created_by IS NULL OR created_by = auth.uid())
);

-- Also ensure organization_members insert policy works correctly
DROP POLICY IF EXISTS "Users can create org membership as owner" ON public.organization_members;

CREATE POLICY "Users can create org membership as owner"
ON public.organization_members
FOR INSERT
WITH CHECK (
    user_id = auth.uid()
);