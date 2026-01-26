import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KanbanCard, Task, BlockedInfo } from "./KanbanCard";
import { cn } from "@/lib/utils";

interface KanbanColumnProps {
  id: string;
  title: string;
  tasks: Task[];
  color: string;
  onAddTask: (columnId: string) => void;
  onEditTask: (task: Task, columnId: string) => void;
  blockedTasks?: Record<string, BlockedInfo>;
}

export function KanbanColumn({ id, title, tasks, color, onAddTask, onEditTask, blockedTasks }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div className="flex-shrink-0 w-72">
      {/* Column Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className={cn("w-3 h-3 rounded-full", color)} />
          <h3 className="font-semibold text-sm">{title}</h3>
          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            {tasks.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onAddTask(id)}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <MoreHorizontal className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Column Content */}
      <div
        ref={setNodeRef}
        className={cn(
          "p-2 bg-muted/50 rounded-lg min-h-[500px] space-y-2 transition-colors",
          isOver && "bg-primary/10 ring-2 ring-primary/30"
        )}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <KanbanCard 
              key={task.id} 
              task={task} 
              onEdit={(t) => onEditTask(t, id)}
              blockedInfo={blockedTasks?.[task.id]}
            />
          ))}
        </SortableContext>

        {/* Add task button */}
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-foreground h-9"
          onClick={() => onAddTask(id)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar tarefa
        </Button>
      </div>
    </div>
  );
}
