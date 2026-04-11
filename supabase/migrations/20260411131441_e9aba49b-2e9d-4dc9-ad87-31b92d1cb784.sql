
-- Create disbursement_tranches table
CREATE TABLE public.disbursement_tranches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  tranche_number INTEGER NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  description TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'AOA',
  condition_description TEXT,
  milestone_description TEXT,
  planned_date DATE,
  actual_date DATE,
  status TEXT NOT NULL DEFAULT 'planned',
  evidence_document_id UUID REFERENCES public.documents(id),
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.disbursement_tranches ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view tranches of their org projects"
  ON public.disbursement_tranches FOR SELECT
  USING (public.project_in_user_orgs(project_id));

CREATE POLICY "Users can create tranches for their org projects"
  ON public.disbursement_tranches FOR INSERT
  WITH CHECK (public.project_in_user_orgs(project_id));

CREATE POLICY "Users can update tranches of their org projects"
  ON public.disbursement_tranches FOR UPDATE
  USING (public.project_in_user_orgs(project_id));

CREATE POLICY "Users can delete tranches of their org projects"
  ON public.disbursement_tranches FOR DELETE
  USING (public.project_in_user_orgs(project_id));

-- Timestamp trigger
CREATE TRIGGER update_disbursement_tranches_updated_at
  BEFORE UPDATE ON public.disbursement_tranches
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Audit trigger
CREATE TRIGGER audit_disbursement_tranches
  AFTER INSERT OR UPDATE OR DELETE ON public.disbursement_tranches
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_trigger_func();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.disbursement_tranches;
