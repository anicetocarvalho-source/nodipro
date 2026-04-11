
-- Trigger: notify on document workflow creation
CREATE OR REPLACE FUNCTION public.notify_document_workflow()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.assigned_to IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, message, module, action_url)
    VALUES (
      NEW.assigned_to,
      'warning',
      'Revisão de documento pendente',
      'Tem um documento a aguardar a sua ' || NEW.workflow_type || '.',
      'documents',
      '/documents'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_document_workflow
AFTER INSERT ON public.document_workflows
FOR EACH ROW
EXECUTE FUNCTION public.notify_document_workflow();

-- Trigger: notify on disbursement tranche status change
CREATE OR REPLACE FUNCTION public.notify_disbursement_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.created_by IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, message, module, project_id, action_url)
    VALUES (
      NEW.created_by,
      CASE WHEN NEW.status = 'disbursed' THEN 'success' WHEN NEW.status = 'cancelled' THEN 'error' ELSE 'info' END,
      'Estado de desembolso alterado',
      'A tranche "' || NEW.title || '" passou para o estado: ' || NEW.status || '.',
      'disbursements',
      NEW.project_id,
      '/disbursements'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_disbursement_change
AFTER UPDATE OF status ON public.disbursement_tranches
FOR EACH ROW
EXECUTE FUNCTION public.notify_disbursement_change();

-- Trigger: notify on change request creation
CREATE OR REPLACE FUNCTION public.notify_change_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project_manager UUID;
BEGIN
  SELECT tm.user_id INTO v_project_manager
  FROM public.team_members tm
  WHERE tm.project_id = NEW.project_id AND tm.role IN ('project_manager', 'manager')
  LIMIT 1;

  IF v_project_manager IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, message, module, project_id, action_url)
    VALUES (
      v_project_manager,
      'warning',
      'Novo pedido de alteração',
      'Foi submetido o pedido "' || NEW.title || '" que requer análise.',
      'change_requests',
      NEW.project_id,
      '/change-requests'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_change_request
AFTER INSERT ON public.change_requests
FOR EACH ROW
EXECUTE FUNCTION public.notify_change_request();
