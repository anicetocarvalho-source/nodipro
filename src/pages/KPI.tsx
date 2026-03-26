import { useState, useMemo } from "react";
import { Plus, TrendingUp, TrendingDown, Target, CheckCircle, AlertTriangle, Download, Trash2, Pencil, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { cn } from "@/lib/utils";
import { useKPIs } from "@/hooks/useKPIs";
import { usePermissions } from "@/hooks/usePermissions";

const DIRECTIONS = [
  { value: "higher_is_better", label: "Maior é melhor" },
  { value: "lower_is_better", label: "Menor é melhor" },
];
const FREQUENCIES = [
  { value: "daily", label: "Diário" },
  { value: "weekly", label: "Semanal" },
  { value: "monthly", label: "Mensal" },
  { value: "quarterly", label: "Trimestral" },
  { value: "annual", label: "Anual" },
];

function getKPIStatus(kpi: any) {
  const measurements = kpi.kpi_measurements || [];
  if (measurements.length === 0) return { value: null, status: "no_data", label: "Sem dados" };
  const sorted = [...measurements].sort((a: any, b: any) => b.measured_at.localeCompare(a.measured_at));
  const current = Number(sorted[0].value);
  const target = Number(kpi.target_value);
  const warning = kpi.warning_threshold != null ? Number(kpi.warning_threshold) : null;
  const isHigherBetter = kpi.direction === "higher_is_better";

  let status = "good";
  if (target) {
    const progress = isHigherBetter ? (current / target) * 100 : target > 0 ? ((2 * target - current) / target) * 100 : 100;
    if (warning != null) {
      const warningMet = isHigherBetter ? current < warning : current > warning;
      if (warningMet) status = "warning";
    }
    const targetMet = isHigherBetter ? current >= target : current <= target;
    if (targetMet) status = "excellent";
    else if (status !== "warning") status = "warning";
  }

  const prev = sorted.length > 1 ? Number(sorted[1].value) : null;
  const change = prev != null ? current - prev : null;

  return { value: current, status, progress: target ? Math.min(100, (current / target) * 100) : 0, change, target, label: status === "excellent" ? "Excelente" : status === "good" ? "Bom" : "Atenção" };
}

export default function KPI() {
  const { kpis, loadingKPIs, createKPI, updateKPI, deleteKPI, addMeasurement } = useKPIs();
  const { isAdmin, isPortfolioManager, isProjectManager, isManager } = usePermissions();
  const canManageKPIs = isAdmin || isPortfolioManager || isProjectManager || isManager;
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [showMeasurement, setShowMeasurement] = useState<any>(null);

  const chartData = useMemo(() =>
    kpis.slice(0, 8).map((k: any) => {
      const s = getKPIStatus(k);
      return { name: k.name.length > 12 ? k.name.slice(0, 12) + "…" : k.name, value: s.value || 0, target: s.target || 0 };
    }), [kpis]);

  const chartConfig = { value: { label: "Actual", color: "hsl(var(--chart-1))" }, target: { label: "Meta", color: "hsl(var(--chart-2))" } };

  if (loadingKPIs) {
    return <div className="space-y-6"><Skeleton className="h-10 w-64" /><div className="grid grid-cols-4 gap-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-32" />)}</div><Skeleton className="h-96" /></div>;
  }

  const excellent = kpis.filter((k: any) => getKPIStatus(k).status === "excellent").length;
  const warning = kpis.filter((k: any) => getKPIStatus(k).status === "warning").length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Centro de Indicadores</h1>
          <p className="text-muted-foreground">Defina KPIs, registe medições e acompanhe o desempenho.</p>
        </div>
        <Button onClick={() => { setEditItem(null); setShowForm(true); }}><Plus className="h-4 w-4 mr-2" />Novo KPI</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total KPIs</p><p className="text-2xl font-bold">{kpis.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Na Meta</p><p className="text-2xl font-bold text-success">{excellent}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Atenção</p><p className="text-2xl font-bold text-warning">{warning}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Sem Dados</p><p className="text-2xl font-bold text-muted-foreground">{kpis.filter((k: any) => getKPIStatus(k).status === "no_data").length}</p></CardContent></Card>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Actual vs Meta</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[280px] w-full">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs fill-muted-foreground" angle={-20} textAnchor="end" height={60} />
                <YAxis className="text-xs fill-muted-foreground" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="target" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* KPI Table */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Definições de KPI</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead className="text-right">Actual</TableHead>
                <TableHead className="text-right">Meta</TableHead>
                <TableHead>Progresso</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-[120px]" />
              </TableRow></TableHeader>
              <TableBody>
                {kpis.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhum KPI definido. Crie o primeiro.</TableCell></TableRow>}
                {kpis.map((kpi: any) => {
                  const s = getKPIStatus(kpi);
                  return (
                    <TableRow key={kpi.id}>
                      <TableCell className="font-medium">{kpi.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{kpi.unit}</TableCell>
                      <TableCell className="text-right">{s.value != null ? s.value : "—"}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{kpi.target_value || "—"}</TableCell>
                      <TableCell><Progress value={s.progress || 0} className="h-2 w-20" /></TableCell>
                      <TableCell>
                        <Badge className={cn("text-xs",
                          s.status === "excellent" ? "bg-success/10 text-success" :
                          s.status === "warning" ? "bg-warning/10 text-warning" : "bg-muted text-muted-foreground"
                        )}>{s.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowMeasurement(kpi)} title="Registar medição"><BarChart3 className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditItem(kpi); setShowForm(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button></AlertDialogTrigger>
                            <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Eliminar KPI?</AlertDialogTitle><AlertDialogDescription>Todas as medições serão eliminadas.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => deleteKPI.mutate(kpi.id)}>Eliminar</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      {showForm && <KPIFormModal open onClose={() => setShowForm(false)} item={editItem}
        onSubmit={(data: any) => editItem ? updateKPI.mutate({ id: editItem.id, ...data }) : createKPI.mutate(data)} />}
      {showMeasurement && <MeasurementModal open onClose={() => setShowMeasurement(null)} kpi={showMeasurement}
        onSubmit={(data: any) => addMeasurement.mutate(data)} />}
    </div>
  );
}

function KPIFormModal({ open, onClose, item, onSubmit }: any) {
  const [form, setForm] = useState({
    name: item?.name || "", description: item?.description || "", unit: item?.unit || "%",
    target_value: item?.target_value || "", warning_threshold: item?.warning_threshold || "",
    direction: item?.direction || "higher_is_better", frequency: item?.frequency || "monthly", category: item?.category || "",
  });
  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));
  const handleSubmit = () => {
    onSubmit({ ...form, target_value: form.target_value ? Number(form.target_value) : null, warning_threshold: form.warning_threshold ? Number(form.warning_threshold) : null });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{item ? "Editar" : "Novo"} KPI</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div><Label>Nome *</Label><Input value={form.name} onChange={e => set("name", e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Unidade</Label><Input value={form.unit} onChange={e => set("unit", e.target.value)} placeholder="%, dias, etc." /></div>
            <div><Label>Direcção</Label>
              <Select value={form.direction} onValueChange={v => set("direction", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{DIRECTIONS.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Meta</Label><Input type="number" value={form.target_value} onChange={e => set("target_value", e.target.value)} /></div>
            <div><Label>Limiar de Aviso</Label><Input type="number" value={form.warning_threshold} onChange={e => set("warning_threshold", e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Frequência</Label>
              <Select value={form.frequency} onValueChange={v => set("frequency", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{FREQUENCIES.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Categoria</Label><Input value={form.category} onChange={e => set("category", e.target.value)} placeholder="Entrega, Custo..." /></div>
          </div>
          <div><Label>Descrição</Label><Textarea value={form.description} onChange={e => set("description", e.target.value)} rows={2} /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Cancelar</Button><Button onClick={handleSubmit} disabled={!form.name}>Guardar</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MeasurementModal({ open, onClose, kpi, onSubmit }: any) {
  const [value, setValue] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const handleSubmit = () => { onSubmit({ kpi_id: kpi.id, value: Number(value), measured_at: date, notes: notes || null }); onClose(); };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Registar Medição — {kpi.name}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div><Label>Valor ({kpi.unit}) *</Label><Input type="number" value={value} onChange={e => setValue(e.target.value)} /></div>
          <div><Label>Data</Label><Input type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
          <div><Label>Notas</Label><Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Cancelar</Button><Button onClick={handleSubmit} disabled={!value}>Registar</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
