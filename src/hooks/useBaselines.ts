import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useBaselines(projectId?: string) {
  const queryClient = useQueryClient();

  const { data: baselines = [], isLoading } = useQuery({
    queryKey: ["project_baselines", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from("project_baselines")
        .select("*")
        .eq("project_id", projectId)
        .order("baseline_number", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  const createBaseline = useMutation({
    mutationFn: async (item: Record<string, unknown>) => {
      const { error } = await supabase.from("project_baselines").insert([item as any]);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["project_baselines"] }); toast.success("Baseline criada"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteBaseline = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("project_baselines").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["project_baselines"] }); toast.success("Baseline eliminada"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return { baselines, isLoading, createBaseline, deleteBaseline };
}
