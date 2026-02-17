import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useRisks(projectId?: string) {
  const queryClient = useQueryClient();

  const { data: risks = [], isLoading: loadingRisks } = useQuery({
    queryKey: ["risks", projectId],
    queryFn: async () => {
      let q = supabase.from("risks").select("*, projects(name)").order("created_at", { ascending: false });
      if (projectId) q = q.eq("project_id", projectId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const createRisk = useMutation({
    mutationFn: async (risk: Record<string, unknown>) => {
      const { error } = await supabase.from("risks").insert([risk as any]);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["risks"] }); toast.success("Risco registado"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateRisk = useMutation({
    mutationFn: async ({ id, ...data }: Record<string, unknown> & { id: string }) => {
      const { error } = await supabase.from("risks").update(data as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["risks"] }); toast.success("Risco actualizado"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteRisk = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("risks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["risks"] }); toast.success("Risco eliminado"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return { risks, loadingRisks, createRisk, updateRisk, deleteRisk };
}

export function useLessonsLearned(projectId?: string) {
  const queryClient = useQueryClient();

  const { data: lessons = [], isLoading: loadingLessons } = useQuery({
    queryKey: ["lessons_learned", projectId],
    queryFn: async () => {
      let q = supabase.from("lessons_learned").select("*, projects(name)").order("created_at", { ascending: false });
      if (projectId) q = q.eq("project_id", projectId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const createLesson = useMutation({
    mutationFn: async (lesson: Record<string, unknown>) => {
      const { error } = await supabase.from("lessons_learned").insert([lesson as any]);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["lessons_learned"] }); toast.success("Lição registada"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteLesson = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("lessons_learned").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["lessons_learned"] }); toast.success("Lição eliminada"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return { lessons, loadingLessons, createLesson, deleteLesson };
}
