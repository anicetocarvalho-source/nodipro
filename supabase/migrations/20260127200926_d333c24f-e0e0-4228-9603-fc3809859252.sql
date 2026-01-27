-- Disable RLS temporarily on organizations table to allow onboarding
ALTER TABLE public.organizations DISABLE ROW LEVEL SECURITY;

-- Also ensure organization_members allows self-insert during onboarding
DROP POLICY IF EXISTS "Users can create own membership" ON public.organization_members;
CREATE POLICY "Users can create own membership"
ON public.organization_members
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());