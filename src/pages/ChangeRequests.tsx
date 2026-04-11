import { useState, useMemo } from "react";
import { Plus, FileEdit, Search, Trash2, Pencil, CheckCircle, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useChangeRequests } from "@/hooks/useChangeRequests";
import { useProjects } from "@/hooks/useProjects";
import { useAuthContext } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { FeatureGate } from "@/components/subscription/FeatureGate";

const statusConfig: Record<string, { icon: any; className: string }> = {
  submitted: { icon: Clock, className: "bg-primary/10 text-primary" },
  under_review: { icon: FileEdit, className: "bg-warning/10 text-warning" },
  approved: { icon: CheckCircle, className: "bg-success/10 text-success" },
  rejected: { icon: XCircle, className: "bg-destructive/10 text-destructive" },
  deferred: { icon: Clock, className: "bg-muted text-muted-foreground" },
  implemented: { icon: CheckCircle, className: "bg-success/20 text-success" },
};

export default function ChangeRequests() {
  const { t } = useTranslation();
  const { profile } = useAuthContext();
  const { data: projects } = useProjects();
  const { changeRequests, isLoading, createChangeRequest, updateChangeRequest, deleteChangeRequest } = useChangeRequests();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);

  const filtered = useMemo(() => {
    if (!search) return changeRequests;
    return changeRequests.filter((cr: any) => cr.title?.toLowerCase().includes(search.toLowerCase()));
  }, [changeRequests, search]);

  if (isLoading) return <div className="space-y-6"><Skeleton className="h-10 w-64" /><Skeleton className="h-96" /></div>;

  const handleReview = (cr: any, status: string) => {
    updateChangeRequest.mutate({
      id: cr.id,
      status,
      reviewed_by_name: profile?.full_name || "—",
      reviewed_at: new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("changeRequests.title")}</h1>
          <p className="text-muted-foreground">{t("changeRequests.subtitle")}</p>
        </div>
        <Button onClick={() => { setEditItem(null); setShowForm(true); }}><Plus className="h-4 w-4 mr-2" />{t("changeRequests.new")}</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">{t("common.total")}</p><p className="text-2xl font-bold">{changeRequests.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">{t("changeRequests.pending")}</p><p className="text-2xl font-bold">{changeRequests.filter((cr: any) => ["submitted", "under_review"].includes(cr.status)).length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">{t("changeRequests.approved")}</p><p className="text-2xl font-bold text-success">{changeRequests.filter((cr: any) => cr.status === "approved").length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">{t("changeRequests.rejected")}</p><p className="text-2xl font-bold text-destructive">{changeRequests.filter((cr: any) => cr.status === "rejected").length}</p></CardContent></Card>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder={t("common.search") + "..."} value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && <Card className="p-12 text-center"><FileEdit className="h-12 w-12 mx-auto text-muted-foreground/40" /><p className="text-muted-foreground mt-4">{t("changeRequests.noRequests")}</p></Card>}
        {filtered.map((cr: any) => {
          const sc = statusConfig[cr.status] || statusConfig.submitted;
          const Icon = sc.icon;
          return (
            <Card key={cr.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className={cn("p-2 rounded-lg", sc.className)}><Icon className="h-5 w-5" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold">{cr.title}</h3>
                        <p className="text-sm text-muted-foreground">{cr.requested_by_name || "—"} · {format(new Date(cr.created_at), "dd/MM/yyyy")}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={sc.className}>{t(`changeRequests.status_${cr.status}`)}</Badge>
                        <Badge variant="outline">{t(`changeRequests.type_${cr.change_type}`)}</Badge>
                        {cr.priority && <Badge variant={cr.priority === "critical" ? "destructive" : "secondary"}>{t(`common.${cr.priority}`)}</Badge>}
                      </div>
                    </div>
                    {cr.description && <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{cr.description}</p>}
                    <div className="mt-3 flex gap-2">
                      {["submitted", "under_review"].includes(cr.status) && (
                        <>
                          <Button size="sm" variant="outline" className="text-success" onClick={() => handleReview(cr, "approved")}><CheckCircle className="h-3.5 w-3.5 mr-1" />{t("changeRequests.approve")}</Button>
                          <Button size="sm" variant="outline" className="text-destructive" onClick={() => handleReview(cr, "rejected")}><XCircle className="h-3.5 w-3.5 mr-1" />{t("changeRequests.reject")}</Button>
                        </>
                      )}
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditItem(cr); setShowForm(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button></AlertDialogTrigger>
                        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{t("common.delete")}?</AlertDialogTitle><AlertDialogDescription>{t("risks.deleteRiskDesc")}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel><AlertDialogAction onClick={() => deleteChangeRequest.mutate(cr.id)}>{t("common.delete")}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {showForm && (
        <CRFormModal open onClose={() => setShowForm(false)} item={editItem} projects={projects || []}
          userName={profile?.full_name || "—"}
          onSubmit={(data) => editItem ? updateChangeRequest.mutate({ id: editItem.id, ...data }) : createChangeRequest.mutate(data)} />
      )}
    </div>
  );
}

function CRFormModal({ open, onClose, item, projects, userName, onSubmit }: any) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    title: item?.title || "", project_id: item?.project_id || "", description: item?.description || "",
    justification: item?.justification || "", change_type: item?.change_type || "scope",
    priority: item?.priority || "medium", impact_description: item?.impact_description || "",
    impact_budget: item?.impact_budget?.toString() || "", requested_by_name: item?.requested_by_name || userName,
  });
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));
  const handleSubmit = () => {
    onSubmit({ ...form, impact_budget: form.impact_budget ? parseFloat(form.impact_budget) : null });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{item ? t("common.edit") : t("changeRequests.new")}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div><Label>{t("common.title")} *</Label><Input value={form.title} onChange={e => set("title", e.target.value)} /></div>
          <div><Label>{t("common.project")} *</Label>
            <Select value={form.project_id} onValueChange={v => set("project_id", v)}>
              <SelectTrigger><SelectValue placeholder={t("risks.selectProject")} /></SelectTrigger>
              <SelectContent>{projects.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>{t("common.type")}</Label>
              <Select value={form.change_type} onValueChange={v => set("change_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["scope", "schedule", "budget", "resource", "quality", "other"].map(t2 => (
                    <SelectItem key={t2} value={t2}>{t(`changeRequests.type_${t2}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div><Label>{t("common.priority")}</Label>
              <Select value={form.priority} onValueChange={v => set("priority", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["low", "medium", "high", "critical"].map(p => (
                    <SelectItem key={p} value={p}>{t(`common.${p}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>{t("common.description")}</Label><Textarea value={form.description} onChange={e => set("description", e.target.value)} rows={2} /></div>
          <div><Label>{t("changeRequests.justification")}</Label><Textarea value={form.justification} onChange={e => set("justification", e.target.value)} rows={2} /></div>
          <div><Label>{t("changeRequests.impactDescription")}</Label><Textarea value={form.impact_description} onChange={e => set("impact_description", e.target.value)} rows={2} /></div>
          <div><Label>{t("changeRequests.budgetImpact")}</Label><Input type="number" value={form.impact_budget} onChange={e => set("impact_budget", e.target.value)} /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>{t("common.cancel")}</Button><Button onClick={handleSubmit} disabled={!form.title || !form.project_id}>{t("common.save")}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
