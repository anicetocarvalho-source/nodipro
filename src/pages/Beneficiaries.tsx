import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Users, Plus, UserCheck, UserX, Trash2, Edit, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useBeneficiaries, BeneficiaryInsert } from "@/hooks/useBeneficiaries";
import { useProjects } from "@/hooks/useProjects";
import { StatCard } from "@/components/dashboard/StatCard";
import { FeatureGate } from "@/components/subscription/FeatureGate";

const genderLabels: Record<string, string> = { male: "Masculino", female: "Feminino", other: "Outro" };
const typeLabels: Record<string, string> = { direct: "Directo", indirect: "Indirecto" };
const statusLabels: Record<string, string> = { active: "Activo", inactive: "Inactivo", completed: "Concluído" };
const ageGroups = ["0-5", "6-14", "15-24", "25-34", "35-44", "45-54", "55-64", "65+"];

export default function Beneficiaries() {
  const { t } = useTranslation();
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const projectId = selectedProject !== "all" ? selectedProject : undefined;

  const { beneficiaries, isLoading, totalDirect, totalIndirect, totalBeneficiaries, genderBreakdown, createBeneficiary, updateBeneficiary, deleteBeneficiary } = useBeneficiaries(projectId);
  const { data: projects = [] } = useProjects();

  const [form, setForm] = useState<Partial<BeneficiaryInsert>>({
    beneficiary_type: "direct",
    gender: null,
    quantity: 1,
    status: "active",
  });

  const handleSubmit = () => {
    if (!form.name || !form.project_id) return;
    if (editingId) {
      updateBeneficiary.mutate({ id: editingId, ...form });
    } else {
      createBeneficiary.mutate(form as BeneficiaryInsert);
    }
    setFormOpen(false);
    setEditingId(null);
    setForm({ beneficiary_type: "direct", gender: null, quantity: 1, status: "active" });
  };

  const handleEdit = (b: typeof beneficiaries[0]) => {
    setForm(b);
    setEditingId(b.id);
    setFormOpen(true);
  };

  return (
    <FeatureGate feature="beneficiaries" featureLabel="Beneficiários">
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" /> Beneficiários
          </h1>
          <p className="text-muted-foreground">Gestão e rastreamento de beneficiários por projecto</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-[220px]"><SelectValue placeholder="Todos os projectos" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os projectos</SelectItem>
              {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={() => { setEditingId(null); setForm({ beneficiary_type: "direct", gender: null, quantity: 1, status: "active", project_id: projectId }); setFormOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" /> Novo Beneficiário
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Beneficiários" value={totalBeneficiaries.toLocaleString()} icon={Users} />
        <StatCard title="Directos" value={totalDirect.toLocaleString()} icon={UserCheck} />
        <StatCard title="Indirectos" value={totalIndirect.toLocaleString()} icon={UserX} />
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Desagregação por Género</CardTitle></CardHeader>
          <CardContent className="pt-0">
            <div className="flex gap-2 text-sm">
              <Badge variant="outline">♂ {genderBreakdown.male}</Badge>
              <Badge variant="outline">♀ {genderBreakdown.female}</Badge>
              <Badge variant="outline">⚧ {genderBreakdown.other}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Género</TableHead>
                <TableHead>Faixa Etária</TableHead>
                <TableHead>Quantidade</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-[100px]">Acções</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">A carregar...</TableCell></TableRow>
              ) : beneficiaries.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum beneficiário registado</TableCell></TableRow>
              ) : (
                beneficiaries.map(b => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.name}</TableCell>
                    <TableCell><Badge variant={b.beneficiary_type === "direct" ? "default" : "secondary"}>{typeLabels[b.beneficiary_type]}</Badge></TableCell>
                    <TableCell>{b.gender ? genderLabels[b.gender] : "—"}</TableCell>
                    <TableCell>{b.age_group || "—"}</TableCell>
                    <TableCell>{b.quantity}</TableCell>
                    <TableCell><Badge variant="outline">{statusLabels[b.status]}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(b)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteBeneficiary.mutate(b.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Form Modal */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingId ? "Editar Beneficiário" : "Novo Beneficiário"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Projecto *</Label>
              <Select value={form.project_id || ""} onValueChange={v => setForm(f => ({ ...f, project_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Seleccionar projecto" /></SelectTrigger>
                <SelectContent>{projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Nome / Grupo *</Label>
              <Input value={form.name || ""} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Comunidade de Viana" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo</Label>
                <Select value={form.beneficiary_type || "direct"} onValueChange={v => setForm(f => ({ ...f, beneficiary_type: v as "direct" | "indirect" }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="direct">Directo</SelectItem>
                    <SelectItem value="indirect">Indirecto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Quantidade</Label>
                <Input type="number" min={1} value={form.quantity || 1} onChange={e => setForm(f => ({ ...f, quantity: parseInt(e.target.value) || 1 }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Género</Label>
                <Select value={form.gender || "none"} onValueChange={v => setForm(f => ({ ...f, gender: v === "none" ? null : v as "male" | "female" | "other" }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Não especificado</SelectItem>
                    <SelectItem value="male">Masculino</SelectItem>
                    <SelectItem value="female">Feminino</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Faixa Etária</Label>
                <Select value={form.age_group || "none"} onValueChange={v => setForm(f => ({ ...f, age_group: v === "none" ? null : v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Não especificado</SelectItem>
                    {ageGroups.map(ag => <SelectItem key={ag} value={ag}>{ag}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={form.description || ""} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Detalhes sobre o beneficiário ou grupo..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={!form.name || !form.project_id}>{editingId ? "Guardar" : "Registar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </FeatureGate>
  );
}
