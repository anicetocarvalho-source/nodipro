
-- Payment method enum
CREATE TYPE public.payment_method AS ENUM ('reference_multicaixa', 'stripe', 'manual');

-- Payment status enum  
CREATE TYPE public.payment_status AS ENUM ('pending', 'confirmed', 'expired', 'cancelled', 'refunded');

-- Payment references table (Multicaixa + generic)
CREATE TABLE public.payment_references (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.organization_subscriptions(id) ON DELETE SET NULL,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  payment_method public.payment_method NOT NULL DEFAULT 'reference_multicaixa',
  status public.payment_status NOT NULL DEFAULT 'pending',
  reference_code TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'AOA',
  billing_period TEXT NOT NULL DEFAULT 'monthly',
  notes TEXT,
  confirmed_by UUID,
  confirmed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '72 hours'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add payment_method to subscriptions
ALTER TABLE public.organization_subscriptions 
  ADD COLUMN IF NOT EXISTS payment_method public.payment_method DEFAULT 'reference_multicaixa';

-- Stripe preparation: payments log table
CREATE TABLE public.stripe_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.organization_subscriptions(id) ON DELETE SET NULL,
  stripe_payment_intent_id TEXT,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending',
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_payments ENABLE ROW LEVEL SECURITY;

-- RLS: org members can view their own payment references
CREATE POLICY "Org members can view payment references"
  ON public.payment_references FOR SELECT
  USING (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));

-- RLS: org admins can insert payment references
CREATE POLICY "Org members can create payment references"
  ON public.payment_references FOR INSERT
  WITH CHECK (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));

-- RLS: only org admins can update (confirm) payment references
CREATE POLICY "Org admins can update payment references"
  ON public.payment_references FOR UPDATE
  USING (public.is_org_admin(auth.uid(), organization_id));

-- Stripe payments: org members can view
CREATE POLICY "Org members can view stripe payments"
  ON public.stripe_payments FOR SELECT
  USING (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));

-- Stripe payments: only system inserts (via edge functions)
CREATE POLICY "Service role can insert stripe payments"
  ON public.stripe_payments FOR INSERT
  WITH CHECK (false);

-- Trigger for updated_at
CREATE TRIGGER update_payment_references_updated_at
  BEFORE UPDATE ON public.payment_references
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_stripe_payments_updated_at
  BEFORE UPDATE ON public.stripe_payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate a unique Multicaixa reference code
CREATE OR REPLACE FUNCTION public.generate_multicaixa_reference()
  RETURNS TEXT
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $$
DECLARE
  v_ref TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    -- Format: 3 groups of 3 digits (e.g. 123 456 789)
    v_ref := LPAD(floor(random() * 1000)::text, 3, '0') || ' ' ||
             LPAD(floor(random() * 1000)::text, 3, '0') || ' ' ||
             LPAD(floor(random() * 1000)::text, 3, '0');
    SELECT EXISTS(SELECT 1 FROM payment_references WHERE reference_code = v_ref AND status = 'pending') INTO v_exists;
    EXIT WHEN NOT v_exists;
  END LOOP;
  RETURN v_ref;
END;
$$;
