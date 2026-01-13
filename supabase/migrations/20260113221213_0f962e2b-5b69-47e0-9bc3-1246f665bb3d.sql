-- Step 2: Create permissions tables and populate data

-- Create permissions table
CREATE TABLE public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create role_permissions junction table
CREATE TABLE public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role app_role NOT NULL,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(role, permission_id)
);

-- Create user-specific permissions overrides
CREATE TABLE public.user_permission_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  granted BOOLEAN NOT NULL DEFAULT true,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id, permission_id, project_id)
);

-- Enable RLS
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permission_overrides ENABLE ROW LEVEL SECURITY;

-- RLS Policies for permissions (read-only for all)
CREATE POLICY "All authenticated can view permissions"
  ON public.permissions FOR SELECT TO authenticated USING (true);

-- RLS Policies for role_permissions
CREATE POLICY "All authenticated can view role_permissions"
  ON public.role_permissions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Only admins can insert role_permissions"
  ON public.role_permissions FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update role_permissions"
  ON public.role_permissions FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete role_permissions"
  ON public.role_permissions FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for user_permission_overrides
CREATE POLICY "Users can view their own or admin can view all overrides"
  ON public.user_permission_overrides FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can insert overrides"
  ON public.user_permission_overrides FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update overrides"
  ON public.user_permission_overrides FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete overrides"
  ON public.user_permission_overrides FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert all default permissions
INSERT INTO public.permissions (name, description, category) VALUES
  ('project.view', 'Ver projectos', 'project'),
  ('project.create', 'Criar projectos', 'project'),
  ('project.edit', 'Editar projectos', 'project'),
  ('project.delete', 'Eliminar projectos', 'project'),
  ('project.archive', 'Arquivar projectos', 'project'),
  ('portfolio.view', 'Ver portfólio', 'portfolio'),
  ('portfolio.manage', 'Gerir portfólio', 'portfolio'),
  ('portfolio.reports', 'Ver relatórios de portfólio', 'portfolio'),
  ('task.view', 'Ver tarefas', 'task'),
  ('task.create', 'Criar tarefas', 'task'),
  ('task.edit', 'Editar tarefas', 'task'),
  ('task.delete', 'Eliminar tarefas', 'task'),
  ('task.assign', 'Atribuir tarefas', 'task'),
  ('document.view', 'Ver documentos', 'document'),
  ('document.upload', 'Carregar documentos', 'document'),
  ('document.delete', 'Eliminar documentos', 'document'),
  ('document.approve', 'Aprovar documentos', 'document'),
  ('budget.view', 'Ver orçamento', 'budget'),
  ('budget.edit', 'Editar orçamento', 'budget'),
  ('budget.approve', 'Aprovar despesas', 'budget'),
  ('team.view', 'Ver equipa', 'team'),
  ('team.manage', 'Gerir equipa', 'team'),
  ('team.invite', 'Convidar membros', 'team'),
  ('report.view', 'Ver relatórios', 'report'),
  ('report.create', 'Criar relatórios', 'report'),
  ('report.export', 'Exportar relatórios', 'report'),
  ('admin.access', 'Aceder painel admin', 'admin'),
  ('admin.users', 'Gerir utilizadores', 'admin'),
  ('admin.roles', 'Gerir roles', 'admin'),
  ('admin.audit', 'Ver logs de auditoria', 'admin'),
  ('admin.settings', 'Configurações sistema', 'admin');