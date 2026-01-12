import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Users,
  DollarSign,
  AlertTriangle,
  FileText,
  MessageSquare,
  Settings,
  LayoutGrid,
  GanttChartSquare,
  List,
  Clock,
  CheckCircle,
  MoreHorizontal,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { GanttChart } from "@/components/gantt/GanttChart";
import { cn } from "@/lib/utils";

const projectData = {
  id: "1",
  name: "Sistema de Gestão Financeira",
  client: "Ministério das Finanças",
  status: "active",
  phase: "Desenvolvimento",
  progress: 75,
  startDate: "01 Jan 2026",
  deadline: "15 Mar 2026",
  budget: "45.000.000 AOA",
  spent: "32.500.000 AOA",
  budgetPercentage: 72,
  risk: "low",
  description: "Desenvolvimento e implementação de um sistema integrado de gestão financeira para automatizar processos de orçamentação, execução e controlo financeiro.",
  team: [
    { name: "João Miguel", initials: "JM", role: "Gestor de Projecto" },
    { name: "Maria Silva", initials: "MS", role: "Analista de Negócios" },
    { name: "Pedro Alves", initials: "PA", role: "Developer Sénior" },
    { name: "Ana Costa", initials: "AC", role: "UX Designer" },
    { name: "Carlos Ferreira", initials: "CF", role: "Arquitecto" },
    { name: "Sofia Lima", initials: "SL", role: "QA Lead" },
  ],
  stats: {
    totalTasks: 48,
    completedTasks: 36,
    inProgress: 8,
    pending: 4,
  },
};

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<"kanban" | "gantt" | "list">("kanban");

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
              <h1 className="text-2xl font-bold text-foreground">{projectData.name}</h1>
              <Badge className="bg-success/10 text-success">Activo</Badge>
            </div>
            <p className="text-muted-foreground mt-1">{projectData.client}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-12 lg:ml-0">
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Relatório
          </Button>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Configurações
          </Button>
          <Button className="bg-primary hover:bg-primary/90">
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
                <p className="text-sm font-semibold">{projectData.deadline}</p>
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
                <p className="text-sm font-semibold">{projectData.progress}%</p>
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
                <p className="text-sm font-semibold">{projectData.team.length} membros</p>
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
                <p className="text-sm font-semibold">{projectData.budgetPercentage}% usado</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <AlertTriangle className="h-4 w-4 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Risco</p>
                <p className="text-sm font-semibold text-success">Baixo</p>
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
            <Tabs value={activeView} onValueChange={(v) => setActiveView(v as any)}>
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
              {activeView === "kanban" && <KanbanBoard projectId={id || ""} />}
              {activeView === "gantt" && <GanttChart />}
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
                    {projectData.stats.completedTasks}/{projectData.stats.totalTasks}
                  </span>
                </div>
                <Progress value={(projectData.stats.completedTasks / projectData.stats.totalTasks) * 100} className="h-2" />
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 bg-success/10 rounded-lg">
                  <p className="text-lg font-bold text-success">{projectData.stats.completedTasks}</p>
                  <p className="text-xs text-muted-foreground">Concluídas</p>
                </div>
                <div className="p-2 bg-warning/10 rounded-lg">
                  <p className="text-lg font-bold text-warning">{projectData.stats.inProgress}</p>
                  <p className="text-xs text-muted-foreground">Em curso</p>
                </div>
                <div className="p-2 bg-muted rounded-lg">
                  <p className="text-lg font-bold">{projectData.stats.pending}</p>
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
              {projectData.team.slice(0, 5).map((member) => (
                <div key={member.initials} className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {member.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{member.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{member.role}</p>
                  </div>
                </div>
              ))}
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
                  <span className="font-medium">{projectData.budget}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Executado</span>
                  <span className="font-medium">{projectData.spent}</span>
                </div>
              </div>
              <Progress value={projectData.budgetPercentage} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">
                {projectData.budgetPercentage}% do orçamento utilizado
              </p>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Actividade Recente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { user: "JM", action: "completou", target: "Setup ambiente", time: "5 min" },
                { user: "PA", action: "comentou em", target: "API Auth", time: "15 min" },
                { user: "MS", action: "criou tarefa", target: "Análise v2", time: "1h" },
              ].map((activity, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <Avatar className="h-6 w-6 mt-0.5">
                    <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                      {activity.user}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs">
                      <span className="font-medium">{activity.user}</span>{" "}
                      <span className="text-muted-foreground">{activity.action}</span>{" "}
                      <span className="text-primary">{activity.target}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
