import { TrendingUp, TrendingDown, Target, Clock, CheckCircle, AlertTriangle, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, AreaChart, Area, BarChart, Bar } from "recharts";
import { cn } from "@/lib/utils";

const kpiCards = [
  {
    title: "Taxa de Entrega no Prazo",
    value: "78%",
    target: "85%",
    progress: 92,
    trend: "up",
    change: "+5%",
    status: "warning",
  },
  {
    title: "Satisfação do Cliente",
    value: "4.2",
    target: "4.5",
    progress: 93,
    trend: "up",
    change: "+0.3",
    status: "good",
  },
  {
    title: "Desvio Orçamental Médio",
    value: "8%",
    target: "5%",
    progress: 62,
    trend: "down",
    change: "-2%",
    status: "warning",
  },
  {
    title: "Produtividade da Equipa",
    value: "92%",
    target: "90%",
    progress: 102,
    trend: "up",
    change: "+7%",
    status: "excellent",
  },
];

const monthlyData = [
  { month: "Jul", entrega: 72, satisfacao: 3.8, produtividade: 85 },
  { month: "Ago", entrega: 75, satisfacao: 3.9, produtividade: 87 },
  { month: "Set", entrega: 71, satisfacao: 4.0, produtividade: 88 },
  { month: "Out", entrega: 76, satisfacao: 4.1, produtividade: 90 },
  { month: "Nov", entrega: 74, satisfacao: 4.0, produtividade: 89 },
  { month: "Dez", entrega: 78, satisfacao: 4.2, produtividade: 92 },
];

const teamPerformance = [
  { team: "Equipa Alpha", tarefas: 156, concluidas: 142, eficiencia: 91 },
  { team: "Equipa Beta", tarefas: 134, concluidas: 128, eficiencia: 96 },
  { team: "Equipa Gamma", tarefas: 98, concluidas: 85, eficiencia: 87 },
  { team: "Equipa Delta", tarefas: 112, concluidas: 101, eficiencia: 90 },
];

const chartConfig = {
  entrega: { label: "Entrega (%)", color: "hsl(var(--chart-1))" },
  satisfacao: { label: "Satisfação", color: "hsl(var(--chart-2))" },
  produtividade: { label: "Produtividade (%)", color: "hsl(var(--chart-3))" },
};

export default function KPI() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Centro de Indicadores</h1>
          <p className="text-muted-foreground">
            Acompanhe os KPIs e métricas de desempenho da organização.
          </p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exportar Relatório
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi) => (
          <Card key={kpi.title}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <p className="text-sm font-medium text-muted-foreground">{kpi.title}</p>
                <Badge
                  className={cn(
                    "text-xs",
                    kpi.status === "excellent" && "bg-success/10 text-success",
                    kpi.status === "good" && "bg-primary/10 text-primary",
                    kpi.status === "warning" && "bg-warning/10 text-warning",
                    kpi.status === "critical" && "bg-destructive/10 text-destructive"
                  )}
                >
                  {kpi.status === "excellent" ? "Excelente" : kpi.status === "good" ? "Bom" : "Atenção"}
                </Badge>
              </div>
              <div className="flex items-end gap-2 mb-3">
                <span className="text-3xl font-bold">{kpi.value}</span>
                <span className="text-sm text-muted-foreground mb-1">/ {kpi.target}</span>
                <div className={cn(
                  "flex items-center text-xs ml-auto",
                  kpi.trend === "up" ? "text-success" : "text-destructive"
                )}>
                  {kpi.trend === "up" ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {kpi.change}
                </div>
              </div>
              <Progress value={Math.min(kpi.progress, 100)} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {kpi.progress}% da meta
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Evolução Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <LineChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs fill-muted-foreground" />
                <YAxis className="text-xs fill-muted-foreground" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="entrega"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="produtividade"
                  stroke="hsl(var(--chart-3))"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Team Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Desempenho por Equipa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {teamPerformance.map((team) => (
                <div key={team.team} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{team.team}</span>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">
                        {team.concluidas}/{team.tarefas} tarefas
                      </span>
                      <Badge
                        className={cn(
                          team.eficiencia >= 95
                            ? "bg-success/10 text-success"
                            : team.eficiencia >= 90
                            ? "bg-primary/10 text-primary"
                            : "bg-warning/10 text-warning"
                        )}
                      >
                        {team.eficiencia}%
                      </Badge>
                    </div>
                  </div>
                  <Progress value={team.eficiencia} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Alertas de KPI</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { type: "warning", message: "Taxa de entrega no prazo abaixo da meta (78% vs 85%)", project: "Portal Gov" },
              { type: "warning", message: "Desvio orçamental de 12% no projecto ERP Sonangol", project: "ERP Sonangol" },
              { type: "success", message: "Equipa Beta atingiu 96% de eficiência este mês", project: "Geral" },
              { type: "info", message: "Novo recorde de satisfação do cliente: 4.2/5.0", project: "Geral" },
            ].map((alert, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg",
                  alert.type === "warning" && "bg-warning/10",
                  alert.type === "success" && "bg-success/10",
                  alert.type === "info" && "bg-info/10"
                )}
              >
                {alert.type === "warning" && <AlertTriangle className="h-4 w-4 text-warning" />}
                {alert.type === "success" && <CheckCircle className="h-4 w-4 text-success" />}
                {alert.type === "info" && <Target className="h-4 w-4 text-info" />}
                <div className="flex-1">
                  <p className="text-sm">{alert.message}</p>
                  <p className="text-xs text-muted-foreground">{alert.project}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
