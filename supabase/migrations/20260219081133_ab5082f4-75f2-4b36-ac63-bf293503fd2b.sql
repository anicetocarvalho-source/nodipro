
-- Allow org owners (who just created the org) to also insert subscriptions
CREATE POLICY "Org members can insert their own subscription"
  ON public.organization_subscriptions FOR INSERT
  WITH CHECK (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));
