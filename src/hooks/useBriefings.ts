import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DbBriefing, DbBriefingModule } from "@/types/database";
import { toast } from "sonner";

export function useBriefings(projectId: string | undefined) {
  return useQuery({
    queryKey: ["briefings", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from("project_briefings")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as DbBriefing[];
    },
    enabled: !!projectId,
  });
}

export function useBriefingModules(briefingId: string | undefined) {
  return useQuery({
    queryKey: ["briefing-modules", briefingId],
    queryFn: async () => {
      if (!briefingId) return [];
      const { data, error } = await supabase
        .from("briefing_modules")
        .select("*")
        .eq("briefing_id", briefingId)
        .order("position", { ascending: true });
      if (error) throw error;
      return data as DbBriefingModule[];
    },
    enabled: !!briefingId,
  });
}

export function useCreateBriefing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (briefing: { project_id: string; title: string; description?: string; created_by?: string }) => {
      const { data, error } = await supabase
        .from("project_briefings")
        .insert(briefing)
        .select()
        .single();
      if (error) throw error;
      return data as DbBriefing;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["briefings", data.project_id] });
      toast.success("Briefing criado!");
    },
    onError: (e) => toast.error("Erro: " + e.message),
  });
}

export function useUpdateBriefing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, projectId, ...updates }: Partial<DbBriefing> & { id: string; projectId: string }) => {
      const { error } = await supabase
        .from("project_briefings")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
      return projectId;
    },
    onSuccess: (projectId) => {
      queryClient.invalidateQueries({ queryKey: ["briefings", projectId] });
    },
    onError: (e) => toast.error("Erro: " + e.message),
  });
}

export function useDeleteBriefing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      const { error } = await supabase.from("project_briefings").delete().eq("id", id);
      if (error) throw error;
      return projectId;
    },
    onSuccess: (projectId) => {
      queryClient.invalidateQueries({ queryKey: ["briefings", projectId] });
      toast.success("Briefing eliminado!");
    },
    onError: (e) => toast.error("Erro: " + e.message),
  });
}

export function useAddBriefingModule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (mod: { briefing_id: string; title: string; content?: string; level?: number; parent_id?: string; position?: number; module_type?: string }) => {
      const { data, error } = await supabase
        .from("briefing_modules")
        .insert(mod)
        .select()
        .single();
      if (error) throw error;
      return data as DbBriefingModule;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["briefing-modules", data.briefing_id] });
    },
    onError: (e) => toast.error("Erro: " + e.message),
  });
}

export function useUpdateBriefingModule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, briefingId, ...updates }: Partial<DbBriefingModule> & { id: string; briefingId: string }) => {
      const { error } = await supabase
        .from("briefing_modules")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
      return briefingId;
    },
    onSuccess: (briefingId) => {
      queryClient.invalidateQueries({ queryKey: ["briefing-modules", briefingId] });
    },
    onError: (e) => toast.error("Erro: " + e.message),
  });
}

export function useDeleteBriefingModule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, briefingId }: { id: string; briefingId: string }) => {
      const { error } = await supabase.from("briefing_modules").delete().eq("id", id);
      if (error) throw error;
      return briefingId;
    },
    onSuccess: (briefingId) => {
      queryClient.invalidateQueries({ queryKey: ["briefing-modules", briefingId] });
    },
    onError: (e) => toast.error("Erro: " + e.message),
  });
}
