import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { toast } from "sonner";

export interface DigitalApproval {
  id: string;
  organization_id: string;
  entity_type: string;
  entity_id: string;
  approval_type: string;
  status: string;
  approved_by: string;
  approver_name: string | null;
  ip_address: string | null;
  comment: string;
  approved_at: string;
  created_at: string;
}

export function useDigitalApprovals(entityType?: string, entityId?: string) {
  const { organization } = useOrganization();
  const queryClient = useQueryClient();
  const orgId = organization?.id;

  const query = useQuery({
    queryKey: ["digital-approvals", orgId, entityType, entityId],
    queryFn: async () => {
      if (!orgId) return [];
      let q = supabase
        .from("digital_approvals")
        .select("*")
        .eq("organization_id", orgId)
        .order("approved_at", { ascending: false });

      if (entityType) q = q.eq("entity_type", entityType);
      if (entityId) q = q.eq("entity_id", entityId);

      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as DigitalApproval[];
    },
    enabled: !!orgId,
  });

  const submitApproval = useMutation({
    mutationFn: async (params: {
      entity_type: string;
      entity_id: string;
      approval_type?: string;
      comment: string;
      status?: string;
    }) => {
      if (!orgId) throw new Error("No org");
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user!.id)
        .maybeSingle();

      const { error } = await supabase.from("digital_approvals").insert({
        organization_id: orgId,
        entity_type: params.entity_type,
        entity_id: params.entity_id,
        approval_type: params.approval_type || "approval",
        status: params.status || "approved",
        approved_by: user!.id,
        approver_name: profile?.full_name || null,
        comment: params.comment,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["digital-approvals"] });
      toast.success("Aprovação registada com sucesso");
    },
    onError: () => toast.error("Erro ao registar aprovação"),
  });

  return {
    approvals: query.data || [],
    loading: query.isLoading,
    submitApproval,
  };
}
