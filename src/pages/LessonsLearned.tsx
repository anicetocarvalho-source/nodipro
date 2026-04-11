import { useState } from "react";
import { BookOpen, Plus, Search, Trash2, Edit, Tag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLessonsLearned, LessonLearned } from "@/hooks/useLessonsLearned";
import { useProjects } from "@/hooks/useProjects";
import { Skeleton } from "@/components/ui/skeleton";

const typeLabels: Record<string, string> = {
  success: "Boas Práticas",
  improvement: "Melhoria",
  risk: "Risco Materializado",
  process: "Processo",
};

const typeColors: Record<string, string> = {
  success: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  improvement: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  risk: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  process: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
};

export default function LessonsLearned() {
  const { lessons, loading, createLesson, updateLesson, deleteLesson } = useLessonsLearned();
  const { projects } = useProjects();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<LessonLearned | null>(null);
  const [form, setForm] = useState({ title: "", description: "", lesson_type: "success", project_id: "", tags: "" });

  const filtered = lessons.filter(l => {
    const matchSearch = !search || l.title.toLowerCase().includes(search.toLowerCase()) || l.description?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || l.lesson_type === typeFilter;
    return matchSearch && matchType;
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ title: "", description: "", lesson_type: "success", project_id: projects[0]?.id || "", tags: "" });
    setModalOpen(true);
  };

  const openEdit = (l: LessonLearned) => {
    setEditing(l);
    setForm({
      title: l.title,
      description: l.description || "",
      lesson_type: l.lesson_type,
      project_id: l.project_id,
      tags: l.tags?.join(", ") || "",
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const tags = form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : [];
    if (editing) {
      await updateLesson.mutateAsync({
        id: editing.id,
        title: form.title,
        description: form.description || null,
        lesson_type: form.lesson_type,
        tags,
      });
    } else {
      await createLesson.mutateAsync({
        title: form.title,
        description: form.description || undefined,
        lesson_type: form.lesson_type,
        project_id: form.project_id,
        tags,
      });
    }
    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Lições Aprendidas</h1>
            <p className="text-sm text-muted-foreground">Repositório de conhecimento institucional</p>
          </div>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Nova Lição</Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Pesquisar lições…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Tipos</SelectItem>
            <SelectItem value="success">Boas Práticas</SelectItem>
            <SelectItem value="improvement">Melhoria</SelectItem>
            <SelectItem value="risk">Risco Materializado</SelectItem>
            <SelectItem value="process">Processo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center"><div className="text-2xl font-bold">{lessons.length}</div><p className="text-xs text-muted-foreground">Total</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><div className="text-2xl font-bold text-green-600">{lessons.filter(l => l.lesson_type === "success").length}</div><p className="text-xs text-muted-foreground">Boas Práticas</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><div className="text-2xl font-bold text-blue-600">{lessons.filter(l => l.lesson_type === "improvement").length}</div><p className="text-xs text-muted-foreground">Melhorias</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><div className="text-2xl font-bold text-red-600">{lessons.filter(l => l.lesson_type === "risk").length}</div><p className="text-xs text-muted-foreground">Riscos</p></CardContent></Card>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhuma lição registada.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(lesson => (
            <Card key={lesson.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColors[lesson.lesson_type] || "bg-muted"}`}>
                        {typeLabels[lesson.lesson_type] || lesson.lesson_type}
                      </span>
                      <Badge variant="outline" className="text-xs">{lesson.project_name}</Badge>
                    </div>
                    <h3 className="font-semibold">{lesson.title}</h3>
                    {lesson.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{lesson.description}</p>}
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span>{lesson.author_name || "Anónimo"}</span>
                      <span>•</span>
                      <span>{new Date(lesson.created_at).toLocaleDateString("pt-AO")}</span>
                      {lesson.tags && lesson.tags.length > 0 && (
                        <>
                          <span>•</span>
                          <div className="flex gap-1">{lesson.tags.map(t => <span key={t} className="flex items-center gap-0.5"><Tag className="h-3 w-3" />{t}</span>)}</div>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(lesson)}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteLesson.mutate(lesson.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Editar Lição" : "Nova Lição Aprendida"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {!editing && (
              <div>
                <Label>Projecto</Label>
                <Select value={form.project_id} onValueChange={v => setForm(f => ({ ...f, project_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar projecto" /></SelectTrigger>
                  <SelectContent>{projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>Tipo</Label>
              <Select value={form.lesson_type} onValueChange={v => setForm(f => ({ ...f, lesson_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="success">Boas Práticas</SelectItem>
                  <SelectItem value="improvement">Melhoria</SelectItem>
                  <SelectItem value="risk">Risco Materializado</SelectItem>
                  <SelectItem value="process">Processo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Título</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div><Label>Descrição</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={4} /></div>
            <div><Label>Tags (separadas por vírgula)</Label><Input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="gestão, comunicação, risco" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!form.title || (!editing && !form.project_id)}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
