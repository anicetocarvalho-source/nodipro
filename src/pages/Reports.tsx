import { useState, useEffect } from "react";
import { FileText, Download, Calendar, Clock, User, Activity, Eye, BarChart3, TrendingUp, Users, FolderKanban, CheckCircle2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, eachMonthOfInterval, subMonths } from "date-fns";
import { pt } from "date-fns/locale";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const reportTemplates = [
  { id: "1", name: "Relatório de Status do Projecto", type: "project", format: "PDF" },
  { id: "2", name: "Relatório de Portfólio Executivo", type: "portfolio", format: "PDF" },
  { id: "3", name: "Relatório de Desempenho da Equipa", type: "team", format: "Excel" },
  { id: "4", name: "Relatório Financeiro Mensal", type: "financial", format: "PDF" },
  { id: "5", name: "Relatório de Riscos Activos", type: "risk", format: "PDF" },
  { id: "6", name: "Relatório de KPIs", type: "kpi", format: "Excel" },
];

const recentReports = [
  {
    id: "1",
    name: "Status Projecto - Sistema Financeiro",
    type: "project",
    generatedBy: "João Miguel",
    generatedAt: "10 Jan 2026, 14:30",
    format: "PDF",
    size: "2.4 MB",
  },
  {
    id: "2",
    name: "Portfólio Q4 2025",
    type: "portfolio",
    generatedBy: "Maria Silva",
    generatedAt: "09 Jan 2026, 11:15",
    format: "PDF",
    size: "5.8 MB",
  },
  {
    id: "3",
    name: "Desempenho Equipa Alpha - Dezembro",
    type: "team",
    generatedBy: "Pedro Alves",
    generatedAt: "08 Jan 2026, 09:00",
    format: "Excel",
    size: "1.2 MB",
  },
];

const auditLogs = [
  {
    id: "1",
    action: "Documento carregado",
    details: "Proposta Comercial v2.pdf",
    user: "João Miguel",
    timestamp: "10 Jan 2026, 15:45",
    module: "Documentos",
  },
  {
    id: "2",
    action: "Tarefa concluída",
    details: "Análise de requisitos - Sprint 4",
    user: "Maria Silva",
    timestamp: "10 Jan 2026, 14:30",
    module: "Projectos",
  },
  {
    id: "3",
    action: "Risco registado",
    details: "Atraso na entrega de requisitos",
    user: "Carlos Ferreira",
    timestamp: "10 Jan 2026, 11:20",
    module: "Riscos",
  },
  {
    id: "4",
    action: "Relatório gerado",
    details: "Status Projecto - Sistema Financeiro",
    user: "João Miguel",
    timestamp: "10 Jan 2026, 10:00",
    module: "Relatórios",
  },
  {
    id: "5",
    action: "Membro adicionado",
    details: "Ana Costa → Equipa Portal Gov",
    user: "Pedro Alves",
    timestamp: "09 Jan 2026, 16:45",
    module: "Equipa",
  },
  {
    id: "6",
    action: "Orçamento actualizado",
    details: "ERP Corporativo +15%",
    user: "Sofia Lima",
    timestamp: "09 Jan 2026, 15:30",
    module: "Orçamento",
  },
  {
    id: "7",
    action: "Projecto criado",
    details: "Sistema de Recursos Humanos - TAAG",
    user: "João Miguel",
    timestamp: "09 Jan 2026, 09:00",
    module: "Projectos",
  },
];

const typeConfig = {
  project: { label: "Projecto", className: "bg-primary/10 text-primary" },
  portfolio: { label: "Portfólio", className: "bg-success/10 text-success" },
  team: { label: "Equipa", className: "bg-info/10 text-info" },
  financial: { label: "Financeiro", className: "bg-warning/10 text-warning" },
  risk: { label: "Riscos", className: "bg-destructive/10 text-destructive" },
  kpi: { label: "KPIs", className: "bg-chart-5/10 text-chart-5" },
};

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

