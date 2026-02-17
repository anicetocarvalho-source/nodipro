import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Link2, AlertTriangle, Target, X, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useTasks, useUpdateTask, useDeleteTask } from "@/hooks/useTasks";
import { useDatePropagation } from "@/hooks/useDatePropagation";
import {
  useProjectTaskDependencies,
  useUpdateTaskDependency,
  useDeleteTaskDependency,
  isTaskBlocked,
  TaskDependencyWithDetails,
  DependencyType,
  DEPENDENCY_TYPE_LABELS,
} from "@/hooks/useTaskDependencies";
import { useCriticalPath } from "@/hooks/useCriticalPath";
import { Skeleton } from "@/components/ui/skeleton";
import { TaskFormModal } from "@/components/kanban/TaskFormModal";
import { Task } from "@/components/kanban/KanbanCard";
import { DbTask, TaskPriority } from "@/types/database";

interface GanttChartWithDependenciesProps {
  projectId: string;
}

interface GanttTask {
  id: string;
  title: string;
  startDate: Date | null;
  endDate: Date | null;
  progress: number;
  assignee?: string;
  column_id: string;
  dependencies: TaskDependencyWithDetails[];
  isBlocked: boolean;
  isCritical: boolean;
}

const COLUMN_PROGRESS: Record<string, number> = {
  backlog: 0,
  todo: 0,
  in_progress: 50,
  review: 80,
  done: 100,
};

