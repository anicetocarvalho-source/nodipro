-- Create documents table for main document records
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  phase_name TEXT,
  title TEXT NOT NULL,
  description TEXT,
  document_type TEXT NOT NULL DEFAULT 'general',
  current_version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'draft',
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create document_versions table for version control
CREATE TABLE public.document_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  hash_sha256 TEXT,
  change_summary TEXT,
  uploaded_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(document_id, version_number)
);

-- Create document_workflows table for approval processes
CREATE TABLE public.document_workflows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  version_id UUID REFERENCES public.document_versions(id) ON DELETE CASCADE,
  workflow_type TEXT NOT NULL DEFAULT 'approval',
  status TEXT NOT NULL DEFAULT 'pending',
  requested_by UUID,
  assigned_to UUID,
  due_date DATE,
  priority TEXT DEFAULT 'medium',
  notes TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create document_comments table for discussions
CREATE TABLE public.document_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  version_id UUID REFERENCES public.document_versions(id) ON DELETE SET NULL,
  parent_id UUID REFERENCES public.document_comments(id) ON DELETE CASCADE,
  user_id UUID,
  user_name TEXT,
  content TEXT NOT NULL,
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_by UUID,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create document_history table for audit trail
CREATE TABLE public.document_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  version_id UUID REFERENCES public.document_versions(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  action_details JSONB,
  performed_by UUID,
  performed_by_name TEXT,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for documents
CREATE POLICY "Authenticated users can view documents" ON public.documents FOR SELECT USING (true);
CREATE POLICY "Users with permission can create documents" ON public.documents FOR INSERT WITH CHECK (has_permission(auth.uid(), 'project.edit'));
CREATE POLICY "Users with permission can update documents" ON public.documents FOR UPDATE USING (has_permission(auth.uid(), 'project.edit'));
CREATE POLICY "Users with permission can delete documents" ON public.documents FOR DELETE USING (has_permission(auth.uid(), 'project.delete'));

-- RLS Policies for document_versions
CREATE POLICY "Authenticated users can view versions" ON public.document_versions FOR SELECT USING (true);
CREATE POLICY "Users with permission can create versions" ON public.document_versions FOR INSERT WITH CHECK (has_permission(auth.uid(), 'project.edit'));
CREATE POLICY "Users with permission can update versions" ON public.document_versions FOR UPDATE USING (has_permission(auth.uid(), 'project.edit'));
CREATE POLICY "Users with permission can delete versions" ON public.document_versions FOR DELETE USING (has_permission(auth.uid(), 'project.delete'));

-- RLS Policies for document_workflows
CREATE POLICY "Authenticated users can view workflows" ON public.document_workflows FOR SELECT USING (true);
CREATE POLICY "Users with permission can create workflows" ON public.document_workflows FOR INSERT WITH CHECK (has_permission(auth.uid(), 'project.edit'));
CREATE POLICY "Users with permission can update workflows" ON public.document_workflows FOR UPDATE USING (has_permission(auth.uid(), 'project.edit'));
CREATE POLICY "Users with permission can delete workflows" ON public.document_workflows FOR DELETE USING (has_permission(auth.uid(), 'project.delete'));

-- RLS Policies for document_comments
CREATE POLICY "Authenticated users can view comments" ON public.document_comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create comments" ON public.document_comments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own comments" ON public.document_comments FOR UPDATE USING (user_id = auth.uid() OR has_permission(auth.uid(), 'project.edit'));
CREATE POLICY "Users can delete own comments" ON public.document_comments FOR DELETE USING (user_id = auth.uid() OR has_permission(auth.uid(), 'project.delete'));

-- RLS Policies for document_history
CREATE POLICY "Authenticated users can view history" ON public.document_history FOR SELECT USING (true);
CREATE POLICY "System can create history" ON public.document_history FOR INSERT WITH CHECK (true);

-- Create updated_at trigger for documents
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create updated_at trigger for document_workflows
CREATE TRIGGER update_document_workflows_updated_at
  BEFORE UPDATE ON public.document_workflows
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create updated_at trigger for document_comments
CREATE TRIGGER update_document_comments_updated_at
  BEFORE UPDATE ON public.document_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to log document history
CREATE OR REPLACE FUNCTION public.log_document_history()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.document_history (document_id, action, action_details, performed_by)
    VALUES (NEW.id, 'created', jsonb_build_object('title', NEW.title, 'status', NEW.status), NEW.created_by);
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != NEW.status THEN
      INSERT INTO public.document_history (document_id, action, action_details, performed_by)
      VALUES (NEW.id, 'status_changed', jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status), auth.uid());
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to log document changes
CREATE TRIGGER log_document_changes
  AFTER INSERT OR UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.log_document_history();

-- Function to log version uploads
CREATE OR REPLACE FUNCTION public.log_version_upload()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.document_history (document_id, version_id, action, action_details, performed_by)
  VALUES (
    NEW.document_id, 
    NEW.id, 
    'version_uploaded', 
    jsonb_build_object('version_number', NEW.version_number, 'file_name', NEW.file_name, 'file_size', NEW.file_size),
    NEW.uploaded_by
  );
  
  -- Update document current_version
  UPDATE public.documents SET current_version = NEW.version_number, updated_at = now() WHERE id = NEW.document_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to log version uploads
CREATE TRIGGER log_version_upload
  AFTER INSERT ON public.document_versions
  FOR EACH ROW
  EXECUTE FUNCTION public.log_version_upload();

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents', 
  'documents', 
  false, 
  52428800,
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'image/jpeg', 'image/png', 'image/gif', 'text/plain', 'application/zip']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for documents bucket
CREATE POLICY "Authenticated users can view documents" ON storage.objects FOR SELECT USING (bucket_id = 'documents' AND auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can upload documents" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own documents" ON storage.objects FOR UPDATE USING (bucket_id = 'documents' AND auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete documents" ON storage.objects FOR DELETE USING (bucket_id = 'documents' AND auth.uid() IS NOT NULL);

-- Create indexes for performance
CREATE INDEX idx_documents_project_id ON public.documents(project_id);
CREATE INDEX idx_documents_status ON public.documents(status);
CREATE INDEX idx_document_versions_document_id ON public.document_versions(document_id);
CREATE INDEX idx_document_workflows_document_id ON public.document_workflows(document_id);
CREATE INDEX idx_document_workflows_status ON public.document_workflows(status);
CREATE INDEX idx_document_comments_document_id ON public.document_comments(document_id);
CREATE INDEX idx_document_history_document_id ON public.document_history(document_id);