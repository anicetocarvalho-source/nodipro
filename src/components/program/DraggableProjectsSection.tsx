import { useMemo, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FolderKanban,
  GripVertical,
  ArrowRight,
  Plus,
  X,
} from "lucide-react";
import { DbProject } from "@/types/database";
import { useAssignProjectToProgram } from "@/hooks/usePrograms";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  active: "bg-success/20 text-success border-success/30",
  delayed: "bg-destructive/20 text-destructive border-destructive/30",
  completed: "bg-info/20 text-info border-info/30",
  on_hold: "bg-warning/20 text-warning border-warning/30",
};

const statusLabels: Record<string, string> = {
  active: "Ativo",
  delayed: "Atrasado",
  completed: "Concluído",
  on_hold: "Em Espera",
};

interface DraggableProjectsSectionProps {
  programId: string;
  programName: string;
  allProjects: DbProject[];
}

interface DraggableProjectCardProps {
  project: DbProject;
  isDragOverlay?: boolean;
}

function DraggableProjectCard({ project, isDragOverlay }: DraggableProjectCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 p-3 bg-card border rounded-lg transition-all",
        isDragging && "opacity-50",
        isDragOverlay && "shadow-lg ring-2 ring-primary"
      )}
    >
      <button
        className="cursor-grab active:cursor-grabbing touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{project.name}</p>
        <div className="flex items-center gap-2 mt-1">
          <Badge
            variant="outline"
            className={cn("text-xs", statusColors[project.status])}
          >
            {statusLabels[project.status]}
          </Badge>
          {project.client && (
            <span className="text-xs text-muted-foreground truncate">
              {project.client}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="text-right">
          <p className="text-sm font-medium">{project.progress}%</p>
          <Progress value={project.progress} className="w-16 h-1.5" />
        </div>
      </div>
    </div>
  );
}

function StaticProjectCard({ project }: { project: DbProject }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-card border rounded-lg">
      <GripVertical className="h-4 w-4 text-muted-foreground" />
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{project.name}</p>
        <div className="flex items-center gap-2 mt-1">
          <Badge
            variant="outline"
            className={cn("text-xs", statusColors[project.status])}
          >
            {statusLabels[project.status]}
          </Badge>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium">{project.progress}%</p>
        <Progress value={project.progress} className="w-16 h-1.5" />
      </div>
    </div>
  );
}

export function DraggableProjectsSection({
  programId,
  programName,
  allProjects,
}: DraggableProjectsSectionProps) {
  const assignProject = useAssignProjectToProgram();
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Projects in this program
  const programProjects = useMemo(() => {
    return allProjects.filter((p) => p.program_id === programId);
  }, [allProjects, programId]);

  // Unassigned projects (no program)
  const unassignedProjects = useMemo(() => {
    return allProjects.filter((p) => !p.program_id);
  }, [allProjects]);

  const activeProject = useMemo(() => {
    if (!activeId) return null;
    return allProjects.find((p) => p.id === activeId) || null;
  }, [activeId, allProjects]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const projectId = active.id as string;
    const droppedOn = over.id as string;

    // Determine if we're dropping on the program area or unassigned area
    if (droppedOn === "program-drop-zone") {
      // Check if project is not already in this program
      const project = allProjects.find((p) => p.id === projectId);
      if (project && project.program_id !== programId) {
        assignProject.mutate({ projectId, programId });
      }
    } else if (droppedOn === "unassigned-drop-zone") {
      // Remove from program
      const project = allProjects.find((p) => p.id === projectId);
      if (project && project.program_id === programId) {
        assignProject.mutate({ projectId, programId: null });
      }
    }
  };

  const handleQuickAssign = (projectId: string) => {
    assignProject.mutate({ projectId, programId });
  };

  const handleQuickRemove = (projectId: string) => {
    assignProject.mutate({ projectId, programId: null });
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Program Projects */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FolderKanban className="h-4 w-4" />
              Projectos em {programName}
              <Badge variant="secondary" className="ml-auto">
                {programProjects.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DroppableZone id="program-drop-zone" isEmpty={programProjects.length === 0}>
              <SortableContext
                items={programProjects.map((p) => p.id)}
                strategy={verticalListSortingStrategy}
              >
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-2">
                    {programProjects.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <FolderKanban className="h-8 w-8 mb-2 opacity-50" />
                        <p className="text-sm">Arraste projectos para aqui</p>
                      </div>
                    ) : (
                      programProjects.map((project) => (
                        <div key={project.id} className="relative group">
                          <DraggableProjectCard project={project} />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute -right-2 -top-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-full"
                            onClick={() => handleQuickRemove(project.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </SortableContext>
            </DroppableZone>
          </CardContent>
        </Card>

        {/* Unassigned Projects */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FolderKanban className="h-4 w-4 text-muted-foreground" />
              Projectos Disponíveis
              <Badge variant="outline" className="ml-auto">
                {unassignedProjects.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DroppableZone id="unassigned-drop-zone" isEmpty={unassignedProjects.length === 0}>
              <SortableContext
                items={unassignedProjects.map((p) => p.id)}
                strategy={verticalListSortingStrategy}
              >
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-2">
                    {unassignedProjects.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <FolderKanban className="h-8 w-8 mb-2 opacity-50" />
                        <p className="text-sm">Sem projectos disponíveis</p>
                        <p className="text-xs mt-1">
                          Todos os projectos estão atribuídos
                        </p>
                      </div>
                    ) : (
                      unassignedProjects.map((project) => (
                        <div key={project.id} className="relative group">
                          <DraggableProjectCard project={project} />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute -right-2 -top-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity bg-primary text-primary-foreground hover:bg-primary/90 rounded-full"
                            onClick={() => handleQuickAssign(project.id)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </SortableContext>
            </DroppableZone>
          </CardContent>
        </Card>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeProject ? (
          <StaticProjectCard project={activeProject} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

// Droppable Zone component
function DroppableZone({
  id,
  isEmpty,
  children,
}: {
  id: string;
  isEmpty: boolean;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useSortable({
    id,
    data: { type: "container" },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-h-[200px] rounded-lg transition-colors",
        isOver && "bg-primary/5 ring-2 ring-primary/20 ring-dashed"
      )}
    >
      {children}
    </div>
  );
}
