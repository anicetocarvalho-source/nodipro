import { TrendingUp, TrendingDown, Target, DollarSign, AlertTriangle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { StatCard } from "@/components/dashboard/StatCard";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";

const portfolioStats = [
  { title: "Total de Projectos", value: 24, change: "+3 este trimestre", changeType: "positive" as const, icon: Target },
  { title: "Orçamento Total", value: "650M AOA", change: "82% executado", changeType: "neutral" as const, icon: DollarSign },
  { title: "Taxa de Sucesso", value: "87%", change: "+5% vs anterior", changeType: "positive" as const, icon: TrendingUp },
  { title: "Projectos em Risco", value: 3, change: "-2 este mês", changeType: "positive" as const, icon: AlertTriangle },
];

const statusData = [
  { name: "Concluídos", value: 8, color: "hsl(var(--chart-2))" },
  { name: "Em Progresso", value: 12, color: "hsl(var(--chart-1))" },
  { name: "Em Risco", value: 3, color: "hsl(var(--chart-4))" },
  { name: "Planeados", value: 5, color: "hsl(var(--chart-3))" },
];

const sectorData = [
  { sector: "Governo", projectos: 8, orcamento: 280 },
  { sector: "Banca", projectos: 5, orcamento: 150 },
  { sector: "Energia", projectos: 4, orcamento: 120 },
  { sector: "Telecoms", projectos: 4, orcamento: 60 },
  { sector: "Retalho", projectos: 3, orcamento: 40 },
];

const programs = [
  {
    id: "1",
    name: "Transformação Digital Governamental",
    sector: "Governo",
    projects: 5,
    budget: "180.000.000 AOA",
    progress: 62,
    status: "on_track",
    startDate: "Jan 2025",
    endDate: "Dez 2026",
  },
  {
    id: "2",
    name: "Modernização Bancária",
    sector: "Banca",
    projects: 3,
    budget: "95.000.000 AOA",
    progress: 78,
    status: "on_track",
    startDate: "Mar 2025",
    endDate: "Set 2026",
  },
  {
    id: "3",
    name: "Infraestrutura Digital Sonangol",
    sector: "Energia",
    projects: 4,
    budget: "250.000.000 AOA",
    progress: 35,
    status: "at_risk",
    startDate: "Jun 2025",
    endDate: "Jun 2027",
  },
];

const chartConfig = {
  projectos: { label: "Projectos", color: "hsl(var(--chart-1))" },
  orcamento: { label: "Orçamento (M)", color: "hsl(var(--chart-2))" },
};

export default function Portfolio() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Portfólio de Projectos</h1>
        <p className="text-muted-foreground">
          Visão agregada de todos os programas e projectos da organização.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {portfolioStats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribuição por Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <ChartContainer config={{}} className="h-[250px] w-full max-w-[300px]">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {statusData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-muted-foreground">
                    {item.name} ({item.value})
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sector Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Projectos por Sector</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[280px] w-full">
              <BarChart data={sectorData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="sector" className="text-xs fill-muted-foreground" angle={-45} textAnchor="end" height={60} />
                <YAxis className="text-xs fill-muted-foreground" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="projectos" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Programs */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Programas Activos</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {programs.map((program) => (
            <Card key={program.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{program.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{program.sector}</p>
                  </div>
                  <Badge
                    className={
                      program.status === "on_track"
                        ? "bg-success/10 text-success"
                        : "bg-warning/10 text-warning"
                    }
                  >
                    {program.status === "on_track" ? "No Prazo" : "Em Risco"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Projectos</p>
                    <p className="font-semibold">{program.projects}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Orçamento</p>
                    <p className="font-semibold">{program.budget}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progresso</span>
                    <span className="font-medium">{program.progress}%</span>
                  </div>
                  <Progress value={program.progress} className="h-2" />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t">
                  <span>Início: {program.startDate}</span>
                  <span>Fim: {program.endDate}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
