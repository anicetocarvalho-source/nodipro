
-- ============================================
-- 1. NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  module TEXT NULL,
  project_id UUID NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  action_url TEXT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_created ON public.notifications(created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Platform admins can view all notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (is_platform_admin(auth.uid()));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ============================================
-- 2. BUDGET APPROVALS TABLE
-- ============================================
CREATE TABLE public.budget_approvals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  budget_entry_id UUID NOT NULL REFERENCES public.budget_entries(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  approval_level TEXT NOT NULL DEFAULT 'prepared',
  status TEXT NOT NULL DEFAULT 'pending',
  approver_id UUID NULL,
  approver_name TEXT NULL,
  comments TEXT NULL,
  approved_at TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_approval_level CHECK (approval_level IN ('prepared', 'verified', 'approved')),
  CONSTRAINT valid_approval_status CHECK (status IN ('pending', 'approved', 'rejected'))
);

CREATE INDEX idx_budget_approvals_entry ON public.budget_approvals(budget_entry_id);
CREATE INDEX idx_budget_approvals_project ON public.budget_approvals(project_id);
CREATE INDEX idx_budget_approvals_status ON public.budget_approvals(status) WHERE status = 'pending';

ALTER TABLE public.budget_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view budget approvals"
  ON public.budget_approvals FOR SELECT
  USING (project_in_user_orgs(project_id));

CREATE POLICY "Users with permission can create budget approvals"
  ON public.budget_approvals FOR INSERT
  WITH CHECK (has_permission(auth.uid(), 'project.edit') AND project_in_user_orgs(project_id));

CREATE POLICY "Users with permission can update budget approvals"
  ON public.budget_approvals FOR UPDATE
  USING (has_permission(auth.uid(), 'project.edit') AND project_in_user_orgs(project_id));

CREATE POLICY "Users with permission can delete budget approvals"
  ON public.budget_approvals FOR DELETE
  USING (has_permission(auth.uid(), 'project.delete') AND project_in_user_orgs(project_id));

-- ============================================
-- 3. BENEFICIARIES TABLE
-- ============================================
CREATE TABLE public.beneficiaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  beneficiary_type TEXT NOT NULL DEFAULT 'direct',
  gender TEXT NULL,
  age_group TEXT NULL,
  province_id UUID NULL REFERENCES public.provinces(id),
  sector TEXT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  description TEXT NULL,
  contact_info TEXT NULL,
  registration_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'active',
  metadata JSONB NULL,
  created_by UUID NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_beneficiary_type CHECK (beneficiary_type IN ('direct', 'indirect')),
  CONSTRAINT valid_gender CHECK (gender IS NULL OR gender IN ('male', 'female', 'other')),
  CONSTRAINT valid_age_group CHECK (age_group IS NULL OR age_group IN ('0-5', '6-14', '15-24', '25-34', '35-44', '45-54', '55-64', '65+')),
  CONSTRAINT valid_beneficiary_status CHECK (status IN ('active', 'inactive', 'completed')),
  CONSTRAINT positive_quantity CHECK (quantity > 0)
);

CREATE INDEX idx_beneficiaries_project ON public.beneficiaries(project_id);
CREATE INDEX idx_beneficiaries_type ON public.beneficiaries(beneficiary_type);
CREATE INDEX idx_beneficiaries_province ON public.beneficiaries(province_id);

ALTER TABLE public.beneficiaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view beneficiaries"
  ON public.beneficiaries FOR SELECT
  USING (project_in_user_orgs(project_id));

CREATE POLICY "Users with permission can create beneficiaries"
  ON public.beneficiaries FOR INSERT
  WITH CHECK (has_permission(auth.uid(), 'project.edit') AND project_in_user_orgs(project_id));

CREATE POLICY "Users with permission can update beneficiaries"
  ON public.beneficiaries FOR UPDATE
  USING (has_permission(auth.uid(), 'project.edit') AND project_in_user_orgs(project_id));

CREATE POLICY "Users with permission can delete beneficiaries"
  ON public.beneficiaries FOR DELETE
  USING (has_permission(auth.uid(), 'project.delete') AND project_in_user_orgs(project_id));

-- ============================================
-- 4. TRIGGER: Auto-notify on budget approval creation
-- ============================================
CREATE OR REPLACE FUNCTION public.notify_budget_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.approver_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, message, module, project_id, action_url)
    VALUES (
      NEW.approver_id,
      'warning',
      'Aprovação orçamental pendente',
      'Existe uma entrada orçamental que requer a sua aprovação (nível: ' || NEW.approval_level || ').',
      'budget',
      NEW.project_id,
      '/budget'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_budget_approval
  AFTER INSERT ON public.budget_approvals
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_budget_approval();

-- ============================================
-- 5. Updated_at triggers
-- ============================================
CREATE TRIGGER update_budget_approvals_updated_at
  BEFORE UPDATE ON public.budget_approvals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_beneficiaries_updated_at
  BEFORE UPDATE ON public.beneficiaries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
