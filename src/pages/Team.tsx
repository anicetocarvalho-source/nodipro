import { useState, useMemo } from "react";
import { Plus, Search, Mail, Phone, MoreHorizontal, Calendar, CheckCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useProjects } from "@/hooks/useProjects";
import { usePermissions } from "@/hooks/usePermissions";
import { toast } from "sonner";

const statusConfig: Record<string, { label: string; className: string }> = {
  available: { label: "Disponível", className: "bg-success" },
  busy: { label: "Ocupado", className: "bg-destructive" },
  away: { label: "Ausente", className: "bg-warning" },
  offline: { label: "Offline", className: "bg-muted-foreground" },
};

export default function Team() {
  const queryClient = useQueryClient();
  const { organization } = useOrganization();
  const orgId = organization?.id;
  const { data: projects } = useProjects();
  const { canManageTeam } = usePermissions();

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["team_members_all", orgId],
    queryFn: async () => {
      // Get all team members across all org projects + org-level members
      const { data, error } = await supabase
        .from("team_members")
        .select("*, projects(name)")
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });

  const createMember = useMutation({
    mutationFn: async (member: Record<string, unknown>) => {
      const { error } = await supabase.from("team_members").insert([{ ...member, organization_id: orgId } as any]);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["team_members_all"] }); toast.success("Membro adicionado"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMember = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("team_members").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["team_members_all"] }); toast.success("Membro removido"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [showForm, setShowForm] = useState(false);

  const departments = useMemo(() => {
    const depts = new Set(members.map((m: any) => m.department).filter(Boolean));
    return ["all", ...Array.from(depts)];
  }, [members]);

  const filteredMembers = useMemo(() => {
    return members.filter((member: any) => {
      const matchesSearch = member.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.role?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDepartment = selectedDepartment === "all" || member.department === selectedDepartment;
      return matchesSearch && matchesDepartment;
    });
  }, [members, searchQuery, selectedDepartment]);

  if (isLoading) {
    return <div className="space-y-6"><Skeleton className="h-10 w-64" /><div className="grid grid-cols-4 gap-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-28" />)}</div><div className="grid grid-cols-3 gap-4">{[1,2,3].map(i => <Skeleton key={i} className="h-48" />)}</div></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestão de Equipa</h1>
          <p className="text-muted-foreground">Gerir membros da equipa, disponibilidade e carga de trabalho.</p>
        </div>
        {canManageTeam && <Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4 mr-2" />Adicionar Membro</Button>}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Membros</p><p className="text-2xl font-bold">{members.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Disponíveis</p><p className="text-2xl font-bold text-success">{members.filter((m: any) => m.status === "available").length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Departamentos</p><p className="text-2xl font-bold">{departments.length - 1}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Projectos Atribuídos</p><p className="text-2xl font-bold">{new Set(members.map((m: any) => m.project_id).filter(Boolean)).size}</p></CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Pesquisar membros..." className="pl-9" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
        {departments.length > 1 && (
          <Tabs value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <TabsList>{departments.map(dept => <TabsTrigger key={dept} value={dept}>{dept === "all" ? "Todos" : dept}</TabsTrigger>)}</TabsList>
          </Tabs>
        )}
      </div>

      {/* Team Grid */}
      {filteredMembers.length === 0 ? (
        <Card className="p-12 text-center"><p className="text-muted-foreground">Nenhum membro encontrado. Adicione o primeiro.</p></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredMembers.map((member: any) => (
            <Card key={member.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <Avatar className="h-14 w-14">
                      <AvatarImage src={member.avatar_url} />
                      <AvatarFallback className="bg-primary/10 text-primary text-lg">{member.initials}</AvatarFallback>
                    </Avatar>
                    <div className={cn("absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-card", statusConfig[member.status || "available"]?.className || "bg-muted")} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold truncate">{member.name}</h3>
                        <p className="text-sm text-muted-foreground">{member.role || "Sem cargo"}</p>
                      </div>
                      {canManageTeam && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="text-destructive" onClick={() => deleteMember.mutate(member.id)}>Remover</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                    {member.department && <Badge variant="secondary" className="mt-2 text-xs">{member.department}</Badge>}
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  {(member.email || member.phone) && (
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {member.email && <div className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /><span className="truncate">{member.email}</span></div>}
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{(member as any).projects?.name || "Sem projecto"}</span>
                    </div>
                    <Badge className={cn("text-xs", statusConfig[member.status || "available"]?.label ? "" : "", 
                      member.status === "available" ? "bg-success/10 text-success" : 
                      member.status === "busy" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"
                    )}>{statusConfig[member.status || "available"]?.label || "Disponível"}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && <TeamMemberFormModal open onClose={() => setShowForm(false)} projects={projects || []}
        onSubmit={(data: any) => createMember.mutate(data)} />}
    </div>
  );
}

function TeamMemberFormModal({ open, onClose, projects, onSubmit }: any) {
  const [form, setForm] = useState({
    name: "", initials: "", role: "", department: "", email: "", phone: "", project_id: "", status: "available",
  });
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));
  const handleSubmit = () => {
    const initials = form.initials || form.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
    onSubmit({ ...form, initials, project_id: form.project_id || undefined });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Adicionar Membro</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div><Label>Nome *</Label><Input value={form.name} onChange={e => set("name", e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Cargo</Label><Input value={form.role} onChange={e => set("role", e.target.value)} /></div>
            <div><Label>Departamento</Label><Input value={form.department} onChange={e => set("department", e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Email</Label><Input value={form.email} onChange={e => set("email", e.target.value)} /></div>
            <div><Label>Telefone</Label><Input value={form.phone} onChange={e => set("phone", e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Projecto</Label>
              <Select value={form.project_id} onValueChange={v => set("project_id", v)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>{projects.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Estado</Label>
              <Select value={form.status} onValueChange={v => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Disponível</SelectItem>
                  <SelectItem value="busy">Ocupado</SelectItem>
                  <SelectItem value="away">Ausente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Cancelar</Button><Button onClick={handleSubmit} disabled={!form.name}>Guardar</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
