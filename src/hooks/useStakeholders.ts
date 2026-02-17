import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useStakeholders(projectId?: string) {
  const queryClient = useQueryClient();

  const { data: stakeholders = [], isLoading } = useQuery({
    queryKey: ["stakeholders", projectId],
    queryFn: async () => {
      let q = supabase.from("stakeholders").select("*").order("created_at", { ascending: false });
      if (projectId) q = q.eq("project_id", projectId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const createStakeholder = useMutation({
    mutationFn: async (item: Record<string, unknown>) => {
      const { error } = await supabase.from("stakeholders").insert([item as any]);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["stakeholders"] }); toast.success("Stakeholder registado"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateStakeholder = useMutation({
    mutationFn: async ({ id, ...data }: Record<string, unknown> & { id: string }) => {
      const { error } = await supabase.from("stakeholders").update(data as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["stakeholders"] }); toast.success("Stakeholder actualizado"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteStakeholder = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("stakeholders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["stakeholders"] }); toast.success("Stakeholder eliminado"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return { stakeholders, isLoading, createStakeholder, updateStakeholder, deleteStakeholder };
}
