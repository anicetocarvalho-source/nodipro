import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DbTask, DbTaskInsert, DbSubtask, DbSubtaskInsert } from "@/types/database";
import { toast } from "sonner";
import { useEffect } from "react";

export function useTasks(projectId: string | undefined) {
  const queryClient = useQueryClient();

  // Set up realtime subscription
  useEffect(() => {
    if (!projectId) return;

    const channel = supabase
      .channel(`tasks-${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "subtasks",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, queryClient]);

  return useQuery({
    queryKey: ["tasks", projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data: tasks, error: tasksError } = await supabase
        .from("tasks")
        .select("*")
        .eq("project_id", projectId)
        .order("position", { ascending: true });

      if (tasksError) throw tasksError;

      // Fetch subtasks for all tasks
      const taskIds = tasks.map((t) => t.id);
      const { data: subtasks, error: subtasksError } = await supabase
        .from("subtasks")
        .select("*")
        .in("task_id", taskIds.length > 0 ? taskIds : [""])
        .order("position", { ascending: true });

      if (subtasksError) throw subtasksError;

      // Group subtasks by task_id
      const subtasksByTask = (subtasks || []).reduce((acc, st) => {
        if (!acc[st.task_id]) acc[st.task_id] = [];
        acc[st.task_id].push(st);
        return acc;
      }, {} as Record<string, DbSubtask[]>);

      return (tasks as DbTask[]).map((task) => ({
        ...task,
        subtasks: subtasksByTask[task.id] || [],
      }));
    },
    enabled: !!projectId,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      task,
      subtasks,
    }: {
      task: DbTaskInsert;
      subtasks?: Omit<DbSubtaskInsert, "task_id">[];
    }) => {
      const { data: createdTask, error: taskError } = await supabase
        .from("tasks")
        .insert(task)
        .select()
        .single();

      if (taskError) throw taskError;

      if (subtasks && subtasks.length > 0) {
        const subtasksWithTaskId = subtasks.map((st, index) => ({
          ...st,
          task_id: createdTask.id,
          position: index,
        }));

        const { error: subtasksError } = await supabase
          .from("subtasks")
          .insert(subtasksWithTaskId);

        if (subtasksError) throw subtasksError;
      }

      return createdTask as DbTask;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tasks", data.project_id] });
      toast.success("Tarefa criada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar tarefa: " + error.message);
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      projectId,
      subtasks,
      ...updates
    }: Partial<DbTask> & {
      id: string;
      projectId: string;
      subtasks?: DbSubtask[];
    }) => {
      const { data: updatedTask, error: taskError } = await supabase
        .from("tasks")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (taskError) throw taskError;

      // Handle subtasks update
      if (subtasks !== undefined) {
        // Delete existing subtasks
        await supabase.from("subtasks").delete().eq("task_id", id);

        // Insert new subtasks
        if (subtasks.length > 0) {
          const subtasksToInsert = subtasks.map((st, index) => ({
            task_id: id,
            title: st.title,
            completed: st.completed,
            position: index,
          }));

          const { error: subtasksError } = await supabase
            .from("subtasks")
            .insert(subtasksToInsert);

          if (subtasksError) throw subtasksError;
        }
      }

      return { task: updatedTask as DbTask, projectId };
    },
    onSuccess: ({ projectId }) => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
    },
    onError: (error) => {
      toast.error("Erro ao atualizar tarefa: " + error.message);
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      projectId,
    }: {
      taskId: string;
      projectId: string;
    }) => {
      const { error } = await supabase.from("tasks").delete().eq("id", taskId);

      if (error) throw error;
      return projectId;
    },
    onSuccess: (projectId) => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
      toast.success("Tarefa eliminada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao eliminar tarefa: " + error.message);
    },
  });
}

export function useUpdateSubtask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      subtaskId,
      projectId,
      completed,
    }: {
      subtaskId: string;
      projectId: string;
      completed: boolean;
    }) => {
      const { error } = await supabase
        .from("subtasks")
        .update({ completed })
        .eq("id", subtaskId);

      if (error) throw error;
      return projectId;
    },
    onSuccess: (projectId) => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
    },
    onError: (error) => {
      toast.error("Erro ao atualizar subtarefa: " + error.message);
    },
  });
}

export function useMoveTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      projectId,
      columnId,
      position,
    }: {
      taskId: string;
      projectId: string;
      columnId: string;
      position: number;
    }) => {
      const { error } = await supabase
        .from("tasks")
        .update({ column_id: columnId, position })
        .eq("id", taskId);

      if (error) throw error;
      return projectId;
    },
    onSuccess: (projectId) => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
    },
    onError: (error) => {
      toast.error("Erro ao mover tarefa: " + error.message);
    },
  });
}
