-- Create SDG (ODS) table
CREATE TABLE public.sdgs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  number INTEGER NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create provinces table
CREATE TABLE public.provinces (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  code TEXT,
  region TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create funders table
CREATE TABLE public.funders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  acronym TEXT,
  type TEXT, -- 'government', 'multilateral', 'bilateral', 'private', 'ngo'
  country TEXT,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add columns to projects for these relationships
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS province_id UUID REFERENCES public.provinces(id),
ADD COLUMN IF NOT EXISTS funder_id UUID REFERENCES public.funders(id);

-- Create junction table for projects and SDGs (many-to-many)
CREATE TABLE public.project_sdgs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  sdg_id UUID NOT NULL REFERENCES public.sdgs(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, sdg_id)
);

-- Enable RLS
ALTER TABLE public.sdgs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provinces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_sdgs ENABLE ROW LEVEL SECURITY;

-- RLS policies for SDGs (read for all authenticated)
CREATE POLICY "SDGs are viewable by authenticated users" 
ON public.sdgs FOR SELECT 
TO authenticated
USING (true);

-- RLS policies for provinces (read for all authenticated)
CREATE POLICY "Provinces are viewable by authenticated users" 
ON public.provinces FOR SELECT 
TO authenticated
USING (true);

-- RLS policies for funders (read for all authenticated)
CREATE POLICY "Funders are viewable by authenticated users" 
ON public.funders FOR SELECT 
TO authenticated
USING (true);

-- RLS policies for project_sdgs (read for all authenticated)
CREATE POLICY "Project SDGs are viewable by authenticated users" 
ON public.project_sdgs FOR SELECT 
TO authenticated
USING (true);

-- Insert the 17 SDGs
INSERT INTO public.sdgs (number, name, color) VALUES
(1, 'Erradicação da Pobreza', '#E5243B'),
(2, 'Fome Zero e Agricultura Sustentável', '#DDA63A'),
(3, 'Saúde e Bem-Estar', '#4C9F38'),
(4, 'Educação de Qualidade', '#C5192D'),
(5, 'Igualdade de Género', '#FF3A21'),
(6, 'Água Potável e Saneamento', '#26BDE2'),
(7, 'Energia Limpa e Acessível', '#FCC30B'),
(8, 'Trabalho Decente e Crescimento Económico', '#A21942'),
(9, 'Indústria, Inovação e Infraestrutura', '#FD6925'),
(10, 'Redução das Desigualdades', '#DD1367'),
(11, 'Cidades e Comunidades Sustentáveis', '#FD9D24'),
(12, 'Consumo e Produção Responsáveis', '#BF8B2E'),
(13, 'Acção Climática', '#3F7E44'),
(14, 'Vida na Água', '#0A97D9'),
(15, 'Vida Terrestre', '#56C02B'),
(16, 'Paz, Justiça e Instituições Eficazes', '#00689D'),
(17, 'Parcerias e Meios de Implementação', '#19486A');

-- Insert Angola provinces
INSERT INTO public.provinces (name, code, region) VALUES
('Bengo', 'BGO', 'Norte'),
('Benguela', 'BGU', 'Centro'),
('Bié', 'BIE', 'Centro'),
('Cabinda', 'CAB', 'Norte'),
('Cuando Cubango', 'CCU', 'Sul'),
('Cuanza Norte', 'CNO', 'Norte'),
('Cuanza Sul', 'CSU', 'Centro'),
('Cunene', 'CUN', 'Sul'),
('Huambo', 'HUA', 'Centro'),
('Huíla', 'HUI', 'Sul'),
('Luanda', 'LUA', 'Norte'),
('Lunda Norte', 'LNO', 'Leste'),
('Lunda Sul', 'LSU', 'Leste'),
('Malanje', 'MAL', 'Norte'),
('Moxico', 'MOX', 'Leste'),
('Namibe', 'NAM', 'Sul'),
('Uíge', 'UIG', 'Norte'),
('Zaire', 'ZAI', 'Norte');

-- Insert common funders
INSERT INTO public.funders (name, acronym, type, country) VALUES
('Banco Mundial', 'BM', 'multilateral', NULL),
('Banco Africano de Desenvolvimento', 'BAD', 'multilateral', NULL),
('União Europeia', 'UE', 'multilateral', NULL),
('Fundo Monetário Internacional', 'FMI', 'multilateral', NULL),
('Agência Francesa de Desenvolvimento', 'AFD', 'bilateral', 'França'),
('USAID', 'USAID', 'bilateral', 'EUA'),
('Governo de Angola', 'OGE', 'government', 'Angola'),
('Fundo Soberano de Angola', 'FSDEA', 'government', 'Angola'),
('Programa das Nações Unidas para o Desenvolvimento', 'PNUD', 'multilateral', NULL),
('Banco Europeu de Investimento', 'BEI', 'multilateral', NULL);