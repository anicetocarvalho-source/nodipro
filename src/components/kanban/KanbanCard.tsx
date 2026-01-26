import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Calendar, MessageSquare, Paperclip, Pencil, CheckSquare, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: "high" | "medium" | "low";
  assignee?: { name: string; initials: string };
  dueDate?: string;
  comments?: number;
  attachments?: number;
  labels?: string[];
  subtasks?: Subtask[];
}

export interface BlockedInfo {
  blocked: boolean;
  blockers: string[];
}

interface KanbanCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  onToggleSubtask?: (taskId: string, subtaskId: string) => void;
  blockedInfo?: BlockedInfo;
}

const priorityConfig = {
  high: { label: "Alta", className: "bg-destructive/10 text-destructive border-destructive/30" },
  medium: { label: "Média", className: "bg-warning/10 text-warning border-warning/30" },
  low: { label: "Baixa", className: "bg-muted text-muted-foreground border-muted" },
};

export function KanbanCard({ task, onEdit, onToggleSubtask, blockedInfo }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(task);
  };

  const completedSubtasks = task.subtasks?.filter((s) => s.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;
  const subtaskProgress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  const isBlocked = blockedInfo?.blocked ?? false;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "cursor-grab active:cursor-grabbing hover:shadow-md transition-all group",
        isDragging && "opacity-50 shadow-lg rotate-2",
        isBlocked && "border-warning/60 bg-warning/5 ring-1 ring-warning/30"
      )}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          <button
            {...attributes}
            {...listeners}
            className="mt-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <div className="flex-1 min-w-0 space-y-2">
            {/* Labels */}
            {task.labels && task.labels.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {task.labels.map((label) => (
                  <div
                    key={label}
                    className="h-1.5 w-8 rounded-full bg-primary"
                  />
                ))}
              </div>
            )}

            {/* Blocked indicator */}
            {isBlocked && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-warning/20 text-warning text-xs font-medium">
                      <Lock className="h-3 w-3" />
                      <span>Bloqueada</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p className="font-medium mb-1">Dependências pendentes:</p>
                    <ul className="text-xs space-y-0.5">
                      {blockedInfo?.blockers.map((blocker, i) => (
                        <li key={i}>• {blocker}</li>
                      ))}
                    </ul>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {/* Title with Edit Button */}
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium leading-tight flex-1">{task.title}</p>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                onClick={handleEditClick}
              >
                <Pencil className="h-3 w-3" />
              </Button>
            </div>

            {/* Description */}
            {task.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {task.description}
              </p>
            )}

            {/* Subtasks Progress */}
            {totalSubtasks > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <CheckSquare className="h-3 w-3" />
                    <span>{completedSubtasks}/{totalSubtasks} subtarefas</span>
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">
                    {Math.round(subtaskProgress)}%
                  </span>
                </div>
                <Progress value={subtaskProgress} className="h-1.5" />
              </div>
            )}

            {/* Meta info */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                {task.dueDate && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>{task.dueDate}</span>
                  </div>
                )}
                {task.comments && task.comments > 0 && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MessageSquare className="h-3 w-3" />
                    <span>{task.comments}</span>
                  </div>
                )}
                {task.attachments && task.attachments > 0 && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Paperclip className="h-3 w-3" />
                    <span>{task.attachments}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn("text-[10px] px-1.5 py-0", priorityConfig[task.priority].className)}
                >
                  {priorityConfig[task.priority].label}
                </Badge>
                {task.assignee && (
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                      {task.assignee.initials}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
