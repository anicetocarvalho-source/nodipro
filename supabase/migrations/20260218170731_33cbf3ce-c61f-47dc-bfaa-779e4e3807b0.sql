
-- Allow anyone (including unauthenticated) to read subscription plans
DROP POLICY IF EXISTS "Anyone authenticated can read plans" ON public.subscription_plans;
CREATE POLICY "Anyone can read active plans"
  ON public.subscription_plans FOR SELECT
  USING (is_active = true);
