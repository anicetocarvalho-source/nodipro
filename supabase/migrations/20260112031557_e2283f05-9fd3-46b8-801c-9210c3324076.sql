-- Create enum for task priority
CREATE TYPE public.task_priority AS ENUM ('low', 'medium', 'high');

-- Create enum for project status
CREATE TYPE public.project_status AS ENUM ('active', 'delayed', 'completed', 'on_hold');

-- Create projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  client TEXT,
  status public.project_status NOT NULL DEFAULT 'active',
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  start_date DATE,
  end_date DATE,
  budget DECIMAL(15,2),
  spent DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tasks table
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  priority public.task_priority NOT NULL DEFAULT 'medium',
  column_id TEXT NOT NULL DEFAULT 'todo',
  position INTEGER NOT NULL DEFAULT 0,
  assignee_name TEXT,
  assignee_initials TEXT,
  due_date DATE,
  labels TEXT[],
  comments_count INTEGER DEFAULT 0,
  attachments_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create subtasks table
CREATE TABLE public.subtasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create team_members table for project teams
CREATE TABLE public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  initials TEXT NOT NULL,
  role TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Create public read/write policies (no auth required for now - can be restricted later)
CREATE POLICY "Allow public read on projects" 
ON public.projects FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert on projects" 
ON public.projects FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update on projects" 
ON public.projects FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete on projects" 
ON public.projects FOR DELETE 
USING (true);

CREATE POLICY "Allow public read on tasks" 
ON public.tasks FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert on tasks" 
ON public.tasks FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update on tasks" 
ON public.tasks FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete on tasks" 
ON public.tasks FOR DELETE 
USING (true);

CREATE POLICY "Allow public read on subtasks" 
ON public.subtasks FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert on subtasks" 
ON public.subtasks FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update on subtasks" 
ON public.subtasks FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete on subtasks" 
ON public.subtasks FOR DELETE 
USING (true);

CREATE POLICY "Allow public read on team_members" 
ON public.team_members FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert on team_members" 
ON public.team_members FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update on team_members" 
ON public.team_members FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete on team_members" 
ON public.team_members FOR DELETE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for tasks table
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.subtasks;