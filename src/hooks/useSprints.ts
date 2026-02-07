import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DbSprint } from "@/types/database";
import { toast } from "sonner";

export function useSprints(projectId: string | undefined) {
  return useQuery({
    queryKey: ["sprints", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from("sprints")
        .select("*")
        .eq("project_id", projectId)
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data as DbSprint[];
    },
    enabled: !!projectId,
  });
}

export function useAllSprints(projectIds: string[]) {
  return useQuery({
    queryKey: ["sprints", "all", projectIds],
    queryFn: async () => {
      if (!projectIds.length) return [];
      const { data, error } = await supabase
        .from("sprints")
        .select("*, projects:project_id(id, name)")
        .in("project_id", projectIds)
        .order("start_date", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: projectIds.length > 0,
  });
}

export function useCreateSprint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sprint: Omit<DbSprint, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("sprints")
        .insert(sprint)
        .select()
        .single();
      if (error) throw error;
      return data as DbSprint;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["sprints", data.project_id] });
      queryClient.invalidateQueries({ queryKey: ["sprints", "all"] });
      toast.success("Sprint criado com sucesso!");
    },
    onError: (e) => toast.error("Erro ao criar sprint: " + e.message),
  });
}

export function useUpdateSprint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, projectId, ...updates }: Partial<DbSprint> & { id: string; projectId: string }) => {
      const { data, error } = await supabase
        .from("sprints")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return { sprint: data as DbSprint, projectId };
    },
    onSuccess: ({ projectId }) => {
      queryClient.invalidateQueries({ queryKey: ["sprints", projectId] });
      queryClient.invalidateQueries({ queryKey: ["sprints", "all"] });
    },
    onError: (e) => toast.error("Erro ao atualizar sprint: " + e.message),
  });
}

export function useDeleteSprint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      const { error } = await supabase.from("sprints").delete().eq("id", id);
      if (error) throw error;
      return projectId;
    },
    onSuccess: (projectId) => {
      queryClient.invalidateQueries({ queryKey: ["sprints", projectId] });
      queryClient.invalidateQueries({ queryKey: ["sprints", "all"] });
      toast.success("Sprint eliminado!");
    },
    onError: (e) => toast.error("Erro ao eliminar sprint: " + e.message),
  });
}
