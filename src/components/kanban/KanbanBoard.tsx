import { useState, useMemo, forwardRef, useImperativeHandle } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { Filter, X } from "lucide-react";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanCard, Task, BlockedInfo } from "./KanbanCard";
import { TaskFormModal } from "./TaskFormModal";
import { useTasks, useCreateTask, useUpdateTask, useMoveTask } from "@/hooks/useTasks";
import { useDatePropagation } from "@/hooks/useDatePropagation";
import { useProjectTaskDependencies, isTaskBlocked, TaskDependencyWithDetails } from "@/hooks/useTaskDependencies";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { DbTask, DbSubtask, TaskPriority } from "@/types/database";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Column {
  id: string;
  title: string;
  color: string;
}

const columns: Column[] = [
  { id: "backlog", title: "Backlog", color: "bg-muted-foreground" },
  { id: "todo", title: "A Fazer", color: "bg-info" },
  { id: "in_progress", title: "Em Progresso", color: "bg-warning" },
  { id: "review", title: "Em Revisão", color: "bg-chart-5" },
  { id: "done", title: "Concluído", color: "bg-success" },
];

interface KanbanBoardProps {
  projectId: string;
}

export interface KanbanBoardRef {
  openNewTaskModal: (columnId?: string) => void;
}

// Convert DB task to UI task
function dbTaskToUiTask(dbTask: DbTask & { subtasks?: DbSubtask[] }): Task {
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
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
    subtasks: dbTask.subtasks?.map(st => ({
      id: st.id,
      title: st.title,
      completed: st.completed,
    })),
  };
}

// Columns that require dependency validation (active work states)
const ACTIVE_COLUMNS = ["in_progress", "review"];

