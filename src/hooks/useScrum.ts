import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DbScrumConfig, DbScrumRoleAssignment, ScrumRole } from "@/types/database";
import { toast } from "sonner";

// Scrum Config hooks
export function useScrumConfig(projectId: string | undefined) {
  return useQuery({
    queryKey: ["scrum-config", projectId],
    queryFn: async () => {
      if (!projectId) return null;
      const { data, error } = await supabase
        .from("project_scrum_config")
        .select("*")
        .eq("project_id", projectId)
        .maybeSingle();
      if (error) throw error;
      return data as DbScrumConfig | null;
    },
    enabled: !!projectId,
  });
}

export function useUpsertScrumConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, ...config }: Partial<DbScrumConfig> & { projectId: string }) => {
      // Try to update first
      const { data: existing } = await supabase
        .from("project_scrum_config")
        .select("id")
        .eq("project_id", projectId)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from("project_scrum_config")
          .update(config)
          .eq("project_id", projectId)
          .select()
          .single();
        if (error) throw error;
        return data as DbScrumConfig;
      } else {
        const { data, error } = await supabase
          .from("project_scrum_config")
          .insert({ project_id: projectId, ...config })
          .select()
          .single();
        if (error) throw error;
        return data as DbScrumConfig;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["scrum-config", data.project_id] });
      toast.success("Configuração Scrum guardada!");
    },
    onError: (e) => toast.error("Erro ao guardar configuração: " + e.message),
  });
}

// Scrum Roles hooks
export function useScrumRoles(projectId: string | undefined) {
  return useQuery({
    queryKey: ["scrum-roles", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from("project_scrum_roles")
        .select("*")
        .eq("project_id", projectId)
        .order("scrum_role");
      if (error) throw error;
      return data as DbScrumRoleAssignment[];
    },
    enabled: !!projectId,
  });
}

export function useAssignScrumRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (assignment: Omit<DbScrumRoleAssignment, "id" | "created_at">) => {
      const { data, error } = await supabase
        .from("project_scrum_roles")
        .insert(assignment)
        .select()
        .single();
      if (error) throw error;
      return data as DbScrumRoleAssignment;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["scrum-roles", data.project_id] });
      toast.success("Papel Scrum atribuído!");
    },
    onError: (e) => toast.error("Erro ao atribuir papel: " + e.message),
  });
}

export function useRemoveScrumRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      const { error } = await supabase
        .from("project_scrum_roles")
        .delete()
        .eq("id", id);
      if (error) throw error;
      return projectId;
    },
    onSuccess: (projectId) => {
      queryClient.invalidateQueries({ queryKey: ["scrum-roles", projectId] });
      toast.success("Papel Scrum removido!");
    },
    onError: (e) => toast.error("Erro ao remover papel: " + e.message),
  });
}

// Burndown data computation
export function useBurndownData(projectId: string | undefined, sprintId: string | undefined) {
  return useQuery({
    queryKey: ["burndown", projectId, sprintId],
    queryFn: async () => {
      if (!projectId || !sprintId) return null;

      // Get sprint dates
      const { data: sprint, error: sprintError } = await supabase
        .from("sprints")
        .select("start_date, end_date")
        .eq("id", sprintId)
        .single();
      if (sprintError) throw sprintError;

      // Get tasks for this sprint
      const { data: tasks, error: tasksError } = await supabase
        .from("tasks")
        .select("story_points, column_id, created_at, updated_at")
        .eq("project_id", projectId)
        .eq("sprint_id", sprintId);
      if (tasksError) throw tasksError;

      const startDate = new Date(sprint.start_date);
      const endDate = new Date(sprint.end_date);
      const totalPoints = tasks.reduce((sum, t) => sum + (t.story_points || 1), 0);
      const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

      // Generate ideal burndown line
      const idealLine: { day: number; date: string; ideal: number; actual: number }[] = [];
      for (let i = 0; i <= totalDays; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split("T")[0];
        
        // Count completed tasks up to this date
        const completedPoints = tasks
          .filter(t => t.column_id === "done" && t.updated_at && new Date(t.updated_at).toISOString().split("T")[0] <= dateStr)
          .reduce((sum, t) => sum + (t.story_points || 1), 0);

        idealLine.push({
          day: i,
          date: dateStr,
          ideal: Math.round(totalPoints - (totalPoints / totalDays) * i),
          actual: totalPoints - completedPoints,
        });
      }

      return {
        totalPoints,
        totalDays,
        data: idealLine,
        startDate: sprint.start_date,
        endDate: sprint.end_date,
      };
    },
    enabled: !!projectId && !!sprintId,
  });
}
