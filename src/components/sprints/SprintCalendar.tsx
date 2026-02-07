import { useMemo } from "react";
import { format, eachDayOfInterval, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isToday, isWithinInterval, parseISO, addMonths, subMonths } from "date-fns";
import { pt } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SprintEvent {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: string;
  project_name?: string;
}

interface Props {
  sprints: SprintEvent[];
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
  onSprintClick?: (id: string) => void;
}

const statusColors: Record<string, string> = {
  planning: "bg-muted text-muted-foreground",
  active: "bg-primary/20 text-primary border-primary/40",
  completed: "bg-green-500/20 text-green-700 dark:text-green-400",
  cancelled: "bg-destructive/20 text-destructive",
};

export function SprintCalendar({ sprints, currentMonth, onMonthChange, onSprintClick }: Props) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { locale: pt });
  const calendarEnd = endOfWeek(monthEnd, { locale: pt });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const weekDays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

  const sprintsByDay = useMemo(() => {
    const map: Record<string, SprintEvent[]> = {};
    for (const sprint of sprints) {
      const start = parseISO(sprint.start_date);
      const end = parseISO(sprint.end_date);
      const interval = eachDayOfInterval({ start, end });
      for (const day of interval) {
        const key = format(day, "yyyy-MM-dd");
        if (!map[key]) map[key] = [];
        map[key].push(sprint);
      }
    }
    return map;
  }, [sprints]);

  return (
    <div className="space-y-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="icon" onClick={() => onMonthChange(subMonths(currentMonth, 1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-lg font-semibold capitalize">
          {format(currentMonth, "MMMM yyyy", { locale: pt })}
        </h3>
        <Button variant="outline" size="icon" onClick={() => onMonthChange(addMonths(currentMonth, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
        {/* Header */}
        {weekDays.map((day) => (
          <div key={day} className="bg-muted p-2 text-center text-xs font-medium text-muted-foreground">
            {day}
          </div>
        ))}
        {/* Days */}
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const daySprints = sprintsByDay[key] || [];
          const inMonth = isSameMonth(day, currentMonth);

          return (
            <div
              key={key}
              className={cn(
                "bg-card min-h-[80px] p-1 transition-colors",
                !inMonth && "bg-muted/30",
                isToday(day) && "ring-2 ring-primary ring-inset"
              )}
            >
              <span className={cn(
                "text-xs font-medium",
                !inMonth && "text-muted-foreground/50",
                isToday(day) && "text-primary font-bold"
              )}>
                {format(day, "d")}
              </span>
              <div className="space-y-0.5 mt-0.5">
                {daySprints.slice(0, 2).map((sprint) => (
                  <button
                    key={sprint.id}
                    onClick={() => onSprintClick?.(sprint.id)}
                    className={cn(
                      "w-full text-left text-[10px] px-1 py-0.5 rounded truncate border",
                      statusColors[sprint.status] || statusColors.planning
                    )}
                    title={`${sprint.name}${sprint.project_name ? ` — ${sprint.project_name}` : ""}`}
                  >
                    <Zap className="h-2.5 w-2.5 inline mr-0.5" />
                    {sprint.name}
                  </button>
                ))}
                {daySprints.length > 2 && (
                  <span className="text-[9px] text-muted-foreground">+{daySprints.length - 2}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        {[
          { status: "planning", label: "Planeamento" },
          { status: "active", label: "Activo" },
          { status: "completed", label: "Concluído" },
        ].map(({ status, label }) => (
          <div key={status} className="flex items-center gap-1.5">
            <div className={cn("w-3 h-3 rounded border", statusColors[status])} />
            <span className="text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
