import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface EVMAlert {
  id: string;
  project_id: string;
  alert_type: "cost_underperformance" | "schedule_underperformance" | "both";
  cpi: number | null;
  spi: number | null;
  severity: "warning" | "critical";
  message: string;
  is_acknowledged: boolean;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  created_at: string;
}

export function useEVMAlerts(onlyUnack = false) {
  return useQuery({
    queryKey: ["evm_alerts", onlyUnack],
    queryFn: async (): Promise<EVMAlert[]> => {
      let q = supabase.from("evm_alerts").select("*").order("created_at", { ascending: false });
      if (onlyUnack) q = q.eq("is_acknowledged", false);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as EVMAlert[];
    },
  });
}

export function useAcknowledgeEVMAlert() {
  const qc = useQueryClient();
  const { user } = useAuthContext();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("evm_alerts")
        .update({
          is_acknowledged: true,
          acknowledged_by: user?.id,
          acknowledged_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Alerta marcado como visto" });
      qc.invalidateQueries({ queryKey: ["evm_alerts"] });
    },
  });
}
