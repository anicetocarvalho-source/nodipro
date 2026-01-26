import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DependencyType } from "./useTaskDependencies";

interface TaskWithDate {
  id: string;
  due_date: string | null;
  project_id: string;
}

interface DependencyInfo {
  task_id: string;
  predecessor_id: string;
  dependency_type: DependencyType;
  lag_days: number;
}

/**
 * Calculate the new date for a dependent task based on predecessor date and dependency type
 */
function calculateDependentDate(
  predecessorDate: Date,
  dependencyType: DependencyType,
  lagDays: number
): Date {
  const newDate = new Date(predecessorDate);
  
  // Add lag days
  newDate.setDate(newDate.getDate() + lagDays);
  
  // For FS (Finish-to-Start), the successor starts after predecessor ends
  // Since we're using due_date as the end date, we add 1 day for the successor to start
  if (dependencyType === 'FS') {
    newDate.setDate(newDate.getDate() + 1);
  }
  // For SS (Start-to-Start), both start at same time - use predecessor date directly
  // For FF (Finish-to-Finish), both end at same time - use predecessor date directly
  // For SF (Start-to-Finish), successor ends when predecessor starts - edge case
  
  return newDate;
}

/**
 * Check if a date should be updated (only if it would be earlier than required)
 */
function shouldUpdateDate(
  currentDate: Date | null,
  newMinimumDate: Date
): boolean {
  if (!currentDate) return true;
  return currentDate < newMinimumDate;
}

/**
 * Hook to propagate date changes through dependency chains
 */
export function useDatePropagation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      newDueDate,
      projectId,
    }: {
      taskId: string;
      newDueDate: string;
      projectId: string;
    }) => {
      // Get all tasks and dependencies for this project
      const { data: allTasks, error: tasksError } = await supabase
        .from("tasks")
        .select("id, due_date, project_id")
        .eq("project_id", projectId);

      if (tasksError) throw tasksError;

      const taskIds = allTasks?.map(t => t.id) || [];
      if (taskIds.length === 0) return { updatedCount: 0, projectId };

      // Get all dependencies where any of these tasks is a predecessor
      const { data: dependencies, error: depsError } = await supabase
        .from("task_dependencies")
        .select("task_id, predecessor_id, dependency_type, lag_days")
        .in("predecessor_id", taskIds);

      if (depsError) throw depsError;

      // Build a map of tasks by ID
      const tasksMap = new Map<string, TaskWithDate>();
      allTasks?.forEach(t => tasksMap.set(t.id, t as TaskWithDate));

      // Build adjacency list: predecessor -> dependent tasks
      const dependentsOf = new Map<string, DependencyInfo[]>();
      dependencies?.forEach(dep => {
        const list = dependentsOf.get(dep.predecessor_id) || [];
        list.push(dep as DependencyInfo);
        dependentsOf.set(dep.predecessor_id, list);
      });

      // Track updates to make
      const updates: { id: string; due_date: string }[] = [];
      const visited = new Set<string>();

      // BFS to propagate dates
      const queue: string[] = [taskId];
      const predecessorDates = new Map<string, Date>();
      predecessorDates.set(taskId, new Date(newDueDate));

      while (queue.length > 0) {
        const currentId = queue.shift()!;
        if (visited.has(currentId)) continue;
        visited.add(currentId);

        const currentDate = predecessorDates.get(currentId);
        if (!currentDate) continue;

        const dependents = dependentsOf.get(currentId) || [];
        
        for (const dep of dependents) {
          const dependentTask = tasksMap.get(dep.task_id);
          if (!dependentTask) continue;

          const newMinDate = calculateDependentDate(
            currentDate,
            dep.dependency_type,
            dep.lag_days
          );

          const currentDueDate = dependentTask.due_date 
            ? new Date(dependentTask.due_date) 
            : null;

          if (shouldUpdateDate(currentDueDate, newMinDate)) {
            const newDateStr = newMinDate.toISOString().split('T')[0];
            updates.push({ id: dep.task_id, due_date: newDateStr });
            predecessorDates.set(dep.task_id, newMinDate);
            
            // Add to queue for further propagation
            if (!visited.has(dep.task_id)) {
              queue.push(dep.task_id);
            }
          }
        }
      }

      // Apply all updates
      let updatedCount = 0;
      for (const update of updates) {
        const { error } = await supabase
          .from("tasks")
          .update({ due_date: update.due_date })
          .eq("id", update.id);

        if (error) {
          console.error(`Failed to update task ${update.id}:`, error);
        } else {
          updatedCount++;
        }
      }

      return { updatedCount, projectId };
    },
    onSuccess: ({ updatedCount, projectId }) => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
      queryClient.invalidateQueries({ queryKey: ["project-task-dependencies", projectId] });
      
      if (updatedCount > 0) {
        toast.info(
          `${updatedCount} tarefa${updatedCount > 1 ? 's' : ''} dependente${updatedCount > 1 ? 's' : ''} ajustada${updatedCount > 1 ? 's' : ''} automaticamente`,
          { duration: 4000 }
        );
      }
    },
    onError: (error) => {
      console.error("Date propagation error:", error);
      toast.error("Erro ao propagar datas: " + error.message);
    },
  });
}

/**
 * Hook to recalculate dates for a task based on its predecessors
 * (used when adding a new dependency)
 */
export function useRecalculateDependentDates() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      projectId,
    }: {
      taskId: string;
      projectId: string;
    }) => {
      // Get the task
      const { data: task, error: taskError } = await supabase
        .from("tasks")
        .select("id, due_date")
        .eq("id", taskId)
        .single();

      if (taskError) throw taskError;

      // Get all dependencies for this task
      const { data: dependencies, error: depsError } = await supabase
        .from("task_dependencies")
        .select(`
          dependency_type,
          lag_days,
          predecessor:tasks!task_dependencies_predecessor_id_fkey(
            id,
            due_date
          )
        `)
        .eq("task_id", taskId);

      if (depsError) throw depsError;

      if (!dependencies || dependencies.length === 0) {
        return { updated: false, projectId };
      }

      // Calculate the minimum date based on all predecessors
      let latestRequiredDate: Date | null = null;

      for (const dep of dependencies) {
        const predecessor = dep.predecessor as { id: string; due_date: string | null } | null;
        if (!predecessor?.due_date) continue;

        const requiredDate = calculateDependentDate(
          new Date(predecessor.due_date),
          dep.dependency_type as DependencyType,
          dep.lag_days
        );

        if (!latestRequiredDate || requiredDate > latestRequiredDate) {
          latestRequiredDate = requiredDate;
        }
      }

      if (!latestRequiredDate) {
        return { updated: false, projectId };
      }

      // Check if current date is earlier than required
      const currentDueDate = task.due_date ? new Date(task.due_date) : null;
      
      if (shouldUpdateDate(currentDueDate, latestRequiredDate)) {
        const newDateStr = latestRequiredDate.toISOString().split('T')[0];
        
        const { error: updateError } = await supabase
          .from("tasks")
          .update({ due_date: newDateStr })
          .eq("id", taskId);

        if (updateError) throw updateError;

        return { updated: true, projectId, newDate: newDateStr };
      }

      return { updated: false, projectId };
    },
    onSuccess: ({ updated, projectId, newDate }) => {
      if (updated) {
        queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
        toast.info("Data da tarefa ajustada automaticamente com base nas dependências", {
          duration: 3000,
        });
      }
    },
    onError: (error) => {
      console.error("Date recalculation error:", error);
    },
  });
}
