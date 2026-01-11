import { Check, Clock, AlertCircle, MoreHorizontal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  project: string;
  priority: "high" | "medium" | "low";
  deadline: string;
  status: "pending" | "in_progress" | "completed";
}

interface TaskListProps {
  tasks: Task[];
  title?: string;
}

const priorityConfig = {
  high: { className: "bg-destructive/10 text-destructive", icon: AlertCircle },
  medium: { className: "bg-warning/10 text-warning", icon: Clock },
  low: { className: "bg-muted text-muted-foreground", icon: Clock },
};

export function TaskList({ tasks, title = "Minhas Tarefas" }: TaskListProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        <Button variant="ghost" size="sm" className="text-primary">
          Ver todas
        </Button>
      </CardHeader>
      <CardContent className="space-y-1">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors group",
              task.status === "completed" && "opacity-60"
            )}
          >
            <Checkbox
              checked={task.status === "completed"}
              className="h-5 w-5"
            />
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  "text-sm font-medium truncate",
                  task.status === "completed" && "line-through text-muted-foreground"
                )}
              >
                {task.title}
              </p>
              <p className="text-xs text-muted-foreground">{task.project}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className={cn("text-xs", priorityConfig[task.priority].className)}
              >
                {task.priority === "high" ? "Alta" : task.priority === "medium" ? "Média" : "Baixa"}
              </Badge>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {task.deadline}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
