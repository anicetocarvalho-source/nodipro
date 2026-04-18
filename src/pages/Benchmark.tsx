import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useEVMData } from "@/hooks/useEVM";
import { useEVMAlerts, useAcknowledgeEVMAlert } from "@/hooks/useEVMAlerts";
import { AlertTriangle, CheckCircle2, TrendingDown, TrendingUp } from "lucide-react";
import { format } from "date-fns";

export default function Benchmark() {
  const { evmData, portfolio, isLoading } = useEVMData();
  const { data: alerts = [] } = useEVMAlerts(true);
  const ack = useAcknowledgeEVMAlert();
  const [search, setSearch] = useState("");

  const sorted = useMemo(() => {
    return [...evmData]
      .filter((p) => p.projectName.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => a.CPI - b.CPI);
  }, [evmData, search]);

  const healthBadge = (h: "good" | "warning" | "critical") => {
    if (h === "good") return <Badge className="bg-success text-success-foreground">Bom</Badge>;
    if (h === "warning") return <Badge className="bg-warning text-warning-foreground">Atenção</Badge>;
    return <Badge variant="destructive">Crítico</Badge>;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Benchmark de Projectos</h1>
        <p className="text-muted-foreground">Comparação de desempenho EVM e alertas preditivos.</p>
      </div>

      {portfolio && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">CPI Portefólio</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center gap-2">
                {portfolio.CPI.toFixed(2)}
                {portfolio.CPI >= 1 ? <TrendingUp className="h-5 w-5 text-success" /> : <TrendingDown className="h-5 w-5 text-destructive" />}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">SPI Portefólio</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center gap-2">
                {portfolio.SPI.toFixed(2)}
                {portfolio.SPI >= 1 ? <TrendingUp className="h-5 w-5 text-success" /> : <TrendingDown className="h-5 w-5 text-destructive" />}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">VAC</CardTitle></CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${portfolio.VAC >= 0 ? "text-success" : "text-destructive"}`}>
                {portfolio.VAC.toLocaleString("pt-PT", { maximumFractionDigits: 0 })}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Alertas activos</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{alerts.length}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" /> Alertas Preditivos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts.slice(0, 5).map((a) => (
              <div key={a.id} className="flex items-start justify-between gap-4 p-3 rounded-md border bg-card">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={a.severity === "critical" ? "destructive" : "secondary"}>
                      {a.severity === "critical" ? "Crítico" : "Atenção"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(a.created_at), "dd/MM/yyyy HH:mm")}
                    </span>
                  </div>
                  <p className="text-sm">{a.message}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => ack.mutate(a.id)}>
                  <CheckCircle2 className="h-4 w-4 mr-1" /> OK
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Comparação de Projectos</CardTitle>
          <Input
            placeholder="Filtrar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">A carregar...</p>
          ) : sorted.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Sem projectos com orçamento.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Projecto</TableHead>
                  <TableHead className="text-right">Progresso</TableHead>
                  <TableHead className="text-right">CPI</TableHead>
                  <TableHead className="text-right">SPI</TableHead>
                  <TableHead className="text-right">VAC</TableHead>
                  <TableHead>Saúde</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((e) => (
                  <TableRow key={e.projectId}>
                    <TableCell className="font-medium">{e.projectName}</TableCell>
                    <TableCell className="text-right">{e.percentComplete.toFixed(0)}%</TableCell>
                    <TableCell className="text-right tabular-nums">{e.CPI.toFixed(2)}</TableCell>
                    <TableCell className="text-right tabular-nums">{e.SPI.toFixed(2)}</TableCell>
                    <TableCell className={`text-right tabular-nums ${e.VAC >= 0 ? "text-success" : "text-destructive"}`}>
                      {e.VAC.toLocaleString("pt-PT", { maximumFractionDigits: 0 })}
                    </TableCell>
                    <TableCell>{healthBadge(e.overallHealth)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
