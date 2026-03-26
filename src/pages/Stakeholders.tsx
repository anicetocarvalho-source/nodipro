import { useState, useMemo } from "react";
import { Plus, Users2, Search, Trash2, Pencil, Grid3X3 } from "lucide-react";
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
import { useStakeholders } from "@/hooks/useStakeholders";
import { useProjects } from "@/hooks/useProjects";
import { useTranslation } from "react-i18next";
import { usePermissions } from "@/hooks/usePermissions";

const categoryColors: Record<string, string> = {
  internal: "bg-primary/10 text-primary",
  external: "bg-secondary/80 text-secondary-foreground",
  government: "bg-warning/10 text-warning",
  donor: "bg-success/10 text-success",
  community: "bg-accent text-accent-foreground",
  partner: "bg-muted text-muted-foreground",
};

export default function Stakeholders() {
  const { t } = useTranslation();
  const { data: projects } = useProjects();
  const { stakeholders, isLoading, createStakeholder, updateStakeholder, deleteStakeholder } = useStakeholders();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);

  const filtered = useMemo(() => {
    if (!search) return stakeholders;
    return stakeholders.filter((s: any) => s.name?.toLowerCase().includes(search.toLowerCase()));
  }, [stakeholders, search]);

  if (isLoading) return <div className="space-y-6"><Skeleton className="h-10 w-64" /><Skeleton className="h-96" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("stakeholders.title")}</h1>
          <p className="text-muted-foreground">{t("stakeholders.subtitle")}</p>
        </div>
        <Button onClick={() => { setEditItem(null); setShowForm(true); }}><Plus className="h-4 w-4 mr-2" />{t("stakeholders.add")}</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">{t("common.total")}</p><p className="text-2xl font-bold">{stakeholders.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">{t("stakeholders.highInfluence")}</p><p className="text-2xl font-bold">{stakeholders.filter((s: any) => s.influence >= 4).length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">{t("stakeholders.highInterest")}</p><p className="text-2xl font-bold">{stakeholders.filter((s: any) => s.interest >= 4).length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">{t("stakeholders.engaged")}</p><p className="text-2xl font-bold">{stakeholders.filter((s: any) => s.status === "engaged").length}</p></CardContent></Card>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder={t("common.search") + "..."} value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">{t("stakeholders.list")} ({filtered.length})</TabsTrigger>
          <TabsTrigger value="matrix">{t("stakeholders.powerInterestMatrix")}</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-6 space-y-3">
          {filtered.length === 0 && <Card className="p-12 text-center"><Users2 className="h-12 w-12 mx-auto text-muted-foreground/40" /><p className="text-muted-foreground mt-4">{t("stakeholders.noStakeholders")}</p></Card>}
          {filtered.map((s: any) => (
            <Card key={s.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{s.name}</h3>
                      <Badge className={categoryColors[s.category] || "bg-muted text-muted-foreground"}>{s.category}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{s.organization_name || s.role || "—"}</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      <span className="text-muted-foreground">{t("stakeholders.influence")}: <strong>{s.influence}/5</strong></span>
                      <span className="text-muted-foreground">{t("stakeholders.interest")}: <strong>{s.interest}/5</strong></span>
                      {s.email && <span className="text-muted-foreground">{s.email}</span>}
                    </div>
                    {s.engagement_strategy && <p className="mt-2 text-sm text-muted-foreground">{s.engagement_strategy}</p>}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditItem(s); setShowForm(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button></AlertDialogTrigger>
                      <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{t("common.delete")}?</AlertDialogTitle><AlertDialogDescription>{t("risks.deleteRiskDesc")}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel><AlertDialogAction onClick={() => deleteStakeholder.mutate(s.id)}>{t("common.delete")}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="matrix" className="mt-6">
          <Card>
            <CardHeader><CardTitle className="text-lg">{t("stakeholders.powerInterestMatrix")}</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 max-w-2xl">
                {[
                  { label: t("stakeholders.manageClosely"), filter: (s: any) => s.influence >= 4 && s.interest >= 4, bg: "bg-destructive/10 border-destructive/30" },
                  { label: t("stakeholders.keepSatisfied"), filter: (s: any) => s.influence >= 4 && s.interest < 4, bg: "bg-warning/10 border-warning/30" },
                  { label: t("stakeholders.keepInformed"), filter: (s: any) => s.influence < 4 && s.interest >= 4, bg: "bg-primary/10 border-primary/30" },
                  { label: t("stakeholders.monitor"), filter: (s: any) => s.influence < 4 && s.interest < 4, bg: "bg-muted border-border" },
                ].map((q, i) => {
                  const items = stakeholders.filter(q.filter);
                  return (
                    <div key={i} className={cn("p-4 rounded-lg border min-h-[120px]", q.bg)}>
                      <p className="text-sm font-semibold mb-2">{q.label}</p>
                      <div className="space-y-1">
                        {items.map((s: any) => <Badge key={s.id} variant="outline" className="mr-1 mb-1">{s.name}</Badge>)}
                        {items.length === 0 && <p className="text-xs text-muted-foreground">—</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 flex gap-6 text-xs text-muted-foreground">
                <span>↑ {t("stakeholders.influence")}</span>
                <span>→ {t("stakeholders.interest")}</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {showForm && (
        <StakeholderFormModal
          open
          onClose={() => setShowForm(false)}
          item={editItem}
          projects={projects || []}
          onSubmit={(data) => {
            if (editItem) updateStakeholder.mutate({ id: editItem.id, ...data });
            else createStakeholder.mutate(data);
          }}
        />
      )}
    </div>
  );
}

function StakeholderFormModal({ open, onClose, item, projects, onSubmit }: any) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    name: item?.name || "", project_id: item?.project_id || "", organization_name: item?.organization_name || "",
    role: item?.role || "", email: item?.email || "", phone: item?.phone || "",
    influence: item?.influence?.toString() || "3", interest: item?.interest?.toString() || "3",
    category: item?.category || "external", engagement_strategy: item?.engagement_strategy || "",
    communication_frequency: item?.communication_frequency || "monthly", status: item?.status || "active", notes: item?.notes || "",
  });
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));
  const handleSubmit = () => { onSubmit({ ...form, influence: parseInt(form.influence), interest: parseInt(form.interest) }); onClose(); };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{item ? t("common.edit") : t("common.create")} Stakeholder</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div><Label>{t("common.name")} *</Label><Input value={form.name} onChange={e => set("name", e.target.value)} /></div>
          <div><Label>{t("common.project")} *</Label>
            <Select value={form.project_id} onValueChange={v => set("project_id", v)}>
              <SelectTrigger><SelectValue placeholder={t("risks.selectProject")} /></SelectTrigger>
              <SelectContent>{projects.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>{t("stakeholders.organizationName")}</Label><Input value={form.organization_name} onChange={e => set("organization_name", e.target.value)} /></div>
            <div><Label>{t("team.role")}</Label><Input value={form.role} onChange={e => set("role", e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Email</Label><Input value={form.email} onChange={e => set("email", e.target.value)} /></div>
            <div><Label>{t("team.phone")}</Label><Input value={form.phone} onChange={e => set("phone", e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>{t("stakeholders.influence")} (1-5)</Label>
              <Select value={form.influence} onValueChange={v => set("influence", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{[1,2,3,4,5].map(n => <SelectItem key={n} value={n.toString()}>{n}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>{t("stakeholders.interest")} (1-5)</Label>
              <Select value={form.interest} onValueChange={v => set("interest", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{[1,2,3,4,5].map(n => <SelectItem key={n} value={n.toString()}>{n}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>{t("stakeholders.categoryLabel")}</Label>
              <Select value={form.category} onValueChange={v => set("category", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="internal">{t("stakeholders.catInternal")}</SelectItem>
                  <SelectItem value="external">{t("stakeholders.catExternal")}</SelectItem>
                  <SelectItem value="government">{t("stakeholders.catGovernment")}</SelectItem>
                  <SelectItem value="donor">{t("stakeholders.catDonor")}</SelectItem>
                  <SelectItem value="community">{t("stakeholders.catCommunity")}</SelectItem>
                  <SelectItem value="partner">{t("stakeholders.catPartner")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>{t("common.status")}</Label>
              <Select value={form.status} onValueChange={v => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{t("common.active")}</SelectItem>
                  <SelectItem value="engaged">{t("stakeholders.engaged")}</SelectItem>
                  <SelectItem value="inactive">Inactivo</SelectItem>
                  <SelectItem value="disengaged">Desinteressado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>{t("stakeholders.engagementStrategy")}</Label><Textarea value={form.engagement_strategy} onChange={e => set("engagement_strategy", e.target.value)} rows={2} /></div>
          <div><Label>{t("kpi.notes")}</Label><Textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2} /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>{t("common.cancel")}</Button><Button onClick={handleSubmit} disabled={!form.name || !form.project_id}>{t("common.save")}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
