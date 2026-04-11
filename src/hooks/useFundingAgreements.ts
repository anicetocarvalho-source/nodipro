import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { toast } from "sonner";

export interface FundingAgreement {
  id: string;
  organization_id: string;
  project_id: string | null;
  funder_id: string | null;
  title: string;
  agreement_number: string | null;
  agreement_type: string;
  status: string;
  total_amount: number;
  disbursed_amount: number;
  currency: string;
  signed_date: string | null;
  effective_date: string | null;
  closing_date: string | null;
  disbursement_conditions: string | null;
  key_contacts: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  project_name?: string;
  funder_name?: string;
}

export function useFundingAgreements() {
  const { organization } = useOrganization();
  const queryClient = useQueryClient();
  const orgId = organization?.id;

  const query = useQuery({
    queryKey: ["funding-agreements", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("funding_agreements")
        .select("*")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Enrich with project and funder names
      const projectIds = [...new Set((data || []).map(a => a.project_id).filter(Boolean))] as string[];
      const funderIds = [...new Set((data || []).map(a => a.funder_id).filter(Boolean))] as string[];

      let projectMap = new Map<string, string>();
      let funderMap = new Map<string, string>();

      if (projectIds.length > 0) {
        const { data: projects } = await supabase.from("projects").select("id, name").in("id", projectIds);
        projectMap = new Map(projects?.map(p => [p.id, p.name]) || []);
      }
      if (funderIds.length > 0) {
        const { data: funders } = await supabase.from("funders").select("id, name").in("id", funderIds);
        funderMap = new Map(funders?.map(f => [f.id, f.name]) || []);
      }

      // Calculate disbursed_amount from real tranches for project-linked agreements
      const projectIdsWithAgreements = [...new Set((data || []).map(a => a.project_id).filter(Boolean))] as string[];
      let trancheMap = new Map<string, number>();
      if (projectIdsWithAgreements.length > 0) {
        const { data: tranches } = await supabase
          .from("disbursement_tranches")
          .select("project_id, amount, status")
          .in("project_id", projectIdsWithAgreements)
          .eq("status", "disbursed");
        if (tranches) {
          for (const t of tranches) {
            trancheMap.set(t.project_id, (trancheMap.get(t.project_id) || 0) + Number(t.amount));
          }
        }
      }

      return (data || []).map(a => ({
        ...a,
        disbursed_amount: a.project_id ? (trancheMap.get(a.project_id) ?? a.disbursed_amount) : a.disbursed_amount,
        project_name: a.project_id ? projectMap.get(a.project_id) || null : null,
        funder_name: a.funder_id ? funderMap.get(a.funder_id) || null : null,
      })) as FundingAgreement[];
    },
    enabled: !!orgId,
  });

  const createAgreement = useMutation({
    mutationFn: async (agreement: Omit<FundingAgreement, "id" | "organization_id" | "created_at" | "updated_at" | "created_by" | "project_name" | "funder_name" | "disbursed_amount">) => {
      if (!orgId) throw new Error("No org");
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("funding_agreements").insert({
        ...agreement,
        organization_id: orgId,
        created_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["funding-agreements"] });
      toast.success("Acordo de financiamento criado");
    },
    onError: () => toast.error("Erro ao criar acordo"),
  });

  const updateAgreement = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FundingAgreement> & { id: string }) => {
      const { error } = await supabase.from("funding_agreements").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["funding-agreements"] });
      toast.success("Acordo actualizado");
    },
    onError: () => toast.error("Erro ao actualizar acordo"),
  });

  const deleteAgreement = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("funding_agreements").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["funding-agreements"] });
      toast.success("Acordo eliminado");
    },
    onError: () => toast.error("Erro ao eliminar acordo"),
  });

  return {
    agreements: query.data || [],
    loading: query.isLoading,
    createAgreement,
    updateAgreement,
    deleteAgreement,
  };
}
