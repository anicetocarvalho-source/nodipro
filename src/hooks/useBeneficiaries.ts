import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Beneficiary {
  id: string;
  project_id: string;
  name: string;
  beneficiary_type: string;
  gender: string | null;
  age_group: string | null;
  province_id: string | null;
  sector: string | null;
  quantity: number;
  description: string | null;
  contact_info: string | null;
  registration_date: string;
  status: string;
  metadata: unknown | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type BeneficiaryInsert = {
  project_id: string;
  name: string;
  beneficiary_type?: string;
  gender?: string | null;
  age_group?: string | null;
  province_id?: string | null;
  sector?: string | null;
  quantity?: number;
  description?: string | null;
  contact_info?: string | null;
  registration_date?: string;
  status?: string;
  metadata?: unknown | null;
  created_by?: string | null;
};

export function useBeneficiaries(projectId?: string) {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  const { data: beneficiaries = [], isLoading } = useQuery({
    queryKey: ["beneficiaries", projectId],
    queryFn: async () => {
      let query = supabase.from("beneficiaries").select("*").order("created_at", { ascending: false });
      if (projectId) query = query.eq("project_id", projectId);
      const { data, error } = await query.limit(500);
      if (error) throw error;
      return data as Beneficiary[];
    },
    enabled: true,
  });

  const createBeneficiary = useMutation({
    mutationFn: async (data: BeneficiaryInsert) => {
      const { error } = await supabase.from("beneficiaries").insert([{
        project_id: data.project_id,
        name: data.name,
        beneficiary_type: data.beneficiary_type || "direct",
        gender: data.gender || null,
        age_group: data.age_group || null,
        province_id: data.province_id || null,
        sector: data.sector || null,
        quantity: data.quantity || 1,
        description: data.description || null,
        contact_info: data.contact_info || null,
        status: data.status || "active",
        created_by: user?.id || null,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["beneficiaries"] });
      toast.success("Beneficiário registado com sucesso");
    },
    onError: () => toast.error("Erro ao registar beneficiário"),
  });

  const updateBeneficiary = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; [key: string]: unknown }) => {
      const { error } = await supabase.from("beneficiaries").update(data as Record<string, unknown>).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["beneficiaries"] });
      toast.success("Beneficiário actualizado");
    },
    onError: () => toast.error("Erro ao actualizar beneficiário"),
  });

  const deleteBeneficiary = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("beneficiaries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["beneficiaries"] });
      toast.success("Beneficiário removido");
    },
    onError: () => toast.error("Erro ao remover beneficiário"),
  });

  // Summary stats
  const totalDirect = beneficiaries.filter(b => b.beneficiary_type === "direct").reduce((s, b) => s + b.quantity, 0);
  const totalIndirect = beneficiaries.filter(b => b.beneficiary_type === "indirect").reduce((s, b) => s + b.quantity, 0);
  const genderBreakdown = {
    male: beneficiaries.filter(b => b.gender === "male").reduce((s, b) => s + b.quantity, 0),
    female: beneficiaries.filter(b => b.gender === "female").reduce((s, b) => s + b.quantity, 0),
    other: beneficiaries.filter(b => b.gender === "other").reduce((s, b) => s + b.quantity, 0),
  };

  return {
    beneficiaries,
    isLoading,
    createBeneficiary,
    updateBeneficiary,
    deleteBeneficiary,
    totalDirect,
    totalIndirect,
    totalBeneficiaries: totalDirect + totalIndirect,
    genderBreakdown,
  };
}