export const KanbanBoard = forwardRef<KanbanBoardRef, KanbanBoardProps>(({ projectId }, ref) => {
  const { data: dbTasks, isLoading, error } = useTasks(projectId);
  const { data: dependencies } = useProjectTaskDependencies(projectId);
  const { data: teamMembers = [] } = useTeamMembers(projectId);
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const moveTask = useMoveTask();
  const propagateDates = useDatePropagation();

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedColumnId, setSelectedColumnId] = useState<string>("todo");
  const [filterAssignee, setFilterAssignee] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  
  // Local state for optimistic updates during drag
  const [localTasks, setLocalTasks] = useState<Record<string, Task[]>>({});
  const [isDragging, setIsDragging] = useState(false);

  // Expose method to open new task modal from parent
  useImperativeHandle(ref, () => ({
    openNewTaskModal: (columnId = "todo") => {
      setEditingTask(null);
      setSelectedColumnId(columnId);
      setModalOpen(true);
    },
  }));

  // Unique assignees from tasks for filter options
  const assigneeOptions = useMemo(() => {
    if (!dbTasks) return [];
    const seen = new Set<string>();
    return dbTasks
      .filter((t) => t.assignee_name && !seen.has(t.assignee_name) && seen.add(t.assignee_name))
      .map((t) => ({ name: t.assignee_name!, initials: t.assignee_initials || "?" }));
  }, [dbTasks]);

  // Group tasks by column (with assignee filter)
  const tasksByColumn = useMemo(() => {
    if (isDragging) return localTasks;
    
    const grouped: Record<string, Task[]> = {
      backlog: [],
      todo: [],
      in_progress: [],
      review: [],
      done: [],
    };

    if (dbTasks) {
      for (const dbTask of dbTasks) {
        // Apply assignee filter
        if (filterAssignee !== "all") {
          if (filterAssignee === "unassigned") {
            if (dbTask.assignee_name) continue;
          } else if (dbTask.assignee_name !== filterAssignee) {
            continue;
          }
        }

        // Apply priority filter
        if (filterPriority !== "all" && dbTask.priority !== filterPriority) {
          continue;
        }

        const uiTask = dbTaskToUiTask(dbTask);
        const column = dbTask.column_id;
        if (grouped[column]) {
          grouped[column].push(uiTask);
        } else {
          grouped.todo.push(uiTask);
        }
      }
    }

    return grouped;
  }, [dbTasks, isDragging, localTasks, filterAssignee, filterPriority]);

  // Calculate blocked status for each task
  const blockedTasks = useMemo(() => {
    const result: Record<string, BlockedInfo> = {};
    
    if (!dependencies || !dbTasks) return result;
    
    for (const task of dbTasks) {
      // Only check blocking for tasks not in active columns
      if (!ACTIVE_COLUMNS.includes(task.column_id) && task.column_id !== "done") {
        const taskDeps = dependencies.filter(d => d.task_id === task.id) as TaskDependencyWithDetails[];
        if (taskDeps.length > 0) {
          const blockInfo = isTaskBlocked(taskDeps);
          if (blockInfo.blocked) {
            result[task.id] = blockInfo;
          }
        }
      }
    }
    
    return result;
  }, [dependencies, dbTasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const findColumn = (taskId: string): string | undefined => {
    for (const [columnId, columnTasks] of Object.entries(tasksByColumn)) {
      if (columnTasks.some((t) => t.id === taskId)) {
        return columnId;
      }
    }
    return undefined;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const columnId = findColumn(active.id as string);
    if (columnId) {
      const task = tasksByColumn[columnId].find((t) => t.id === active.id);
      if (task) {
        setActiveTask(task);
        setLocalTasks({ ...tasksByColumn });
        setIsDragging(true);
      }
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeColumn = findColumn(activeId);
    const overColumn = findColumn(overId) || (columns.find((c) => c.id === overId) ? overId : undefined);

    if (!activeColumn || !overColumn || activeColumn === overColumn) return;

    setLocalTasks((prev) => {
      const activeTask = prev[activeColumn].find((t) => t.id === activeId);
      if (!activeTask) return prev;

      return {
        ...prev,
        [activeColumn]: prev[activeColumn].filter((t) => t.id !== activeId),
        [overColumn]: [...prev[overColumn], activeTask],
      };
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    setIsDragging(false);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeColumn = findColumn(activeId);
    let overColumn = findColumn(overId);

    // Check if dropped on a column header
    if (!overColumn && columns.find((c) => c.id === overId)) {
      overColumn = overId;
    }

    if (!activeColumn) return;

    // Calculate new position
    const targetColumn = overColumn || activeColumn;
    
    // Validate dependencies when moving to active columns
    if (ACTIVE_COLUMNS.includes(targetColumn) && !ACTIVE_COLUMNS.includes(activeColumn) && activeColumn !== "done") {
      const taskDeps = dependencies?.filter(d => d.task_id === activeId) as TaskDependencyWithDetails[] | undefined;
      
      if (taskDeps && taskDeps.length > 0) {
        const { blocked, blockers } = isTaskBlocked(taskDeps);
        
        if (blocked) {
          toast.error("Tarefa bloqueada por dependências", {
            description: `Não é possível mover para "${columns.find(c => c.id === targetColumn)?.title}". ${blockers[0]}`,
            duration: 5000,
          });
          return;
        }
      }
    }
    
    const tasksInColumn = localTasks[targetColumn] || [];
    let newPosition = 0;

    if (activeId !== overId && overColumn) {
      const overIndex = tasksInColumn.findIndex((t) => t.id === overId);
      if (overIndex >= 0) {
        newPosition = overIndex;
      } else {
        newPosition = tasksInColumn.length;
      }
    } else if (activeColumn === targetColumn) {
      const oldIndex = tasksInColumn.findIndex((t) => t.id === activeId);
      const newIndex = tasksInColumn.findIndex((t) => t.id === overId);
      if (oldIndex !== newIndex && newIndex >= 0) {
        newPosition = newIndex;
      } else {
        return; // No change needed
      }
    }

    // Update in database
    moveTask.mutate({
      taskId: activeId,
      projectId,
      columnId: targetColumn,
      position: newPosition,
    });
  };

  const handleAddTask = (columnId: string) => {
    setEditingTask(null);
    setSelectedColumnId(columnId);
    setModalOpen(true);
  };

  const handleEditTask = (task: Task, columnId: string) => {
    setEditingTask(task);
    setSelectedColumnId(columnId);
    setModalOpen(true);
  };

  const handleSaveTask = (task: Task, columnId: string, isNew: boolean) => {
    // Parse date from Portuguese format to ISO
    let dueDate: string | null = null;
    if (task.dueDate) {
      const months: Record<string, number> = {
        Jan: 0, Fev: 1, Mar: 2, Abr: 3, Mai: 4, Jun: 5,
        Jul: 6, Ago: 7, Set: 8, Out: 9, Nov: 10, Dez: 11,
      };
      const parts = task.dueDate.split(" ");
      if (parts.length === 2) {
        const day = parseInt(parts[0]);
        const month = months[parts[1]];
        if (!isNaN(day) && month !== undefined) {
          const date = new Date(2026, month, day);
          dueDate = date.toISOString().split("T")[0];
        }
      }
    }

    if (isNew) {
      const tasksInColumn = tasksByColumn[columnId] || [];
      createTask.mutate({
        task: {
          project_id: projectId,
          title: task.title,
          description: task.description || null,
          priority: task.priority as TaskPriority,
          column_id: columnId,
          position: 0, // Add at beginning
          assignee_name: task.assignee?.name || null,
          assignee_initials: task.assignee?.initials || null,
          due_date: dueDate,
          labels: task.labels || null,
          comments_count: 0,
          attachments_count: 0,
        },
        subtasks: task.subtasks?.map((st) => ({
          title: st.title,
          completed: st.completed,
          position: 0,
        })),
      });
    } else {
      // Find the original task to get the previous due date
      const originalTask = dbTasks?.find(t => t.id === task.id);
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
          // Propagate dates to dependent tasks if date changed
          if (shouldPropagate && newDueDate) {
            propagateDates.mutate({
              taskId: task.id,
              newDueDate,
              projectId,
            });
          }
        },
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => (
          <div key={column.id} className="flex-shrink-0 w-72">
            <Skeleton className="h-10 mb-3" />
            <div className="space-y-3">
              <Skeleton className="h-24" />
              <Skeleton className="h-32" />
              <Skeleton className="h-20" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-destructive">
        Erro ao carregar tarefas: {error.message}
      </div>
    );
  }

  const isFiltering = filterAssignee !== "all" || filterPriority !== "all";
  const totalFiltered = isFiltering
    ? Object.values(tasksByColumn).reduce((sum, col) => sum + col.length, 0)
    : null;

  const clearFilters = () => {
    setFilterAssignee("all");
    setFilterPriority("all");
  };

  return (
    <>
      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span className="text-sm font-medium">Filtrar:</span>
        </div>
        <Select value={filterAssignee} onValueChange={setFilterAssignee}>
          <SelectTrigger className="w-[200px] h-8 text-sm">
            <SelectValue placeholder="Responsável" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os responsáveis</SelectItem>
            <SelectItem value="unassigned">Sem atribuição</SelectItem>
            {assigneeOptions.map((member) => (
              <SelectItem key={member.name} value={member.name}>
                <div className="flex items-center gap-2">
                  <Avatar className="h-5 w-5">
                    <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                      {member.initials}
                    </AvatarFallback>
                  </Avatar>
                  {member.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-[160px] h-8 text-sm">
            <SelectValue placeholder="Prioridade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas prioridades</SelectItem>
            <SelectItem value="high">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-destructive" />
                Alta
              </div>
            </SelectItem>
            <SelectItem value="medium">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-warning" />
                Média
              </div>
            </SelectItem>
            <SelectItem value="low">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-success" />
                Baixa
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        {isFiltering && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {totalFiltered} tarefa{totalFiltered !== 1 ? "s" : ""}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={clearFilters}
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Limpar
            </Button>
          </div>
        )}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              id={column.id}
              title={column.title}
              tasks={tasksByColumn[column.id] || []}
              color={column.color}
              onAddTask={handleAddTask}
              onEditTask={handleEditTask}
              blockedTasks={blockedTasks}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask && <KanbanCard task={activeTask} />}
        </DragOverlay>
      </DndContext>

      <TaskFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        task={editingTask}
        columnId={selectedColumnId}
        onSave={handleSaveTask}
        projectId={projectId}
        availableTasks={dbTasks?.map(t => ({
          id: t.id,
          title: t.title,
          column_id: t.column_id,
        })) || []}
      />
    </>
  );
});

KanbanBoard.displayName = "KanbanBoard";
