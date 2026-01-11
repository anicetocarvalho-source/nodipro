import { DollarSign, TrendingUp, TrendingDown, AlertCircle, Download, PieChart as PieChartIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { cn } from "@/lib/utils";

const budgetStats = [
  { title: "Orçamento Total", value: "650.000.000 AOA", change: "+15% YoY", changeType: "positive" },
  { title: "Executado", value: "485.250.000 AOA", change: "74.6%", changeType: "neutral" },
  { title: "Disponível", value: "164.750.000 AOA", change: "25.4%", changeType: "neutral" },
  { title: "Desvio", value: "+8.2%", change: "Acima do planeado", changeType: "negative" },
];

const projectBudgets = [
  {
    id: "1",
    name: "Sistema de Gestão Financeira",
    client: "Ministério das Finanças",
    planned: 45000000,
    spent: 32500000,
    percentage: 72,
    status: "on_track",
  },
  {
    id: "2",
    name: "Portal de Serviços Públicos",
    client: "Governo Provincial",
    planned: 120000000,
    spent: 48000000,
    percentage: 40,
    status: "on_track",
  },
  {
    id: "3",
    name: "App Mobile Bancário",
    client: "Banco Nacional",
    planned: 85000000,
    spent: 72250000,
    percentage: 85,
    status: "on_track",
  },
  {
    id: "4",
    name: "ERP Corporativo",
    client: "Sonangol EP",
    planned: 250000000,
    spent: 287500000,
    percentage: 115,
    status: "over_budget",
  },
  {
    id: "5",
    name: "Sistema de RH",
    client: "TAAG Airlines",
    planned: 35000000,
    spent: 5250000,
    percentage: 15,
    status: "on_track",
  },
];

const categoryData = [
  { name: "Recursos Humanos", value: 280, color: "hsl(var(--chart-1))" },
  { name: "Infraestrutura", value: 95, color: "hsl(var(--chart-2))" },
  { name: "Licenças", value: 45, color: "hsl(var(--chart-3))" },
  { name: "Consultoria", value: 35, color: "hsl(var(--chart-4))" },
  { name: "Outros", value: 30, color: "hsl(var(--chart-5))" },
];

const monthlyData = [
  { month: "Jul", planeado: 45, executado: 42 },
  { month: "Ago", planeado: 52, executado: 55 },
  { month: "Set", planeado: 48, executado: 51 },
  { month: "Out", planeado: 55, executado: 58 },
  { month: "Nov", planeado: 60, executado: 62 },
  { month: "Dez", planeado: 65, executado: 68 },
];

const chartConfig = {
  planeado: { label: "Planeado", color: "hsl(var(--chart-1))" },
  executado: { label: "Executado", color: "hsl(var(--chart-2))" },
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-AO", {
    style: "decimal",
    maximumFractionDigits: 0,
  }).format(value) + " AOA";
};

export default function Budget() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Controlo Orçamental</h1>
          <p className="text-muted-foreground">
            Acompanhe o planeado vs executado por projecto e fase.
          </p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exportar Relatório
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {budgetStats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-5">
              <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
              <p className="text-2xl font-bold mt-1">{stat.value}</p>
              <div
                className={cn(
                  "flex items-center gap-1 text-xs mt-2",
                  stat.changeType === "positive" && "text-success",
                  stat.changeType === "negative" && "text-destructive",
                  stat.changeType === "neutral" && "text-muted-foreground"
                )}
              >
                {stat.changeType === "positive" && <TrendingUp className="h-3 w-3" />}
                {stat.changeType === "negative" && <TrendingDown className="h-3 w-3" />}
                {stat.change}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Planeado vs Executado (M AOA)</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[280px] w-full">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs fill-muted-foreground" />
                <YAxis className="text-xs fill-muted-foreground" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="planeado" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="executado" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribuição por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <ChartContainer config={{}} className="h-[200px] w-full max-w-[250px]">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-3 mt-4">
              {categoryData.map((item) => (
                <div key={item.name} className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project Budgets */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Orçamento por Projecto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {projectBudgets.map((project) => (
              <div key={project.id} className="p-4 border rounded-lg hover:bg-accent/30 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold">{project.name}</h3>
                    <p className="text-sm text-muted-foreground">{project.client}</p>
                  </div>
                  <Badge
                    className={cn(
                      project.status === "on_track"
                        ? "bg-success/10 text-success"
                        : "bg-destructive/10 text-destructive"
                    )}
                  >
                    {project.status === "on_track" ? "No Orçamento" : "Acima do Orçamento"}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                  <div>
                    <p className="text-muted-foreground">Planeado</p>
                    <p className="font-medium">{formatCurrency(project.planned)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Executado</p>
                    <p className="font-medium">{formatCurrency(project.spent)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Disponível</p>
                    <p className={cn("font-medium", project.status === "over_budget" && "text-destructive")}>
                      {formatCurrency(Math.max(0, project.planned - project.spent))}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Progress
                    value={Math.min(project.percentage, 100)}
                    className={cn(
                      "h-2 flex-1",
                      project.status === "over_budget" && "[&>div]:bg-destructive"
                    )}
                  />
                  <span
                    className={cn(
                      "text-sm font-medium min-w-[45px]",
                      project.status === "over_budget" && "text-destructive"
                    )}
                  >
                    {project.percentage}%
                  </span>
                  {project.status === "over_budget" && (
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
