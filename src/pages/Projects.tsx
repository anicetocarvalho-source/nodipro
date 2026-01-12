import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Filter,
  LayoutGrid,
  List,
  MoreHorizontal,
  Calendar,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useProjects } from "@/hooks/useProjects";
import { DbProject } from "@/types/database";
import { ProjectFormModal } from "@/components/projects/ProjectFormModal";

const statusConfig = {
  active: { label: "Activo", className: "bg-success/10 text-success" },
  delayed: { label: "Atrasado", className: "bg-destructive/10 text-destructive" },
  completed: { label: "Concluído", className: "bg-primary/10 text-primary" },
  on_hold: { label: "Pausado", className: "bg-warning/10 text-warning" },
};

const getRiskLevel = (progress: number, endDate: string | null): "low" | "medium" | "high" | "critical" => {
  if (!endDate) return "low";
  const now = new Date();
  const deadline = new Date(endDate);
  const daysRemaining = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (progress >= 90) return "low";
  if (daysRemaining < 0) return "critical";
  if (daysRemaining < 7 && progress < 80) return "high";
  if (daysRemaining < 30 && progress < 60) return "medium";
  return "low";
};

const riskConfig = {
  low: { label: "Baixo", className: "bg-success/10 text-success" },
  medium: { label: "Médio", className: "bg-warning/10 text-warning" },
  high: { label: "Alto", className: "bg-destructive/10 text-destructive" },
  critical: { label: "Crítico", className: "bg-destructive text-destructive-foreground" },
};

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "-";
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const date = new Date(dateStr);
  return `${date.getDate().toString().padStart(2, '0')} ${months[date.getMonth()]} ${date.getFullYear()}`;
};

const formatCurrency = (value: number | null) => {
  if (value === null) return "-";
  return new Intl.NumberFormat("pt-AO", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value) + " AOA";
};

export default function Projects() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<DbProject | null>(null);
  const { data: projects, isLoading, error } = useProjects();

  const filteredProjects = (projects || []).filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.client?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  const getProjectsByStatus = (status: string) =>
    filteredProjects.filter((p) => p.status === status);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-destructive">
        Erro ao carregar projectos: {error.message}
      </div>
    );
  }

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
                <DropdownMenuItem onClick={() => navigate(`/projects/${project.id}`)}>
                  Ver detalhes
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  setEditingProject(project);
                  setIsFormOpen(true);
                }}>
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem>Relatório</DropdownMenuItem>
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
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-medium">{project.progress}%</span>
            </div>
            <Progress value={project.progress} className="h-2" />
          </div>

          {/* Deadline & Risk */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(project.end_date)}</span>
            </div>
            <Badge className={cn("text-xs", riskConfig[risk].className)}>
              Risco {riskConfig[risk].label}
            </Badge>
          </div>

          {/* Budget */}
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
          <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
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
        <Button className="bg-primary hover:bg-primary/90" onClick={() => {
          setEditingProject(null);
          setIsFormOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Projecto
        </Button>
      </div>

      {/* Filters & Search */}
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
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Todos</DropdownMenuItem>
              <DropdownMenuItem>Activos</DropdownMenuItem>
              <DropdownMenuItem>Atrasados</DropdownMenuItem>
              <DropdownMenuItem>Concluídos</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">Todos ({filteredProjects.length})</TabsTrigger>
          <TabsTrigger value="active">
            Activos ({getProjectsByStatus("active").length})
          </TabsTrigger>
          <TabsTrigger value="delayed">
            Atrasados ({getProjectsByStatus("delayed").length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Concluídos ({getProjectsByStatus("completed").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {renderProjects(filteredProjects)}
        </TabsContent>
        <TabsContent value="active" className="mt-6">
          {renderProjects(getProjectsByStatus("active"))}
        </TabsContent>
        <TabsContent value="delayed" className="mt-6">
          {renderProjects(getProjectsByStatus("delayed"))}
        </TabsContent>
        <TabsContent value="completed" className="mt-6">
          {renderProjects(getProjectsByStatus("completed"))}
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
    </div>
  );
}
