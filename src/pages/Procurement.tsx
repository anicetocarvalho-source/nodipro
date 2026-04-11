import { useState, useMemo } from "react";
import { Plus, ShoppingCart, FileSignature, Users2, Trash2, Pencil, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useProcurement } from "@/hooks/useProcurement";
import { FeatureGate } from "@/components/subscription/FeatureGate";
import { useProjects } from "@/hooks/useProjects";
import {
  PROCUREMENT_METHODS, PROCUREMENT_STATUSES, CONTRACT_TYPES, CONTRACT_STATUSES,
  SUPPLIER_STATUSES, PROCUREMENT_CATEGORIES,
} from "@/types/procurement";

const fmt = (v: number) => new Intl.NumberFormat("pt-AO").format(v);

export default function Procurement() {
  const { data: projects } = useProjects();
  const {
    suppliers, loadingSuppliers, createSupplier, updateSupplier, deleteSupplier,
    plans, loadingPlans, createPlan, updatePlan, deletePlan,
    contracts, loadingContracts, createContract, updateContract, deleteContract,
  } = useProcurement();

  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState<string>("all");

  // Modal state
  const [modalType, setModalType] = useState<"supplier" | "plan" | "contract" | null>(null);
  const [editItem, setEditItem] = useState<any>(null);

  const openCreate = (type: "supplier" | "plan" | "contract") => { setEditItem(null); setModalType(type); };
  const openEdit = (type: "supplier" | "plan" | "contract", item: any) => { setEditItem(item); setModalType(type); };

  const filteredPlans = useMemo(() => {
    let f = plans;
    if (projectFilter !== "all") f = f.filter((p: any) => p.project_id === projectFilter);
    if (search) f = f.filter((p: any) => p.title?.toLowerCase().includes(search.toLowerCase()));
    return f;
  }, [plans, projectFilter, search]);

  const filteredContracts = useMemo(() => {
    let f = contracts;
    if (projectFilter !== "all") f = f.filter((c: any) => c.project_id === projectFilter);
    if (search) f = f.filter((c: any) => c.title?.toLowerCase().includes(search.toLowerCase()));
    return f;
  }, [contracts, projectFilter, search]);

  const filteredSuppliers = useMemo(() => {
    if (!search) return suppliers;
    return suppliers.filter((s: any) => s.name?.toLowerCase().includes(search.toLowerCase()));
  }, [suppliers, search]);

  // Summary stats
  const totalPlanned = plans.reduce((s: number, p: any) => s + Number(p.estimated_amount || 0), 0);
  const totalContracted = contracts.reduce((s: number, c: any) => s + Number(c.amount || 0), 0);
  const activeContracts = contracts.filter((c: any) => c.status === "active").length;

  const isLoading = loadingSuppliers || loadingPlans || loadingContracts;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-4 gap-4">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28" />)}</div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestão de Aquisições</h1>
          <p className="text-sm text-muted-foreground mt-1">Planos de aquisição, contratos e fornecedores</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-5">
          <ShoppingCart className="h-5 w-5 text-muted-foreground mb-2" />
          <p className="text-2xl font-bold">{plans.length}</p>
          <p className="text-xs text-muted-foreground">Planos de Aquisição</p>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <FileSignature className="h-5 w-5 text-muted-foreground mb-2" />
          <p className="text-2xl font-bold">{activeContracts}</p>
          <p className="text-xs text-muted-foreground">Contratos Activos</p>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <Users2 className="h-5 w-5 text-muted-foreground mb-2" />
          <p className="text-2xl font-bold">{suppliers.length}</p>
          <p className="text-xs text-muted-foreground">Fornecedores</p>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <ShoppingCart className="h-5 w-5 text-muted-foreground mb-2" />
          <p className="text-2xl font-bold">{fmt(totalContracted)} AOA</p>
          <p className="text-xs text-muted-foreground">Valor Contratado</p>
        </CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Pesquisar..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-[220px]"><SelectValue placeholder="Todos os projectos" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os projectos</SelectItem>
            {projects?.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="plans">
        <TabsList>
          <TabsTrigger value="plans">Planos ({filteredPlans.length})</TabsTrigger>
          <TabsTrigger value="contracts">Contratos ({filteredContracts.length})</TabsTrigger>
          <TabsTrigger value="suppliers">Fornecedores ({filteredSuppliers.length})</TabsTrigger>
        </TabsList>

        {/* PLANS TAB */}
        <TabsContent value="plans">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Planos de Aquisição</CardTitle>
              <Button size="sm" onClick={() => openCreate("plan")}><Plus className="h-4 w-4 mr-1" />Novo Plano</Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Projecto</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Valor Est.</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-[80px]" />
                  </TableRow></TableHeader>
                  <TableBody>
                    {filteredPlans.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Sem planos de aquisição</TableCell></TableRow>}
                    {filteredPlans.map((p: any) => {
                      const proj = projects?.find((pr: any) => pr.id === p.project_id);
                      const method = PROCUREMENT_METHODS.find(m => m.value === p.procurement_method);
                      const st = PROCUREMENT_STATUSES.find(s => s.value === p.status);
                      const cat = PROCUREMENT_CATEGORIES.find(c => c.value === p.category);
                      return (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{p.title}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{proj?.name || "—"}</TableCell>
                          <TableCell className="text-xs">{method?.label || p.procurement_method}</TableCell>
                          <TableCell className="text-xs">{cat?.label || "—"}</TableCell>
                          <TableCell className="text-right text-xs">{fmt(p.estimated_amount)} AOA</TableCell>
                          <TableCell><Badge className={cn("text-xs", st?.color)}>{st?.label}</Badge></TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit("plan", p)}><Pencil className="h-3.5 w-3.5" /></Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button></AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader><AlertDialogTitle>Eliminar plano?</AlertDialogTitle><AlertDialogDescription>Esta acção não pode ser revertida.</AlertDialogDescription></AlertDialogHeader>
                                  <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => deletePlan.mutate(p.id)}>Eliminar</AlertDialogAction></AlertDialogFooter>
                                </AlertDialogContent>
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
        </TabsContent>

        {/* CONTRACTS TAB */}
        <TabsContent value="contracts">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Contratos</CardTitle>
              <Button size="sm" onClick={() => openCreate("contract")}><Plus className="h-4 w-4 mr-1" />Novo Contrato</Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Nº Contrato</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-[80px]" />
                  </TableRow></TableHeader>
                  <TableBody>
                    {filteredContracts.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Sem contratos</TableCell></TableRow>}
                    {filteredContracts.map((c: any) => {
                      const ct = CONTRACT_TYPES.find(t => t.value === c.contract_type);
                      const st = CONTRACT_STATUSES.find(s => s.value === c.status);
                      const supplierName = (c as any).suppliers?.name;
                      return (
                        <TableRow key={c.id}>
                          <TableCell className="font-medium">{c.title}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{c.contract_number || "—"}</TableCell>
                          <TableCell className="text-xs">{supplierName || "—"}</TableCell>
                          <TableCell className="text-xs">{ct?.label || c.contract_type}</TableCell>
                          <TableCell className="text-right text-xs">{fmt(c.amount)} AOA</TableCell>
                          <TableCell><Badge className={cn("text-xs", st?.color)}>{st?.label}</Badge></TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit("contract", c)}><Pencil className="h-3.5 w-3.5" /></Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button></AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader><AlertDialogTitle>Eliminar contrato?</AlertDialogTitle><AlertDialogDescription>Esta acção não pode ser revertida.</AlertDialogDescription></AlertDialogHeader>
                                  <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => deleteContract.mutate(c.id)}>Eliminar</AlertDialogAction></AlertDialogFooter>
                                </AlertDialogContent>
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
        </TabsContent>

        {/* SUPPLIERS TAB */}
        <TabsContent value="suppliers">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Fornecedores</CardTitle>
              <Button size="sm" onClick={() => openCreate("supplier")}><Plus className="h-4 w-4 mr-1" />Novo Fornecedor</Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>NIF</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-[80px]" />
                  </TableRow></TableHeader>
                  <TableBody>
                    {filteredSuppliers.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Sem fornecedores</TableCell></TableRow>}
                    {filteredSuppliers.map((s: any) => {
                      const st = SUPPLIER_STATUSES.find(x => x.value === s.status);
                      const cat = PROCUREMENT_CATEGORIES.find(c => c.value === s.category);
                      return (
                        <TableRow key={s.id}>
                          <TableCell className="font-medium">{s.name}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{s.tax_id || "—"}</TableCell>
                          <TableCell className="text-xs">{s.contact_email || s.contact_phone || "—"}</TableCell>
                          <TableCell className="text-xs">{cat?.label || "—"}</TableCell>
                          <TableCell><Badge className={cn("text-xs", st?.color)}>{st?.label}</Badge></TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit("supplier", s)}><Pencil className="h-3.5 w-3.5" /></Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button></AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader><AlertDialogTitle>Eliminar fornecedor?</AlertDialogTitle><AlertDialogDescription>Esta acção não pode ser revertida.</AlertDialogDescription></AlertDialogHeader>
                                  <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => deleteSupplier.mutate(s.id)}>Eliminar</AlertDialogAction></AlertDialogFooter>
                                </AlertDialogContent>
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
        </TabsContent>
      </Tabs>

      {/* Form Modals */}
      {modalType === "supplier" && (
        <SupplierFormModal open onClose={() => setModalType(null)} item={editItem}
          onSubmit={(data) => editItem ? updateSupplier.mutate({ id: editItem.id, ...data }) : createSupplier.mutate(data)}
        />
      )}
      {modalType === "plan" && (
        <PlanFormModal open onClose={() => setModalType(null)} item={editItem} projects={projects || []}
          onSubmit={(data) => editItem ? updatePlan.mutate({ id: editItem.id, ...data }) : createPlan.mutate(data)}
        />
      )}
      {modalType === "contract" && (
        <ContractFormModal open onClose={() => setModalType(null)} item={editItem}
          projects={projects || []} suppliers={suppliers} plans={plans}
          onSubmit={(data) => editItem ? updateContract.mutate({ id: editItem.id, ...data }) : createContract.mutate(data)}
        />
      )}
    </div>
  );
}

// --- SUPPLIER FORM MODAL ---
function SupplierFormModal({ open, onClose, item, onSubmit }: { open: boolean; onClose: () => void; item: any; onSubmit: (d: any) => void }) {
  const [form, setForm] = useState({
    name: item?.name || "", tax_id: item?.tax_id || "", contact_name: item?.contact_name || "",
    contact_email: item?.contact_email || "", contact_phone: item?.contact_phone || "",
    address: item?.address || "", category: item?.category || "", status: item?.status || "active", notes: item?.notes || "",
  });
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));
  const handleSubmit = () => { onSubmit(form); onClose(); };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{item ? "Editar" : "Novo"} Fornecedor</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div><Label>Nome *</Label><Input value={form.name} onChange={e => set("name", e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>NIF</Label><Input value={form.tax_id} onChange={e => set("tax_id", e.target.value)} /></div>
            <div><Label>Categoria</Label>
              <Select value={form.category} onValueChange={v => set("category", v)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>{PROCUREMENT_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Contacto</Label><Input value={form.contact_name} onChange={e => set("contact_name", e.target.value)} placeholder="Nome do contacto" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Email</Label><Input value={form.contact_email} onChange={e => set("contact_email", e.target.value)} /></div>
            <div><Label>Telefone</Label><Input value={form.contact_phone} onChange={e => set("contact_phone", e.target.value)} /></div>
          </div>
          <div><Label>Estado</Label>
            <Select value={form.status} onValueChange={v => set("status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{SUPPLIER_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Notas</Label><Textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2} /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Cancelar</Button><Button onClick={handleSubmit} disabled={!form.name}>Guardar</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --- PLAN FORM MODAL ---
function PlanFormModal({ open, onClose, item, projects, onSubmit }: { open: boolean; onClose: () => void; item: any; projects: any[]; onSubmit: (d: any) => void }) {
  const [form, setForm] = useState({
    title: item?.title || "", description: item?.description || "", project_id: item?.project_id || "",
    procurement_method: item?.procurement_method || "direct", estimated_amount: item?.estimated_amount || 0,
    status: item?.status || "planned", category: item?.category || "",
    planned_start_date: item?.planned_start_date || "", planned_end_date: item?.planned_end_date || "",
    funding_source: item?.funding_source || "", notes: item?.notes || "",
  });
  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));
  const handleSubmit = () => { onSubmit({ ...form, estimated_amount: Number(form.estimated_amount) }); onClose(); };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{item ? "Editar" : "Novo"} Plano de Aquisição</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div><Label>Título *</Label><Input value={form.title} onChange={e => set("title", e.target.value)} /></div>
          <div><Label>Projecto *</Label>
            <Select value={form.project_id} onValueChange={v => set("project_id", v)}>
              <SelectTrigger><SelectValue placeholder="Seleccionar projecto" /></SelectTrigger>
              <SelectContent>{projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Método</Label>
              <Select value={form.procurement_method} onValueChange={v => set("procurement_method", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PROCUREMENT_METHODS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Categoria</Label>
              <Select value={form.category} onValueChange={v => set("category", v)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>{PROCUREMENT_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Valor Estimado (AOA)</Label><Input type="number" value={form.estimated_amount} onChange={e => set("estimated_amount", e.target.value)} /></div>
            <div><Label>Estado</Label>
              <Select value={form.status} onValueChange={v => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PROCUREMENT_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Data Início</Label><Input type="date" value={form.planned_start_date} onChange={e => set("planned_start_date", e.target.value)} /></div>
            <div><Label>Data Fim</Label><Input type="date" value={form.planned_end_date} onChange={e => set("planned_end_date", e.target.value)} /></div>
          </div>
          <div><Label>Fonte de Financiamento</Label><Input value={form.funding_source} onChange={e => set("funding_source", e.target.value)} /></div>
          <div><Label>Descrição</Label><Textarea value={form.description} onChange={e => set("description", e.target.value)} rows={2} /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Cancelar</Button><Button onClick={handleSubmit} disabled={!form.title || !form.project_id}>Guardar</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --- CONTRACT FORM MODAL ---
function ContractFormModal({ open, onClose, item, projects, suppliers, plans, onSubmit }: {
  open: boolean; onClose: () => void; item: any; projects: any[]; suppliers: any[]; plans: any[]; onSubmit: (d: any) => void;
}) {
  const [form, setForm] = useState({
    title: item?.title || "", project_id: item?.project_id || "", supplier_id: item?.supplier_id || "",
    procurement_plan_id: item?.procurement_plan_id || "", contract_number: item?.contract_number || "",
    contract_type: item?.contract_type || "fixed_price", amount: item?.amount || 0,
    status: item?.status || "draft", start_date: item?.start_date || "", end_date: item?.end_date || "",
    payment_terms: item?.payment_terms || "", deliverables: item?.deliverables || "", notes: item?.notes || "",
  });
  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));
  const handleSubmit = () => {
    const { supplier_id, procurement_plan_id, ...rest } = form;
    onSubmit({
      ...rest, amount: Number(form.amount),
      supplier_id: supplier_id || null,
      procurement_plan_id: procurement_plan_id || null,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{item ? "Editar" : "Novo"} Contrato</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div><Label>Título *</Label><Input value={form.title} onChange={e => set("title", e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Projecto *</Label>
              <Select value={form.project_id} onValueChange={v => set("project_id", v)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>{projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Nº Contrato</Label><Input value={form.contract_number} onChange={e => set("contract_number", e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Fornecedor</Label>
              <Select value={form.supplier_id} onValueChange={v => set("supplier_id", v)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>{suppliers.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Plano Aquisição</Label>
              <Select value={form.procurement_plan_id} onValueChange={v => set("procurement_plan_id", v)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>{plans.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Tipo</Label>
              <Select value={form.contract_type} onValueChange={v => set("contract_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CONTRACT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Valor (AOA)</Label><Input type="number" value={form.amount} onChange={e => set("amount", e.target.value)} /></div>
          </div>
          <div><Label>Estado</Label>
            <Select value={form.status} onValueChange={v => set("status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CONTRACT_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Data Início</Label><Input type="date" value={form.start_date} onChange={e => set("start_date", e.target.value)} /></div>
            <div><Label>Data Fim</Label><Input type="date" value={form.end_date} onChange={e => set("end_date", e.target.value)} /></div>
          </div>
          <div><Label>Condições de Pagamento</Label><Textarea value={form.payment_terms} onChange={e => set("payment_terms", e.target.value)} rows={2} /></div>
          <div><Label>Entregáveis</Label><Textarea value={form.deliverables} onChange={e => set("deliverables", e.target.value)} rows={2} /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Cancelar</Button><Button onClick={handleSubmit} disabled={!form.title || !form.project_id}>Guardar</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
