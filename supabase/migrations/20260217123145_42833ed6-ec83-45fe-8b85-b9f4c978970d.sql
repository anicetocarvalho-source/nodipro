
-- =====================================================
-- PRODUCTION READINESS: Fix permissive RLS policies
-- =====================================================

-- 1. Fix document_history INSERT policy (currently USING true)
-- The trigger log_document_history() runs as SECURITY DEFINER, so it bypasses RLS.
-- But the permissive policy is still a risk. Replace with org-member check.
DROP POLICY IF EXISTS "System can create history" ON public.document_history;
CREATE POLICY "Org members can insert document history"
  ON public.document_history FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM documents d
      JOIN projects p ON p.id = d.project_id
      WHERE d.id = document_id
      AND p.organization_id IN (SELECT get_user_org_ids(auth.uid()))
    )
    OR
    EXISTS (
      SELECT 1 FROM documents d
      WHERE d.id = document_id AND d.project_id IS NULL AND auth.uid() IS NOT NULL
    )
  );

-- 2. Fix budget_alerts INSERT policy (currently WITH CHECK true)
-- budget_alerts are created by trigger check_budget_thresholds() which is SECURITY DEFINER
-- But permissive policy is a risk. Restrict to org members of the project.
DROP POLICY IF EXISTS "System can create budget alerts" ON public.budget_alerts;
CREATE POLICY "Org members can insert budget alerts"
  ON public.budget_alerts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_id
      AND p.organization_id IN (SELECT get_user_org_ids(auth.uid()))
    )
  );

-- 3. Fix organizations INSERT policy (currently WITH CHECK true)
-- Anyone authenticated could create an organization - this is intentional for onboarding
-- But we should at least require authentication
DROP POLICY IF EXISTS "Authenticated can insert organizations" ON public.organizations;
CREATE POLICY "Authenticated users can create organizations"
  ON public.organizations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
