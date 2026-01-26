import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEffect } from "react";

export type DependencyType = 'FS' | 'SS' | 'FF' | 'SF';

export interface TaskDependency {
  id: string;
  task_id: string;
  predecessor_id: string;
  dependency_type: DependencyType;
  lag_days: number;
  created_at: string;
}

export interface TaskDependencyWithDetails extends TaskDependency {
  predecessor?: {
    id: string;
    title: string;
    column_id: string;
    due_date: string | null;
  };
}

export const DEPENDENCY_TYPE_LABELS: Record<DependencyType, string> = {
  FS: 'Fim-para-Início',
  SS: 'Início-para-Início',
  FF: 'Fim-para-Fim',
  SF: 'Início-para-Fim',
};

export const DEPENDENCY_TYPE_DESCRIPTIONS: Record<DependencyType, string> = {
  FS: 'A tarefa só pode iniciar quando a predecessora terminar',
  SS: 'A tarefa só pode iniciar quando a predecessora iniciar',
  FF: 'A tarefa só pode terminar quando a predecessora terminar',
  SF: 'A tarefa só pode terminar quando a predecessora iniciar',
};

export function useTaskDependencies(taskId: string | undefined) {
  const queryClient = useQueryClient();

  // Set up realtime subscription
  useEffect(() => {
    if (!taskId) return;

    const channel = supabase
      .channel(`task-dependencies-${taskId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "task_dependencies",
          filter: `task_id=eq.${taskId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["task-dependencies", taskId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [taskId, queryClient]);

  return useQuery({
    queryKey: ["task-dependencies", taskId],
    queryFn: async () => {
      if (!taskId) return [];

      const { data, error } = await supabase
        .from("task_dependencies")
        .select(`
          *,
          predecessor:tasks!task_dependencies_predecessor_id_fkey(
            id,
            title,
            column_id,
            due_date
          )
        `)
        .eq("task_id", taskId);

      if (error) throw error;
      return data as TaskDependencyWithDetails[];
    },
    enabled: !!taskId,
  });
}

export function useProjectTaskDependencies(projectId: string | undefined) {
  const queryClient = useQueryClient();

  // Set up realtime subscription for all project dependencies
  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel(`project-task-dependencies-${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "task_dependencies",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["project-task-dependencies", projectId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, queryClient]);

  return useQuery({
    queryKey: ["project-task-dependencies", projectId],
    queryFn: async () => {
      if (!projectId) return [];

      // Get all task IDs for this project first
      const { data: tasks, error: tasksError } = await supabase
        .from("tasks")
        .select("id")
        .eq("project_id", projectId);

      if (tasksError) throw tasksError;
      if (!tasks || tasks.length === 0) return [];

      const taskIds = tasks.map(t => t.id);

      const { data, error } = await supabase
        .from("task_dependencies")
        .select(`
          *,
          predecessor:tasks!task_dependencies_predecessor_id_fkey(
            id,
            title,
            column_id,
            due_date
          ),
          task:tasks!task_dependencies_task_id_fkey(
            id,
            title,
            column_id,
            due_date
          )
        `)
        .in("task_id", taskIds);

      if (error) throw error;
      return data as (TaskDependencyWithDetails & {
        task?: {
          id: string;
          title: string;
          column_id: string;
          due_date: string | null;
        };
      })[];
    },
    enabled: !!projectId,
  });
}

export function useAddTaskDependency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      predecessorId,
      dependencyType = 'FS',
      lagDays = 0,
      projectId,
    }: {
      taskId: string;
      predecessorId: string;
      dependencyType?: DependencyType;
      lagDays?: number;
      projectId?: string;
    }) => {
      // First check for circular dependency
      const { data: isCircular, error: circularError } = await supabase
        .rpc('check_circular_dependency', {
          p_task_id: taskId,
          p_predecessor_id: predecessorId,
        });

      if (circularError) throw circularError;
      if (isCircular) {
        throw new Error('Esta dependência criaria uma referência circular');
      }

      const { data, error } = await supabase
        .from("task_dependencies")
        .insert({
          task_id: taskId,
          predecessor_id: predecessorId,
          dependency_type: dependencyType,
          lag_days: lagDays,
        })
        .select()
        .single();

      if (error) throw error;

      // Get predecessor's due date to calculate dependent task's new date
      const { data: predecessor } = await supabase
        .from("tasks")
        .select("due_date")
        .eq("id", predecessorId)
        .single();

      // Get current task's date
      const { data: currentTask } = await supabase
        .from("tasks")
        .select("due_date, project_id")
        .eq("id", taskId)
        .single();

      let dateUpdated = false;
      
      if (predecessor?.due_date && currentTask) {
        const predecessorDate = new Date(predecessor.due_date);
        const lagMs = lagDays * 24 * 60 * 60 * 1000;
        let newDate = new Date(predecessorDate.getTime() + lagMs);
        
        // For FS, add 1 day (successor starts after predecessor ends)
        if (dependencyType === 'FS') {
          newDate.setDate(newDate.getDate() + 1);
        }
        
        const currentDate = currentTask.due_date ? new Date(currentTask.due_date) : null;
        
        // Only update if current date is earlier than required
        if (!currentDate || currentDate < newDate) {
          const newDateStr = newDate.toISOString().split('T')[0];
          
          await supabase
            .from("tasks")
            .update({ due_date: newDateStr })
            .eq("id", taskId);
            
          dateUpdated = true;
        }
      }

      return { 
        dependency: data, 
        taskId, 
        projectId: projectId || currentTask?.project_id,
        dateUpdated,
      };
    },
    onSuccess: ({ taskId, projectId, dateUpdated }) => {
      queryClient.invalidateQueries({ queryKey: ["task-dependencies", taskId] });
      queryClient.invalidateQueries({ queryKey: ["project-task-dependencies"] });
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
      }
      
      if (dateUpdated) {
        toast.success("Dependência adicionada e data ajustada automaticamente!");
      } else {
        toast.success("Dependência adicionada com sucesso!");
      }
    },
    onError: (error) => {
      toast.error("Erro ao adicionar dependência: " + error.message);
    },
  });
}

export function useUpdateTaskDependency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      dependencyType,
      lagDays,
    }: {
      id: string;
      dependencyType?: DependencyType;
      lagDays?: number;
    }) => {
      const updates: { dependency_type?: DependencyType; lag_days?: number } = {};
      if (dependencyType !== undefined) updates.dependency_type = dependencyType;
      if (lagDays !== undefined) updates.lag_days = lagDays;

      const { data, error } = await supabase
        .from("task_dependencies")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["task-dependencies", data.task_id] });
      queryClient.invalidateQueries({ queryKey: ["project-task-dependencies"] });
      toast.success("Dependência actualizada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao actualizar dependência: " + error.message);
    },
  });
}

export function useDeleteTaskDependency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, taskId }: { id: string; taskId: string }) => {
      const { error } = await supabase
        .from("task_dependencies")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return taskId;
    },
    onSuccess: (taskId) => {
      queryClient.invalidateQueries({ queryKey: ["task-dependencies", taskId] });
      queryClient.invalidateQueries({ queryKey: ["project-task-dependencies"] });
      toast.success("Dependência removida com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao remover dependência: " + error.message);
    },
  });
}

export function useCheckTaskCanStart() {
  return useMutation({
    mutationFn: async (taskId: string) => {
      const { data, error } = await supabase
        .rpc('can_task_start', { p_task_id: taskId });

      if (error) throw error;
      return data as boolean;
    },
  });
}

// Helper function to check if a task is blocked
export function isTaskBlocked(
  dependencies: TaskDependencyWithDetails[] | undefined
): { blocked: boolean; blockers: string[] } {
  if (!dependencies || dependencies.length === 0) {
    return { blocked: false, blockers: [] };
  }

  const blockers: string[] = [];

  for (const dep of dependencies) {
    if (!dep.predecessor) continue;

    const predecessorDone = dep.predecessor.column_id === 'done';
    const predecessorStarted = !['backlog', 'todo'].includes(dep.predecessor.column_id);

    switch (dep.dependency_type) {
      case 'FS':
        if (!predecessorDone) {
          blockers.push(`"${dep.predecessor.title}" precisa ser concluída (Fim-para-Início)`);
        }
        break;
      case 'SS':
        if (!predecessorStarted) {
          blockers.push(`"${dep.predecessor.title}" precisa ser iniciada (Início-para-Início)`);
        }
        break;
      // FF and SF don't block starting, only finishing
    }
  }

  return { blocked: blockers.length > 0, blockers };
}
