-- Create cost categories table
CREATE TABLE public.cost_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  code TEXT UNIQUE,
  parent_id UUID REFERENCES public.cost_categories(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cost_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view cost categories" 
ON public.cost_categories FOR SELECT USING (true);

CREATE POLICY "Managers can manage cost categories" 
ON public.cost_categories FOR ALL USING (has_permission(auth.uid(), 'projects.create'::text));

-- Insert default cost categories
INSERT INTO public.cost_categories (name, description, code) VALUES
  ('Pessoal', 'Custos com recursos humanos', 'RH'),
  ('Equipamento', 'Aquisição e manutenção de equipamentos', 'EQP'),
  ('Materiais', 'Materiais de consumo e construção', 'MAT'),
  ('Serviços', 'Contratação de serviços externos', 'SRV'),
  ('Viagens', 'Deslocações e estadias', 'VGM'),
  ('Formação', 'Capacitação e treinamento', 'FRM'),
  ('Consultoria', 'Serviços de consultoria especializada', 'CST'),
  ('Infraestrutura', 'Obras e infraestrutura física', 'INF'),
  ('TI', 'Tecnologia da informação e software', 'TI'),
  ('Administrativo', 'Custos administrativos gerais', 'ADM');

-- Create budget entries table (actual cost tracking)
CREATE TABLE public.budget_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  phase_name TEXT,
  category_id UUID REFERENCES public.cost_categories(id),
  description TEXT NOT NULL,
  planned_amount NUMERIC NOT NULL DEFAULT 0,
  actual_amount NUMERIC NOT NULL DEFAULT 0,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'paid')),
  invoice_number TEXT,
  supplier TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.budget_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view budget entries" 
ON public.budget_entries FOR SELECT USING (true);

CREATE POLICY "Users with permission can create budget entries" 
ON public.budget_entries FOR INSERT WITH CHECK (has_permission(auth.uid(), 'project.edit'::text));

CREATE POLICY "Users with permission can update budget entries" 
ON public.budget_entries FOR UPDATE USING (has_permission(auth.uid(), 'project.edit'::text));

CREATE POLICY "Users with permission can delete budget entries" 
ON public.budget_entries FOR DELETE USING (has_permission(auth.uid(), 'project.delete'::text));

-- Create budget alerts table
CREATE TABLE public.budget_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('warning', 'critical', 'info')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  threshold_percentage NUMERIC,
  current_percentage NUMERIC,
  is_read BOOLEAN NOT NULL DEFAULT false,
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.budget_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view budget alerts" 
ON public.budget_alerts FOR SELECT USING (true);

CREATE POLICY "System can create budget alerts" 
ON public.budget_alerts FOR INSERT WITH CHECK (true);

CREATE POLICY "Users with permission can update budget alerts" 
ON public.budget_alerts FOR UPDATE USING (has_permission(auth.uid(), 'project.edit'::text));

CREATE POLICY "Users with permission can delete budget alerts" 
ON public.budget_alerts FOR DELETE USING (has_permission(auth.uid(), 'project.delete'::text));

-- Create budget snapshots for historical tracking (monthly reports)
CREATE TABLE public.budget_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  period_type TEXT NOT NULL DEFAULT 'monthly' CHECK (period_type IN ('monthly', 'quarterly', 'yearly')),
  total_planned NUMERIC NOT NULL DEFAULT 0,
  total_actual NUMERIC NOT NULL DEFAULT 0,
  variance NUMERIC NOT NULL DEFAULT 0,
  variance_percentage NUMERIC NOT NULL DEFAULT 0,
  category_breakdown JSONB,
  phase_breakdown JSONB,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, snapshot_date, period_type)
);

-- Enable RLS
ALTER TABLE public.budget_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view budget snapshots" 
ON public.budget_snapshots FOR SELECT USING (true);

CREATE POLICY "Users with permission can manage budget snapshots" 
ON public.budget_snapshots FOR ALL USING (has_permission(auth.uid(), 'project.edit'::text));

