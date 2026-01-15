import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Sector, 
  ProjectTemplate, 
  TemplatePhase, 
  TemplateDeliverable,
  TemplateDocument,
  ProjectTemplateInsert,
  TemplatePhaseInsert,
  TemplateDeliverableInsert,
  TemplateDocumentInsert
} from "@/types/methodology";
import { toast } from "sonner";

// Sectors hooks
export function useSectors() {
  return useQuery({
    queryKey: ["sectors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sectors")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data as Sector[];
    },
  });
}

// Project Templates hooks
export function useProjectTemplates(sectorId?: string) {
  return useQuery({
    queryKey: ["project-templates", sectorId],
    queryFn: async () => {
      let query = supabase
        .from("project_templates")
        .select(`
          *,
          sector:sectors(*)
        `)
        .order("name");
      
      if (sectorId) {
        query = query.eq("sector_id", sectorId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as ProjectTemplate[];
    },
  });
}

export function useProjectTemplate(templateId: string | undefined) {
  return useQuery({
    queryKey: ["project-templates", templateId],
    queryFn: async () => {
      if (!templateId) return null;
      
      const { data, error } = await supabase
        .from("project_templates")
        .select(`
          *,
          sector:sectors(*)
        `)
        .eq("id", templateId)
        .maybeSingle();
      
      if (error) throw error;
      return data as ProjectTemplate | null;
    },
    enabled: !!templateId,
  });
}

export function useCreateProjectTemplate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (template: ProjectTemplateInsert) => {
      const { data, error } = await supabase
        .from("project_templates")
        .insert(template)
        .select()
        .single();
      
      if (error) throw error;
      return data as ProjectTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-templates"] });
      toast.success("Template criado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar template: " + error.message);
    },
  });
}

export function useUpdateProjectTemplate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ProjectTemplate> & { id: string }) => {
      const { data, error } = await supabase
        .from("project_templates")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data as ProjectTemplate;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["project-templates"] });
      queryClient.invalidateQueries({ queryKey: ["project-templates", data.id] });
      toast.success("Template atualizado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar template: " + error.message);
    },
  });
}

export function useDeleteProjectTemplate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (templateId: string) => {
      const { error } = await supabase
        .from("project_templates")
        .delete()
        .eq("id", templateId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-templates"] });
      toast.success("Template eliminado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao eliminar template: " + error.message);
    },
  });
}

// Template Phases hooks
export function useTemplatePhases(templateId: string | undefined) {
  return useQuery({
    queryKey: ["template-phases", templateId],
    queryFn: async () => {
      if (!templateId) return [];
      
      const { data, error } = await supabase
        .from("template_phases")
        .select("*")
        .eq("template_id", templateId)
        .order("position");
      
      if (error) throw error;
      return data as TemplatePhase[];
    },
    enabled: !!templateId,
  });
}

export function useCreateTemplatePhase() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (phase: TemplatePhaseInsert) => {
      const { data, error } = await supabase
        .from("template_phases")
        .insert(phase)
        .select()
        .single();
      
      if (error) throw error;
      return data as TemplatePhase;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["template-phases", data.template_id] });
      toast.success("Fase adicionada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao adicionar fase: " + error.message);
    },
  });
}

export function useUpdateTemplatePhase() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TemplatePhase> & { id: string }) => {
      const { data, error } = await supabase
        .from("template_phases")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data as TemplatePhase;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["template-phases", data.template_id] });
      toast.success("Fase atualizada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar fase: " + error.message);
    },
  });
}

export function useDeleteTemplatePhase() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ phaseId, templateId }: { phaseId: string; templateId: string }) => {
      const { error } = await supabase
        .from("template_phases")
        .delete()
        .eq("id", phaseId);
      
      if (error) throw error;
      return templateId;
    },
    onSuccess: (templateId) => {
      queryClient.invalidateQueries({ queryKey: ["template-phases", templateId] });
      toast.success("Fase eliminada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao eliminar fase: " + error.message);
    },
  });
}

// Template Deliverables hooks
export function useTemplateDeliverables(phaseId: string | undefined) {
  return useQuery({
    queryKey: ["template-deliverables", phaseId],
    queryFn: async () => {
      if (!phaseId) return [];
      
      const { data, error } = await supabase
        .from("template_deliverables")
        .select("*")
        .eq("phase_id", phaseId)
        .order("position");
      
      if (error) throw error;
      return data as TemplateDeliverable[];
    },
    enabled: !!phaseId,
  });
}

