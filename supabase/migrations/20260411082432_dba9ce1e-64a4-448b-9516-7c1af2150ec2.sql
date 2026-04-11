
-- Function to expire trials
CREATE OR REPLACE FUNCTION public.expire_trials()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE organization_subscriptions
  SET status = 'expired', updated_at = now()
  WHERE status = 'trial'
    AND trial_ends_at IS NOT NULL
    AND trial_ends_at < now();
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- Expire any currently expired trials
SELECT public.expire_trials();

-- Update plan prices to AOA and currency
UPDATE public.subscription_plans SET
  price_monthly = 0,
  price_yearly = 0,
  currency = 'AOA'
WHERE slug = 'free';

UPDATE public.subscription_plans SET
  price_monthly = 7500,
  price_yearly = 75000,
  currency = 'AOA'
WHERE slug = 'starter';

UPDATE public.subscription_plans SET
  price_monthly = 19500,
  price_yearly = 195000,
  currency = 'AOA'
WHERE slug = 'professional';

UPDATE public.subscription_plans SET
  price_monthly = 49500,
  price_yearly = 495000,
  currency = 'AOA'
WHERE slug = 'enterprise';
