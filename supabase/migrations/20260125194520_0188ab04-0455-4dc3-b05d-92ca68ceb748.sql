-- Add RLS policies for project_sdgs to allow insert/update/delete
CREATE POLICY "Users with permission can insert project SDGs"
ON public.project_sdgs
FOR INSERT
WITH CHECK (has_permission(auth.uid(), 'project.edit'::text));

CREATE POLICY "Users with permission can delete project SDGs"
ON public.project_sdgs
FOR DELETE
USING (has_permission(auth.uid(), 'project.edit'::text));