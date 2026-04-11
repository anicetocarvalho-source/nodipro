import { useState } from "react";
import { Handshake, Plus, Trash2, Edit, Search, ExternalLink } from "lucide-react";
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
import { useFundingAgreements, FundingAgreement } from "@/hooks/useFundingAgreements";
import { useProjects } from "@/hooks/useProjects";
import { Skeleton } from "@/components/ui/skeleton";
import { FeatureGate } from "@/components/subscription/FeatureGate";

const statusLabels: Record<string, string> = {
  negotiation: "Em Negociação", signed: "Assinado", effective: "Em Vigor", closing: "Em Encerramento", closed: "Encerrado", cancelled: "Cancelado",
};
const statusColors: Record<string, string> = {
  negotiation: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  signed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  effective: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  closing: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  closed: "bg-muted text-muted-foreground",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};
const typeLabels: Record<string, string> = {
  grant: "Doação/Grant", loan: "Empréstimo", technical_assistance: "Assistência Técnica", co_financing: "Co-financiamento",
};

const emptyForm = {
  title: "", agreement_number: "", agreement_type: "grant", status: "negotiation",
  total_amount: "0", currency: "AOA", project_id: "", funder_id: "",
  signed_date: "", effective_date: "", closing_date: "",
  disbursement_conditions: "", key_contacts: "", notes: "",
};

export default function FundingAgreements() {
  const { agreements, loading, createAgreement, updateAgreement, deleteAgreement } = useFundingAgreements();
  const { data: projects = [] } = useProjects();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FundingAgreement | null>(null);
  const [form, setForm] = useState(emptyForm);

  const filtered = agreements.filter(a => {
    const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.agreement_number?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalAmount = agreements.reduce((s, a) => s + a.total_amount, 0);
  const totalDisbursed = agreements.reduce((s, a) => s + a.disbursed_amount, 0);
  const activeCount = agreements.filter(a => a.status === "effective").length;

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (a: FundingAgreement) => {
    setEditing(a);
    setForm({
      title: a.title, agreement_number: a.agreement_number || "", agreement_type: a.agreement_type,
      status: a.status, total_amount: String(a.total_amount), currency: a.currency,
      project_id: a.project_id || "", funder_id: a.funder_id || "",
      signed_date: a.signed_date || "", effective_date: a.effective_date || "", closing_date: a.closing_date || "",
      disbursement_conditions: a.disbursement_conditions || "", key_contacts: a.key_contacts || "", notes: a.notes || "",
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const payload = {
      title: form.title,
      agreement_number: form.agreement_number || null,
      agreement_type: form.agreement_type,
      status: form.status,
      total_amount: Number(form.total_amount) || 0,
      currency: form.currency,
      project_id: form.project_id || null,
      funder_id: form.funder_id || null,
      signed_date: form.signed_date || null,
      effective_date: form.effective_date || null,
      closing_date: form.closing_date || null,
      disbursement_conditions: form.disbursement_conditions || null,
      key_contacts: form.key_contacts || null,
      notes: form.notes || null,
    };
    if (editing) {
      await updateAgreement.mutateAsync({ id: editing.id, ...payload });
    } else {
      await createAgreement.mutateAsync(payload);
    }
    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Handshake className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Acordos de Financiamento</h1>
            <p className="text-sm text-muted-foreground">Gestão do ciclo de vida de grants e contratos com financiadores</p>
          </div>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Novo Acordo</Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center"><div className="text-2xl font-bold">{agreements.length}</div><p className="text-xs text-muted-foreground">Total de Acordos</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><div className="text-2xl font-bold text-green-600">{activeCount}</div><p className="text-xs text-muted-foreground">Em Vigor</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><div className="text-2xl font-bold">{totalAmount.toLocaleString("pt-AO")} AOA</div><p className="text-xs text-muted-foreground">Valor Total</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <div className="text-2xl font-bold">{totalAmount > 0 ? Math.round((totalDisbursed / totalAmount) * 100) : 0}%</div>
          <p className="text-xs text-muted-foreground">Desembolsado</p>
          <Progress value={totalAmount > 0 ? (totalDisbursed / totalAmount) * 100 : 0} className="h-1.5 mt-1" />
        </CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Pesquisar acordos…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Estados</SelectItem>
            {Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Nenhum acordo de financiamento registado.</CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Acordo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Desembolsado</TableHead>
                  <TableHead>Projecto</TableHead>
                  <TableHead>Vigência</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(a => {
                  const disbPct = a.total_amount > 0 ? Math.round((a.disbursed_amount / a.total_amount) * 100) : 0;
                  return (
                    <TableRow key={a.id}>
                      <TableCell>
                        <div className="font-medium">{a.title}</div>
                        {a.agreement_number && <span className="text-xs text-muted-foreground">{a.agreement_number}</span>}
                        {a.funder_name && <div className="text-xs text-muted-foreground mt-0.5">{a.funder_name}</div>}
                      </TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{typeLabels[a.agreement_type] || a.agreement_type}</Badge></TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[a.status] || "bg-muted"}`}>
                          {statusLabels[a.status] || a.status}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">{a.total_amount.toLocaleString("pt-AO")} {a.currency}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{disbPct}%</span>
                          <Progress value={disbPct} className="w-16 h-1.5" />
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{a.project_name || "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {a.effective_date ? new Date(a.effective_date).toLocaleDateString("pt-AO") : "—"}
                        {a.closing_date ? ` — ${new Date(a.closing_date).toLocaleDateString("pt-AO")}` : ""}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(a)}><Edit className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteAgreement.mutate(a.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Editar Acordo" : "Novo Acordo de Financiamento"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Título</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Grant Agreement — Banco Mundial" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Nº do Acordo</Label><Input value={form.agreement_number} onChange={e => setForm(f => ({ ...f, agreement_number: e.target.value }))} /></div>
              <div>
                <Label>Tipo</Label>
                <Select value={form.agreement_type} onValueChange={v => setForm(f => ({ ...f, agreement_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(typeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Valor Total</Label><Input type="number" value={form.total_amount} onChange={e => setForm(f => ({ ...f, total_amount: e.target.value }))} /></div>
              <div>
                <Label>Moeda</Label>
                <Select value={form.currency} onValueChange={v => setForm(f => ({ ...f, currency: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AOA">AOA</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Projecto (opcional)</Label>
              <Select value={form.project_id} onValueChange={v => setForm(f => ({ ...f, project_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum</SelectItem>
                  {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Estado</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Data de Assinatura</Label><Input type="date" value={form.signed_date} onChange={e => setForm(f => ({ ...f, signed_date: e.target.value }))} /></div>
              <div><Label>Início de Vigência</Label><Input type="date" value={form.effective_date} onChange={e => setForm(f => ({ ...f, effective_date: e.target.value }))} /></div>
              <div><Label>Data de Encerramento</Label><Input type="date" value={form.closing_date} onChange={e => setForm(f => ({ ...f, closing_date: e.target.value }))} /></div>
            </div>
            <div><Label>Condições de Desembolso</Label><Textarea value={form.disbursement_conditions} onChange={e => setForm(f => ({ ...f, disbursement_conditions: e.target.value }))} rows={3} /></div>
            <div><Label>Contactos-Chave</Label><Textarea value={form.key_contacts} onChange={e => setForm(f => ({ ...f, key_contacts: e.target.value }))} rows={2} /></div>
            <div><Label>Notas</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></div>
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
