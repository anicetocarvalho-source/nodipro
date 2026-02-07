import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Zap, Calendar as CalendarIcon, List, Loader2, Play, CheckCircle, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { SprintCalendar } from "@/components/sprints/SprintCalendar";
import { SprintFormModal } from "@/components/sprints/SprintFormModal";
import { useProjects } from "@/hooks/useProjects";
import { useAllSprints, useCreateSprint, useUpdateSprint, useDeleteSprint } from "@/hooks/useSprints";
import { useCreateRetrospective, useRetrospective } from "@/hooks/useRetrospectives";
import { useOrganization } from "@/contexts/OrganizationContext";
import { format, differenceInDays, parseISO } from "date-fns";
import { pt } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const statusConfig: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  planning: { label: "Planeamento", icon: Clock, className: "bg-muted text-muted-foreground" },
  active: { label: "Activo", icon: Play, className: "bg-primary/20 text-primary" },
  completed: { label: "Concluído", icon: CheckCircle, className: "bg-green-500/20 text-green-700 dark:text-green-400" },
  cancelled: { label: "Cancelado", icon: X, className: "bg-destructive/20 text-destructive" },
};

export default function Sprints() {
  const navigate = useNavigate();
  const { organization } = useOrganization();
  const { data: projects = [], isLoading: projectsLoading } = useProjects();
  const projectIds = useMemo(() => projects.map((p) => p.id), [projects]);
  const { data: allSprints = [], isLoading: sprintsLoading } = useAllSprints(projectIds);

  const [selectedProjectId, setSelectedProjectId] = useState<string>("all");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSprint, setEditingSprint] = useState<any>(null);
  const [view, setView] = useState<"calendar" | "list">("calendar");

  const createSprint = useCreateSprint();
  const updateSprint = useUpdateSprint();
  const deleteSprint = useDeleteSprint();
  const createRetro = useCreateRetrospective();

  const filteredSprints = useMemo(() => {
    if (selectedProjectId === "all") return allSprints;
    return allSprints.filter((s: any) => s.project_id === selectedProjectId);
  }, [allSprints, selectedProjectId]);

  const calendarSprints = useMemo(() => {
    return filteredSprints.map((s: any) => ({
      id: s.id,
      name: s.name,
      start_date: s.start_date,
      end_date: s.end_date,
      status: s.status,
      project_name: s.projects?.name,
    }));
  }, [filteredSprints]);

  const handleSave = (data: any) => {
    if (editingSprint) {
      updateSprint.mutate({ id: editingSprint.id, projectId: editingSprint.project_id, ...data });
    } else {
      createSprint.mutate(data);
    }
    setEditingSprint(null);
  };

  const handleStartRetro = (sprint: any) => {
    createRetro.mutate({
      sprint_id: sprint.id,
      project_id: sprint.project_id,
    });
    toast.success("Retrospetiva iniciada! Navegue para o sprint para participar.");
  };

  const isLoading = projectsLoading || sprintsLoading;

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sprints</h1>
          <p className="text-muted-foreground">Gestão de sprints, épicos e histórias</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Todos os projectos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os projectos</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => { setEditingSprint(null); setIsFormOpen(true); }} disabled={selectedProjectId === "all" && projects.length === 0}>
            <Plus className="h-4 w-4 mr-2" /> Novo Sprint
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Sprints", value: filteredSprints.length, icon: Zap },
          { label: "Activos", value: filteredSprints.filter((s: any) => s.status === "active").length, icon: Play },
          { label: "Concluídos", value: filteredSprints.filter((s: any) => s.status === "completed").length, icon: CheckCircle },
          { label: "Em Planeamento", value: filteredSprints.filter((s: any) => s.status === "planning").length, icon: Clock },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10"><Icon className="h-4 w-4 text-primary" /></div>
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-xl font-bold">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* View toggle */}
      <Tabs value={view} onValueChange={(v) => setView(v as "calendar" | "list")}>
        <TabsList>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" /> Calendário
          </TabsTrigger>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <List className="h-4 w-4" /> Lista
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="mt-4">
          <Card>
            <CardContent className="p-4">
              <SprintCalendar
                sprints={calendarSprints}
                currentMonth={currentMonth}
                onMonthChange={setCurrentMonth}
                onSprintClick={(id) => {
                  const sprint = allSprints.find((s: any) => s.id === id);
                  if (sprint) { setEditingSprint(sprint); setIsFormOpen(true); }
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list" className="mt-4">
          <div className="space-y-3">
            {filteredSprints.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-muted-foreground">Nenhum sprint encontrado.</CardContent></Card>
            ) : (
              filteredSprints.map((sprint: any) => {
                const days = differenceInDays(parseISO(sprint.end_date), parseISO(sprint.start_date));
                const config = statusConfig[sprint.status] || statusConfig.planning;
                const StatusIcon = config.icon;
                return (
                  <Card key={sprint.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn("p-2 rounded-lg", config.className)}>
                            <StatusIcon className="h-4 w-4" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{sprint.name}</h3>
                            <p className="text-xs text-muted-foreground">
                              {sprint.projects?.name} • {format(parseISO(sprint.start_date), "dd MMM", { locale: pt })} — {format(parseISO(sprint.end_date), "dd MMM yyyy", { locale: pt })} ({days} dias)
                            </p>
                            {sprint.goal && <p className="text-sm text-muted-foreground mt-1">{sprint.goal}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={config.className}>{config.label}</Badge>
                          {sprint.status === "planning" && (
                            <Button size="sm" variant="outline" onClick={() => updateSprint.mutate({ id: sprint.id, projectId: sprint.project_id, status: "active" })}>
                              <Play className="h-3 w-3 mr-1" /> Iniciar
                            </Button>
                          )}
                          {sprint.status === "active" && (
                            <>
                              <Button size="sm" variant="outline" onClick={() => updateSprint.mutate({ id: sprint.id, projectId: sprint.project_id, status: "completed" })}>
                                <CheckCircle className="h-3 w-3 mr-1" /> Concluir
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleStartRetro(sprint)}>
                                Retrospetiva
                              </Button>
                            </>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => { setEditingSprint(sprint); setIsFormOpen(true); }}>Editar</Button>
                          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteSprint.mutate({ id: sprint.id, projectId: sprint.project_id })}>
                            Eliminar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>

      <SprintFormModal
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        sprint={editingSprint}
        projectId={selectedProjectId !== "all" ? selectedProjectId : projects[0]?.id || ""}
        onSave={handleSave}
        isLoading={createSprint.isPending || updateSprint.isPending}
      />
    </div>
  );
}
