import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { toast } from "sonner";

export function useProcurement(projectId?: string) {
  const queryClient = useQueryClient();
  const { organization } = useOrganization();
  const orgId = organization?.id;

  // Suppliers
  const { data: suppliers = [], isLoading: loadingSuppliers } = useQuery({
    queryKey: ["suppliers", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .eq("organization_id", orgId!)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });

  const createSupplier = useMutation({
    mutationFn: async (supplier: Record<string, unknown>) => {
      const payload = { ...supplier, organization_id: orgId } as any;
      const { error } = await supabase.from("suppliers").insert([payload]);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["suppliers"] }); toast.success("Fornecedor criado"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateSupplier = useMutation({
    mutationFn: async ({ id, ...data }: Record<string, unknown> & { id: string }) => {
      const { error } = await supabase.from("suppliers").update(data as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["suppliers"] }); toast.success("Fornecedor actualizado"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteSupplier = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("suppliers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["suppliers"] }); toast.success("Fornecedor eliminado"); },
    onError: (e: Error) => toast.error(e.message),
  });

  // Procurement Plans
  const { data: plans = [], isLoading: loadingPlans } = useQuery({
    queryKey: ["procurement_plans", projectId],
    queryFn: async () => {
      let q = supabase.from("procurement_plans").select("*").order("created_at", { ascending: false });
      if (projectId) q = q.eq("project_id", projectId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });

  const createPlan = useMutation({
    mutationFn: async (plan: Record<string, unknown>) => {
      const { error } = await supabase.from("procurement_plans").insert([plan as any]);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["procurement_plans"] }); toast.success("Plano criado"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const updatePlan = useMutation({
    mutationFn: async ({ id, ...data }: Record<string, unknown> & { id: string }) => {
      const { error } = await supabase.from("procurement_plans").update(data as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["procurement_plans"] }); toast.success("Plano actualizado"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deletePlan = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("procurement_plans").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["procurement_plans"] }); toast.success("Plano eliminado"); },
    onError: (e: Error) => toast.error(e.message),
  });

  // Contracts
  const { data: contracts = [], isLoading: loadingContracts } = useQuery({
    queryKey: ["contracts", projectId],
    queryFn: async () => {
      let q = supabase.from("contracts").select("*, suppliers(name)").order("created_at", { ascending: false });
      if (projectId) q = q.eq("project_id", projectId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });

  const createContract = useMutation({
    mutationFn: async (contract: Record<string, unknown>) => {
      const { error } = await supabase.from("contracts").insert([contract as any]);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["contracts"] }); toast.success("Contrato criado"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateContract = useMutation({
    mutationFn: async ({ id, ...data }: Record<string, unknown> & { id: string }) => {
      const { error } = await supabase.from("contracts").update(data as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["contracts"] }); toast.success("Contrato actualizado"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteContract = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contracts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["contracts"] }); toast.success("Contrato eliminado"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return {
    suppliers, loadingSuppliers, createSupplier, updateSupplier, deleteSupplier,
    plans, loadingPlans, createPlan, updatePlan, deletePlan,
    contracts, loadingContracts, createContract, updateContract, deleteContract,
  };
}
