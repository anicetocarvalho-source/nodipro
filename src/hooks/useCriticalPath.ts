import { useMemo } from "react";
import { TaskDependencyWithDetails, DependencyType } from "./useTaskDependencies";

interface TaskForCriticalPath {
  id: string;
  due_date: string | null;
  column_id: string;
  title: string;
}

interface CriticalPathResult {
  criticalTasks: Set<string>;
  projectEndDate: Date | null;
  longestPath: string[];
  totalDuration: number;
}

/**
 * Calculate Early Start (ES) and Early Finish (EF) for each task
 * Forward pass through the dependency network
 */
function forwardPass(
  tasks: TaskForCriticalPath[],
  dependencyMap: Map<string, TaskDependencyWithDetails[]>,
  predecessorMap: Map<string, string[]>
): Map<string, { es: number; ef: number; duration: number }> {
  const results = new Map<string, { es: number; ef: number; duration: number }>();
  const visited = new Set<string>();
  
  // Get task duration (for now, 1 day per task, could be extended)
  const getTaskDuration = (task: TaskForCriticalPath): number => {
    return 1; // Default duration of 1 day
  };

  // Topological sort to process tasks in dependency order
  const sortedTasks: TaskForCriticalPath[] = [];
  const inDegree = new Map<string, number>();
  
  // Initialize in-degrees
  tasks.forEach(task => {
    const predecessors = predecessorMap.get(task.id) || [];
    inDegree.set(task.id, predecessors.length);
  });
  
  // Start with tasks that have no predecessors
  const queue: TaskForCriticalPath[] = [];
  tasks.forEach(task => {
    if ((inDegree.get(task.id) || 0) === 0) {
      queue.push(task);
    }
  });
  
  while (queue.length > 0) {
    const task = queue.shift()!;
    sortedTasks.push(task);
    
    // Find successors
    tasks.forEach(successor => {
      const predecessors = predecessorMap.get(successor.id) || [];
      if (predecessors.includes(task.id)) {
        const newDegree = (inDegree.get(successor.id) || 0) - 1;
        inDegree.set(successor.id, newDegree);
        if (newDegree === 0) {
          queue.push(successor);
        }
      }
    });
  }
  
  // Forward pass
  sortedTasks.forEach(task => {
    const duration = getTaskDuration(task);
    const predecessors = predecessorMap.get(task.id) || [];
    
    let es = 0;
    predecessors.forEach(predId => {
      const predResult = results.get(predId);
      if (predResult) {
        // Get lag days from dependency
        const deps = dependencyMap.get(task.id) || [];
        const dep = deps.find(d => d.predecessor_id === predId);
        const lag = dep?.lag_days || 0;
        
        // For FS: ES = EF of predecessor + lag + 1
        const newEs = predResult.ef + lag + 1;
        es = Math.max(es, newEs);
      }
    });
    
    const ef = es + duration - 1;
    results.set(task.id, { es, ef, duration });
  });
  
  return results;
}

/**
 * Calculate Late Start (LS) and Late Finish (LF) for each task
 * Backward pass through the dependency network
 */
function backwardPass(
  tasks: TaskForCriticalPath[],
  predecessorMap: Map<string, string[]>,
  forwardResults: Map<string, { es: number; ef: number; duration: number }>,
  dependencyMap: Map<string, TaskDependencyWithDetails[]>
): Map<string, { ls: number; lf: number; slack: number }> {
  const results = new Map<string, { ls: number; lf: number; slack: number }>();
  
  // Find project end (maximum EF)
  let projectEnd = 0;
  forwardResults.forEach(result => {
    projectEnd = Math.max(projectEnd, result.ef);
  });
  
  // Build successor map
  const successorMap = new Map<string, string[]>();
  tasks.forEach(task => {
    const predecessors = predecessorMap.get(task.id) || [];
    predecessors.forEach(predId => {
      const successors = successorMap.get(predId) || [];
      if (!successors.includes(task.id)) {
        successors.push(task.id);
        successorMap.set(predId, successors);
      }
    });
  });
  
  // Process tasks in reverse order (from end to start)
  const processOrder = Array.from(forwardResults.entries())
    .sort((a, b) => b[1].ef - a[1].ef);
  
  processOrder.forEach(([taskId, forwardResult]) => {
    const successors = successorMap.get(taskId) || [];
    
    let lf = projectEnd;
    
    if (successors.length > 0) {
      successors.forEach(succId => {
        const succResult = results.get(succId);
        const succForward = forwardResults.get(succId);
        
        if (succResult && succForward) {
          // Get lag days from dependency
          const deps = dependencyMap.get(succId) || [];
          const dep = deps.find(d => d.predecessor_id === taskId);
          const lag = dep?.lag_days || 0;
          
          // For FS: LF = LS of successor - lag - 1
          const newLf = succResult.ls - lag - 1;
          lf = Math.min(lf, newLf);
        }
      });
    }
    
    const ls = lf - forwardResult.duration + 1;
    const slack = ls - forwardResult.es;
    
    results.set(taskId, { ls, lf, slack });
  });
  
  return results;
}

