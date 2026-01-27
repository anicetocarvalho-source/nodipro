-- Drop existing INSERT policy and create simpler one
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON public.organizations;

-- Simpler INSERT policy - just check if user is authenticated
CREATE POLICY "Authenticated can insert organizations"
ON public.organizations
FOR INSERT
TO authenticated
WITH CHECK (true);