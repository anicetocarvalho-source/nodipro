-- Create portfolios table
CREATE TABLE public.portfolios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  manager_id uuid REFERENCES auth.users(id),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create programs table (intermediate grouping between portfolios and projects)
CREATE TABLE public.programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id uuid REFERENCES public.portfolios(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  sector text,
  manager_id uuid REFERENCES auth.users(id),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed')),
  start_date date,
  end_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add program_id to projects table to link projects to programs
ALTER TABLE public.projects 
ADD COLUMN program_id uuid REFERENCES public.programs(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;

-- RLS policies for portfolios (authenticated users can read, managers+ can write)
CREATE POLICY "Authenticated users can view portfolios"
ON public.portfolios FOR SELECT
USING (true);

CREATE POLICY "Managers can insert portfolios"
ON public.portfolios FOR INSERT
WITH CHECK (has_permission(auth.uid(), 'projects.create'));

CREATE POLICY "Managers can update portfolios"
ON public.portfolios FOR UPDATE
USING (has_permission(auth.uid(), 'projects.edit'));

CREATE POLICY "Managers can delete portfolios"
ON public.portfolios FOR DELETE
USING (has_permission(auth.uid(), 'projects.delete'));

-- RLS policies for programs
CREATE POLICY "Authenticated users can view programs"
ON public.programs FOR SELECT
USING (true);

CREATE POLICY "Managers can insert programs"
ON public.programs FOR INSERT
WITH CHECK (has_permission(auth.uid(), 'projects.create'));

CREATE POLICY "Managers can update programs"
ON public.programs FOR UPDATE
USING (has_permission(auth.uid(), 'projects.edit'));

CREATE POLICY "Managers can delete programs"
ON public.programs FOR DELETE
USING (has_permission(auth.uid(), 'projects.delete'));

-- Triggers for updated_at
CREATE TRIGGER update_portfolios_updated_at
BEFORE UPDATE ON public.portfolios
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_programs_updated_at
BEFORE UPDATE ON public.programs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();