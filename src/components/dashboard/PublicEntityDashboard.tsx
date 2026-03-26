import { useNavigate } from "react-router-dom";
import {
  FolderKanban,
  CheckCircle,
  FileCheck,
  Landmark,
  Globe,
  Target,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardData } from "@/hooks/useDashboardData";
import { usePermissions } from "@/hooks/usePermissions";

interface PublicEntityDashboardProps {
  userName: string;
}

export function PublicEntityDashboard({ userName }: PublicEntityDashboardProps) {
  const navigate = useNavigate();
  const {
    stats,
    projects,
    sdgProgress,
    budgetByProvince,
    upcomingDeadlines,
    isLoading,
  } = useDashboardData();
  const { canViewBudget } = usePermissions();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
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

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge variant="destructive">Alta</Badge>;
      case "medium":
        return <Badge variant="default" className="bg-warning">Média</Badge>;
      default:
        return <Badge variant="secondary">Baixa</Badge>;
    }
  };

  // Find the first delayed/active project for drill-down
  const firstDelayedProject = projects.find(p => p.status === "delayed");

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
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Skeleton className="xl:col-span-2 h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  const dynamicStats = [
    {
      title: "Projectos Activos",
      value: stats.activeProjects,
      change: `${stats.completedProjects} concluídos`,
      changeType: "positive" as const,
      icon: FolderKanban,
      href: "/projects",
    },
    ...(canViewBudget ? [{
      title: "Taxa de Execução",
      value: `${stats.executionRate}%`,
      change: `${formatCompactNumber(stats.totalSpent)} de ${formatCompactNumber(stats.totalBudget)}`,
      changeType: stats.executionRate >= 50 ? "positive" as const : "neutral" as const,
      icon: CheckCircle,
      href: "/budget",
    }] : []),
    {
      title: "Tarefas Concluídas",
      value: `${stats.completedTasks}/${stats.totalTasks}`,
      change: `${stats.overdueTasks} em atraso`,
      changeType: stats.overdueTasks > 0 ? "negative" as const : "positive" as const,
      icon: FileCheck,
      href: firstDelayedProject ? `/projects/${firstDelayedProject.id}` : "/projects",
    },
    {
      title: "ODS Impactados",
      value: stats.sdgsImpacted,
      change: "De 17 objectivos",
      changeType: "positive" as const,
      icon: Globe,
      href: "/governance",
    },
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
            <Badge variant="outline" className="border-primary text-primary">
              <Landmark className="h-3 w-3 mr-1" />
              Entidade Pública
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Painel de controlo para gestão de projectos públicos e conformidade.
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
        {/* Left Column - SDG Progress & Budget */}
        <div className="xl:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Progresso dos Objectivos de Desenvolvimento Sustentável
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs text-primary" onClick={() => navigate("/governance")}>
                Ver todos
                <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {sdgProgress.length > 0 ? (
                sdgProgress.slice(0, 5).map((sdg) => {
                  const progressPercent = Math.min(sdg.projectCount * 20, 100);
                  return (
                    <div key={sdg.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                            style={{ backgroundColor: sdg.color || "#666" }}
                          >
                            {sdg.number}
                          </div>
                          <span className="text-sm font-medium">{sdg.name}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {sdg.projectCount} projecto{sdg.projectCount !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <Progress value={progressPercent} className="h-2" />
                    </div>
                  );
                })
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  Nenhum ODS associado aos projectos ainda.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Budget by Province */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Execução Orçamental por Província</CardTitle>
              <Button variant="ghost" size="sm" className="text-xs text-primary" onClick={() => navigate("/budget")}>
                Ver orçamento
                <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              {budgetByProvince.length > 0 ? (
                <div className="space-y-4">
                  {budgetByProvince.map((item) => {
                    const percentage = item.allocated > 0 
                      ? Math.round((item.executed / item.allocated) * 100) 
                      : 0;
                    return (
                      <div key={item.province} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{item.province}</span>
                          <span className="text-muted-foreground">
                            {formatCurrency(item.executed)} / {formatCurrency(item.allocated)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={percentage} className="h-2 flex-1" />
                          <span className="text-sm font-medium w-12">{percentage}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  Nenhum orçamento por província disponível.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Deadlines & Alerts */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-primary" />
                Próximos Prazos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingDeadlines.length > 0 ? (
                <div className="space-y-4">
                  {upcomingDeadlines.map((item) => {
                    // Find the project to link to
                    const project = projects.find(p => p.name === item.projectName);
                    return (
                      <button
                        key={item.id}
                        className="w-full flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left"
                        onClick={() => {
                          if (project) navigate(`/projects/${project.id}`);
                        }}
                      >
                        <div>
                          <p className="text-sm font-medium">{item.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.projectName} • {new Date(item.dueDate).toLocaleDateString('pt-AO')}
                          </p>
                        </div>
                        {getPriorityBadge(item.priority)}
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

          {/* Alerts */}
          {(stats.overdueTasks > 0 || stats.delayedProjects > 0) && (
            <Card className="border-warning/50 bg-warning/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-warning">
                  <AlertTriangle className="h-5 w-5" />
                  Alertas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.overdueTasks > 0 && (
                    <button
                      className="w-full p-3 rounded-lg bg-background hover:bg-muted/50 transition-colors text-left"
                      onClick={() => navigate("/projects")}
                    >
                      <p className="text-sm font-medium">Tarefas em Atraso</p>
                      <p className="text-xs text-muted-foreground">
                        {stats.overdueTasks} tarefa{stats.overdueTasks !== 1 ? "s" : ""} com prazo ultrapassado
                      </p>
                    </button>
                  )}
                  {stats.delayedProjects > 0 && (
                    <button
                      className="w-full p-3 rounded-lg bg-background hover:bg-muted/50 transition-colors text-left"
                      onClick={() => navigate("/projects")}
                    >
                      <p className="text-sm font-medium">Projectos Atrasados</p>
                      <p className="text-xs text-muted-foreground">
                        {stats.delayedProjects} projecto{stats.delayedProjects !== 1 ? "s" : ""} com status de atraso
                      </p>
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