-- Create triggers for updated_at
CREATE TRIGGER update_budget_entries_updated_at
BEFORE UPDATE ON public.budget_entries
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to check budget thresholds and create alerts
CREATE OR REPLACE FUNCTION public.check_budget_thresholds()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  project_record RECORD;
  spent_percentage NUMERIC;
  existing_alert_id UUID;
BEGIN
  -- Get project budget info
  SELECT id, name, budget, spent INTO project_record
  FROM public.projects
  WHERE id = NEW.project_id;
  
  IF project_record.budget IS NOT NULL AND project_record.budget > 0 THEN
    -- Calculate current spent percentage
    spent_percentage := (COALESCE(project_record.spent, 0) / project_record.budget) * 100;
    
    -- Check for 80% warning threshold
    IF spent_percentage >= 80 AND spent_percentage < 100 THEN
      SELECT id INTO existing_alert_id
      FROM public.budget_alerts
      WHERE project_id = NEW.project_id 
        AND threshold_percentage = 80 
        AND is_resolved = false;
      
      IF existing_alert_id IS NULL THEN
        INSERT INTO public.budget_alerts (project_id, alert_type, title, message, threshold_percentage, current_percentage)
        VALUES (
          NEW.project_id,
          'warning',
          'Orçamento a 80%',
          'O projecto ' || project_record.name || ' atingiu 80% do orçamento planeado.',
          80,
          spent_percentage
        );
      END IF;
    END IF;
    
    -- Check for 100% critical threshold
    IF spent_percentage >= 100 THEN
      SELECT id INTO existing_alert_id
      FROM public.budget_alerts
      WHERE project_id = NEW.project_id 
        AND threshold_percentage = 100 
        AND is_resolved = false;
      
      IF existing_alert_id IS NULL THEN
        INSERT INTO public.budget_alerts (project_id, alert_type, title, message, threshold_percentage, current_percentage)
        VALUES (
          NEW.project_id,
          'critical',
          'Orçamento ultrapassado!',
          'O projecto ' || project_record.name || ' ultrapassou o orçamento planeado em ' || ROUND(spent_percentage - 100, 1) || '%.',
          100,
          spent_percentage
        );
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to check thresholds when budget entries are created/updated
CREATE TRIGGER check_budget_on_entry
AFTER INSERT OR UPDATE ON public.budget_entries
FOR EACH ROW EXECUTE FUNCTION public.check_budget_thresholds();

-- Create function to update project spent amount
CREATE OR REPLACE FUNCTION public.update_project_spent()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update project spent amount based on sum of actual amounts
  IF TG_OP = 'DELETE' THEN
    UPDATE public.projects
    SET spent = COALESCE((
      SELECT SUM(actual_amount) 
      FROM public.budget_entries 
      WHERE project_id = OLD.project_id AND status IN ('approved', 'paid')
    ), 0)
    WHERE id = OLD.project_id;
    RETURN OLD;
  ELSE
    UPDATE public.projects
    SET spent = COALESCE((
      SELECT SUM(actual_amount) 
      FROM public.budget_entries 
      WHERE project_id = NEW.project_id AND status IN ('approved', 'paid')
    ), 0)
    WHERE id = NEW.project_id;
    RETURN NEW;
  END IF;
END;
$$;

-- Create trigger to auto-update project spent
CREATE TRIGGER update_spent_on_entry_change
AFTER INSERT OR UPDATE OR DELETE ON public.budget_entries
FOR EACH ROW EXECUTE FUNCTION public.update_project_spent();

-- Add phase tracking to tasks
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS phase_name TEXT;

-- Create index for better performance
CREATE INDEX idx_budget_entries_project ON public.budget_entries(project_id);
CREATE INDEX idx_budget_entries_date ON public.budget_entries(entry_date);
CREATE INDEX idx_budget_alerts_project ON public.budget_alerts(project_id);
CREATE INDEX idx_budget_snapshots_project_date ON public.budget_snapshots(project_id, snapshot_date);