import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  CostCategory, 
  BudgetEntry, 
  BudgetAlert, 
  BudgetSnapshot,
  BudgetEntryInsert,
  BudgetEntryStatus
} from "@/types/budget";
import { toast } from "sonner";

// Cost Categories
export function useCostCategories() {
  return useQuery({
    queryKey: ["cost-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cost_categories")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data as CostCategory[];
    },
  });
}

// Budget Entries
export function useBudgetEntries(projectId?: string) {
  return useQuery({
    queryKey: ["budget-entries", projectId],
    queryFn: async () => {
      let query = supabase
        .from("budget_entries")
        .select(`
          *,
          category:cost_categories(*)
        `)
        .order("entry_date", { ascending: false });
      
      if (projectId) {
        query = query.eq("project_id", projectId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as BudgetEntry[];
    },
  });
}

export function useBudgetEntriesByMonth(projectId?: string) {
  return useQuery({
    queryKey: ["budget-entries-monthly", projectId],
    queryFn: async () => {
      let query = supabase
        .from("budget_entries")
        .select("*")
        .order("entry_date", { ascending: true });
      
      if (projectId) {
        query = query.eq("project_id", projectId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Group by month
      const monthlyData: Record<string, { planned: number; actual: number }> = {};
      
      (data || []).forEach((entry: any) => {
        const date = new Date(entry.entry_date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { planned: 0, actual: 0 };
        }
        
        monthlyData[monthKey].planned += Number(entry.planned_amount) || 0;
        monthlyData[monthKey].actual += Number(entry.actual_amount) || 0;
      });
      
      return monthlyData;
    },
  });
}

export function useBudgetEntriesByCategory(projectId?: string) {
  return useQuery({
    queryKey: ["budget-entries-category", projectId],
    queryFn: async () => {
      let query = supabase
        .from("budget_entries")
        .select(`
          planned_amount,
          actual_amount,
          category:cost_categories(id, name, code)
        `);
      
      if (projectId) {
        query = query.eq("project_id", projectId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Group by category
      const categoryData: Record<string, { name: string; planned: number; actual: number }> = {};
      
      (data || []).forEach((entry: any) => {
        const categoryName = entry.category?.name || 'Sem categoria';
        const categoryId = entry.category?.id || 'uncategorized';
        
        if (!categoryData[categoryId]) {
          categoryData[categoryId] = { name: categoryName, planned: 0, actual: 0 };
        }
        
        categoryData[categoryId].planned += Number(entry.planned_amount) || 0;
        categoryData[categoryId].actual += Number(entry.actual_amount) || 0;
      });
      
      return Object.values(categoryData);
    },
  });
}

export function useBudgetEntriesByPhase(projectId?: string) {
  return useQuery({
    queryKey: ["budget-entries-phase", projectId],
    queryFn: async () => {
      let query = supabase
        .from("budget_entries")
        .select("phase_name, planned_amount, actual_amount");
      
      if (projectId) {
        query = query.eq("project_id", projectId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Group by phase
      const phaseData: Record<string, { planned: number; actual: number }> = {};
      
      (data || []).forEach((entry: any) => {
        const phaseName = entry.phase_name || 'Sem fase';
        
        if (!phaseData[phaseName]) {
          phaseData[phaseName] = { planned: 0, actual: 0 };
        }
        
        phaseData[phaseName].planned += Number(entry.planned_amount) || 0;
        phaseData[phaseName].actual += Number(entry.actual_amount) || 0;
      });
      
      return Object.entries(phaseData).map(([name, values]) => ({ name, ...values }));
    },
  });
}

export function useCreateBudgetEntry() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (entry: BudgetEntryInsert) => {
      const { data, error } = await supabase
        .from("budget_entries")
        .insert(entry)
        .select()
        .single();
      
      if (error) throw error;
      return data as BudgetEntry;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["budget-entries"] });
      queryClient.invalidateQueries({ queryKey: ["budget-entries", data.project_id] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Entrada orçamental criada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar entrada: " + error.message);
    },
  });
}

export function useUpdateBudgetEntry() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<BudgetEntry> & { id: string }) => {
      const { data, error } = await supabase
        .from("budget_entries")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data as BudgetEntry;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["budget-entries"] });
      queryClient.invalidateQueries({ queryKey: ["budget-entries", data.project_id] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Entrada orçamental atualizada!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar entrada: " + error.message);
    },
  });
}

export function useUpdateBudgetEntryStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      id, 
      status, 
      approvedBy 
    }: { 
      id: string; 
      status: BudgetEntryStatus; 
      approvedBy?: string;
    }) => {
      const updates: any = { status };
      
      if (status === 'approved' && approvedBy) {
        updates.approved_by = approvedBy;
        updates.approved_at = new Date().toISOString();
      }
      
      const { data, error } = await supabase
        .from("budget_entries")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data as BudgetEntry;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["budget-entries"] });
      queryClient.invalidateQueries({ queryKey: ["budget-entries", data.project_id] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Estado atualizado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar estado: " + error.message);
    },
  });
}

