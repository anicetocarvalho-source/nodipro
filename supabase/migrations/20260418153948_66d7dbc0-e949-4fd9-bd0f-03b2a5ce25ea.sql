-- Trigger to auto-sync funding_agreements.disbursed_amount from disbursement_tranches
CREATE OR REPLACE FUNCTION public.update_funding_disbursed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project_id uuid;
BEGIN
  v_project_id := COALESCE(NEW.project_id, OLD.project_id);

  UPDATE public.funding_agreements fa
  SET disbursed_amount = COALESCE((
    SELECT SUM(dt.amount)
    FROM public.disbursement_tranches dt
    WHERE dt.project_id = fa.project_id
      AND dt.status = 'disbursed'
  ), 0),
  updated_at = now()
  WHERE fa.project_id = v_project_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_funding_disbursed ON public.disbursement_tranches;
CREATE TRIGGER sync_funding_disbursed
AFTER INSERT OR UPDATE OR DELETE ON public.disbursement_tranches
FOR EACH ROW EXECUTE FUNCTION public.update_funding_disbursed();