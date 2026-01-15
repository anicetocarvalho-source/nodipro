import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { 
  Document, 
  DocumentVersion, 
  DocumentWorkflow, 
  DocumentComment, 
  DocumentHistory,
  DocumentStatus,
  WorkflowStatus
} from '@/types/document';

// Fetch all documents with project info
export function useDocuments(projectId?: string) {
  return useQuery({
    queryKey: ['documents', projectId],
    queryFn: async () => {
      let query = supabase
        .from('documents')
        .select(`
          *,
          project:projects(id, name)
        `)
        .order('updated_at', { ascending: false });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as Document[];
    },
  });
}

// Fetch single document with all related data
export function useDocument(documentId: string) {
  return useQuery({
    queryKey: ['document', documentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          project:projects(id, name)
        `)
        .eq('id', documentId)
        .single();

      if (error) throw error;
      return data as unknown as Document;
    },
    enabled: !!documentId,
  });
}

// Fetch document versions
export function useDocumentVersions(documentId: string) {
  return useQuery({
    queryKey: ['document-versions', documentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_versions')
        .select('*')
        .eq('document_id', documentId)
        .order('version_number', { ascending: false });

      if (error) throw error;
      return data as DocumentVersion[];
    },
    enabled: !!documentId,
  });
}

// Fetch document workflows
export function useDocumentWorkflows(documentId?: string) {
  return useQuery({
    queryKey: ['document-workflows', documentId],
    queryFn: async () => {
      let query = supabase
        .from('document_workflows')
        .select('*')
        .order('created_at', { ascending: false });

      if (documentId) {
        query = query.eq('document_id', documentId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as DocumentWorkflow[];
    },
  });
}

// Fetch pending workflows for current user
export function usePendingWorkflows() {
  return useQuery({
    queryKey: ['pending-workflows'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('document_workflows')
        .select(`
          *,
          document:documents(id, title, project:projects(id, name))
        `)
        .eq('assigned_to', user.id)
        .in('status', ['pending', 'in_progress'])
        .order('due_date', { ascending: true });

      if (error) throw error;
      return data;
    },
  });
}

// Fetch document comments
export function useDocumentComments(documentId: string) {
  return useQuery({
    queryKey: ['document-comments', documentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_comments')
        .select('*')
        .eq('document_id', documentId)
        .is('parent_id', null)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch replies for each comment
      const commentsWithReplies = await Promise.all(
        (data as DocumentComment[]).map(async (comment) => {
          const { data: replies } = await supabase
            .from('document_comments')
            .select('*')
            .eq('parent_id', comment.id)
            .order('created_at', { ascending: true });
          
          return { ...comment, replies: replies as DocumentComment[] };
        })
      );

      return commentsWithReplies;
    },
    enabled: !!documentId,
  });
}

// Fetch document history
export function useDocumentHistory(documentId: string) {
  return useQuery({
    queryKey: ['document-history', documentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_history')
        .select('*')
        .eq('document_id', documentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as DocumentHistory[];
    },
    enabled: !!documentId,
  });
}

// Create document
export function useCreateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      project_id: string | null;
      phase_name: string | null;
      title: string;
      description: string | null;
      document_type: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: doc, error } = await supabase
        .from('documents')
        .insert({
          ...data,
          created_by: user?.id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return doc;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Documento criado com sucesso');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar documento: ${error.message}`);
    },
  });
}

// Upload new version
export function useUploadVersion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      documentId, 
      file, 
      changeSummary 
    }: { 
      documentId: string; 
      file: File; 
      changeSummary?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Get current version number
      const { data: doc } = await supabase
        .from('documents')
        .select('current_version')
        .eq('id', documentId)
        .single();

      const newVersionNumber = (doc?.current_version || 0) + 1;

      // Calculate hash (simple implementation)
      const arrayBuffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // Upload file to storage
      const filePath = `${documentId}/v${newVersionNumber}/${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create version record
      const { data: version, error } = await supabase
        .from('document_versions')
        .insert({
          document_id: documentId,
          version_number: newVersionNumber,
          file_path: filePath,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          hash_sha256: hashHex,
          change_summary: changeSummary || null,
          uploaded_by: user?.id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return version;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['document', variables.documentId] });
      queryClient.invalidateQueries({ queryKey: ['document-versions', variables.documentId] });
      queryClient.invalidateQueries({ queryKey: ['document-history', variables.documentId] });
      toast.success('Nova versão carregada com sucesso');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao carregar versão: ${error.message}`);
    },
  });
}

