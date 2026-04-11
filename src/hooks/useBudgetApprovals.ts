import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface BudgetApproval {
  id: string;
  budget_entry_id: string;
  project_id: string;
  approval_level: "prepared" | "verified" | "approved";
  status: "pending" | "approved" | "rejected";
  approver_id: string | null;
  approver_name: string | null;
  comments: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useBudgetApprovals(projectId?: string) {
  const { user, profile } = useAuthContext();
  const queryClient = useQueryClient();

  const { data: approvals = [], isLoading } = useQuery({
    queryKey: ["budget-approvals", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from("budget_approvals")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as BudgetApproval[];
    },
    enabled: !!projectId,
  });

  const submitForApproval = useMutation({
    mutationFn: async ({ budgetEntryId, level, approverId, approverName }: {
      budgetEntryId: string;
      level: "prepared" | "verified" | "approved";
      approverId: string;
      approverName: string;
    }) => {
      if (!projectId) throw new Error("No project selected");
      const { error } = await supabase.from("budget_approvals").insert({
        budget_entry_id: budgetEntryId,
        project_id: projectId,
        approval_level: level,
        approver_id: approverId,
        approver_name: approverName,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget-approvals", projectId] });
      toast.success("Pedido de aprovação submetido");
    },
    onError: () => toast.error("Erro ao submeter aprovação"),
  });

  const processApproval = useMutation({
    mutationFn: async ({ approvalId, action, comments }: {
      approvalId: string;
      action: "approved" | "rejected";
      comments?: string;
    }) => {
      const { error } = await supabase.from("budget_approvals").update({
        status: action,
        comments,
        approved_at: action === "approved" ? new Date().toISOString() : null,
      }).eq("id", approvalId);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["budget-approvals", projectId] });
      toast.success(vars.action === "approved" ? "Aprovado com sucesso" : "Rejeitado");
    },
    onError: () => toast.error("Erro ao processar aprovação"),
  });

  const pendingApprovals = approvals.filter(a => a.status === "pending");
  const myPendingApprovals = pendingApprovals.filter(a => a.approver_id === user?.id);

  return {
    approvals,
    pendingApprovals,
    myPendingApprovals,
    isLoading,
    submitForApproval,
    processApproval,
  };
}