const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export function GanttChartWithDependencies({ projectId }: GanttChartWithDependenciesProps) {
  const { data: tasks, isLoading: tasksLoading } = useTasks(projectId);
  const { data: allDependencies, isLoading: depsLoading } = useProjectTaskDependencies(projectId);
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const updateDependency = useUpdateTaskDependency();
  const deleteDependency = useDeleteTaskDependency();
  const propagateDates = useDatePropagation();
  
  const [viewStart, setViewStart] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [daysToShow, setDaysToShow] = useState(60);
  const [showCriticalPath, setShowCriticalPath] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingColumnId, setEditingColumnId] = useState<string>("todo");
  const [selectedDep, setSelectedDep] = useState<{ id: string; taskId: string; type: DependencyType; lagDays: number; fromTitle: string; toTitle: string; anchorX: number; anchorY: number } | null>(null);
  const [editDepType, setEditDepType] = useState<DependencyType>("FS");
  const [editLagDays, setEditLagDays] = useState(0);
  const svgRef = useRef<SVGSVGElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Calculate critical path
  const { criticalTasks, projectEndDate } = useCriticalPath(
    tasks?.map(t => ({ 
      id: t.id, 
      due_date: t.due_date, 
      column_id: t.column_id, 
      title: t.title 
    })),
    allDependencies
  );

  // Group dependencies by task
  const dependenciesByTask = useMemo(() => {
    const map: Record<string, TaskDependencyWithDetails[]> = {};
    if (allDependencies) {
      for (const dep of allDependencies) {
        if (!map[dep.task_id]) map[dep.task_id] = [];
        map[dep.task_id].push(dep);
      }
    }
    return map;
  }, [allDependencies]);

  // Convert tasks to Gantt format
  const ganttTasks: GanttTask[] = useMemo(() => {
    if (!tasks) return [];
    
    return tasks.map((task) => {
      const deps = dependenciesByTask[task.id] || [];
      const { blocked } = isTaskBlocked(deps);
      
      return {
        id: task.id,
        title: task.title,
        startDate: task.due_date ? new Date(task.due_date) : null,
        endDate: task.due_date ? new Date(task.due_date) : null,
        progress: COLUMN_PROGRESS[task.column_id] || 0,
        assignee: task.assignee_initials || undefined,
        column_id: task.column_id,
        dependencies: deps,
        isBlocked: blocked && task.column_id !== 'done',
        isCritical: criticalTasks.has(task.id),
      };
    });
  }, [tasks, dependenciesByTask, criticalTasks]);

  // Calculate visible date range
  const startDate = new Date(viewStart);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + daysToShow);

  const days = useMemo(() => {
    const result = [];
    const current = new Date(startDate);
    while (current <= endDate) {
      result.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return result;
  }, [startDate.getTime(), endDate.getTime()]);

  // Group days by month
  const monthGroups = useMemo(() => {
    const groups: { month: string; days: Date[] }[] = [];
    days.forEach((day) => {
      const monthKey = `${months[day.getMonth()]} ${day.getFullYear()}`;
      const lastGroup = groups[groups.length - 1];
      if (lastGroup?.month === monthKey) {
        lastGroup.days.push(day);
      } else {
        groups.push({ month: monthKey, days: [day] });
      }
    });
    return groups;
  }, [days]);

  const getTaskPosition = (task: GanttTask) => {
    if (!task.startDate || !task.endDate) return null;
    
    const taskStart = Math.max(task.startDate.getTime(), startDate.getTime());
    const taskEnd = Math.min(task.endDate.getTime(), endDate.getTime());
    
    const totalDays = daysToShow;
    const startOffset = (taskStart - startDate.getTime()) / (1000 * 60 * 60 * 24);
    const duration = Math.max((taskEnd - taskStart) / (1000 * 60 * 60 * 24) + 1, 1);

    return {
      left: `${(startOffset / totalDays) * 100}%`,
      width: `${(duration / totalDays) * 100}%`,
      startOffset,
      duration,
    };
  };

  const handlePrev = () => {
    const newDate = new Date(viewStart);
    newDate.setDate(newDate.getDate() - 14);
    setViewStart(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(viewStart);
    newDate.setDate(newDate.getDate() + 14);
    setViewStart(newDate);
  };

  const handleZoomIn = () => {
    setDaysToShow(Math.max(30, daysToShow - 15));
  };

  const handleZoomOut = () => {
    setDaysToShow(Math.min(120, daysToShow + 15));
  };

  // Convert DbTask to UI Task for modal
  const dbTaskToUiTask = useCallback((dbTask: DbTask & { subtasks?: any[] }): Task => {
    let dueDate: string | undefined;
    if (dbTask.due_date) {
      const date = new Date(dbTask.due_date);
      dueDate = `${date.getDate()} ${months[date.getMonth()]}`;
    }
    return {
      id: dbTask.id,
      title: dbTask.title,
      description: dbTask.description || undefined,
      priority: dbTask.priority as "high" | "medium" | "low",
      assignee: dbTask.assignee_name && dbTask.assignee_initials
        ? { name: dbTask.assignee_name, initials: dbTask.assignee_initials }
        : undefined,
      dueDate,
      comments: dbTask.comments_count || undefined,
      attachments: dbTask.attachments_count || undefined,
      labels: dbTask.labels || undefined,
      itemType: dbTask.item_type as "epic" | "story" | "task" | undefined,
      storyPoints: dbTask.story_points || undefined,
    };
  }, []);

  const handleTaskClick = useCallback((taskId: string) => {
    if (!tasks) return;
    const dbTask = tasks.find(t => t.id === taskId);
    if (!dbTask) return;
    const uiTask = dbTaskToUiTask(dbTask);
    setEditingTask(uiTask);
    setEditingColumnId(dbTask.column_id);
    setModalOpen(true);
  }, [tasks, dbTaskToUiTask]);

  const handleSaveTask = useCallback((task: Task, columnId: string, isNew: boolean) => {
    if (isNew || !tasks) return;

    let dueDate: string | null = null;
    if (task.dueDate) {
      const monthMap: Record<string, number> = {
        Jan: 0, Fev: 1, Mar: 2, Abr: 3, Mai: 4, Jun: 5,
        Jul: 6, Ago: 7, Set: 8, Out: 9, Nov: 10, Dez: 11,
      };
      const parts = task.dueDate.split(" ");
      if (parts.length === 2) {
        const day = parseInt(parts[0]);
        const month = monthMap[parts[1]];
        if (!isNaN(day) && month !== undefined) {
          const date = new Date(2026, month, day);
          dueDate = date.toISOString().split("T")[0];
        }
      }
    }

    const originalTask = tasks.find(t => t.id === task.id);
    const previousDueDate = originalTask?.due_date || null;

    updateTask.mutate({
      id: task.id,
      projectId,
      title: task.title,
      description: task.description || null,
      priority: task.priority as TaskPriority,
      assignee_name: task.assignee?.name || null,
      assignee_initials: task.assignee?.initials || null,
      due_date: dueDate,
      labels: task.labels || null,
      propagateDates: true,
      previousDueDate,
      subtasks: task.subtasks?.map((st, index) => ({
        id: st.id,
        task_id: task.id,
        title: st.title,
        completed: st.completed,
        position: index,
        created_at: new Date().toISOString(),
      })),
    }, {
      onSuccess: ({ shouldPropagate, newDueDate }) => {
        if (shouldPropagate && newDueDate) {
          propagateDates.mutate({ taskId: task.id, newDueDate, projectId });
        }
      },
    });
  }, [tasks, projectId, updateTask, propagateDates]);

  // Available tasks for dependency selector
  const availableTasks = useMemo(() =>
    (tasks || []).map(t => ({ id: t.id, title: t.title, column_id: t.column_id })),
    [tasks]
  );

  // Calculate dependency lines
  const dependencyLines = useMemo(() => {
    const lines: {
      id: string;
      fromTaskId: string;
      toTaskId: string;
      taskId: string;
      type: DependencyType;
      lagDays: number;
      fromTitle: string;
      toTitle: string;
      path: string;
      midX: number;
      midY: number;
    }[] = [];

    if (!allDependencies || !timelineRef.current) return lines;

    const rowHeight = 40;
    const headerHeight = 48;

    for (const dep of allDependencies) {
      const fromTask = ganttTasks.find((t) => t.id === dep.predecessor_id);
      const toTask = ganttTasks.find((t) => t.id === dep.task_id);

      if (!fromTask || !toTask) continue;

      const fromPos = getTaskPosition(fromTask);
      const toPos = getTaskPosition(toTask);

      if (!fromPos || !toPos) continue;

      const fromIndex = ganttTasks.findIndex((t) => t.id === fromTask.id);
      const toIndex = ganttTasks.findIndex((t) => t.id === toTask.id);

      const containerWidth = timelineRef.current.scrollWidth || 1000;
      
      const fromX = (parseFloat(fromPos.left) / 100 * containerWidth) + 
                   (parseFloat(fromPos.width) / 100 * containerWidth);
      const toX = parseFloat(toPos.left) / 100 * containerWidth;
      
      const fromY = headerHeight + (fromIndex * rowHeight) + (rowHeight / 2);
      const toY = headerHeight + (toIndex * rowHeight) + (rowHeight / 2);

      const lineMidX = fromX + 10;
      const path = fromIndex === toIndex
        ? `M ${fromX} ${fromY} L ${toX} ${toY}`
        : `M ${fromX} ${fromY} L ${lineMidX} ${fromY} L ${lineMidX} ${toY} L ${toX} ${toY}`;

      // Calculate midpoint for popover anchor
      const anchorX = fromIndex === toIndex ? (fromX + toX) / 2 : lineMidX;
      const anchorY = (fromY + toY) / 2;

      lines.push({
        id: dep.id,
        fromTaskId: dep.predecessor_id,
        toTaskId: dep.task_id,
        taskId: dep.task_id,
        type: dep.dependency_type,
        lagDays: dep.lag_days,
        fromTitle: fromTask.title,
        toTitle: toTask.title,
        path,
        midX: anchorX,
        midY: anchorY,
      });
    }

    return lines;
  }, [allDependencies, ganttTasks, daysToShow, viewStart]);

  const handleDepLineClick = useCallback((line: typeof dependencyLines[0], e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDep({
      id: line.id,
      taskId: line.taskId,
      type: line.type,
      lagDays: line.lagDays,
      fromTitle: line.fromTitle,
      toTitle: line.toTitle,
      anchorX: line.midX,
      anchorY: line.midY,
    });
    setEditDepType(line.type);
    setEditLagDays(line.lagDays);
  }, []);

  const handleSaveDep = useCallback(() => {
    if (!selectedDep) return;
    updateDependency.mutate({
      id: selectedDep.id,
      dependencyType: editDepType,
      lagDays: editLagDays,
    });
    setSelectedDep(null);
  }, [selectedDep, editDepType, editLagDays, updateDependency]);

  const handleDeleteDep = useCallback(() => {
    if (!selectedDep) return;
    deleteDependency.mutate({ id: selectedDep.id, taskId: selectedDep.taskId });
    setSelectedDep(null);
  }, [selectedDep, deleteDependency]);

  if (tasksLoading || depsLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="border rounded-lg overflow-hidden">
          <Skeleton className="h-[400px]" />
        </div>
      </div>
    );
  }

  if (!ganttTasks.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <Link2 className="h-12 w-12 mb-4 opacity-50" />
        <p>Nenhuma tarefa com data de entrega definida</p>
        <p className="text-sm">Adicione datas às tarefas para visualizá-las no Gantt</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground ml-2">
            {months[viewStart.getMonth()]} {viewStart.getFullYear()}
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Critical Path Toggle */}
          <div className="flex items-center gap-2">
            <Switch
              id="critical-path"
              checked={showCriticalPath}
              onCheckedChange={setShowCriticalPath}
            />
            <Label htmlFor="critical-path" className="text-sm cursor-pointer flex items-center gap-1">
              <Target className="h-4 w-4 text-destructive" />
              Caminho Crítico
            </Label>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handleZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Project End Date Info */}
      {projectEndDate && (
        <div className="flex items-center gap-2 text-sm bg-muted/50 rounded-lg px-4 py-2">
          <Target className="h-4 w-4 text-destructive" />
          <span className="text-muted-foreground">Data Final do Projecto:</span>
          <span className="font-medium">
            {projectEndDate.getDate()} {months[projectEndDate.getMonth()]} {projectEndDate.getFullYear()}
          </span>
          {criticalTasks.size > 0 && (
            <Badge variant="outline" className="ml-2 border-destructive/50 text-destructive">
              {criticalTasks.size} tarefa{criticalTasks.size !== 1 ? 's' : ''} no caminho crítico
            </Badge>
          )}
        </div>
      )}

      {/* Gantt Chart */}
      <div className="border rounded-lg overflow-hidden relative">
        <div className="flex">
          {/* Task Names Column */}
          <div className="w-64 flex-shrink-0 bg-muted/30 border-r">
            {/* Header */}
            <div className="h-12 border-b flex items-center px-3 bg-muted/50">
              <span className="text-sm font-medium">Tarefa</span>
            </div>
            {/* Task Rows */}
            {ganttTasks.map((task) => (
              <TooltipProvider key={task.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      onClick={() => handleTaskClick(task.id)}
                      className={cn(
                        "h-10 border-b flex items-center px-3 gap-2 cursor-pointer hover:bg-muted/50 transition-colors",
                        task.isBlocked && "bg-warning/5",
                        showCriticalPath && task.isCritical && !task.isBlocked && "bg-destructive/5"
                      )}
                    >
                      {task.isBlocked && (
                        <AlertTriangle className="h-3 w-3 text-warning flex-shrink-0" />
                      )}
                      {showCriticalPath && task.isCritical && !task.isBlocked && (
                        <Target className="h-3 w-3 text-destructive flex-shrink-0" />
                      )}
                      {task.dependencies.length > 0 && !task.isBlocked && !task.isCritical && (
                        <Link2 className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      )}
                      <span className={cn(
                        "text-sm truncate",
                        showCriticalPath && task.isCritical && "font-medium text-destructive"
                      )}>
                        {task.title}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="space-y-1">
                      {task.isCritical && showCriticalPath && (
                        <p className="text-xs text-destructive font-medium">🎯 Caminho Crítico</p>
                      )}
                      {task.dependencies.length > 0 && (
                        <>
                          <p className="font-medium">Dependências:</p>
                          {task.dependencies.map((dep) => (
                            <p key={dep.id} className="text-xs">
                              • {dep.predecessor?.title} ({dep.dependency_type})
                            </p>
                          ))}
                        </>
                      )}
                      {task.dependencies.length === 0 && !task.isCritical && (
                        <p className="text-xs text-muted-foreground">Sem dependências</p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>

          {/* Timeline */}
          <div className="flex-1 overflow-x-auto relative" ref={timelineRef}>
            {/* SVG for dependency lines */}
            <svg
              ref={svgRef}
              className="absolute inset-0 z-10"
              style={{ width: '100%', height: `${48 + ganttTasks.length * 40}px`, pointerEvents: 'none' }}
            >
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="7"
                  refX="9"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon
                    points="0 0, 10 3.5, 0 7"
                    fill="hsl(var(--muted-foreground))"
                    opacity="0.6"
                  />
                </marker>
                <marker
                  id="arrowhead-selected"
                  markerWidth="10"
                  markerHeight="7"
                  refX="9"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon
                    points="0 0, 10 3.5, 0 7"
                    fill="hsl(var(--primary))"
                  />
                </marker>
              </defs>
              {dependencyLines.map((line) => {
                const isSelected = selectedDep?.id === line.id;
                return (
                  <g key={line.id} style={{ pointerEvents: 'auto', cursor: 'pointer' }} onClick={(e) => handleDepLineClick(line, e as unknown as React.MouseEvent)}>
                    {/* Invisible wider path for easier clicking */}
                    <path
                      d={line.path}
                      stroke="transparent"
                      strokeWidth="12"
                      fill="none"
                    />
                    {/* Visible path */}
                    <path
                      d={line.path}
                      stroke={isSelected ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"}
                      strokeWidth={isSelected ? 2.5 : 1.5}
                      fill="none"
                      opacity={isSelected ? 1 : 0.6}
                      markerEnd={isSelected ? "url(#arrowhead-selected)" : "url(#arrowhead)"}
                      strokeDasharray={line.type !== 'FS' ? "4 2" : undefined}
                      className="transition-all duration-150"
                    />
                  </g>
                );
              })}
            </svg>


            {/* Month Headers */}
            <div className="flex h-6 border-b bg-muted/50">
              {monthGroups.map((group, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 border-r flex items-center justify-center"
                  style={{ width: `${(group.days.length / daysToShow) * 100}%` }}
                >
                  <span className="text-xs font-medium">{group.month}</span>
                </div>
              ))}
            </div>

            {/* Day Headers */}
            <div className="flex h-6 border-b bg-muted/30">
              {days.map((day, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex-shrink-0 text-center border-r",
                    day.getDay() === 0 || day.getDay() === 6 ? "bg-muted/50" : ""
                  )}
                  style={{ width: `${100 / daysToShow}%` }}
                >
                  <span className="text-[10px] text-muted-foreground">{day.getDate()}</span>
                </div>
              ))}
            </div>

            {/* Task Bars */}
            {ganttTasks.map((task) => {
              const position = getTaskPosition(task);
              const isVisible = task.startDate && task.endDate && 
                task.startDate <= endDate && task.endDate >= startDate;

              return (
                <div key={task.id} className="h-10 border-b relative">
                  {/* Grid lines */}
                  <div className="absolute inset-0 flex">
                    {days.map((day, i) => (
                      <div
                        key={i}
                        className={cn(
                          "flex-shrink-0 border-r border-muted/50",
                          day.getDay() === 0 || day.getDay() === 6 ? "bg-muted/30" : ""
                        )}
                        style={{ width: `${100 / daysToShow}%` }}
                      />
                    ))}
                  </div>

                  {/* Task Bar */}
                  {isVisible && position && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className="absolute top-1/2 -translate-y-1/2 cursor-pointer"
                            style={{ left: position.left, width: position.width }}
                            onClick={() => handleTaskClick(task.id)}
                          >
                            <div
                              className={cn(
                                "h-6 rounded relative overflow-hidden min-w-[8px]",
                                task.isBlocked
                                  ? "bg-warning/80"
                                  : showCriticalPath && task.isCritical
                                  ? "bg-destructive/90 ring-2 ring-destructive ring-offset-1"
                                  : task.column_id === "done"
                                  ? "bg-success/80"
                                  : "bg-primary/80"
                              )}
                            >
                              {/* Progress */}
                              <div
                                className="absolute inset-0 bg-foreground/20"
                                style={{ width: `${task.progress}%` }}
                              />
                              {task.assignee && (
                                <span className="absolute inset-0 flex items-center px-2 text-[10px] text-white font-medium">
                                  {task.assignee}
                                </span>
                              )}
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="space-y-1">
                            <p className="font-medium">{task.title}</p>
                            <p className="text-xs">Progresso: {task.progress}%</p>
                            {task.startDate && (
                              <p className="text-xs">
                                Data: {task.startDate.getDate()} {months[task.startDate.getMonth()]}
                              </p>
                            )}
                            {showCriticalPath && task.isCritical && (
                              <p className="text-xs text-destructive">🎯 No caminho crítico</p>
                            )}
                            {task.isBlocked && (
                              <p className="text-xs text-warning">⚠️ Bloqueada por dependência</p>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Dependency Edit Popover - positioned over the entire chart */}
        {selectedDep && (
          <div
            className="absolute z-50"
            style={{
              left: `${selectedDep.anchorX + 256}px`,
              top: `${selectedDep.anchorY}px`,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <div className="bg-popover border rounded-lg shadow-lg p-4 w-72 space-y-3 mb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Editar Dependência</span>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSelectedDep(null)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>

              <div className="text-xs text-muted-foreground space-y-0.5">
                <p><span className="font-medium">De:</span> {selectedDep.fromTitle}</p>
                <p><span className="font-medium">Para:</span> {selectedDep.toTitle}</p>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Tipo de Dependência</Label>
                <Select value={editDepType} onValueChange={(v) => setEditDepType(v as DependencyType)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(DEPENDENCY_TYPE_LABELS) as DependencyType[]).map((type) => (
                      <SelectItem key={type} value={type}>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="font-mono text-[10px]">{type}</Badge>
                          <span className="text-xs">{DEPENDENCY_TYPE_LABELS[type]}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Atraso (dias)</Label>
                <Input
                  type="number"
                  min={-365}
                  max={365}
                  value={editLagDays}
                  onChange={(e) => setEditLagDays(parseInt(e.target.value) || 0)}
                  className="h-8 text-xs"
                />
              </div>

              <div className="flex gap-2">
                <Button size="sm" className="flex-1 h-8 text-xs" onClick={handleSaveDep}>
                  <Pencil className="h-3 w-3 mr-1" />
                  Guardar
                </Button>
                <Button size="sm" variant="destructive" className="h-8 text-xs" onClick={handleDeleteDep}>
                  <X className="h-3 w-3 mr-1" />
                  Remover
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-sm flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-8 h-3 rounded bg-primary/80" />
          <span className="text-muted-foreground">Em Progresso</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-3 rounded bg-success/80" />
          <span className="text-muted-foreground">Concluída</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-3 rounded bg-warning/80" />
          <span className="text-muted-foreground">Bloqueada</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-3 rounded bg-destructive/90 ring-2 ring-destructive ring-offset-1" />
          <span className="text-muted-foreground">Caminho Crítico</span>
        </div>
        <div className="flex items-center gap-2">
          <svg width="24" height="12">
            <line x1="0" y1="6" x2="20" y2="6" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" />
            <polygon points="24 6, 18 3, 18 9" fill="hsl(var(--muted-foreground))" />
          </svg>
          <span className="text-muted-foreground">Dependência</span>
        </div>
      </div>

      <TaskFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        task={editingTask}
        columnId={editingColumnId}
        onSave={handleSaveTask}
        onDelete={(taskId) => {
          if (projectId) {
            deleteTask.mutate({ taskId, projectId });
          }
        }}
        projectId={projectId}
        availableTasks={availableTasks}
      />
    </div>
  );
}