export function useAllTemplateDeliverables(templateId: string | undefined) {
  return useQuery({
    queryKey: ["all-template-deliverables", templateId],
    queryFn: async () => {
      if (!templateId) return [];
      
      // First get all phases for this template
      const { data: phases, error: phasesError } = await supabase
        .from("template_phases")
        .select("id")
        .eq("template_id", templateId);
      
      if (phasesError) throw phasesError;
      
      if (!phases || phases.length === 0) return [];
      
      const phaseIds = phases.map(p => p.id);
      
      const { data, error } = await supabase
        .from("template_deliverables")
        .select("*")
        .in("phase_id", phaseIds)
        .order("position");
      
      if (error) throw error;
      return data as TemplateDeliverable[];
    },
    enabled: !!templateId,
  });
}

export function useCreateTemplateDeliverable() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (deliverable: TemplateDeliverableInsert) => {
      const { data, error } = await supabase
        .from("template_deliverables")
        .insert(deliverable)
        .select()
        .single();
      
      if (error) throw error;
      return data as TemplateDeliverable;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["template-deliverables", data.phase_id] });
      queryClient.invalidateQueries({ queryKey: ["all-template-deliverables"] });
      toast.success("Entregável adicionado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao adicionar entregável: " + error.message);
    },
  });
}

export function useUpdateTemplateDeliverable() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TemplateDeliverable> & { id: string }) => {
      const { data, error } = await supabase
        .from("template_deliverables")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data as TemplateDeliverable;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["template-deliverables", data.phase_id] });
      queryClient.invalidateQueries({ queryKey: ["all-template-deliverables"] });
      toast.success("Entregável atualizado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar entregável: " + error.message);
    },
  });
}

export function useDeleteTemplateDeliverable() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ deliverableId, phaseId }: { deliverableId: string; phaseId: string }) => {
      const { error } = await supabase
        .from("template_deliverables")
        .delete()
        .eq("id", deliverableId);
      
      if (error) throw error;
      return phaseId;
    },
    onSuccess: (phaseId) => {
      queryClient.invalidateQueries({ queryKey: ["template-deliverables", phaseId] });
      queryClient.invalidateQueries({ queryKey: ["all-template-deliverables"] });
      toast.success("Entregável eliminado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao eliminar entregável: " + error.message);
    },
  });
}

// Template Documents hooks
export function useTemplateDocuments(templateId: string | undefined) {
  return useQuery({
    queryKey: ["template-documents", templateId],
    queryFn: async () => {
      if (!templateId) return [];
      
      const { data, error } = await supabase
        .from("template_documents")
        .select("*")
        .eq("template_id", templateId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as TemplateDocument[];
    },
    enabled: !!templateId,
  });
}

export function useCreateTemplateDocument() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (document: TemplateDocumentInsert) => {
      const { data, error } = await supabase
        .from("template_documents")
        .insert(document)
        .select()
        .single();
      
      if (error) throw error;
      return data as TemplateDocument;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["template-documents", data.template_id] });
      toast.success("Documento adicionado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao adicionar documento: " + error.message);
    },
  });
}

export function useDeleteTemplateDocument() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ documentId, templateId, filePath }: { documentId: string; templateId: string; filePath?: string }) => {
      // Delete file from storage if exists
      if (filePath) {
        await supabase.storage.from("document-templates").remove([filePath]);
      }
      
      const { error } = await supabase
        .from("template_documents")
        .delete()
        .eq("id", documentId);
      
      if (error) throw error;
      return templateId;
    },
    onSuccess: (templateId) => {
      queryClient.invalidateQueries({ queryKey: ["template-documents", templateId] });
      toast.success("Documento eliminado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao eliminar documento: " + error.message);
    },
  });
}

// Upload document
export function useUploadTemplateDocument() {
  const queryClient = useQueryClient();
  const createDocument = useCreateTemplateDocument();
  
  return useMutation({
    mutationFn: async ({ 
      file, 
      templateId, 
      phaseId, 
      name, 
      description,
      userId 
    }: { 
      file: File; 
      templateId: string; 
      phaseId?: string; 
      name: string; 
      description?: string;
      userId?: string;
    }) => {
      const fileName = `${templateId}/${Date.now()}_${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from("document-templates")
        .upload(fileName, file);
      
      if (uploadError) throw uploadError;
      
      const document = await createDocument.mutateAsync({
        template_id: templateId,
        phase_id: phaseId || null,
        name,
        description: description || null,
        file_path: fileName,
        file_type: file.type,
        file_size: file.size,
        created_by: userId || null,
      });
      
      return document;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["template-documents", data.template_id] });
    },
    onError: (error) => {
      toast.error("Erro ao fazer upload do documento: " + error.message);
    },
  });
}
