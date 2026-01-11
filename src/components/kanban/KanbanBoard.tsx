import { useState } from "react";
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
import { arrayMove } from "@dnd-kit/sortable";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanCard, Task } from "./KanbanCard";

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

const initialTasks: Record<string, Task[]> = {
  backlog: [
    { id: "t1", title: "Pesquisa de mercado para novos features", priority: "low", assignee: { name: "Ana", initials: "AC" } },
    { id: "t2", title: "Documentação da API v2", priority: "medium", dueDate: "25 Jan" },
  ],
  todo: [
    { id: "t3", title: "Implementar autenticação OAuth", priority: "high", assignee: { name: "Pedro", initials: "PA" }, dueDate: "18 Jan", comments: 5 },
    { id: "t4", title: "Design do dashboard mobile", priority: "medium", assignee: { name: "Sofia", initials: "SL" }, dueDate: "20 Jan", attachments: 3 },
    { id: "t5", title: "Optimização de queries SQL", priority: "high", dueDate: "19 Jan" },
  ],
  in_progress: [
    { id: "t6", title: "Desenvolvimento do módulo de relatórios", description: "Criar componentes para exportação PDF e Excel", priority: "high", assignee: { name: "João", initials: "JM" }, dueDate: "16 Jan", comments: 12, attachments: 2, labels: ["feature"] },
    { id: "t7", title: "Integração com gateway de pagamento", priority: "high", assignee: { name: "Carlos", initials: "CF" }, dueDate: "17 Jan", comments: 8 },
  ],
  review: [
    { id: "t8", title: "Testes unitários do módulo de users", priority: "medium", assignee: { name: "Maria", initials: "MS" }, comments: 3 },
    { id: "t9", title: "Code review - Sprint 4", priority: "low", assignee: { name: "Pedro", initials: "PA" } },
  ],
  done: [
    { id: "t10", title: "Setup do ambiente de staging", priority: "medium", assignee: { name: "João", initials: "JM" } },
    { id: "t11", title: "Configuração CI/CD", priority: "high", assignee: { name: "Carlos", initials: "CF" } },
    { id: "t12", title: "Migração do banco de dados", priority: "high", assignee: { name: "Ana", initials: "AC" } },
  ],
};

export function KanbanBoard() {
  const [tasks, setTasks] = useState(initialTasks);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const findColumn = (taskId: string): string | undefined => {
    for (const [columnId, columnTasks] of Object.entries(tasks)) {
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
      const task = tasks[columnId].find((t) => t.id === active.id);
      if (task) setActiveTask(task);
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

    setTasks((prev) => {
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

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    const activeColumn = findColumn(activeId);
    const overColumn = findColumn(overId);

    if (!activeColumn || !overColumn) return;

    if (activeColumn === overColumn) {
      setTasks((prev) => {
        const oldIndex = prev[activeColumn].findIndex((t) => t.id === activeId);
        const newIndex = prev[activeColumn].findIndex((t) => t.id === overId);

        return {
          ...prev,
          [activeColumn]: arrayMove(prev[activeColumn], oldIndex, newIndex),
        };
      });
    }
  };

  return (
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
            tasks={tasks[column.id] || []}
            color={column.color}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask && <KanbanCard task={activeTask} />}
      </DragOverlay>
    </DndContext>
  );
}
