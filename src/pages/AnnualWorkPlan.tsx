import { useState } from "react";
import { CalendarRange, Plus, Trash2, Edit, ChevronDown, ChevronRight, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useAnnualWorkPlans, useAWPActivities, AnnualWorkPlan as AWP } from "@/hooks/useAnnualWorkPlans";
import { useProjects } from "@/hooks/useProjects";
import { Skeleton } from "@/components/ui/skeleton";

const statusLabels: Record<string, string> = { draft: "Rascunho", active: "Activo", completed: "Concluído", cancelled: "Cancelado" };
const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  completed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

function PlanActivities({ plan }: { plan: AWP }) {
  const { activities, loading, createActivity, updateActivity, deleteActivity } = useAWPActivities(plan.id);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ title: "", quarter: "Q1", planned_budget: "0", physical_target: "0", responsible: "", description: "" });

  const quarters = ["Q1", "Q2", "Q3", "Q4"];
  const byQuarter = quarters.map(q => ({ q, items: activities.filter(a => a.quarter === q) }));

  const handleSave = async () => {
    await createActivity.mutateAsync({
      work_plan_id: plan.id,
      title: form.title,
      quarter: form.quarter,
      planned_budget: Number(form.planned_budget) || 0,
      physical_target: Number(form.physical_target) || 0,
      responsible: form.responsible || undefined,
      description: form.description || undefined,
    });
    setModalOpen(false);
    setForm({ title: "", quarter: "Q1", planned_budget: "0", physical_target: "0", responsible: "", description: "" });
  };

  if (loading) return <Skeleton className="h-20 w-full" />;

  return (
    <div className="space-y-3 mt-3">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">Actividades ({activities.length})</span>
        <Button size="sm" variant="outline" onClick={() => setModalOpen(true)}><Plus className="h-3 w-3 mr-1" />Actividade</Button>
      </div>

      {byQuarter.map(({ q, items }) => (
        items.length > 0 && (
          <div key={q}>
            <h4 className="text-xs font-semibold text-muted-foreground mb-1">{q}</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Actividade</TableHead>
                  <TableHead className="w-[100px]">Orç. Planeado</TableHead>
                  <TableHead className="w-[100px]">Orç. Executado</TableHead>
                  <TableHead className="w-[80px]">Meta Física</TableHead>
                  <TableHead className="w-[80px]">Realizado</TableHead>
                  <TableHead className="w-[100px]">Estado</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map(act => {
                  const physicalPct = act.physical_target && act.physical_target > 0
                    ? Math.round(((act.physical_achieved || 0) / act.physical_target) * 100) : 0;
                  return (
                    <TableRow key={act.id}>
                      <TableCell>
                        <div className="font-medium text-sm">{act.title}</div>
                        {act.responsible && <span className="text-xs text-muted-foreground">{act.responsible}</span>}
                      </TableCell>
                      <TableCell className="text-sm">{act.planned_budget.toLocaleString("pt-AO")}</TableCell>
                      <TableCell className="text-sm">{act.executed_budget.toLocaleString("pt-AO")}</TableCell>
                      <TableCell className="text-sm">{act.physical_target || 0}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="text-sm">{act.physical_achieved || 0}</span>
                          <span className="text-xs text-muted-foreground">({physicalPct}%)</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select value={act.status} onValueChange={v => updateActivity.mutate({ id: act.id, status: v })}>
                          <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="planned">Planeada</SelectItem>
                            <SelectItem value="in_progress">Em Curso</SelectItem>
                            <SelectItem value="completed">Concluída</SelectItem>
                            <SelectItem value="cancelled">Cancelada</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteActivity.mutate(act.id)}>
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )
      ))}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Actividade</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Título</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div><Label>Trimestre</Label>
              <Select value={form.quarter} onValueChange={v => setForm(f => ({ ...f, quarter: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{quarters.map(q => <SelectItem key={q} value={q}>{q}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Orçamento Planeado</Label><Input type="number" value={form.planned_budget} onChange={e => setForm(f => ({ ...f, planned_budget: e.target.value }))} /></div>
              <div><Label>Meta Física</Label><Input type="number" value={form.physical_target} onChange={e => setForm(f => ({ ...f, physical_target: e.target.value }))} /></div>
            </div>
            <div><Label>Responsável</Label><Input value={form.responsible} onChange={e => setForm(f => ({ ...f, responsible: e.target.value }))} /></div>
            <div><Label>Descrição</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!form.title}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AnnualWorkPlan() {
  const { plans, loading, createPlan, updatePlan, deletePlan } = useAnnualWorkPlans();
  const { projects } = useProjects();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ title: "", year: new Date().getFullYear().toString(), project_id: "", total_budget: "0", notes: "" });

  const toggleExpand = (id: string) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const handleCreate = async () => {
    await createPlan.mutateAsync({
      title: form.title,
      year: Number(form.year),
      project_id: form.project_id || null,
      total_budget: Number(form.total_budget) || 0,
      notes: form.notes || undefined,
    });
    setModalOpen(false);
    setForm({ title: "", year: new Date().getFullYear().toString(), project_id: "", total_budget: "0", notes: "" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CalendarRange className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Plano de Trabalho Anual</h1>
            <p className="text-sm text-muted-foreground">Actividades planeadas por trimestre com execução física e financeira</p>
          </div>
        </div>
        <Button onClick={() => setModalOpen(true)}><Plus className="h-4 w-4 mr-2" />Novo PTA</Button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2].map(i => <Skeleton key={i} className="h-28 w-full" />)}</div>
      ) : plans.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhum plano de trabalho criado.</CardContent></Card>
      ) : (
        <div className="space-y-4">
          {plans.map(plan => {
            const execPct = plan.total_budget > 0 ? Math.round((plan.total_executed / plan.total_budget) * 100) : 0;
            const isOpen = expanded[plan.id] || false;
            return (
              <Card key={plan.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => toggleExpand(plan.id)}>
                      {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      <div>
                        <CardTitle className="text-lg">{plan.title}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">{plan.year}</Badge>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[plan.status]}`}>{statusLabels[plan.status] || plan.status}</span>
                          {plan.project_name && <Badge variant="secondary" className="text-xs">{plan.project_name}</Badge>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-medium">{plan.total_executed.toLocaleString("pt-AO")} / {plan.total_budget.toLocaleString("pt-AO")} AOA</div>
                        <Progress value={execPct} className="w-32 h-2 mt-1" />
                        <span className="text-xs text-muted-foreground">{execPct}% executado</span>
                      </div>
                      <Select value={plan.status} onValueChange={v => updatePlan.mutate({ id: plan.id, status: v })}>
                        <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Rascunho</SelectItem>
                          <SelectItem value="active">Activo</SelectItem>
                          <SelectItem value="completed">Concluído</SelectItem>
                          <SelectItem value="cancelled">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="icon" onClick={() => deletePlan.mutate(plan.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </div>
                </CardHeader>
                {isOpen && (
                  <CardContent>
                    <PlanActivities plan={plan} />
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Plano de Trabalho Anual</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Título</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="PTA 2026 — Projecto X" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Ano</Label><Input type="number" value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} /></div>
              <div><Label>Orçamento Total</Label><Input type="number" value={form.total_budget} onChange={e => setForm(f => ({ ...f, total_budget: e.target.value }))} /></div>
            </div>
            <div>
              <Label>Projecto (opcional)</Label>
              <Select value={form.project_id} onValueChange={v => setForm(f => ({ ...f, project_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Sem projecto associado" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum</SelectItem>
                  {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Notas</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={!form.title}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
