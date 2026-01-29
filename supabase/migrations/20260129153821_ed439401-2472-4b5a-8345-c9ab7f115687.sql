-- Fix RLS policies on project_templates - permission name is 'project.create' not 'projects.create'
DROP POLICY IF EXISTS "Managers can manage templates" ON public.project_templates;

CREATE POLICY "Managers can manage templates"
ON public.project_templates
FOR ALL
TO authenticated
USING (has_permission(auth.uid(), 'project.create'::text))
WITH CHECK (has_permission(auth.uid(), 'project.create'::text));

-- Also fix template_phases
DROP POLICY IF EXISTS "Managers can manage template phases" ON public.template_phases;

CREATE POLICY "Managers can manage template phases"
ON public.template_phases
FOR ALL
TO authenticated
USING (has_permission(auth.uid(), 'project.create'::text))
WITH CHECK (has_permission(auth.uid(), 'project.create'::text));

-- Also fix template_deliverables
DROP POLICY IF EXISTS "Managers can manage template deliverables" ON public.template_deliverables;

CREATE POLICY "Managers can manage template deliverables"
ON public.template_deliverables
FOR ALL
TO authenticated
USING (has_permission(auth.uid(), 'project.create'::text))
WITH CHECK (has_permission(auth.uid(), 'project.create'::text));

-- Also fix cost_categories
DROP POLICY IF EXISTS "Managers can manage cost categories" ON public.cost_categories;

CREATE POLICY "Managers can manage cost categories"
ON public.cost_categories
FOR ALL
TO authenticated
USING (has_permission(auth.uid(), 'project.create'::text))
WITH CHECK (has_permission(auth.uid(), 'project.create'::text));

-- Also fix template_documents
DROP POLICY IF EXISTS "Managers can manage template documents" ON public.template_documents;

CREATE POLICY "Managers can manage template documents"
ON public.template_documents
FOR ALL
TO authenticated
USING (has_permission(auth.uid(), 'project.create'::text))
WITH CHECK (has_permission(auth.uid(), 'project.create'::text));