import { useState, useMemo, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Link2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useTasks } from "@/hooks/useTasks";
import { useProjectTaskDependencies, isTaskBlocked, TaskDependencyWithDetails } from "@/hooks/useTaskDependencies";
import { Skeleton } from "@/components/ui/skeleton";

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
  
  const [viewStart, setViewStart] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [daysToShow, setDaysToShow] = useState(60);
  const svgRef = useRef<SVGSVGElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

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
      };
    });
  }, [tasks, dependenciesByTask]);

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

  // Calculate dependency lines
  const dependencyLines = useMemo(() => {
    const lines: {
      id: string;
      fromTaskId: string;
      toTaskId: string;
      type: string;
      path: string;
    }[] = [];

    if (!allDependencies || !timelineRef.current) return lines;

    const rowHeight = 40;
    const headerHeight = 48; // 24px for month + 24px for days

    for (const dep of allDependencies) {
      const fromTask = ganttTasks.find((t) => t.id === dep.predecessor_id);
      const toTask = ganttTasks.find((t) => t.id === dep.task_id);

      if (!fromTask || !toTask) continue;

      const fromPos = getTaskPosition(fromTask);
      const toPos = getTaskPosition(toTask);

      if (!fromPos || !toPos) continue;

      const fromIndex = ganttTasks.findIndex((t) => t.id === fromTask.id);
      const toIndex = ganttTasks.findIndex((t) => t.id === toTask.id);

      // Calculate pixel positions
      const containerWidth = timelineRef.current.scrollWidth || 1000;
      
      // For FS: line starts from end of predecessor, goes to start of successor
      const fromX = (parseFloat(fromPos.left) / 100 * containerWidth) + 
                   (parseFloat(fromPos.width) / 100 * containerWidth);
      const toX = parseFloat(toPos.left) / 100 * containerWidth;
      
      const fromY = headerHeight + (fromIndex * rowHeight) + (rowHeight / 2);
      const toY = headerHeight + (toIndex * rowHeight) + (rowHeight / 2);

      // Create path with right angles
      const midX = fromX + 10;
      const path = fromIndex === toIndex
        ? `M ${fromX} ${fromY} L ${toX} ${toY}`
        : `M ${fromX} ${fromY} L ${midX} ${fromY} L ${midX} ${toY} L ${toX} ${toY}`;

      lines.push({
        id: dep.id,
        fromTaskId: dep.predecessor_id,
        toTaskId: dep.task_id,
        type: dep.dependency_type,
        path,
      });
    }

    return lines;
  }, [allDependencies, ganttTasks, daysToShow, viewStart]);

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
      <div className="flex items-center justify-between">
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
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Gantt Chart */}
      <div className="border rounded-lg overflow-hidden">
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
                      className={cn(
                        "h-10 border-b flex items-center px-3 gap-2",
                        task.isBlocked && "bg-warning/5"
                      )}
                    >
                      {task.isBlocked && (
                        <AlertTriangle className="h-3 w-3 text-warning flex-shrink-0" />
                      )}
                      {task.dependencies.length > 0 && !task.isBlocked && (
                        <Link2 className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      )}
                      <span className="text-sm truncate">{task.title}</span>
                    </div>
                  </TooltipTrigger>
                  {task.dependencies.length > 0 && (
                    <TooltipContent>
                      <div className="space-y-1">
                        <p className="font-medium">Dependências:</p>
                        {task.dependencies.map((dep) => (
                          <p key={dep.id} className="text-xs">
                            • {dep.predecessor?.title} ({dep.dependency_type})
                          </p>
                        ))}
                      </div>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>

          {/* Timeline */}
          <div className="flex-1 overflow-x-auto relative" ref={timelineRef}>
            {/* SVG for dependency lines */}
            <svg
              ref={svgRef}
              className="absolute inset-0 pointer-events-none z-10"
              style={{ width: '100%', height: `${48 + ganttTasks.length * 40}px` }}
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
              </defs>
              {dependencyLines.map((line) => (
                <path
                  key={line.id}
                  d={line.path}
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth="1.5"
                  fill="none"
                  opacity="0.6"
                  markerEnd="url(#arrowhead)"
                  strokeDasharray={line.type !== 'FS' ? "4 2" : undefined}
                />
              ))}
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
                          >
                            <div
                              className={cn(
                                "h-6 rounded relative overflow-hidden min-w-[8px]",
                                task.isBlocked
                                  ? "bg-warning/80"
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
          <svg width="24" height="12">
            <line x1="0" y1="6" x2="20" y2="6" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" />
            <polygon points="24 6, 18 3, 18 9" fill="hsl(var(--muted-foreground))" />
          </svg>
          <span className="text-muted-foreground">Dependência</span>
        </div>
      </div>
    </div>
  );
}
