
-- 1. ENABLE RLS on organizations table (it was disabled!)
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- 2. Create function to check if user belongs to the organization via project
-- This allows restricting budget_entries by organization
CREATE OR REPLACE FUNCTION public.get_user_project_org_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT p.organization_id
  FROM projects p
  WHERE p.organization_id IN (
    SELECT get_user_org_ids(_user_id)
  )
  AND p.organization_id IS NOT NULL
$$;

-- 3. Update budget_entries SELECT policy to restrict by organization
-- Drop the old overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can view budget entries" ON public.budget_entries;

-- Create new policy that restricts by organization membership
CREATE POLICY "Users can view budget entries from their org projects"
ON public.budget_entries
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = budget_entries.project_id
    AND p.organization_id IN (SELECT get_user_org_ids(auth.uid()))
  )
  OR has_permission(auth.uid(), 'project.view')
);

-- 4. Update budget_snapshots SELECT policy similarly
DROP POLICY IF EXISTS "Authenticated users can view budget snapshots" ON public.budget_snapshots;

CREATE POLICY "Users can view budget snapshots from their org projects"
ON public.budget_snapshots
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = budget_snapshots.project_id
    AND p.organization_id IN (SELECT get_user_org_ids(auth.uid()))
  )
  OR has_permission(auth.uid(), 'project.view')
);

-- 5. Update budget_alerts SELECT policy similarly  
DROP POLICY IF EXISTS "Authenticated users can view budget alerts" ON public.budget_alerts;

CREATE POLICY "Users can view budget alerts from their org projects"
ON public.budget_alerts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = budget_alerts.project_id
    AND p.organization_id IN (SELECT get_user_org_ids(auth.uid()))
  )
  OR has_permission(auth.uid(), 'project.view')
);
