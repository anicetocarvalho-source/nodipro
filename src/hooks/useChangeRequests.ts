import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useChangeRequests(projectId?: string) {
  const queryClient = useQueryClient();

  const { data: changeRequests = [], isLoading } = useQuery({
    queryKey: ["change_requests", projectId],
    queryFn: async () => {
      let q = supabase.from("change_requests").select("*").order("created_at", { ascending: false });
      if (projectId) q = q.eq("project_id", projectId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const createChangeRequest = useMutation({
    mutationFn: async (item: Record<string, unknown>) => {
      const { error } = await supabase.from("change_requests").insert([item as any]);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["change_requests"] }); toast.success("Pedido de mudança registado"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateChangeRequest = useMutation({
    mutationFn: async ({ id, ...data }: Record<string, unknown> & { id: string }) => {
      const { error } = await supabase.from("change_requests").update(data as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["change_requests"] }); toast.success("Pedido de mudança actualizado"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteChangeRequest = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("change_requests").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["change_requests"] }); toast.success("Pedido de mudança eliminado"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return { changeRequests, isLoading, createChangeRequest, updateChangeRequest, deleteChangeRequest };
}
