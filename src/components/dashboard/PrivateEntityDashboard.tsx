import { useNavigate } from "react-router-dom";
import {
  FolderKanban,
  TrendingUp,
  Clock,
  DollarSign,
  Users,
  Zap,
  Building2,
  BarChart3,
  ExternalLink,
  Heart,
  Banknote,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardData } from "@/hooks/useDashboardData";
import { usePermissions } from "@/hooks/usePermissions";

interface PrivateEntityDashboardProps {
  userName: string;
}

export function PrivateEntityDashboard({ userName }: PrivateEntityDashboardProps) {
  const navigate = useNavigate();
  const {
    stats,
    projects,
    upcomingDeadlines: realDeadlines,
    isLoading,
  } = useDashboardData();
  const { canViewBudget } = usePermissions();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default" className="bg-success">Activo</Badge>;
      case "delayed":
        return <Badge variant="default" className="bg-warning">Atrasado</Badge>;
      case "completed":
        return <Badge variant="default" className="bg-info">Concluído</Badge>;
      default:
        return <Badge variant="secondary">Em Espera</Badge>;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  };

  const formatCompactNumber = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  // Use real data for project performance
  const topProjects = projects
    .filter(p => p.status === "active" || p.status === "delayed")
    .slice(0, 4);

  const dynamicStats = [
    {
      title: "Projectos Activos",
      value: stats.activeProjects,
      change: `+${stats.completedProjects} concluídos`,
      changeType: "positive" as const,
      icon: FolderKanban,
      href: "/projects",
    },
    ...(canViewBudget ? [{
      title: "Taxa de Execução",
      value: `${stats.executionRate}%`,
      change: `${formatCompactNumber(stats.totalSpent)} de ${formatCompactNumber(stats.totalBudget)}`,
      changeType: stats.executionRate >= 50 ? "positive" as const : "neutral" as const,
      icon: TrendingUp,
      href: "/budget",
    }] : []),
    {
      title: "Tarefas Concluídas",
      value: `${stats.completedTasks}/${stats.totalTasks}`,
      change: `${stats.inProgressTasks} em progresso`,
      changeType: "positive" as const,
      icon: Clock,
      href: "/projects",
    },
    ...(canViewBudget ? [{
      title: "Orçamento Total",
      value: formatCompactNumber(stats.totalBudget),
      change: `${stats.executionRate}% executado`,
      changeType: "positive" as const,
      icon: DollarSign,
      href: "/budget",
    }] : []),
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-foreground">
              {getGreeting()}, {userName}! 👋
            </h1>
            <Badge variant="outline" className="border-info text-info">
              <Building2 className="h-3 w-3 mr-1" />
              Empresa Privada
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Visão geral de performance, recursos e entregas dos seus projectos.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {dynamicStats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column - Project Performance from real data */}
        <div className="xl:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Performance dos Projectos
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs text-primary" onClick={() => navigate("/projects")}>
                Ver todos
                <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {topProjects.length > 0 ? (
                topProjects.map((project) => (
                  <button
                    key={project.id}
                    className="w-full p-4 rounded-lg bg-muted/50 space-y-3 hover:bg-muted transition-colors text-left"
                    onClick={() => navigate(`/projects/${project.id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{project.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Orçamento: {formatCurrency(project.budget || 0)}
                        </p>
                      </div>
                      {getStatusBadge(project.status)}
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={project.progress} className="h-2 flex-1" />
                      <span className="text-sm font-medium w-12">{project.progress}%</span>
                    </div>
                  </button>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  Nenhum projecto activo encontrado.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Team overview */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Visão Geral da Equipa
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs text-primary" onClick={() => navigate("/team")}>
                Ver equipa
                <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Tarefas Activas</span>
                    <span className="text-sm text-muted-foreground">{stats.inProgressTasks} em progresso</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={stats.totalTasks > 0 ? (stats.completedTasks / stats.totalTasks) * 100 : 0}
                      className="h-2 flex-1"
                    />
                    <span className="text-sm font-medium w-12">
                      {stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}%
                    </span>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Execução Orçamental</span>
                    <span className="text-sm text-muted-foreground">{stats.executionRate}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={stats.executionRate}
                      className={`h-2 flex-1 ${stats.executionRate > 85 ? '[&>div]:bg-warning' : ''}`}
                    />
                    <span className="text-sm font-medium w-12">{stats.executionRate}%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Deadlines & Quick Stats */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Próximos Prazos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {realDeadlines.length > 0 ? (
                <div className="space-y-4">
                  {realDeadlines.map((deadline) => {
                    const project = projects.find(p => p.name === deadline.projectName);
                    return (
                      <button
                        key={deadline.id}
                        className="w-full flex items-start justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left"
                        onClick={() => {
                          if (project) navigate(`/projects/${project.id}`);
                        }}
                      >
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{deadline.title}</p>
                          <p className="text-xs text-muted-foreground">{deadline.projectName}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {new Date(deadline.dueDate).toLocaleDateString('pt-AO')}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  Nenhum prazo próximo.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Quick Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Métricas Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <button
                  className="w-full flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  onClick={() => navigate("/projects")}
                >
                  <span className="text-sm">Projectos Activos</span>
                  <span className="font-medium text-success">{stats.activeProjects}</span>
                </button>
                <button
                  className="w-full flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  onClick={() => navigate("/projects")}
                >
                  <span className="text-sm">Em Atraso</span>
                  <span className="font-medium text-warning">{stats.delayedProjects}</span>
                </button>
                <button
                  className="w-full flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  onClick={() => navigate("/budget")}
                >
                  <span className="text-sm">Tarefas em Atraso</span>
                  <span className="font-medium text-destructive">{stats.overdueTasks}</span>
                </button>
                <button
                  className="w-full flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  onClick={() => navigate("/portfolio")}
                >
                  <span className="text-sm">Portfólio</span>
                  <span className="font-medium">Ver →</span>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
