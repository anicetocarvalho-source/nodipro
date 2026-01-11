import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, CartesianGrid } from "recharts";

const data = [
  { month: "Jan", tarefas: 45, projectos: 12 },
  { month: "Fev", tarefas: 52, projectos: 15 },
  { month: "Mar", tarefas: 48, projectos: 18 },
  { month: "Abr", tarefas: 70, projectos: 22 },
  { month: "Mai", tarefas: 65, projectos: 20 },
  { month: "Jun", tarefas: 85, projectos: 25 },
];

const chartConfig = {
  tarefas: {
    label: "Tarefas Concluídas",
    color: "hsl(var(--chart-1))",
  },
  projectos: {
    label: "Projectos Activos",
    color: "hsl(var(--chart-2))",
  },
};

export function ProgressChart() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Desempenho Mensal</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorTarefas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorProjectos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              className="text-xs fill-muted-foreground"
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              className="text-xs fill-muted-foreground"
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              type="monotone"
              dataKey="tarefas"
              stroke="hsl(var(--chart-1))"
              fillOpacity={1}
              fill="url(#colorTarefas)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="projectos"
              stroke="hsl(var(--chart-2))"
              fillOpacity={1}
              fill="url(#colorProjectos)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
