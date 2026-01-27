-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "Members can view org members" ON public.organization_members;
DROP POLICY IF EXISTS "Users can view own memberships" ON public.organization_members;
DROP POLICY IF EXISTS "Organization admins can manage members" ON public.organization_members;
DROP POLICY IF EXISTS "Users can insert themselves as owner when creating org" ON public.organization_members;

-- Create security definer function to check organization membership
CREATE OR REPLACE FUNCTION public.is_org_member(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE user_id = _user_id
    AND organization_id = _org_id
  )
$$;

-- Create security definer function to check org admin/owner status
CREATE OR REPLACE FUNCTION public.is_org_admin(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE user_id = _user_id
    AND organization_id = _org_id
    AND role IN ('owner', 'admin')
  )
$$;

-- Create security definer function to get user's organization IDs
CREATE OR REPLACE FUNCTION public.get_user_org_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id
  FROM public.organization_members
  WHERE user_id = _user_id
$$;

-- Recreate policies without recursion
-- Users can view their own membership
CREATE POLICY "Users can view own memberships"
ON public.organization_members
FOR SELECT
USING (user_id = auth.uid());

-- Authenticated users can insert themselves as owner when creating org
CREATE POLICY "Users can create org membership as owner"
ON public.organization_members
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Organization admins can update members (using security definer function)
CREATE POLICY "Org admins can update members"
ON public.organization_members
FOR UPDATE
USING (is_org_admin(auth.uid(), organization_id));

-- Organization admins can delete members (using security definer function)
CREATE POLICY "Org admins can delete members"
ON public.organization_members
FOR DELETE
USING (is_org_admin(auth.uid(), organization_id));

-- Update organizations policies to use security definer functions
DROP POLICY IF EXISTS "Users can view organizations they belong to" ON public.organizations;
DROP POLICY IF EXISTS "Organization owners and admins can update" ON public.organizations;
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON public.organizations;
DROP POLICY IF EXISTS "Only owners can delete organizations" ON public.organizations;

-- Organizations SELECT policy - users can see orgs they belong to
CREATE POLICY "Users can view own organizations"
ON public.organizations
FOR SELECT
USING (id IN (SELECT public.get_user_org_ids(auth.uid())));

-- Authenticated users can create organizations
CREATE POLICY "Authenticated users can create organizations"
ON public.organizations
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Org admins can update their organizations
CREATE POLICY "Org admins can update organizations"
ON public.organizations
FOR UPDATE
USING (is_org_admin(auth.uid(), id));

-- Only owners can delete organizations
CREATE POLICY "Org owners can delete organizations"
ON public.organizations
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = id
    AND user_id = auth.uid()
    AND role = 'owner'
  )
);