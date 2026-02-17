import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { toast } from "sonner";

export function useKPIs() {
  const queryClient = useQueryClient();
  const { organization } = useOrganization();
  const orgId = organization?.id;

  const { data: kpis = [], isLoading: loadingKPIs } = useQuery({
    queryKey: ["kpi_definitions", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kpi_definitions")
        .select("*, kpi_measurements(id, value, measured_at)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });

  const createKPI = useMutation({
    mutationFn: async (kpi: Record<string, unknown>) => {
      const { error } = await supabase.from("kpi_definitions").insert([{ ...kpi, organization_id: orgId } as any]);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["kpi_definitions"] }); toast.success("KPI criado"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateKPI = useMutation({
    mutationFn: async ({ id, ...data }: Record<string, unknown> & { id: string }) => {
      const { error } = await supabase.from("kpi_definitions").update(data as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["kpi_definitions"] }); toast.success("KPI actualizado"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteKPI = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("kpi_definitions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["kpi_definitions"] }); toast.success("KPI eliminado"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const addMeasurement = useMutation({
    mutationFn: async (measurement: Record<string, unknown>) => {
      const { error } = await supabase.from("kpi_measurements").insert([measurement as any]);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["kpi_definitions"] }); toast.success("Medição registada"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return { kpis, loadingKPIs, createKPI, updateKPI, deleteKPI, addMeasurement };
}
