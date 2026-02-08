import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  MoreHorizontal,
  Calendar,
  Loader2,
  Trash2,
  FolderKanban,
  Zap,
  Pencil,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { useProjects, useDeleteProject } from "@/hooks/useProjects";
import { usePermissions } from "@/hooks/usePermissions";
import { DbProject } from "@/types/database";
import { ProjectFormModal } from "@/components/projects/ProjectFormModal";
import { SprintsView } from "@/components/sprints/SprintsView";
import {
  statusConfig,
  riskConfig,
  getRiskLevel,
  formatDate,
  formatCurrency,
} from "@/lib/projectUtils";

export default function Projects() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeSection = searchParams.get("tab") === "sprints" ? "sprints" : "projects";
  const activeStatusTab = searchParams.get("status") || "all";

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<DbProject | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<DbProject | null>(null);
  const { data: projects, isLoading, error } = useProjects();
  const deleteProject = useDeleteProject();
  const { canCreateProject, canEditProject, canDeleteProject } = usePermissions();

  // Filter by search only — status is handled by tabs
  const searchFiltered = (projects || []).filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.client?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    return matchesSearch;
  });

  const getProjectsByStatus = (status: string) =>
    status === "all" ? searchFiltered : searchFiltered.filter((p) => p.status === status);

  const handleSectionChange = (section: string) => {
    if (section === "sprints") {
      setSearchParams({ tab: "sprints" });
    } else {
      setSearchParams({});
    }
  };

  const handleStatusTabChange = (status: string) => {
    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);
    setSearchParams(params);
  };

  const handleEditProject = (project: DbProject, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingProject(project);
    setIsFormOpen(true);
  };

  const handleDeleteProject = (project: DbProject, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setProjectToDelete(project);
  };

  const renderProjectCard = (project: DbProject) => {
    const risk = getRiskLevel(project.progress, project.end_date);

    return (
      <Card
        key={project.id}
        className="hover:shadow-md transition-all hover:border-primary/30 cursor-pointer group"
        onClick={() => navigate(`/projects/${project.id}`)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1 min-w-0">
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                {project.name}
              </h3>
              <p className="text-sm text-muted-foreground truncate">
                {project.client || "Sem cliente"}
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/projects/${project.id}`); }}>
                  <Eye className="h-4 w-4 mr-2" />
                  Ver detalhes
                </DropdownMenuItem>
                {canEditProject && (
                  <DropdownMenuItem onClick={(e) => handleEditProject(project, e)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                )}
                {canDeleteProject && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={(e) => handleDeleteProject(project, e)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex gap-2 mt-2">
            <Badge className={cn("text-xs", statusConfig[project.status].className)}>
              {statusConfig[project.status].label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-medium">{project.progress}%</span>
            </div>
            <Progress value={project.progress} className="h-2" />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(project.end_date)}</span>
            </div>
            <Badge className={cn("text-xs", riskConfig[risk].className)}>
              Risco {riskConfig[risk].label}
            </Badge>
          </div>

          {project.budget && (
            <div className="flex items-center justify-between text-sm pt-2 border-t">
              <span className="text-muted-foreground">Orçamento</span>
              <span className="font-medium">{formatCurrency(project.budget)}</span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderProjectRow = (project: DbProject) => {
    const risk = getRiskLevel(project.progress, project.end_date);

    return (
      <tr
        key={project.id}
        className="border-b hover:bg-accent/50 cursor-pointer"
        onClick={() => navigate(`/projects/${project.id}`)}
      >
        <td className="p-4">
          <div>
            <p className="font-medium">{project.name}</p>
            <p className="text-sm text-muted-foreground">{project.client || "Sem cliente"}</p>
          </div>
        </td>
        <td className="p-4">
          <Badge className={cn("text-xs", statusConfig[project.status].className)}>
            {statusConfig[project.status].label}
          </Badge>
        </td>
        <td className="p-4">
          <div className="flex items-center gap-3 min-w-[120px]">
            <Progress value={project.progress} className="h-2 flex-1" />
            <span className="text-sm font-medium">{project.progress}%</span>
          </div>
        </td>
        <td className="p-4 text-sm">{formatDate(project.end_date)}</td>
        <td className="p-4">
          <Badge className={cn("text-xs", riskConfig[risk].className)}>
            {riskConfig[risk].label}
          </Badge>
        </td>
        <td className="p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/projects/${project.id}`); }}>
                <Eye className="h-4 w-4 mr-2" />
                Ver detalhes
              </DropdownMenuItem>
              {canEditProject && (
                <DropdownMenuItem onClick={(e) => handleEditProject(project, e)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
              )}
              {canDeleteProject && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={(e) => handleDeleteProject(project, e)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </td>
      </tr>
    );
  };

  const renderProjects = (projectList: DbProject[]) => {
    if (projectList.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          Nenhum projecto encontrado.
        </div>
      );
    }

    if (viewMode === "grid") {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projectList.map(renderProjectCard)}
        </div>
      );
    }

    return (
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4 font-medium text-muted-foreground">Projecto</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Estado</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Progresso</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Prazo</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Risco</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>{projectList.map(renderProjectRow)}</tbody>
          </table>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Projectos</h1>
          <p className="text-muted-foreground">
            Gerir e acompanhar todos os projectos da organização.
          </p>
        </div>
        {activeSection === "projects" && canCreateProject && (
          <Button
            className="bg-primary hover:bg-primary/90"
            onClick={() => {
              setEditingProject(null);
              setIsFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Projecto
          </Button>
        )}
      </div>

      {/* Section Tabs: Projects | Sprints */}
      <Tabs value={activeSection} onValueChange={handleSectionChange}>
        <TabsList>
          <TabsTrigger value="projects" className="flex items-center gap-2">
            <FolderKanban className="h-4 w-4" />
            Projectos
          </TabsTrigger>
          <TabsTrigger value="sprints" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Sprints
          </TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="mt-6 space-y-6">
          {/* Search & View toggle */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar projectos..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex border rounded-lg overflow-hidden">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Loading / Error / Content */}
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64 text-destructive">
              Erro ao carregar projectos: {error.message}
            </div>
          ) : (
            <Tabs value={activeStatusTab} onValueChange={handleStatusTabChange}>
              <TabsList className="flex-wrap">
                <TabsTrigger value="all">Todos ({searchFiltered.length})</TabsTrigger>
                <TabsTrigger value="active">
                  Activos ({getProjectsByStatus("active").length})
                </TabsTrigger>
                <TabsTrigger value="delayed">
                  Atrasados ({getProjectsByStatus("delayed").length})
                </TabsTrigger>
                <TabsTrigger value="on_hold">
                  Pausados ({getProjectsByStatus("on_hold").length})
                </TabsTrigger>
                <TabsTrigger value="completed">
                  Concluídos ({getProjectsByStatus("completed").length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-6">
                {renderProjects(getProjectsByStatus("all"))}
              </TabsContent>
              <TabsContent value="active" className="mt-6">
                {renderProjects(getProjectsByStatus("active"))}
              </TabsContent>
              <TabsContent value="delayed" className="mt-6">
                {renderProjects(getProjectsByStatus("delayed"))}
              </TabsContent>
              <TabsContent value="on_hold" className="mt-6">
                {renderProjects(getProjectsByStatus("on_hold"))}
              </TabsContent>
              <TabsContent value="completed" className="mt-6">
                {renderProjects(getProjectsByStatus("completed"))}
              </TabsContent>
            </Tabs>
          )}
        </TabsContent>

        <TabsContent value="sprints" className="mt-6">
          <SprintsView />
        </TabsContent>
      </Tabs>

      <ProjectFormModal
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingProject(null);
        }}
        project={editingProject}
      />

      <AlertDialog open={!!projectToDelete} onOpenChange={(open) => !open && setProjectToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar projecto</AlertDialogTitle>
            <AlertDialogDescription>
              Tem a certeza que deseja eliminar o projecto "{projectToDelete?.name}"?
              Esta acção é irreversível e eliminará todas as tarefas associadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (projectToDelete) {
                  deleteProject.mutate(projectToDelete.id);
                  setProjectToDelete(null);
                }
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
    </div>
  );
}
