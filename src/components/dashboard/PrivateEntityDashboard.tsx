import {
  FolderKanban,
  TrendingUp,
  Clock,
  DollarSign,
  Users,
  Zap,
  Building2,
  BarChart3,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface PrivateEntityDashboardProps {
  userName: string;
}

const stats = [
  {
    title: "Projectos Activos",
    value: 12,
    change: "+2 este mês",
    changeType: "positive" as const,
    icon: FolderKanban,
  },
  {
    title: "ROI Médio",
    value: "24%",
    change: "+8% vs ano anterior",
    changeType: "positive" as const,
    icon: TrendingUp,
  },
  {
    title: "Tempo Médio Entrega",
    value: "45 dias",
    change: "-5 dias vs meta",
    changeType: "positive" as const,
    icon: Clock,
  },
  {
    title: "Receita Projectos",
    value: "85M",
    change: "+12% YTD",
    changeType: "positive" as const,
    icon: DollarSign,
  },
];

const projectPerformance = [
  { name: "Sistema ERP Cliente A", progress: 78, status: "on_track", revenue: 15000000 },
  { name: "App Mobile Fintech", progress: 45, status: "at_risk", revenue: 8500000 },
  { name: "Plataforma E-commerce", progress: 92, status: "on_track", revenue: 12000000 },
  { name: "Integração API Bancária", progress: 60, status: "on_track", revenue: 5000000 },
];

const resourceUtilization = [
  { name: "Desenvolvedores", utilization: 85, count: 24 },
  { name: "Designers", utilization: 72, count: 8 },
  { name: "Gestores de Projecto", utilization: 90, count: 6 },
  { name: "QA/Testers", utilization: 68, count: 10 },
];

const upcomingDeadlines = [
  { project: "Sistema ERP", milestone: "Fase 2 - Módulo Financeiro", date: "02 Fev 2026", priority: "high" },
  { project: "App Mobile", milestone: "Beta Release", date: "15 Fev 2026", priority: "high" },
  { project: "E-commerce", milestone: "Go-Live", date: "28 Fev 2026", priority: "medium" },
  { project: "API Bancária", milestone: "Testes de Integração", date: "10 Mar 2026", priority: "low" },
];

export function PrivateEntityDashboard({ userName }: PrivateEntityDashboardProps) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "on_track":
        return <Badge variant="default" className="bg-success">No Prazo</Badge>;
      case "at_risk":
        return <Badge variant="default" className="bg-warning">Em Risco</Badge>;
      case "delayed":
        return <Badge variant="default" className="bg-destructive">Atrasado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-destructive";
      case "medium":
        return "text-warning";
      default:
        return "text-muted-foreground";
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
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column - Project Performance */}
        <div className="xl:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Performance dos Projectos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {projectPerformance.map((project) => (
                <div key={project.name} className="p-4 rounded-lg bg-muted/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{project.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Receita: {formatCurrency(project.revenue)}
                      </p>
                    </div>
                    {getStatusBadge(project.status)}
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={project.progress} className="h-2 flex-1" />
                    <span className="text-sm font-medium w-12">{project.progress}%</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Resource Utilization */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Utilização de Recursos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {resourceUtilization.map((resource) => (
                  <div key={resource.name} className="p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{resource.name}</span>
                      <span className="text-sm text-muted-foreground">{resource.count} pessoas</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={resource.utilization} 
                        className={`h-2 flex-1 ${resource.utilization > 85 ? '[&>div]:bg-warning' : ''}`}
                      />
                      <span className="text-sm font-medium w-12">{resource.utilization}%</span>
                    </div>
                  </div>
                ))}
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
              <div className="space-y-4">
                {upcomingDeadlines.map((deadline, index) => (
                  <div
                    key={index}
                    className="flex items-start justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{deadline.milestone}</p>
                      <p className="text-xs text-muted-foreground">{deadline.project}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${getPriorityColor(deadline.priority)}`}>
                        {deadline.date}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
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
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm">Velocidade da Equipa</span>
                  <span className="font-medium text-success">+15%</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm">Satisfação do Cliente</span>
                  <span className="font-medium">4.7/5.0</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm">Bugs Críticos</span>
                  <span className="font-medium text-warning">3</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm">Sprints Concluídos</span>
                  <span className="font-medium">24/26</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