/**
 * Find the critical path - tasks with zero slack
 */
function findCriticalPath(
  tasks: TaskForCriticalPath[],
  backwardResults: Map<string, { ls: number; lf: number; slack: number }>,
  predecessorMap: Map<string, string[]>
): { criticalTasks: Set<string>; longestPath: string[] } {
  const criticalTasks = new Set<string>();
  
  // Tasks with zero or near-zero slack are on the critical path
  backwardResults.forEach((result, taskId) => {
    if (Math.abs(result.slack) < 0.001) {
      criticalTasks.add(taskId);
    }
  });
  
  // Build the longest path through critical tasks
  const longestPath: string[] = [];
  
  // Find starting critical tasks (no critical predecessors)
  const criticalStarters = Array.from(criticalTasks).filter(taskId => {
    const predecessors = predecessorMap.get(taskId) || [];
    return !predecessors.some(predId => criticalTasks.has(predId));
  });
  
  // Trace through the critical path
  if (criticalStarters.length > 0) {
    const visited = new Set<string>();
    const stack = [...criticalStarters];
    
    while (stack.length > 0) {
      const current = stack.pop()!;
      if (visited.has(current)) continue;
      visited.add(current);
      longestPath.push(current);
      
      // Find critical successors
      tasks.forEach(task => {
        const predecessors = predecessorMap.get(task.id) || [];
        if (predecessors.includes(current) && criticalTasks.has(task.id) && !visited.has(task.id)) {
          stack.push(task.id);
        }
      });
    }
  }
  
  return { criticalTasks, longestPath };
}

/**
 * Hook to calculate the critical path for a project
 */
export function useCriticalPath(
  tasks: TaskForCriticalPath[] | undefined,
  dependencies: TaskDependencyWithDetails[] | undefined
): CriticalPathResult {
  return useMemo(() => {
    if (!tasks || tasks.length === 0) {
      return {
        criticalTasks: new Set<string>(),
        projectEndDate: null,
        longestPath: [],
        totalDuration: 0,
      };
    }

    // Filter to only tasks with dates
    const tasksWithDates = tasks.filter(t => t.due_date);
    
    if (tasksWithDates.length === 0) {
      return {
        criticalTasks: new Set<string>(),
        projectEndDate: null,
        longestPath: [],
        totalDuration: 0,
      };
    }

    // Build dependency map (task_id -> dependencies)
    const dependencyMap = new Map<string, TaskDependencyWithDetails[]>();
    const predecessorMap = new Map<string, string[]>();
    
    if (dependencies) {
      dependencies.forEach(dep => {
        // Map task to its dependencies
        const deps = dependencyMap.get(dep.task_id) || [];
        deps.push(dep);
        dependencyMap.set(dep.task_id, deps);
        
        // Map task to its predecessor IDs
        const preds = predecessorMap.get(dep.task_id) || [];
        if (!preds.includes(dep.predecessor_id)) {
          preds.push(dep.predecessor_id);
          predecessorMap.set(dep.task_id, preds);
        }
      });
    }

    // If no dependencies, all tasks with dates are on critical path
    if (!dependencies || dependencies.length === 0) {
      // Just find the task with the latest date
      let latestDate: Date | null = null;
      let latestTask: TaskForCriticalPath | null = null;
      
      tasksWithDates.forEach(task => {
        if (task.due_date) {
          const date = new Date(task.due_date);
          if (!latestDate || date > latestDate) {
            latestDate = date;
            latestTask = task;
          }
        }
      });
      
      return {
        criticalTasks: latestTask ? new Set([latestTask.id]) : new Set<string>(),
        projectEndDate: latestDate,
        longestPath: latestTask ? [latestTask.id] : [],
        totalDuration: 1,
      };
    }

    // Run forward pass
    const forwardResults = forwardPass(tasksWithDates, dependencyMap, predecessorMap);
    
    // Run backward pass
    const backwardResults = backwardPass(tasksWithDates, predecessorMap, forwardResults, dependencyMap);
    
    // Find critical path
    const { criticalTasks, longestPath } = findCriticalPath(
      tasksWithDates,
      backwardResults,
      predecessorMap
    );

    // Calculate project end date
    let projectEndDate: Date | null = null;
    let maxEf = 0;
    
    forwardResults.forEach((result) => {
      if (result.ef > maxEf) {
        maxEf = result.ef;
      }
    });

    // Find the task with the latest due date
    tasksWithDates.forEach(task => {
      if (task.due_date) {
        const date = new Date(task.due_date);
        if (!projectEndDate || date > projectEndDate) {
          projectEndDate = date;
        }
      }
    });

    return {
      criticalTasks,
      projectEndDate,
      longestPath,
      totalDuration: maxEf,
    };
  }, [tasks, dependencies]);
}
