import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { toast } from "sonner";

export interface DisbursementTranche {
  id: string;
  project_id: string;
  tranche_number: number;
  title: string;
  description: string | null;
  amount: number;
  currency: string;
  condition_description: string | null;
  milestone_description: string | null;
  planned_date: string | null;
  actual_date: string | null;
  status: string;
  evidence_document_id: string | null;
  approved_by: string | null;
  approved_at: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useDisbursements(projectId?: string) {
  const { organization } = useOrganization();
  const queryClient = useQueryClient();
  const orgId = organization?.id;
  const queryKey = ["disbursement_tranches", orgId, projectId];

  const { data: tranches = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!orgId) return [];
      // Get org project ids for scoping
      const { data: orgProjects } = await supabase
        .from("projects")
        .select("id")
        .eq("organization_id", orgId);
      const orgProjectIds = orgProjects?.map(p => p.id) || [];
      if (orgProjectIds.length === 0) return [];

      let query = supabase
        .from("disbursement_tranches")
        .select("*")
        .in("project_id", orgProjectIds)
        .order("tranche_number", { ascending: true });

      if (projectId) {
        query = query.eq("project_id", projectId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as DisbursementTranche[];
    },
    enabled: !!orgId,
  });

  const createTranche = useMutation({
    mutationFn: async (input: Partial<DisbursementTranche> & { project_id: string; title: string }) => {
      const { data: user } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("disbursement_tranches")
        .insert({ ...input, created_by: user.user?.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Tranche criada com sucesso");
    },
    onError: () => toast.error("Erro ao criar tranche"),
  });

  const updateTranche = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DisbursementTranche> & { id: string }) => {
      const { data, error } = await supabase
        .from("disbursement_tranches")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Tranche actualizada");
    },
    onError: () => toast.error("Erro ao actualizar tranche"),
  });

  const deleteTranche = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("disbursement_tranches").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Tranche eliminada");
    },
    onError: () => toast.error("Erro ao eliminar tranche"),
  });

  const totalPlanned = tranches.reduce((s, t) => s + Number(t.amount), 0);
  const totalDisbursed = tranches.filter(t => t.status === "disbursed").reduce((s, t) => s + Number(t.amount), 0);
  const disbursementRate = totalPlanned > 0 ? Math.round((totalDisbursed / totalPlanned) * 100) : 0;

  return {
    tranches,
    isLoading,
    createTranche,
    updateTranche,
    deleteTranche,
    totalPlanned,
    totalDisbursed,
    disbursementRate,
  };
}
