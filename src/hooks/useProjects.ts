import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DbProject, DbProjectInsert } from "@/types/database";
import { toast } from "sonner";

export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as DbProject[];
    },
  });
}

export function useProject(projectId: string | undefined) {
  return useQuery({
    queryKey: ["projects", projectId],
    queryFn: async () => {
      if (!projectId) return null;
      
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .maybeSingle();
      
      if (error) throw error;
      return data as DbProject | null;
    },
    enabled: !!projectId,
  });
}

export function useProjectSDGs(projectId: string | undefined) {
  return useQuery({
    queryKey: ["project-sdgs", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from("project_sdgs")
        .select("sdg_id, sdgs(id, number, name, color)")
        .eq("project_id", projectId);
      
      if (error) throw error;
      return (data || []).map((item: any) => item.sdgs);
    },
    enabled: !!projectId,
  });
}

export function useSaveProjectSDGs() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ projectId, sdgIds }: { projectId: string; sdgIds: string[] }) => {
      // First, delete existing associations
      const { error: deleteError } = await supabase
        .from("project_sdgs")
        .delete()
        .eq("project_id", projectId);
      
      if (deleteError) throw deleteError;
      
      // Then, insert new associations
      if (sdgIds.length > 0) {
        const inserts = sdgIds.map(sdgId => ({
          project_id: projectId,
          sdg_id: sdgId,
        }));
        
        const { error: insertError } = await supabase
          .from("project_sdgs")
          .insert(inserts);
        
        if (insertError) throw insertError;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["project-sdgs", variables.projectId] });
    },
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (project: DbProjectInsert) => {
      const { data, error } = await supabase
        .from("projects")
        .insert(project)
        .select()
        .single();
      
      if (error) throw error;
      return data as DbProject;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Projecto criado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar projecto: " + error.message);
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DbProject> & { id: string }) => {
      const { data, error } = await supabase
        .from("projects")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data as DbProject;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["projects", data.id] });
      toast.success("Projecto atualizado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar projecto: " + error.message);
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Projecto eliminado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao eliminar projecto: " + error.message);
    },
  });
}
