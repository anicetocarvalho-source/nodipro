
-- Fornecedores
CREATE TABLE public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id),
  name TEXT NOT NULL,
  tax_id TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  category TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','blacklisted')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view suppliers" ON public.suppliers
  FOR SELECT USING (
    organization_id IN (SELECT get_user_org_ids(auth.uid()))
  );

CREATE POLICY "Users with permission can manage suppliers" ON public.suppliers
  FOR ALL USING (
    has_permission(auth.uid(), 'project.edit') AND
    organization_id IN (SELECT get_user_org_ids(auth.uid()))
  );

-- Planos de Aquisição
CREATE TABLE public.procurement_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  procurement_method TEXT NOT NULL DEFAULT 'direct' CHECK (procurement_method IN ('direct','shopping','ncb','icb','sole_source','framework')),
  estimated_amount NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'AOA',
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','in_progress','completed','cancelled')),
  planned_start_date DATE,
  planned_end_date DATE,
  actual_start_date DATE,
  actual_end_date DATE,
  category TEXT,
  funding_source TEXT,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.procurement_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view procurement plans" ON public.procurement_plans
  FOR SELECT USING (
    project_id IN (
      SELECT p.id FROM public.projects p WHERE p.organization_id IN (SELECT get_user_org_ids(auth.uid()))
    )
  );

CREATE POLICY "Users with permission can manage procurement plans" ON public.procurement_plans
  FOR ALL USING (
    has_permission(auth.uid(), 'project.edit') AND
    project_id IN (
      SELECT p.id FROM public.projects p WHERE p.organization_id IN (SELECT get_user_org_ids(auth.uid()))
    )
  );

-- Contratos
CREATE TABLE public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  procurement_plan_id UUID REFERENCES public.procurement_plans(id),
  supplier_id UUID REFERENCES public.suppliers(id),
  contract_number TEXT,
  title TEXT NOT NULL,
  description TEXT,
  contract_type TEXT NOT NULL DEFAULT 'fixed_price' CHECK (contract_type IN ('fixed_price','time_material','cost_plus','unit_price','framework')),
  amount NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'AOA',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','completed','terminated','suspended')),
  start_date DATE,
  end_date DATE,
  signed_date DATE,
  payment_terms TEXT,
  deliverables TEXT,
  penalties TEXT,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view contracts" ON public.contracts
  FOR SELECT USING (
    project_id IN (
      SELECT p.id FROM public.projects p WHERE p.organization_id IN (SELECT get_user_org_ids(auth.uid()))
    )
  );

CREATE POLICY "Users with permission can manage contracts" ON public.contracts
  FOR ALL USING (
    has_permission(auth.uid(), 'project.edit') AND
    project_id IN (
      SELECT p.id FROM public.projects p WHERE p.organization_id IN (SELECT get_user_org_ids(auth.uid()))
    )
  );

-- Triggers updated_at
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_procurement_plans_updated_at BEFORE UPDATE ON public.procurement_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
