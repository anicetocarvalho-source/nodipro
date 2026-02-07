import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useBurndownData } from "@/hooks/useScrum";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingDown } from "lucide-react";

interface BurndownChartProps {
  projectId: string;
  sprintId: string;
}

export function BurndownChart({ projectId, sprintId }: BurndownChartProps) {
  const { data: burndown, isLoading } = useBurndownData(projectId, sprintId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!burndown || burndown.data.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingDown className="h-4 w-4" />
            Burndown Chart
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-6">
            Sem dados suficientes para gerar o gráfico burndown.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Find current day index
  const today = new Date().toISOString().split("T")[0];
  const currentDayIndex = burndown.data.findIndex(d => d.date >= today);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingDown className="h-4 w-4" />
            Burndown Chart
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {burndown.totalPoints} pontos
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={burndown.data}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="day" 
              tick={{ fontSize: 11 }}
              label={{ value: "Dias", position: "insideBottomRight", offset: -5, fontSize: 11 }}
            />
            <YAxis 
              tick={{ fontSize: 11 }}
              label={{ value: "Pontos", angle: -90, position: "insideLeft", fontSize: 11 }}
            />
            <Tooltip 
              formatter={(value: number, name: string) => [
                value, 
                name === "ideal" ? "Linha Ideal" : "Progresso Real"
              ]}
              labelFormatter={(label) => `Dia ${label}`}
            />
            <Legend 
              formatter={(value) => value === "ideal" ? "Linha Ideal" : "Progresso Real"}
            />
            <Line 
              type="monotone" 
              dataKey="ideal" 
              stroke="hsl(var(--muted-foreground))" 
              strokeDasharray="5 5"
              strokeWidth={1.5}
              dot={false}
            />
            <Line 
              type="monotone" 
              dataKey="actual" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              dot={{ r: 2 }}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