// Update document status
export function useUpdateDocumentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      documentId, 
      status 
    }: { 
      documentId: string; 
      status: DocumentStatus;
    }) => {
      const { error } = await supabase
        .from('documents')
        .update({ status })
        .eq('id', documentId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['document', variables.documentId] });
      queryClient.invalidateQueries({ queryKey: ['document-history', variables.documentId] });
      toast.success('Estado do documento atualizado');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar estado: ${error.message}`);
    },
  });
}

// Delete document
export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (documentId: string) => {
      // Delete files from storage first
      const { data: versions } = await supabase
        .from('document_versions')
        .select('file_path')
        .eq('document_id', documentId);

      if (versions && versions.length > 0) {
        const filePaths = versions.map(v => v.file_path);
        await supabase.storage.from('documents').remove(filePaths);
      }

      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Documento eliminado com sucesso');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao eliminar documento: ${error.message}`);
    },
  });
}

// Create workflow
export function useCreateWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      document_id: string;
      version_id?: string;
      workflow_type: string;
      assigned_to: string;
      due_date?: string;
      priority?: string;
      notes?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: workflow, error } = await supabase
        .from('document_workflows')
        .insert({
          ...data,
          requested_by: user?.id || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Update document status
      await supabase
        .from('documents')
        .update({ status: 'pending_review' })
        .eq('id', data.document_id);

      return workflow;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['document-workflows', variables.document_id] });
      queryClient.invalidateQueries({ queryKey: ['pending-workflows'] });
      toast.success('Workflow criado com sucesso');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar workflow: ${error.message}`);
    },
  });
}

// Update workflow status
export function useUpdateWorkflowStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      workflowId, 
      status,
      documentId,
      notes
    }: { 
      workflowId: string; 
      status: WorkflowStatus;
      documentId: string;
      notes?: string;
    }) => {
      const updateData: Record<string, any> = { status };
      if (notes) updateData.notes = notes;
      if (status === 'approved' || status === 'rejected') {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('document_workflows')
        .update(updateData)
        .eq('id', workflowId);

      if (error) throw error;

      // Update document status based on workflow result
      let docStatus: DocumentStatus = 'in_review';
      if (status === 'approved') docStatus = 'approved';
      if (status === 'rejected') docStatus = 'rejected';

      await supabase
        .from('documents')
        .update({ status: docStatus })
        .eq('id', documentId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['document', variables.documentId] });
      queryClient.invalidateQueries({ queryKey: ['document-workflows', variables.documentId] });
      queryClient.invalidateQueries({ queryKey: ['pending-workflows'] });
      toast.success('Workflow atualizado com sucesso');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar workflow: ${error.message}`);
    },
  });
}

// Add comment
export function useAddComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      document_id: string;
      version_id?: string;
      parent_id?: string;
      content: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Get user profile for name
      let userName = 'Utilizador';
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', user.id)
          .single();
        if (profile?.full_name) userName = profile.full_name;
      }

      const { data: comment, error } = await supabase
        .from('document_comments')
        .insert({
          ...data,
          user_id: user?.id || null,
          user_name: userName,
        })
        .select()
        .single();

      if (error) throw error;
      return comment;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['document-comments', variables.document_id] });
      toast.success('Comentário adicionado');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao adicionar comentário: ${error.message}`);
    },
  });
}

// Resolve comment
export function useResolveComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId, documentId }: { commentId: string; documentId: string }) => {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('document_comments')
        .update({
          is_resolved: true,
          resolved_by: user?.id,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', commentId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['document-comments', variables.documentId] });
      toast.success('Comentário resolvido');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao resolver comentário: ${error.message}`);
    },
  });
}

// Download document version
export async function downloadDocumentVersion(filePath: string, fileName: string) {
  const { data, error } = await supabase.storage
    .from('documents')
    .download(filePath);

  if (error) {
    toast.error('Erro ao descarregar ficheiro');
    return;
  }

  const url = URL.createObjectURL(data);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Hook to download latest version of a document
export function useDownloadFile() {
  return useMutation({
    mutationFn: async (documentId: string) => {
      // Get latest version
      const { data: versions, error } = await supabase
        .from('document_versions')
        .select('file_path, file_name')
        .eq('document_id', documentId)
        .order('version_number', { ascending: false })
        .limit(1);

      if (error) throw error;
      if (!versions || versions.length === 0) {
        throw new Error('Nenhuma versão encontrada');
      }

      const { file_path, file_name } = versions[0];
      await downloadDocumentVersion(file_path, file_name);
    },
    onError: (error: Error) => {
      toast.error(`Erro ao descarregar: ${error.message}`);
    },
  });
}
