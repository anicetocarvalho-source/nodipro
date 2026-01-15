-- Create sectors table for project methodology templates
CREATE TABLE public.sectors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default sectors
INSERT INTO public.sectors (name, description, icon, color) VALUES
  ('Infraestrutura', 'Projectos de construção, obras públicas e infraestrutura', 'Building2', 'hsl(25 95% 53%)'),
  ('Governo', 'Projectos governamentais e administração pública', 'Landmark', 'hsl(217 91% 60%)'),
  ('Educação', 'Projectos educacionais, formação e capacitação', 'GraduationCap', 'hsl(142 76% 36%)'),
  ('Saúde', 'Projectos na área da saúde e bem-estar', 'Heart', 'hsl(0 84% 60%)'),
  ('Tecnologia', 'Projectos de TI, transformação digital e inovação', 'Cpu', 'hsl(262 83% 58%)');

-- Enable RLS
ALTER TABLE public.sectors ENABLE ROW LEVEL SECURITY;

-- Everyone can view sectors
CREATE POLICY "Authenticated users can view sectors" 
ON public.sectors FOR SELECT USING (true);

-- Only admins can manage sectors
CREATE POLICY "Admins can manage sectors" 
ON public.sectors FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Create project templates table
CREATE TABLE public.project_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sector_id UUID NOT NULL REFERENCES public.sectors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view templates" 
ON public.project_templates FOR SELECT USING (true);

CREATE POLICY "Managers can manage templates" 
ON public.project_templates FOR ALL USING (has_permission(auth.uid(), 'projects.create'::text));

-- Create template phases table
CREATE TABLE public.template_phases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.project_templates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  duration_days INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.template_phases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view template phases" 
ON public.template_phases FOR SELECT USING (true);

CREATE POLICY "Managers can manage template phases" 
ON public.template_phases FOR ALL USING (has_permission(auth.uid(), 'projects.create'::text));

-- Create template deliverables table
CREATE TABLE public.template_deliverables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phase_id UUID NOT NULL REFERENCES public.template_phases(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_mandatory BOOLEAN DEFAULT true,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.template_deliverables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view template deliverables" 
ON public.template_deliverables FOR SELECT USING (true);

CREATE POLICY "Managers can manage template deliverables" 
ON public.template_deliverables FOR ALL USING (has_permission(auth.uid(), 'projects.create'::text));

-- Create storage bucket for document templates
INSERT INTO storage.buckets (id, name, public) VALUES ('document-templates', 'document-templates', true);

-- Storage policies for document templates
CREATE POLICY "Anyone can view document templates"
ON storage.objects FOR SELECT
USING (bucket_id = 'document-templates');

CREATE POLICY "Managers can upload document templates"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'document-templates' AND has_permission(auth.uid(), 'projects.create'::text));

CREATE POLICY "Managers can update document templates"
ON storage.objects FOR UPDATE
USING (bucket_id = 'document-templates' AND has_permission(auth.uid(), 'projects.create'::text));

CREATE POLICY "Managers can delete document templates"
ON storage.objects FOR DELETE
USING (bucket_id = 'document-templates' AND has_permission(auth.uid(), 'projects.create'::text));

