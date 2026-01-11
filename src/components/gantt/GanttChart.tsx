import { useState } from "react";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface GanttTask {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  progress: number;
  assignee?: string;
  type: "task" | "milestone" | "phase";
  color?: string;
}

const tasks: GanttTask[] = [
  { id: "1", name: "Fase 1: Planeamento", startDate: new Date(2026, 0, 1), endDate: new Date(2026, 0, 15), progress: 100, type: "phase", color: "bg-primary" },
  { id: "2", name: "Análise de Requisitos", startDate: new Date(2026, 0, 1), endDate: new Date(2026, 0, 8), progress: 100, assignee: "MS", type: "task" },
  { id: "3", name: "Especificação Funcional", startDate: new Date(2026, 0, 6), endDate: new Date(2026, 0, 12), progress: 100, assignee: "AC", type: "task" },
  { id: "4", name: "Aprovação do Escopo", startDate: new Date(2026, 0, 15), endDate: new Date(2026, 0, 15), progress: 100, type: "milestone", color: "bg-success" },
  { id: "5", name: "Fase 2: Design", startDate: new Date(2026, 0, 16), endDate: new Date(2026, 1, 5), progress: 80, type: "phase", color: "bg-info" },
  { id: "6", name: "Arquitectura do Sistema", startDate: new Date(2026, 0, 16), endDate: new Date(2026, 0, 23), progress: 100, assignee: "CF", type: "task" },
  { id: "7", name: "Design de Interface", startDate: new Date(2026, 0, 20), endDate: new Date(2026, 1, 3), progress: 70, assignee: "SL", type: "task" },
  { id: "8", name: "Protótipo Validado", startDate: new Date(2026, 1, 5), endDate: new Date(2026, 1, 5), progress: 0, type: "milestone", color: "bg-warning" },
  { id: "9", name: "Fase 3: Desenvolvimento", startDate: new Date(2026, 1, 6), endDate: new Date(2026, 2, 15), progress: 35, type: "phase", color: "bg-chart-5" },
  { id: "10", name: "Backend API", startDate: new Date(2026, 1, 6), endDate: new Date(2026, 1, 28), progress: 50, assignee: "PA", type: "task" },
  { id: "11", name: "Frontend Application", startDate: new Date(2026, 1, 10), endDate: new Date(2026, 2, 10), progress: 30, assignee: "JM", type: "task" },
  { id: "12", name: "Integração de Sistemas", startDate: new Date(2026, 2, 1), endDate: new Date(2026, 2, 15), progress: 10, assignee: "CF", type: "task" },
];

const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export function GanttChart() {
  const [viewStart, setViewStart] = useState(new Date(2026, 0, 1));
  const [daysToShow, setDaysToShow] = useState(60);

  const startDate = new Date(viewStart);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + daysToShow);

  const days = [];
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    days.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Group days by month
  const monthGroups: { month: string; days: Date[] }[] = [];
  days.forEach((day) => {
    const monthKey = `${months[day.getMonth()]} ${day.getFullYear()}`;
    const lastGroup = monthGroups[monthGroups.length - 1];
    if (lastGroup?.month === monthKey) {
      lastGroup.days.push(day);
    } else {
      monthGroups.push({ month: monthKey, days: [day] });
    }
  });

  const getTaskPosition = (task: GanttTask) => {
    const taskStart = Math.max(task.startDate.getTime(), startDate.getTime());
    const taskEnd = Math.min(task.endDate.getTime(), endDate.getTime());
    
    const totalDays = daysToShow;
    const startOffset = (taskStart - startDate.getTime()) / (1000 * 60 * 60 * 24);
    const duration = (taskEnd - taskStart) / (1000 * 60 * 60 * 24) + 1;

    return {
      left: `${(startOffset / totalDays) * 100}%`,
      width: task.type === "milestone" ? "12px" : `${(duration / totalDays) * 100}%`,
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
            {tasks.map((task) => (
              <div
                key={task.id}
                className={cn(
                  "h-10 border-b flex items-center px-3 gap-2",
                  task.type === "phase" && "bg-muted/30 font-medium"
                )}
              >
                {task.type === "phase" && (
                  <div className={cn("w-2 h-2 rounded-full", task.color)} />
                )}
                <span className={cn(
                  "text-sm truncate",
                  task.type !== "phase" && "pl-4"
                )}>
                  {task.name}
                </span>
              </div>
            ))}
          </div>

          {/* Timeline */}
          <div className="flex-1 overflow-x-auto">
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
            {tasks.map((task) => {
              const position = getTaskPosition(task);
              const isVisible = task.startDate <= endDate && task.endDate >= startDate;

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
                  {isVisible && (
                    <div
                      className="absolute top-1/2 -translate-y-1/2"
                      style={{ left: position.left, width: position.width }}
                    >
                      {task.type === "milestone" ? (
                        <div
                          className={cn(
                            "w-3 h-3 rotate-45 mx-auto",
                            task.color || "bg-primary"
                          )}
                        />
                      ) : (
                        <div
                          className={cn(
                            "h-6 rounded relative overflow-hidden",
                            task.type === "phase"
                              ? task.color || "bg-primary"
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
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-3 rounded bg-primary" />
          <span className="text-muted-foreground">Tarefa</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rotate-45 bg-success" />
          <span className="text-muted-foreground">Marco</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-3 rounded bg-foreground/20" />
          <span className="text-muted-foreground">Progresso</span>
        </div>
      </div>
    </div>
  );
}
