import { useState, useMemo } from "react";
import { Plus, AlertTriangle, Shield, TrendingUp, Lightbulb, Trash2, Pencil, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useRisks, useLessonsLearned } from "@/hooks/useRisks";
import { useProjects } from "@/hooks/useProjects";

const probabilityConfig: Record<string, { label: string; value: number; className: string }> = {
  low: { label: "Baixa", value: 1, className: "bg-success/10 text-success" },
  medium: { label: "Média", value: 2, className: "bg-warning/10 text-warning" },
  high: { label: "Alta", value: 3, className: "bg-destructive/10 text-destructive" },
};

const impactConfig: Record<string, { label: string; value: number; className: string }> = {
  low: { label: "Baixo", value: 1, className: "bg-success/10 text-success" },
  medium: { label: "Médio", value: 2, className: "bg-warning/10 text-warning" },
  high: { label: "Alto", value: 3, className: "bg-destructive/10 text-destructive" },
};

const getRiskLevel = (probability: string, impact: string) => {
  const p = probabilityConfig[probability]?.value || 2;
  const i = impactConfig[impact]?.value || 2;
  const score = p * i;
  if (score >= 6) return { label: "Crítico", className: "bg-destructive text-destructive-foreground" };
  if (score >= 4) return { label: "Alto", className: "bg-destructive/20 text-destructive" };
  if (score >= 2) return { label: "Médio", className: "bg-warning/20 text-warning" };
  return { label: "Baixo", className: "bg-success/20 text-success" };
};

