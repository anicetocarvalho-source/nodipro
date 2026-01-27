-- Drop existing restrictive policy and create a proper one for organization_members
DROP POLICY IF EXISTS "Members can view their organization members" ON public.organization_members;

-- Users can view their own membership records
CREATE POLICY "Users can view own memberships"
ON public.organization_members
FOR SELECT
USING (user_id = auth.uid());

-- Users who are members can also view other members of the same organization
CREATE POLICY "Members can view org members"
ON public.organization_members
FOR SELECT
USING (
    organization_id IN (
        SELECT om.organization_id 
        FROM public.organization_members om 
        WHERE om.user_id = auth.uid()
    )
);