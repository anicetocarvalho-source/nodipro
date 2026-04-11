import { useState } from "react";
import { Banknote, Plus, TrendingUp, CheckCircle2, Clock, AlertTriangle, Trash2, Edit, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FeatureGate } from "@/components/subscription/FeatureGate";
import { useDisbursements, DisbursementTranche } from "@/hooks/useDisbursements";
import { useProjects } from "@/hooks/useProjects";
import { format } from "date-fns";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof Clock }> = {
  planned: { label: "Planeado", variant: "secondary", icon: Clock },
  pending: { label: "Pendente", variant: "outline", icon: AlertTriangle },
  disbursed: { label: "Desembolsado", variant: "default", icon: CheckCircle2 },
  cancelled: { label: "Cancelado", variant: "destructive", icon: AlertTriangle },
};

const formatCurrency = (v: number, currency = "AOA") =>
  new Intl.NumberFormat("pt-AO", { style: "currency", currency, maximumFractionDigits: 0 }).format(v);

export default function Disbursements() {
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<DisbursementTranche | null>(null);
  const { projects } = useProjects();

  const projectFilter = selectedProject === "all" ? undefined : selectedProject;
  const { tranches, isLoading, createTranche, updateTranche, deleteTranche, totalPlanned, totalDisbursed, disbursementRate } = useDisbursements(projectFilter);

  const [form, setForm] = useState({
    project_id: "",
    title: "",
    description: "",
    amount: "",
    condition_description: "",
    milestone_description: "",
    planned_date: "",
    status: "planned",
    notes: "",
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ project_id: projects[0]?.id ?? "", title: "", description: "", amount: "", condition_description: "", milestone_description: "", planned_date: "", status: "planned", notes: "" });
    setModalOpen(true);
  };

  const openEdit = (t: DisbursementTranche) => {
    setEditing(t);
    setForm({
      project_id: t.project_id,
      title: t.title,
      description: t.description ?? "",
      amount: String(t.amount),
      condition_description: t.condition_description ?? "",
      milestone_description: t.milestone_description ?? "",
      planned_date: t.planned_date ?? "",
      status: t.status,
      notes: t.notes ?? "",
    });
    setModalOpen(true);
  };

  const handleSave = () => {
    const payload = {
      ...form,
      amount: parseFloat(form.amount) || 0,
      tranche_number: editing ? undefined : tranches.length + 1,
    };
    if (editing) {
      updateTranche.mutate({ id: editing.id, ...payload });
    } else {
      createTranche.mutate(payload as any);
    }
    setModalOpen(false);
  };

  const projectName = (pid: string) => projects.find(p => p.id === pid)?.name ?? "—";

  return (
    <FeatureGate feature="disbursements">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Banknote className="h-6 w-6 text-primary" />
              Gestão de Desembolsos
            </h1>
            <p className="text-muted-foreground">Gestão de tranches e desembolsos por projecto</p>
          </div>
          <div className="flex gap-2">
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Filtrar por projecto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os projectos</SelectItem>
                {projects.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> Nova Tranche</Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">Total Planeado</p>
              <p className="text-2xl font-bold">{formatCurrency(totalPlanned)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">Total Desembolsado</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(totalDisbursed)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">Taxa de Desembolso</p>
              <p className="text-2xl font-bold">{disbursementRate}%</p>
              <Progress value={disbursementRate} className="mt-2" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">Tranches Pendentes</p>
              <p className="text-2xl font-bold text-warning">{tranches.filter(t => t.status === "pending").length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" /> Tranches de Desembolso
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : tranches.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Nenhuma tranche registada. Crie a primeira tranche.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Projecto</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Montante</TableHead>
                    <TableHead>Condição</TableHead>
                    <TableHead>Data Prevista</TableHead>
                    <TableHead>Data Real</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acções</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tranches.map(t => {
                    const sc = statusConfig[t.status] || statusConfig.planned;
                    const Icon = sc.icon;
                    return (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">{t.tranche_number}</TableCell>
                        <TableCell className="max-w-[150px] truncate">{projectName(t.project_id)}</TableCell>
                        <TableCell>{t.title}</TableCell>
                        <TableCell className="font-mono">{formatCurrency(Number(t.amount), t.currency)}</TableCell>
                        <TableCell className="max-w-[180px] truncate text-muted-foreground">{t.condition_description ?? "—"}</TableCell>
                        <TableCell>{t.planned_date ? format(new Date(t.planned_date), "dd/MM/yyyy") : "—"}</TableCell>
                        <TableCell>{t.actual_date ? format(new Date(t.actual_date), "dd/MM/yyyy") : "—"}</TableCell>
                        <TableCell>
                          <Badge variant={sc.variant} className="gap-1">
                            <Icon className="h-3 w-3" />{sc.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" onClick={() => openEdit(t)}><Edit className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteTranche.mutate(t.id)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Modal */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing ? "Editar Tranche" : "Nova Tranche"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Projecto</Label>
                <Select value={form.project_id} onValueChange={v => setForm(f => ({ ...f, project_id: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Título</Label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: 1ª Tranche - Arranque" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Montante</Label>
                  <Input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
                </div>
                <div>
                  <Label>Estado</Label>
                  <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Data Prevista</Label>
                <Input type="date" value={form.planned_date} onChange={e => setForm(f => ({ ...f, planned_date: e.target.value }))} />
              </div>
              <div>
                <Label>Condição de Desembolso</Label>
                <Textarea value={form.condition_description} onChange={e => setForm(f => ({ ...f, condition_description: e.target.value }))} placeholder="Ex: Relatório de progresso aprovado" />
              </div>
              <div>
                <Label>Marco Associado</Label>
                <Input value={form.milestone_description} onChange={e => setForm(f => ({ ...f, milestone_description: e.target.value }))} placeholder="Ex: Conclusão da fase de mobilização" />
              </div>
              <div>
                <Label>Notas</Label>
                <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={!form.title || !form.project_id}>{editing ? "Guardar" : "Criar"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </FeatureGate>
  );
}