const chartConfig = {
  tasks: { label: "Tarefas", color: "hsl(var(--chart-1))" },
  projects: { label: "Projectos", color: "hsl(var(--chart-2))" },
  completed: { label: "Concluídas", color: "hsl(var(--success))" },
  pending: { label: "Pendentes", color: "hsl(var(--warning))" },
  active: { label: "Activos", color: "hsl(var(--chart-1))" },
  delayed: { label: "Atrasados", color: "hsl(var(--destructive))" },
};

interface AnalyticsData {
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  totalTeamMembers: number;
  projectsByStatus: { name: string; value: number; color: string }[];
  tasksByPriority: { name: string; value: number; color: string }[];
  tasksOverTime: { date: string; created: number; completed: number }[];
  projectsOverTime: { month: string; created: number; active: number }[];
  recentActivity: { date: string; tasks: number; projects: number }[];
}

export default function Reports() {
  const [selectedProject, setSelectedProject] = useState("");
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      // Fetch all data in parallel
      const [projectsRes, tasksRes, teamMembersRes] = await Promise.all([
        supabase.from('projects').select('*'),
        supabase.from('tasks').select('*'),
        supabase.from('team_members').select('*'),
      ]);

      const projects = projectsRes.data || [];
      const tasks = tasksRes.data || [];
      const teamMembers = teamMembersRes.data || [];

      // Calculate stats
      const totalProjects = projects.length;
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(t => t.column_id === 'done').length;
      const totalTeamMembers = teamMembers.length;

      // Projects by status
      const statusCounts = projects.reduce((acc, p) => {
        acc[p.status] = (acc[p.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const statusLabels: Record<string, string> = {
        active: 'Activos',
        delayed: 'Atrasados',
        completed: 'Concluídos',
        on_hold: 'Em Pausa',
      };

      const projectsByStatus = Object.entries(statusCounts).map(([status, count], index) => ({
        name: statusLabels[status] || status,
        value: count as number,
        color: COLORS[index % COLORS.length],
      }));

      // Tasks by priority
      const priorityCounts = tasks.reduce((acc, t) => {
        acc[t.priority] = (acc[t.priority] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const priorityLabels: Record<string, string> = {
        high: 'Alta',
        medium: 'Média',
        low: 'Baixa',
      };

      const tasksByPriority = Object.entries(priorityCounts).map(([priority, count], index) => ({
        name: priorityLabels[priority] || priority,
        value: count as number,
        color: priority === 'high' ? 'hsl(var(--destructive))' : priority === 'medium' ? 'hsl(var(--warning))' : 'hsl(var(--success))',
      }));

      // Tasks over time (last 30 days)
      const last30Days = eachDayOfInterval({
        start: subDays(new Date(), 29),
        end: new Date(),
      });

      const tasksOverTime = last30Days.map(day => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const created = tasks.filter(t => format(new Date(t.created_at), 'yyyy-MM-dd') === dayStr).length;
        const completed = tasks.filter(t => t.column_id === 'done' && format(new Date(t.updated_at), 'yyyy-MM-dd') === dayStr).length;
        return {
          date: format(day, 'dd/MM', { locale: pt }),
          created,
          completed,
        };
      });

      // Projects over time (last 6 months)
      const last6Months = eachMonthOfInterval({
        start: subMonths(new Date(), 5),
        end: new Date(),
      });

      const projectsOverTime = last6Months.map(month => {
        const monthStart = startOfMonth(month);
        const monthEnd = endOfMonth(month);
        const created = projects.filter(p => {
          const createdDate = new Date(p.created_at);
          return createdDate >= monthStart && createdDate <= monthEnd;
        }).length;
        const active = projects.filter(p => {
          const createdDate = new Date(p.created_at);
          return createdDate <= monthEnd && p.status === 'active';
        }).length;
        return {
          month: format(month, 'MMM', { locale: pt }),
          created,
          active,
        };
      });

      // Recent activity (last 7 days)
      const last7Days = eachDayOfInterval({
        start: subDays(new Date(), 6),
        end: new Date(),
      });

      const recentActivity = last7Days.map(day => {
        const dayStr = format(day, 'yyyy-MM-dd');
        const taskCount = tasks.filter(t => format(new Date(t.created_at), 'yyyy-MM-dd') === dayStr || format(new Date(t.updated_at), 'yyyy-MM-dd') === dayStr).length;
        const projectCount = projects.filter(p => format(new Date(p.created_at), 'yyyy-MM-dd') === dayStr || format(new Date(p.updated_at), 'yyyy-MM-dd') === dayStr).length;
        return {
          date: format(day, 'EEE', { locale: pt }),
          tasks: taskCount,
          projects: projectCount,
        };
      });

      setAnalytics({
        totalProjects,
        totalTasks,
        completedTasks,
        totalTeamMembers,
        projectsByStatus,
        tasksByPriority,
        tasksOverTime,
        projectsOverTime,
        recentActivity,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Relatórios e Auditoria</h1>
          <p className="text-muted-foreground">
            Gerar relatórios e consultar logs de actividade.
          </p>
        </div>
      </div>

      <Tabs defaultValue="analytics">
        <TabsList>
          <TabsTrigger value="analytics">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="generate">Gerar Relatório</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
          <TabsTrigger value="audit">Logs de Auditoria</TabsTrigger>
        </TabsList>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="mt-6 space-y-6">
          {loadingAnalytics ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : analytics ? (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Total de Projectos</p>
                        <p className="text-2xl font-bold text-foreground">{analytics.totalProjects}</p>
                        <p className="text-xs text-muted-foreground">Todos os projectos no sistema</p>
                      </div>
                      <div className="p-3 rounded-lg bg-primary/10">
                        <FolderKanban className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Total de Tarefas</p>
                        <p className="text-2xl font-bold text-foreground">{analytics.totalTasks}</p>
                        <p className="text-xs text-success">{analytics.completedTasks} concluídas ({analytics.totalTasks > 0 ? Math.round((analytics.completedTasks / analytics.totalTasks) * 100) : 0}%)</p>
                      </div>
                      <div className="p-3 rounded-lg bg-chart-1/10">
                        <CheckCircle2 className="h-5 w-5 text-chart-1" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Membros da Equipa</p>
                        <p className="text-2xl font-bold text-foreground">{analytics.totalTeamMembers}</p>
                        <p className="text-xs text-muted-foreground">Alocados a projectos</p>
                      </div>
                      <div className="p-3 rounded-lg bg-chart-2/10">
                        <Users className="h-5 w-5 text-chart-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Taxa de Conclusão</p>
                        <p className="text-2xl font-bold text-foreground">
                          {analytics.totalTasks > 0 ? Math.round((analytics.completedTasks / analytics.totalTasks) * 100) : 0}%
                        </p>
                        <p className="text-xs text-muted-foreground">Tarefas concluídas</p>
                      </div>
                      <div className="p-3 rounded-lg bg-success/10">
                        <TrendingUp className="h-5 w-5 text-success" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Row 1 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Tasks Over Time */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-semibold">Tarefas ao Longo do Tempo</CardTitle>
                    <p className="text-sm text-muted-foreground">Últimos 30 dias</p>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className="h-[250px] w-full">
                      <AreaChart data={analytics.tasksOverTime} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} className="text-xs fill-muted-foreground" interval="preserveStartEnd" />
                        <YAxis axisLine={false} tickLine={false} className="text-xs fill-muted-foreground" />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Area type="monotone" dataKey="created" name="Criadas" stroke="hsl(var(--chart-1))" fillOpacity={1} fill="url(#colorCreated)" strokeWidth={2} />
                        <Area type="monotone" dataKey="completed" name="Concluídas" stroke="hsl(var(--success))" fillOpacity={1} fill="url(#colorCompleted)" strokeWidth={2} />
                      </AreaChart>
                    </ChartContainer>
                  </CardContent>
                </Card>

                {/* Projects Over Time */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-semibold">Evolução de Projectos</CardTitle>
                    <p className="text-sm text-muted-foreground">Últimos 6 meses</p>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className="h-[250px] w-full">
                      <BarChart data={analytics.projectsOverTime} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} className="text-xs fill-muted-foreground" />
                        <YAxis axisLine={false} tickLine={false} className="text-xs fill-muted-foreground" />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="created" name="Criados" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="active" name="Activos" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Row 2 */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Projects by Status */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-semibold">Projectos por Estado</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className="h-[200px] w-full">
                      <PieChart>
                        <Pie
                          data={analytics.projectsByStatus}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {analytics.projectsByStatus.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </PieChart>
                    </ChartContainer>
                    <div className="flex flex-wrap justify-center gap-4 mt-4">
                      {analytics.projectsByStatus.map((entry, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                          <span className="text-sm text-muted-foreground">{entry.name}: {entry.value}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Tasks by Priority */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-semibold">Tarefas por Prioridade</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className="h-[200px] w-full">
                      <PieChart>
                        <Pie
                          data={analytics.tasksByPriority}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {analytics.tasksByPriority.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </PieChart>
                    </ChartContainer>
                    <div className="flex flex-wrap justify-center gap-4 mt-4">
                      {analytics.tasksByPriority.map((entry, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                          <span className="text-sm text-muted-foreground">{entry.name}: {entry.value}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Weekly Activity */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-semibold">Actividade Semanal</CardTitle>
                    <p className="text-sm text-muted-foreground">Últimos 7 dias</p>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className="h-[200px] w-full">
                      <LineChart data={analytics.recentActivity} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} className="text-xs fill-muted-foreground" />
                        <YAxis axisLine={false} tickLine={false} className="text-xs fill-muted-foreground" />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line type="monotone" dataKey="tasks" name="Tarefas" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={{ fill: 'hsl(var(--chart-1))' }} />
                        <Line type="monotone" dataKey="projects" name="Projectos" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={{ fill: 'hsl(var(--chart-2))' }} />
                      </LineChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Não foi possível carregar os dados de analytics.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="generate" className="mt-6 space-y-6">
          {/* Report Generator */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Gerar Novo Relatório</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tipo de Relatório</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="project">Status do Projecto</SelectItem>
                      <SelectItem value="portfolio">Portfólio Executivo</SelectItem>
                      <SelectItem value="team">Desempenho da Equipa</SelectItem>
                      <SelectItem value="financial">Financeiro</SelectItem>
                      <SelectItem value="risk">Riscos</SelectItem>
                      <SelectItem value="kpi">KPIs</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Projecto</label>
                  <Select value={selectedProject} onValueChange={setSelectedProject}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os projectos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os projectos</SelectItem>
                      <SelectItem value="1">Sistema de Gestão Financeira</SelectItem>
                      <SelectItem value="2">Portal de Serviços Públicos</SelectItem>
                      <SelectItem value="3">App Mobile Bancário</SelectItem>
                      <SelectItem value="4">ERP Corporativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Formato</label>
                  <Select defaultValue="pdf">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="excel">Excel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button className="bg-primary hover:bg-primary/90">
                <FileText className="h-4 w-4 mr-2" />
                Gerar Relatório
              </Button>
            </CardContent>
          </Card>

          {/* Report Templates */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Templates Disponíveis</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reportTemplates.map((template) => (
                <Card key={template.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-primary/10">
                        <FileText className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{template.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={cn("text-xs", typeConfig[template.type as keyof typeof typeConfig].className)}>
                            {typeConfig[template.type as keyof typeof typeConfig].label}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{template.format}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Relatórios Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentReports.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{report.name}</p>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5" />
                            {report.generatedBy}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {report.generatedAt}
                          </span>
                          <span>{report.size}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{report.format}</Badge>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="mt-6 space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Input placeholder="Pesquisar nos logs..." />
                </div>
                <Select defaultValue="all">
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Módulo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os módulos</SelectItem>
                    <SelectItem value="projects">Projectos</SelectItem>
                    <SelectItem value="documents">Documentos</SelectItem>
                    <SelectItem value="team">Equipa</SelectItem>
                    <SelectItem value="budget">Orçamento</SelectItem>
                    <SelectItem value="risks">Riscos</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  Data
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Audit Logs */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Logs de Actividade</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-4 p-3 rounded-lg hover:bg-accent/30 transition-colors"
                  >
                    <div className="p-2 rounded-lg bg-muted">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{log.action}</span>
                        <Badge variant="secondary" className="text-xs">
                          {log.module}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">{log.details}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {log.user}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {log.timestamp}
                        </span>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
