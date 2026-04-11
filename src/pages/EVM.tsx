import { useMemo } from "react";
import { TrendingUp, TrendingDown, DollarSign, Clock, Activity, Target, AlertTriangle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";
import { useEVMData, EVMMetrics } from "@/hooks/useEVM";
import { FeatureGate } from "@/components/subscription/FeatureGate";

const healthColor = (h: string) =>
  h === 'good' ? 'text-success' : h === 'warning' ? 'text-warning' : 'text-destructive';
const healthBg = (h: string) =>
  h === 'good' ? 'bg-success/10' : h === 'warning' ? 'bg-warning/10' : 'bg-destructive/10';
const healthLabel = (h: string) =>
  h === 'good' ? 'Saudável' : h === 'warning' ? 'Atenção' : 'Crítico';
const healthIcon = (h: string) =>
  h === 'good' ? CheckCircle : h === 'warning' ? AlertTriangle : AlertTriangle;

const fmt = (v: number) => {
  if (Math.abs(v) >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
  if (Math.abs(v) >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
  return v.toFixed(0);
};

const fmtCurrency = (v: number) => `${fmt(v)} AOA`;

export default function EVM() {
  const { evmData, portfolio, isLoading } = useEVMData();

  const chartData = useMemo(() =>
    evmData.slice(0, 10).map(e => ({
      name: e.projectName.length > 15 ? e.projectName.slice(0, 15) + '…' : e.projectName,
      CPI: Number((e.CPI).toFixed(2)),
      SPI: Number((e.SPI).toFixed(2)),
    })),
  [evmData]);

  const chartConfig = {
    CPI: { label: "CPI", color: "hsl(var(--chart-1))" },
    SPI: { label: "SPI", color: "hsl(var(--chart-2))" },
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-4 gap-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-32" />)}</div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Gestão de Valor Ganho (EVM)</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Métricas de desempenho de custo e cronograma calculadas automaticamente a partir dos dados reais
        </p>
      </div>

      {/* Portfolio Summary */}
      {portfolio && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="CPI — Índice de Custo"
            value={portfolio.CPI.toFixed(2)}
            description={portfolio.CPI >= 1 ? "Abaixo do orçamento" : "Acima do orçamento"}
            health={portfolio.costHealth}
            icon={DollarSign}
            tooltip="Cost Performance Index: EV / AC. Valor ≥ 1 indica eficiência de custo."
          />
          <MetricCard
            title="SPI — Índice de Prazo"
            value={portfolio.SPI.toFixed(2)}
            description={portfolio.SPI >= 1 ? "Adiantado" : "Atrasado"}
            health={portfolio.scheduleHealth}
            icon={Clock}
            tooltip="Schedule Performance Index: EV / PV. Valor ≥ 1 indica cumprimento do prazo."
          />
          <MetricCard
            title="Variância de Custo (CV)"
            value={fmtCurrency(portfolio.CV)}
            description={portfolio.CV >= 0 ? "Economia" : "Sobrecusto"}
            health={portfolio.CV >= 0 ? 'good' : 'critical'}
            icon={Activity}
            tooltip="Cost Variance: EV - AC. Valor positivo indica economia."
          />
          <MetricCard
            title="EAC — Estimativa Final"
            value={fmtCurrency(portfolio.EAC)}
            description={`BAC: ${fmtCurrency(portfolio.totalBAC)}`}
            health={portfolio.EAC <= portfolio.totalBAC * 1.05 ? 'good' : portfolio.EAC <= portfolio.totalBAC * 1.15 ? 'warning' : 'critical'}
            icon={Target}
            tooltip="Estimate at Completion: BAC / CPI. Previsão do custo total final."
          />
        </div>
      )}

      {evmData.length === 0 ? (
        <Card className="p-12 text-center">
          <Activity className="h-12 w-12 mx-auto text-muted-foreground/40" />
          <p className="text-muted-foreground mt-4">Nenhum projecto com orçamento definido encontrado.</p>
          <p className="text-xs text-muted-foreground mt-1">Defina orçamentos nos projectos para ver as métricas EVM.</p>
        </Card>
      ) : (
        <>
          {/* CPI/SPI Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">CPI vs SPI por Projecto</CardTitle>
              <p className="text-xs text-muted-foreground">Linha de referência: 1.00 = desempenho conforme planeado</p>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs fill-muted-foreground" angle={-20} textAnchor="end" height={60} />
                  <YAxis className="text-xs fill-muted-foreground" domain={[0, 'auto']} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="CPI" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="SPI" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Detailed Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Detalhe por Projecto</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Projecto</TableHead>
                      <TableHead className="text-right">BAC</TableHead>
                      <TableHead className="text-right">PV</TableHead>
                      <TableHead className="text-right">EV</TableHead>
                      <TableHead className="text-right">AC</TableHead>
                      <TableHead className="text-center">CPI</TableHead>
                      <TableHead className="text-center">SPI</TableHead>
                      <TableHead className="text-right">EAC</TableHead>
                      <TableHead className="text-right">ETC</TableHead>
                      <TableHead className="text-center">Saúde</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {evmData.map(e => (
                      <TableRow key={e.projectId}>
                        <TableCell className="font-medium max-w-[200px] truncate">{e.projectName}</TableCell>
                        <TableCell className="text-right text-xs">{fmtCurrency(e.BAC)}</TableCell>
                        <TableCell className="text-right text-xs">{fmtCurrency(e.PV)}</TableCell>
                        <TableCell className="text-right text-xs">{fmtCurrency(e.EV)}</TableCell>
                        <TableCell className="text-right text-xs">{fmtCurrency(e.AC)}</TableCell>
                        <TableCell className="text-center">
                          <Badge className={cn("text-xs", healthBg(e.costHealth), healthColor(e.costHealth))}>{e.CPI.toFixed(2)}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className={cn("text-xs", healthBg(e.scheduleHealth), healthColor(e.scheduleHealth))}>{e.SPI.toFixed(2)}</Badge>
                        </TableCell>
                        <TableCell className="text-right text-xs">{fmtCurrency(e.EAC)}</TableCell>
                        <TableCell className="text-right text-xs">{fmtCurrency(e.ETC)}</TableCell>
                        <TableCell className="text-center">
                          <Badge className={cn("text-xs", healthBg(e.overallHealth), healthColor(e.overallHealth))}>
                            {healthLabel(e.overallHealth)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Legend */}
          <Card className="bg-muted/30">
            <CardContent className="p-4">
              <p className="text-xs font-semibold text-muted-foreground mb-2">GLOSSÁRIO EVM</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
                <span><strong>BAC</strong> — Orçamento Total</span>
                <span><strong>PV</strong> — Valor Planeado</span>
                <span><strong>EV</strong> — Valor Ganho</span>
                <span><strong>AC</strong> — Custo Real</span>
                <span><strong>CPI</strong> — Índice de Custo (EV/AC)</span>
                <span><strong>SPI</strong> — Índice de Prazo (EV/PV)</span>
                <span><strong>EAC</strong> — Estimativa Final (BAC/CPI)</span>
                <span><strong>ETC</strong> — Custo Restante (EAC-AC)</span>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function MetricCard({ title, value, description, health, icon: Icon, tooltip }: {
  title: string; value: string; description: string; health: string;
  icon: React.ComponentType<{ className?: string }>; tooltip: string;
}) {
  const HealthIcon = healthIcon(health);
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Card className="hover:shadow-md transition-shadow cursor-help">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <Icon className="h-5 w-5 text-muted-foreground" />
              <HealthIcon className={cn("h-4 w-4", healthColor(health))} />
            </div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{title}</p>
            <p className={cn("text-xs mt-0.5 font-medium", healthColor(health))}>{description}</p>
          </CardContent>
        </Card>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-xs">{tooltip}</TooltipContent>
    </Tooltip>
  );
}
