
-- Funding Agreements (Acordos de Financiamento)
CREATE TABLE public.funding_agreements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  funder_id UUID REFERENCES public.funders(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  agreement_number TEXT,
  agreement_type TEXT NOT NULL DEFAULT 'grant',
  status TEXT NOT NULL DEFAULT 'negotiation',
  total_amount NUMERIC NOT NULL DEFAULT 0,
  disbursed_amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'AOA',
  signed_date DATE,
  effective_date DATE,
  closing_date DATE,
  disbursement_conditions TEXT,
  key_contacts TEXT,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Digital Approvals (Registo de aprovações formais)
CREATE TABLE public.digital_approvals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  approval_type TEXT NOT NULL DEFAULT 'approval',
  status TEXT NOT NULL DEFAULT 'approved',
  approved_by UUID NOT NULL,
  approver_name TEXT,
  ip_address TEXT,
  comment TEXT NOT NULL,
  approved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_funding_agreements_org ON public.funding_agreements(organization_id);
CREATE INDEX idx_funding_agreements_project ON public.funding_agreements(project_id);
CREATE INDEX idx_funding_agreements_status ON public.funding_agreements(status);
CREATE INDEX idx_digital_approvals_entity ON public.digital_approvals(entity_type, entity_id);
CREATE INDEX idx_digital_approvals_org ON public.digital_approvals(organization_id);

-- Timestamp trigger
CREATE TRIGGER update_funding_agreements_updated_at
  BEFORE UPDATE ON public.funding_agreements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Audit triggers
CREATE TRIGGER audit_funding_agreements
  AFTER INSERT OR UPDATE OR DELETE ON public.funding_agreements
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_digital_approvals
  AFTER INSERT OR UPDATE OR DELETE ON public.digital_approvals
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- RLS
ALTER TABLE public.funding_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_approvals ENABLE ROW LEVEL SECURITY;

-- Funding Agreements policies
CREATE POLICY "Org members can view funding agreements"
  ON public.funding_agreements FOR SELECT
  USING (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));

CREATE POLICY "Org members can create funding agreements"
  ON public.funding_agreements FOR INSERT
  WITH CHECK (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));

CREATE POLICY "Org members can update funding agreements"
  ON public.funding_agreements FOR UPDATE
  USING (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));

CREATE POLICY "Org members can delete funding agreements"
  ON public.funding_agreements FOR DELETE
  USING (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));

-- Digital Approvals policies
CREATE POLICY "Org members can view approvals"
  ON public.digital_approvals FOR SELECT
  USING (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));

CREATE POLICY "Org members can create approvals"
  ON public.digital_approvals FOR INSERT
  WITH CHECK (organization_id IN (SELECT public.get_user_org_ids(auth.uid())));
