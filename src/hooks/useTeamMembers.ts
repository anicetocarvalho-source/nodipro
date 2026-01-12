import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DbTeamMember, DbTeamMemberInsert } from "@/types/database";
import { toast } from "sonner";

export function useTeamMembers(projectId: string | undefined) {
  return useQuery({
    queryKey: ["team_members", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      const { data, error } = await supabase
        .from("team_members")
        .select("*")
        .eq("project_id", projectId)
        .order("name", { ascending: true });
      
      if (error) throw error;
      return data as DbTeamMember[];
    },
    enabled: !!projectId,
  });
}

export function useCreateTeamMember() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (member: DbTeamMemberInsert) => {
      const { data, error } = await supabase
        .from("team_members")
        .insert(member)
        .select()
        .single();
      
      if (error) throw error;
      return data as DbTeamMember;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["team_members", data.project_id] });
      toast.success("Membro adicionado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao adicionar membro: " + error.message);
    },
  });
}

export function useDeleteTeamMember() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ memberId, projectId }: { memberId: string; projectId: string }) => {
      const { error } = await supabase
        .from("team_members")
        .delete()
        .eq("id", memberId);
      
      if (error) throw error;
      return projectId;
    },
    onSuccess: (projectId) => {
      queryClient.invalidateQueries({ queryKey: ["team_members", projectId] });
      toast.success("Membro removido com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao remover membro: " + error.message);
    },
  });
}
