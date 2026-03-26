import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Users,
  DollarSign,
  AlertTriangle,
  FileText,
  Settings,
  LayoutGrid,
  GanttChartSquare,
  List,
  CheckCircle,
  Plus,
  Loader2,
  Pencil,
  Trash2,
  Shield,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { KanbanBoardRef } from "@/components/kanban/KanbanBoard";
import { GanttChartWithDependencies } from "@/components/gantt/GanttChartWithDependencies";
import { ProjectFormModal } from "@/components/projects/ProjectFormModal";
import { ProjectPermissionsManager } from "@/components/projects/ProjectPermissionsManager";
import { useProject, useDeleteProject } from "@/hooks/useProjects";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useTasks } from "@/hooks/useTasks";
import { usePermissions } from "@/hooks/usePermissions";
import { ProjectIntegrityPanel } from "@/components/projects/ProjectIntegrityPanel";
import { TaskListView } from "@/components/tasks/TaskListView";
import { ScrumDashboard } from "@/components/scrum/ScrumDashboard";
import { PROJECT_METHODOLOGY_OPTIONS } from "@/types/database";
import {
  statusConfig,
  riskConfig,
  getRiskLevel,
  formatDate,
  formatCurrency,
} from "@/lib/projectUtils";

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<"kanban" | "gantt" | "list">("kanban");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPermissionsOpen, setIsPermissionsOpen] = useState(false);
  const deleteProject = useDeleteProject();
  const { isAdmin, isPortfolioManager, isProjectManager, canEditProject, canDeleteProject, canCreateReports } = usePermissions();

  const kanbanRef = useRef<KanbanBoardRef>(null);

  const handleNewTask = () => {
    if (activeView === "kanban" && kanbanRef.current) {
      kanbanRef.current.openNewTaskModal("todo");
    } else {
      setActiveView("kanban");
      setTimeout(() => {
        kanbanRef.current?.openNewTaskModal("todo");
      }, 100);
    }
  };

  const { data: project, isLoading: projectLoading } = useProject(id);
  const { data: teamMembers, isLoading: teamLoading } = useTeamMembers(id);
  const { data: tasks } = useTasks(id);

  const canManagePermissions = isAdmin || isPortfolioManager || isProjectManager;

  const methodology = project?.methodology;
  const isScrum = methodology === "scrum" || methodology === "hybrid";
  const methodologyLabel =
    PROJECT_METHODOLOGY_OPTIONS.find((m) => m.value === methodology)?.label || "Cascata";

  if (projectLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">Projecto não encontrado.</p>
        <Button onClick={() => navigate("/projects")}>Voltar aos Projectos</Button>
      </div>
    );
  }

  const budgetPercentage =
    project.budget && project.spent
      ? Math.round((Number(project.spent) / Number(project.budget)) * 100)
      : 0;

  const risk = getRiskLevel(project.progress, project.end_date);
  const statusInfo = statusConfig[project.status];

  const taskStats = {
    totalTasks: tasks?.length || 0,
    completedTasks: tasks?.filter((t) => t.column_id === "done").length || 0,
    inProgress: tasks?.filter((t) => t.column_id === "in_progress").length || 0,
    pending: tasks?.filter((t) => ["backlog", "todo"].includes(t.column_id)).length || 0,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="flex items-start gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/projects")}
            className="mt-1"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
              <Badge className={cn(statusInfo.className)}>
                {statusInfo.label}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {methodologyLabel}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">{project.client || "Sem cliente"}</p>
          </div>
        </div>
        {/* Consolidated actions: primary + dropdown for secondary */}
        <div className="flex items-center gap-2 ml-12 lg:ml-0">
          <Button className="bg-primary hover:bg-primary/90" onClick={handleNewTask}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Tarefa
          </Button>
          <Button variant="outline" onClick={() => setIsEditModalOpen(true)}>
            <Pencil className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <FileText className="h-4 w-4 mr-2" />
                Gerar Relatório
              </DropdownMenuItem>
              {canManagePermissions && (
                <DropdownMenuItem onClick={() => setIsPermissionsOpen(true)}>
                  <Shield className="h-4 w-4 mr-2" />
                  Permissões
                </DropdownMenuItem>
              )}
              <DropdownMenuItem>
                <Settings className="h-4 w-4 mr-2" />
                Configurações
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar Projecto
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Prazo</p>
                <p className="text-sm font-semibold">{formatDate(project.end_date)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <CheckCircle className="h-4 w-4 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Progresso</p>
                <p className="text-sm font-semibold">{project.progress}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-info/10">
                <Users className="h-4 w-4 text-info" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Equipa</p>
                <p className="text-sm font-semibold">{teamMembers?.length || 0} membros</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <DollarSign className="h-4 w-4 text-warning" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Orçamento</p>
                <p className="text-sm font-semibold">{budgetPercentage}% usado</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-lg", riskConfig[risk].className.split(" ")[0])}>
                <AlertTriangle className={cn("h-4 w-4", riskConfig[risk].className.split(" ")[1])} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Risco</p>
                <p className={cn("text-sm font-semibold", riskConfig[risk].className.split(" ")[1])}>
                  {riskConfig[risk].label}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Left Side - Main View */}
        <div className="xl:col-span-3 space-y-4">
          {/* View Toggle */}
          <div className="flex items-center justify-between">
            <Tabs value={activeView} onValueChange={(v) => setActiveView(v as typeof activeView)}>
              <TabsList>
                <TabsTrigger value="kanban" className="flex items-center gap-2">
                  <LayoutGrid className="h-4 w-4" />
                  Kanban
                </TabsTrigger>
                <TabsTrigger value="gantt" className="flex items-center gap-2">
                  <GanttChartSquare className="h-4 w-4" />
                  Gantt
                </TabsTrigger>
                <TabsTrigger value="list" className="flex items-center gap-2">
                  <List className="h-4 w-4" />
                  Lista
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Views */}
          <Card className="overflow-hidden">
            <CardContent className="p-4">
              {activeView === "kanban" && <KanbanBoard ref={kanbanRef} projectId={id || ""} />}
              {activeView === "gantt" && <GanttChartWithDependencies projectId={id || ""} />}
              {activeView === "list" && <TaskListView projectId={id || ""} />}
            </CardContent>
          </Card>
        </div>

        {/* Right Side - Info Panel */}
        <div className="space-y-4">
          {isScrum && <ScrumDashboard projectId={id || ""} />}

          <ProjectIntegrityPanel projectId={id || ""} />

          {/* Progress */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Progresso Geral</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tarefas</span>
                  <span className="font-medium">
                    {taskStats.completedTasks}/{taskStats.totalTasks}
                  </span>
                </div>
                <Progress
                  value={
                    taskStats.totalTasks > 0
                      ? (taskStats.completedTasks / taskStats.totalTasks) * 100
                      : 0
                  }
                  className="h-2"
                />
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 bg-success/10 rounded-lg">
                  <p className="text-lg font-bold text-success">{taskStats.completedTasks}</p>
                  <p className="text-xs text-muted-foreground">Concluídas</p>
                </div>
                <div className="p-2 bg-warning/10 rounded-lg">
                  <p className="text-lg font-bold text-warning">{taskStats.inProgress}</p>
                  <p className="text-xs text-muted-foreground">Em curso</p>
                </div>
                <div className="p-2 bg-muted rounded-lg">
                  <p className="text-lg font-bold">{taskStats.pending}</p>
                  <p className="text-xs text-muted-foreground">Pendentes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Team */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base">Equipa</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="text-primary text-xs"
                onClick={() => navigate("/team")}
              >
                Ver todos
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {teamLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : teamMembers && teamMembers.length > 0 ? (
                teamMembers.slice(0, 5).map((member) => (
                  <div key={member.id} className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {member.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{member.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {member.role || "Membro"}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Nenhum membro na equipa.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Actividade Recente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {tasks && tasks.length > 0 ? (
                tasks.slice(0, 3).map((task, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <Avatar className="h-6 w-6 mt-0.5">
                      <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                        {task.assignee_initials || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs">
                        <span className="font-medium">{task.assignee_name || "Sistema"}</span>{" "}
                        <span className="text-muted-foreground">trabalha em</span>{" "}
                        <span className="text-primary truncate">{task.title}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {task.column_id === "done"
                          ? "Concluído"
                          : task.column_id === "in_progress"
                          ? "Em progresso"
                          : task.column_id === "review"
                          ? "Em revisão"
                          : "Pendente"}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Sem actividade recente.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ProjectFormModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        project={project}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar projecto</AlertDialogTitle>
            <AlertDialogDescription>
              Tem a certeza que deseja eliminar o projecto "{project.name}"? Esta acção é
              irreversível e eliminará todas as tarefas associadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                deleteProject.mutate(project.id, {
                  onSuccess: () => navigate("/projects"),
                });
              }}
            >
              {deleteProject.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {canManagePermissions && (
        <ProjectPermissionsManager
          projectId={id || ""}
          open={isPermissionsOpen}
          onOpenChange={setIsPermissionsOpen}
        />
      )}
    </div>
  );
}
