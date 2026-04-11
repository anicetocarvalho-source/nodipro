import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { toast } from "sonner";

export interface AnnualWorkPlan {
  id: string;
  organization_id: string;
  project_id: string | null;
  year: number;
  title: string;
  status: string;
  total_budget: number;
  total_executed: number;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  project_name?: string;
}

export interface AWPActivity {
  id: string;
  work_plan_id: string;
  title: string;
  description: string | null;
  quarter: string;
  planned_budget: number;
  executed_budget: number;
  physical_target: number | null;
  physical_achieved: number | null;
  responsible: string | null;
  status: string;
  position: number;
  created_at: string;
  updated_at: string;
}

export function useAnnualWorkPlans() {
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();
  const orgId = currentOrganization?.id;

  const plansQuery = useQuery({
    queryKey: ["annual-work-plans", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("annual_work_plans")
        .select("*")
        .eq("organization_id", orgId)
        .order("year", { ascending: false });
      if (error) throw error;

      // Get project names
      const projectIds = [...new Set((data || []).map(p => p.project_id).filter(Boolean))] as string[];
      let projectMap = new Map<string, string>();
      if (projectIds.length > 0) {
        const { data: projects } = await supabase
          .from("projects")
          .select("id, name")
          .in("id", projectIds);
        projectMap = new Map(projects?.map(p => [p.id, p.name]) || []);
      }

      return (data || []).map(p => ({
        ...p,
        project_name: p.project_id ? projectMap.get(p.project_id) || "—" : null,
      })) as AnnualWorkPlan[];
    },
    enabled: !!orgId,
  });

  const createPlan = useMutation({
    mutationFn: async (plan: {
      year: number;
      title: string;
      project_id?: string | null;
      total_budget?: number;
      notes?: string;
    }) => {
      if (!orgId) throw new Error("No organization");
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("annual_work_plans").insert({
        ...plan,
        organization_id: orgId,
        created_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["annual-work-plans"] });
      toast.success("Plano de trabalho criado");
    },
    onError: () => toast.error("Erro ao criar plano de trabalho"),
  });

  const updatePlan = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AnnualWorkPlan> & { id: string }) => {
      const { error } = await supabase
        .from("annual_work_plans")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["annual-work-plans"] });
      toast.success("Plano actualizado");
    },
    onError: () => toast.error("Erro ao actualizar plano"),
  });

  const deletePlan = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("annual_work_plans").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["annual-work-plans"] });
      toast.success("Plano eliminado");
    },
    onError: () => toast.error("Erro ao eliminar plano"),
  });

  return {
    plans: plansQuery.data || [],
    loading: plansQuery.isLoading,
    createPlan,
    updatePlan,
    deletePlan,
  };
}

export function useAWPActivities(workPlanId: string | undefined) {
  const queryClient = useQueryClient();

  const activitiesQuery = useQuery({
    queryKey: ["awp-activities", workPlanId],
    queryFn: async () => {
      if (!workPlanId) return [];
      const { data, error } = await supabase
        .from("awp_activities")
        .select("*")
        .eq("work_plan_id", workPlanId)
        .order("quarter")
        .order("position");
      if (error) throw error;
      return (data || []) as AWPActivity[];
    },
    enabled: !!workPlanId,
  });

  const createActivity = useMutation({
    mutationFn: async (activity: {
      work_plan_id: string;
      title: string;
      quarter: string;
      planned_budget?: number;
      physical_target?: number;
      responsible?: string;
      description?: string;
    }) => {
      const { error } = await supabase.from("awp_activities").insert(activity);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["awp-activities"] });
      toast.success("Actividade adicionada");
    },
    onError: () => toast.error("Erro ao adicionar actividade"),
  });

  const updateActivity = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AWPActivity> & { id: string }) => {
      const { error } = await supabase.from("awp_activities").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["awp-activities"] });
      toast.success("Actividade actualizada");
    },
    onError: () => toast.error("Erro ao actualizar actividade"),
  });

  const deleteActivity = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("awp_activities").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["awp-activities"] });
      toast.success("Actividade eliminada");
    },
    onError: () => toast.error("Erro ao eliminar actividade"),
  });

  return {
    activities: activitiesQuery.data || [],
    loading: activitiesQuery.isLoading,
    createActivity,
    updateActivity,
    deleteActivity,
  };
}