-- Create template documents table (metadata)
CREATE TABLE public.template_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phase_id UUID REFERENCES public.template_phases(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES public.project_templates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  file_path TEXT,
  file_type TEXT,
  file_size INTEGER,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.template_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view template documents" 
ON public.template_documents FOR SELECT USING (true);

CREATE POLICY "Managers can manage template documents" 
ON public.template_documents FOR ALL USING (has_permission(auth.uid(), 'projects.create'::text));

-- Add sector_id to projects table
ALTER TABLE public.projects ADD COLUMN sector_id UUID REFERENCES public.sectors(id);
ALTER TABLE public.projects ADD COLUMN template_id UUID REFERENCES public.project_templates(id);

-- Create triggers for updated_at
CREATE TRIGGER update_project_templates_updated_at
BEFORE UPDATE ON public.project_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default templates for each sector
INSERT INTO public.project_templates (sector_id, name, description, is_default)
SELECT s.id, s.name || ' - Modelo Padrão', 'Template padrão para projectos de ' || s.name, true
FROM public.sectors s;

-- Insert default phases for Infrastructure template
INSERT INTO public.template_phases (template_id, name, description, position, duration_days)
SELECT t.id, phase.name, phase.description, phase.position, phase.duration
FROM public.project_templates t
JOIN public.sectors s ON t.sector_id = s.id
CROSS JOIN (VALUES
  ('Iniciação', 'Definição do escopo e viabilidade do projecto', 1, 30),
  ('Planeamento', 'Planeamento detalhado e aprovação', 2, 45),
  ('Licitação', 'Processo de licitação e contratação', 3, 60),
  ('Execução', 'Implementação das obras', 4, 180),
  ('Monitorização', 'Acompanhamento e controle de qualidade', 5, 30),
  ('Encerramento', 'Recepção provisória e definitiva', 6, 30)
) AS phase(name, description, position, duration)
WHERE s.name = 'Infraestrutura';

-- Insert default phases for Government template
INSERT INTO public.template_phases (template_id, name, description, position, duration_days)
SELECT t.id, phase.name, phase.description, phase.position, phase.duration
FROM public.project_templates t
JOIN public.sectors s ON t.sector_id = s.id
CROSS JOIN (VALUES
  ('Diagnóstico', 'Análise da situação actual e identificação de necessidades', 1, 30),
  ('Formulação', 'Elaboração da proposta e aprovação', 2, 45),
  ('Implementação', 'Execução das actividades planeadas', 3, 120),
  ('Avaliação', 'Avaliação de resultados e impacto', 4, 30)
) AS phase(name, description, position, duration)
WHERE s.name = 'Governo';

-- Insert default phases for Education template
INSERT INTO public.template_phases (template_id, name, description, position, duration_days)
SELECT t.id, phase.name, phase.description, phase.position, phase.duration
FROM public.project_templates t
JOIN public.sectors s ON t.sector_id = s.id
CROSS JOIN (VALUES
  ('Análise de Necessidades', 'Identificação de lacunas e objectivos de aprendizagem', 1, 20),
  ('Design Curricular', 'Desenvolvimento do currículo e materiais', 2, 40),
  ('Piloto', 'Implementação piloto e ajustes', 3, 30),
  ('Implementação', 'Rollout completo do programa', 4, 90),
  ('Avaliação', 'Avaliação de impacto e resultados', 5, 30)
) AS phase(name, description, position, duration)
WHERE s.name = 'Educação';

-- Insert default phases for Health template
INSERT INTO public.template_phases (template_id, name, description, position, duration_days)
SELECT t.id, phase.name, phase.description, phase.position, phase.duration
FROM public.project_templates t
JOIN public.sectors s ON t.sector_id = s.id
CROSS JOIN (VALUES
  ('Avaliação', 'Avaliação de necessidades de saúde', 1, 30),
  ('Planeamento', 'Planeamento de intervenções e recursos', 2, 30),
  ('Aquisição', 'Aquisição de equipamentos e insumos', 3, 45),
  ('Implementação', 'Execução das intervenções de saúde', 4, 120),
  ('Monitorização', 'Monitorização de indicadores de saúde', 5, 60)
) AS phase(name, description, position, duration)
WHERE s.name = 'Saúde';

-- Insert default phases for Technology template
INSERT INTO public.template_phases (template_id, name, description, position, duration_days)
SELECT t.id, phase.name, phase.description, phase.position, phase.duration
FROM public.project_templates t
JOIN public.sectors s ON t.sector_id = s.id
CROSS JOIN (VALUES
  ('Descoberta', 'Análise de requisitos e arquitectura', 1, 20),
  ('Design', 'Design de UX/UI e especificações técnicas', 2, 30),
  ('Desenvolvimento', 'Implementação e codificação', 3, 90),
  ('Testes', 'Testes unitários, integração e UAT', 4, 30),
  ('Deploy', 'Implementação em produção', 5, 10),
  ('Suporte', 'Manutenção e suporte pós-implementação', 6, 60)
) AS phase(name, description, position, duration)
WHERE s.name = 'Tecnologia';

-- Insert sample deliverables for phases
INSERT INTO public.template_deliverables (phase_id, name, description, is_mandatory, position)
SELECT p.id, d.name, d.description, d.mandatory, d.position
FROM public.template_phases p
JOIN public.project_templates t ON p.template_id = t.id
JOIN public.sectors s ON t.sector_id = s.id
CROSS JOIN (VALUES
  ('Iniciação', 'Termo de Abertura', 'Documento que autoriza formalmente o projecto', true, 1),
  ('Iniciação', 'Estudo de Viabilidade', 'Análise de viabilidade técnica e económica', true, 2),
  ('Planeamento', 'Plano de Projecto', 'Plano detalhado de actividades e recursos', true, 1),
  ('Planeamento', 'Cronograma', 'Cronograma detalhado com marcos', true, 2),
  ('Planeamento', 'Orçamento Detalhado', 'Estimativa de custos por fase', true, 3),
  ('Execução', 'Relatórios de Progresso', 'Relatórios mensais de acompanhamento', true, 1),
  ('Encerramento', 'Relatório Final', 'Relatório de encerramento do projecto', true, 1),
  ('Encerramento', 'Lições Aprendidas', 'Documentação de lições aprendidas', false, 2)
) AS d(phase_name, name, description, mandatory, position)
WHERE s.name = 'Infraestrutura' AND p.name = d.phase_name;