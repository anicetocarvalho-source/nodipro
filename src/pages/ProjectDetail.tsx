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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { KanbanBoardRef } from "@/components/kanban/KanbanBoard";
import { GanttChartWithDependencies } from "@/components/gantt/GanttChartWithDependencies";
import { ProjectFormModal } from "@/components/projects/ProjectFormModal";
import { ProjectPermissionsManager } from "@/components/projects/ProjectPermissionsManager";
import { useProject, useDeleteProject } from "@/hooks/useProjects";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useTasks } from "@/hooks/useTasks";
import { usePermissions } from "@/hooks/usePermissions";

const formatCurrency = (value: number | null) => {
  if (value === null) return "-";
  return new Intl.NumberFormat("pt-AO", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value) + " AOA";
};

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "-";
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const date = new Date(dateStr);
  return `${date.getDate().toString().padStart(2, '0')} ${months[date.getMonth()]} ${date.getFullYear()}`;
};

const getRiskLevel = (progress: number, endDate: string | null): { label: string; className: string } => {
  if (!endDate) return { label: "Baixo", className: "text-success" };
  const now = new Date();
  const deadline = new Date(endDate);
  const daysRemaining = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (progress >= 90) return { label: "Baixo", className: "text-success" };
  if (daysRemaining < 0) return { label: "Crítico", className: "text-destructive" };
  if (daysRemaining < 7 && progress < 80) return { label: "Alto", className: "text-destructive" };
  if (daysRemaining < 30 && progress < 60) return { label: "Médio", className: "text-warning" };
  return { label: "Baixo", className: "text-success" };
};

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<"kanban" | "gantt" | "list">("kanban");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPermissionsOpen, setIsPermissionsOpen] = useState(false);
  const deleteProject = useDeleteProject();
  const { isAdmin, isPortfolioManager, isProjectManager } = usePermissions();
  
  const kanbanRef = useRef<KanbanBoardRef>(null);

  const handleNewTask = () => {
    if (activeView === "kanban" && kanbanRef.current) {
      kanbanRef.current.openNewTaskModal("todo");
    } else {
      // Switch to kanban view and open modal
      setActiveView("kanban");
      // Use timeout to ensure view is rendered before opening modal
      setTimeout(() => {
        kanbanRef.current?.openNewTaskModal("todo");
      }, 100);
    }
  };
  
  const { data: project, isLoading: projectLoading } = useProject(id);
  const { data: teamMembers, isLoading: teamLoading } = useTeamMembers(id);
  const { data: tasks } = useTasks(id);
  
  const canManagePermissions = isAdmin || isPortfolioManager || isProjectManager;

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

  const budgetPercentage = project.budget && project.spent 
    ? Math.round((Number(project.spent) / Number(project.budget)) * 100)
    : 0;

  const risk = getRiskLevel(project.progress, project.end_date);

  // Calculate task stats from real data
  const taskStats = {
    totalTasks: tasks?.length || 0,
    completedTasks: tasks?.filter(t => t.column_id === 'done').length || 0,
    inProgress: tasks?.filter(t => t.column_id === 'in_progress').length || 0,
    pending: tasks?.filter(t => ['backlog', 'todo'].includes(t.column_id)).length || 0,
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
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
              <Badge className="bg-success/10 text-success">
                {project.status === 'active' ? 'Activo' : 
                 project.status === 'delayed' ? 'Atrasado' :
                 project.status === 'completed' ? 'Concluído' : 'Pausado'}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">{project.client || "Sem cliente"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-12 lg:ml-0">
          <Button variant="outline" onClick={() => setIsEditModalOpen(true)}>
            <Pencil className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <Button 
            variant="outline" 
            className="text-destructive hover:text-destructive"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Eliminar
          </Button>
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Relatório
          </Button>
          {canManagePermissions && (
            <Button variant="outline" onClick={() => setIsPermissionsOpen(true)}>
              <Shield className="h-4 w-4 mr-2" />
              Permissões
            </Button>
          )}
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Configurações
          </Button>
          <Button className="bg-primary hover:bg-primary/90" onClick={handleNewTask}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Tarefa
          </Button>
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
              <div className="p-2 rounded-lg bg-success/10">
                <AlertTriangle className={`h-4 w-4 ${risk.className}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Risco</p>
                <p className={`text-sm font-semibold ${risk.className}`}>{risk.label}</p>
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
              {activeView === "list" && (
                <div className="text-center py-12 text-muted-foreground">
                  Visualização em lista (em desenvolvimento)
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Side - Info Panel */}
        <div className="space-y-4">
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
                  value={taskStats.totalTasks > 0 ? (taskStats.completedTasks / taskStats.totalTasks) * 100 : 0} 
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
              <Button variant="ghost" size="sm" className="text-primary text-xs">
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
                      <p className="text-xs text-muted-foreground truncate">{member.role || "Membro"}</p>
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

          {/* Budget */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Orçamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Planeado</span>
                  <span className="font-medium">{formatCurrency(project.budget)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Executado</span>
                  <span className="font-medium">{formatCurrency(project.spent)}</span>
                </div>
              </div>
              <Progress value={budgetPercentage} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">
                {budgetPercentage}% do orçamento utilizado
              </p>
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
                        {task.column_id === 'done' ? 'Concluído' : 
                         task.column_id === 'in_progress' ? 'Em progresso' :
                         task.column_id === 'review' ? 'Em revisão' : 'Pendente'}
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
              Tem a certeza que deseja eliminar o projecto "{project.name}"? 
              Esta acção é irreversível e eliminará todas as tarefas associadas.
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