export function useDeleteBudgetEntry() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ entryId, projectId }: { entryId: string; projectId: string }) => {
      const { error } = await supabase
        .from("budget_entries")
        .delete()
        .eq("id", entryId);
      
      if (error) throw error;
      return projectId;
    },
    onSuccess: (projectId) => {
      queryClient.invalidateQueries({ queryKey: ["budget-entries"] });
      queryClient.invalidateQueries({ queryKey: ["budget-entries", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Entrada eliminada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao eliminar entrada: " + error.message);
    },
  });
}

// Budget Alerts
export function useBudgetAlerts(projectId?: string, unreadOnly: boolean = false) {
  return useQuery({
    queryKey: ["budget-alerts", projectId, unreadOnly],
    queryFn: async () => {
      let query = supabase
        .from("budget_alerts")
        .select("*")
        .eq("is_resolved", false)
        .order("created_at", { ascending: false });
      
      if (projectId) {
        query = query.eq("project_id", projectId);
      }
      
      if (unreadOnly) {
        query = query.eq("is_read", false);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as BudgetAlert[];
    },
  });
}

export function useMarkAlertRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from("budget_alerts")
        .update({ is_read: true })
        .eq("id", alertId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget-alerts"] });
    },
  });
}

export function useResolveAlert() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ alertId, userId }: { alertId: string; userId: string }) => {
      const { error } = await supabase
        .from("budget_alerts")
        .update({ 
          is_resolved: true, 
          resolved_by: userId,
          resolved_at: new Date().toISOString()
        })
        .eq("id", alertId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget-alerts"] });
      toast.success("Alerta resolvido!");
    },
    onError: (error) => {
      toast.error("Erro ao resolver alerta: " + error.message);
    },
  });
}

// Budget Snapshots
export function useBudgetSnapshots(projectId?: string, periodType?: string) {
  return useQuery({
    queryKey: ["budget-snapshots", projectId, periodType],
    queryFn: async () => {
      let query = supabase
        .from("budget_snapshots")
        .select("*")
        .order("snapshot_date", { ascending: false });
      
      if (projectId) {
        query = query.eq("project_id", projectId);
      }
      
      if (periodType) {
        query = query.eq("period_type", periodType);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as BudgetSnapshot[];
    },
  });
}

export function useCreateBudgetSnapshot() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (snapshot: Omit<BudgetSnapshot, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from("budget_snapshots")
        .insert(snapshot)
        .select()
        .single();
      
      if (error) throw error;
      return data as BudgetSnapshot;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["budget-snapshots"] });
      queryClient.invalidateQueries({ queryKey: ["budget-snapshots", data.project_id] });
      toast.success("Relatório gerado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao gerar relatório: " + error.message);
    },
  });
}

// Budget Summary Stats
export function useBudgetSummary(projectId?: string) {
  return useQuery({
    queryKey: ["budget-summary", projectId],
    queryFn: async () => {
      let query = supabase
        .from("budget_entries")
        .select("planned_amount, actual_amount, status");
      
      if (projectId) {
        query = query.eq("project_id", projectId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      const entries = data || [];
      
      const totalPlanned = entries.reduce((sum, e) => sum + (Number(e.planned_amount) || 0), 0);
      const totalActual = entries.reduce((sum, e) => sum + (Number(e.actual_amount) || 0), 0);
      const pendingAmount = entries
        .filter(e => e.status === 'pending')
        .reduce((sum, e) => sum + (Number(e.actual_amount) || 0), 0);
      const approvedAmount = entries
        .filter(e => e.status === 'approved' || e.status === 'paid')
        .reduce((sum, e) => sum + (Number(e.actual_amount) || 0), 0);
      
      return {
        totalPlanned,
        totalActual,
        pendingAmount,
        approvedAmount,
        variance: totalPlanned - totalActual,
        variancePercentage: totalPlanned > 0 ? ((totalPlanned - totalActual) / totalPlanned) * 100 : 0,
        executionPercentage: totalPlanned > 0 ? (totalActual / totalPlanned) * 100 : 0,
      };
    },
  });
}
