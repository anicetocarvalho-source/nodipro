import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { SectorStats } from "@/hooks/useGovernance";

interface SectorBreakdownChartProps {
  data: SectorStats[];
  isLoading?: boolean;
}

const chartConfig = {
  projectCount: { label: "Projectos", color: "hsl(var(--chart-1))" },
  budget: { label: "Orçamento (M)", color: "hsl(var(--chart-2))" },
};

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(217, 91%, 60%)",
];

export function SectorBreakdownChart({ data, isLoading }: SectorBreakdownChartProps) {
  const chartData = data.map((sector, index) => ({
    name: sector.sectorName,
    projectos: sector.projectCount,
    orcamento: sector.budget / 1_000_000, // Convert to millions
    color: sector.sectorColor || COLORS[index % COLORS.length],
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Distribuição por Pilar Estratégico</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : chartData.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Sem dados de sector disponíveis
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={chartData} 
                layout="vertical"
                margin={{ top: 10, right: 30, left: 100, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={true} vertical={false} />
                <XAxis type="number" className="text-xs fill-muted-foreground" />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  className="text-xs fill-muted-foreground" 
                  width={90}
                  tick={{ fontSize: 11 }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="projectos" radius={[0, 4, 4, 0]} maxBarSize={24}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