export default function Risks() {
  const { data: projects } = useProjects();
  const { risks, loadingRisks, createRisk, updateRisk, deleteRisk } = useRisks();
  const { lessons, loadingLessons, createLesson, deleteLesson } = useLessonsLearned();
  const [search, setSearch] = useState("");
  const [riskModal, setRiskModal] = useState<any>(null);
  const [lessonModal, setLessonModal] = useState<any>(null);
  const [showRiskForm, setShowRiskForm] = useState(false);
  const [showLessonForm, setShowLessonForm] = useState(false);

  const filteredRisks = useMemo(() => {
    if (!search) return risks;
    return risks.filter((r: any) => r.title?.toLowerCase().includes(search.toLowerCase()));
  }, [risks, search]);

  const filteredLessons = useMemo(() => {
    if (!search) return lessons;
    return lessons.filter((l: any) => l.title?.toLowerCase().includes(search.toLowerCase()));
  }, [lessons, search]);

  const isLoading = loadingRisks || loadingLessons;

  if (isLoading) {
    return <div className="space-y-6"><Skeleton className="h-10 w-64" /><div className="grid grid-cols-4 gap-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-28" />)}</div><Skeleton className="h-96" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestão de Riscos e Lições</h1>
          <p className="text-muted-foreground">Identificar, monitorar riscos e documentar lições aprendidas.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setLessonModal(null); setShowLessonForm(true); }}><Lightbulb className="h-4 w-4 mr-2" />Nova Lição</Button>
          <Button onClick={() => { setRiskModal(null); setShowRiskForm(true); }}><Plus className="h-4 w-4 mr-2" />Registar Risco</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-destructive/10"><AlertTriangle className="h-5 w-5 text-destructive" /></div><div><p className="text-sm text-muted-foreground">Riscos Activos</p><p className="text-2xl font-bold">{risks.filter((r: any) => r.status === "active").length}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-warning/10"><TrendingUp className="h-5 w-5 text-warning" /></div><div><p className="text-sm text-muted-foreground">Risco Crítico</p><p className="text-2xl font-bold">{risks.filter((r: any) => r.probability === "high" && r.impact === "high").length}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-success/10"><Shield className="h-5 w-5 text-success" /></div><div><p className="text-sm text-muted-foreground">Mitigados</p><p className="text-2xl font-bold">{risks.filter((r: any) => r.status === "mitigated").length}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-primary/10"><Lightbulb className="h-5 w-5 text-primary" /></div><div><p className="text-sm text-muted-foreground">Lições</p><p className="text-2xl font-bold">{lessons.length}</p></div></div></CardContent></Card>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Pesquisar..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Tabs defaultValue="risks">
        <TabsList>
          <TabsTrigger value="risks">Mapa de Riscos ({filteredRisks.length})</TabsTrigger>
          <TabsTrigger value="matrix">Matriz</TabsTrigger>
          <TabsTrigger value="lessons">Lições Aprendidas ({filteredLessons.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="risks" className="mt-6 space-y-3">
          {filteredRisks.length === 0 && <Card className="p-12 text-center"><AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground/40" /><p className="text-muted-foreground mt-4">Nenhum risco registado.</p></Card>}
          {filteredRisks.map((risk: any) => (
            <Card key={risk.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className={cn("p-2 rounded-lg", risk.status === "active" ? "bg-destructive/10" : "bg-success/10")}>
                    {risk.status === "active" ? <AlertTriangle className="h-5 w-5 text-destructive" /> : <Shield className="h-5 w-5 text-success" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold">{risk.title}</h3>
                        <p className="text-sm text-muted-foreground">{(risk as any).projects?.name || "—"}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getRiskLevel(risk.probability, risk.impact).className}>{getRiskLevel(risk.probability, risk.impact).label}</Badge>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setRiskModal(risk); setShowRiskForm(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button></AlertDialogTrigger>
                          <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Eliminar risco?</AlertDialogTitle><AlertDialogDescription>Esta acção não pode ser revertida.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => deleteRisk.mutate(risk.id)}>Eliminar</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="outline" className={probabilityConfig[risk.probability]?.className}>Prob: {probabilityConfig[risk.probability]?.label}</Badge>
                      <Badge variant="outline" className={impactConfig[risk.impact]?.className}>Impacto: {impactConfig[risk.impact]?.label}</Badge>
                      {risk.owner_name && <Badge variant="secondary">{risk.owner_name}</Badge>}
                    </div>
                    {risk.mitigation && <p className="mt-3 text-sm text-muted-foreground"><strong>Mitigação:</strong> {risk.mitigation}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="matrix" className="mt-6">
          <Card>
            <CardHeader><CardTitle className="text-lg">Matriz de Risco</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-1 max-w-lg">
                <div /><div className="text-xs text-muted-foreground text-center py-2">Baixo</div><div className="text-xs text-muted-foreground text-center py-2">Médio</div><div className="text-xs text-muted-foreground text-center py-2">Alto</div>
                {["high", "medium", "low"].map(prob => (
                  <>
                    <div key={`label-${prob}`} className="text-xs text-muted-foreground flex items-center justify-end pr-2">{probabilityConfig[prob].label}</div>
                    {["low", "medium", "high"].map(imp => {
                      const count = risks.filter((r: any) => r.probability === prob && r.impact === imp).length;
                      const score = probabilityConfig[prob].value * impactConfig[imp].value;
                      const bg = score >= 6 ? "bg-destructive/50" : score >= 4 ? "bg-destructive/30" : score >= 2 ? "bg-warning/30" : "bg-success/20";
                      return <div key={`${prob}-${imp}`} className={cn("h-16 rounded flex items-center justify-center text-xs font-medium", bg)}>{count || "-"}</div>;
                    })}
                  </>
                ))}
              </div>
              <div className="mt-4 flex gap-4 text-xs text-muted-foreground"><span>Eixo X: Impacto</span><span>Eixo Y: Probabilidade</span></div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lessons" className="mt-6 space-y-4">
          {filteredLessons.length === 0 && <Card className="p-12 text-center"><Lightbulb className="h-12 w-12 mx-auto text-muted-foreground/40" /><p className="text-muted-foreground mt-4">Nenhuma lição registada.</p></Card>}
          {filteredLessons.map((lesson: any) => (
            <Card key={lesson.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className={cn("p-2 rounded-lg", lesson.lesson_type === "success" ? "bg-success/10" : "bg-warning/10")}>
                    <Lightbulb className={cn("h-5 w-5", lesson.lesson_type === "success" ? "text-success" : "text-warning")} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div><h3 className="font-semibold">{lesson.title}</h3><p className="text-sm text-muted-foreground">{(lesson as any).projects?.name || "—"}</p></div>
                      <div className="flex items-center gap-2">
                        <Badge className={lesson.lesson_type === "success" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}>{lesson.lesson_type === "success" ? "Sucesso" : "Melhoria"}</Badge>
                        <AlertDialog>
                          <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button></AlertDialogTrigger>
                          <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Eliminar lição?</AlertDialogTitle></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => deleteLesson.mutate(lesson.id)}>Eliminar</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    {lesson.description && <p className="mt-2 text-sm text-muted-foreground">{lesson.description}</p>}
                    {lesson.tags?.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{lesson.tags.map((tag: string) => <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>)}</div>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Risk Form Modal */}
      {showRiskForm && (
        <RiskFormModal open onClose={() => setShowRiskForm(false)} item={riskModal} projects={projects || []}
          onSubmit={(data) => riskModal ? updateRisk.mutate({ id: riskModal.id, ...data }) : createRisk.mutate(data)} />
      )}
      {showLessonForm && (
        <LessonFormModal open onClose={() => setShowLessonForm(false)} projects={projects || []}
          onSubmit={(data) => createLesson.mutate(data)} />
      )}
    </div>
  );
}

function RiskFormModal({ open, onClose, item, projects, onSubmit }: any) {
  const [form, setForm] = useState({
    title: item?.title || "", description: item?.description || "", project_id: item?.project_id || "",
    probability: item?.probability || "medium", impact: item?.impact || "medium",
    status: item?.status || "active", owner_name: item?.owner_name || "", mitigation: item?.mitigation || "",
    category: item?.category || "",
  });
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));
  const handleSubmit = () => { onSubmit(form); onClose(); };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{item ? "Editar" : "Novo"} Risco</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div><Label>Título *</Label><Input value={form.title} onChange={e => set("title", e.target.value)} /></div>
          <div><Label>Projecto *</Label>
            <Select value={form.project_id} onValueChange={v => set("project_id", v)}>
              <SelectTrigger><SelectValue placeholder="Seleccionar projecto" /></SelectTrigger>
              <SelectContent>{projects.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Probabilidade</Label>
              <Select value={form.probability} onValueChange={v => set("probability", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="low">Baixa</SelectItem><SelectItem value="medium">Média</SelectItem><SelectItem value="high">Alta</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label>Impacto</Label>
              <Select value={form.impact} onValueChange={v => set("impact", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="low">Baixo</SelectItem><SelectItem value="medium">Médio</SelectItem><SelectItem value="high">Alto</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Estado</Label>
              <Select value={form.status} onValueChange={v => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="active">Activo</SelectItem><SelectItem value="mitigated">Mitigado</SelectItem><SelectItem value="closed">Fechado</SelectItem><SelectItem value="accepted">Aceite</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label>Responsável</Label><Input value={form.owner_name} onChange={e => set("owner_name", e.target.value)} /></div>
          </div>
          <div><Label>Mitigação</Label><Textarea value={form.mitigation} onChange={e => set("mitigation", e.target.value)} rows={2} /></div>
          <div><Label>Descrição</Label><Textarea value={form.description} onChange={e => set("description", e.target.value)} rows={2} /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Cancelar</Button><Button onClick={handleSubmit} disabled={!form.title || !form.project_id}>Guardar</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LessonFormModal({ open, onClose, projects, onSubmit }: any) {
  const [form, setForm] = useState({ title: "", description: "", project_id: "", lesson_type: "success", tags: "" });
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));
  const handleSubmit = () => {
    onSubmit({ ...form, tags: form.tags.split(",").map(t => t.trim()).filter(Boolean) });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Nova Lição Aprendida</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div><Label>Título *</Label><Input value={form.title} onChange={e => set("title", e.target.value)} /></div>
          <div><Label>Projecto *</Label>
            <Select value={form.project_id} onValueChange={v => set("project_id", v)}>
              <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
              <SelectContent>{projects.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Tipo</Label>
            <Select value={form.lesson_type} onValueChange={v => set("lesson_type", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="success">Sucesso</SelectItem><SelectItem value="improvement">Melhoria</SelectItem><SelectItem value="failure">Falha</SelectItem></SelectContent>
            </Select>
          </div>
          <div><Label>Tags (separadas por vírgula)</Label><Input value={form.tags} onChange={e => set("tags", e.target.value)} placeholder="Comunicação, Agile, Equipa" /></div>
          <div><Label>Descrição</Label><Textarea value={form.description} onChange={e => set("description", e.target.value)} rows={3} /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Cancelar</Button><Button onClick={handleSubmit} disabled={!form.title || !form.project_id}>Guardar</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
