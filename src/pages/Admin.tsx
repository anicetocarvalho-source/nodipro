import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AppRole } from "@/hooks/useAuth";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Users, Shield, Search, UserCog, Trash2, Loader2, Mail, Send, Clock, CheckCircle2, History, UserPlus, UserMinus, RefreshCw, Filter, CalendarDays, X, Settings, Eye } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, isAfter, isBefore, startOfDay, endOfDay } from "date-fns";
import { pt } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PermissionsManager } from "@/components/admin/PermissionsManager";
import { EffectivePermissionsViewer } from "@/components/admin/EffectivePermissionsViewer";
import { AdminPaymentManager } from "@/components/subscription/AdminPaymentManager";
import { usePayments } from "@/hooks/usePayments";
import { Banknote } from "lucide-react";

interface UserWithRole {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string;
  role: AppRole;
  created_at: string;
}

interface Invitation {
  id: string;
  email: string;
  role: AppRole;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

interface AuditLog {
  id: string;
  user_id: string;
  user_name: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  target_name: string | null;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
}

const roleLabels: Record<AppRole, string> = {
  admin: "Administrador",
  portfolio_manager: "Gestor de Portfólio",
  project_manager: "Gestor de Projecto",
  manager: "Gestor",
  member: "Membro",
  observer: "Observador",
};

const roleBadgeVariants: Record<AppRole, "default" | "secondary" | "outline" | "destructive"> = {
  admin: "default",
  portfolio_manager: "secondary",
  project_manager: "secondary",
  manager: "secondary",
  member: "outline",
  observer: "outline",
};

const actionLabels: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  role_change: { label: "Alteração de Role", icon: <RefreshCw className="h-4 w-4" />, color: "text-blue-500" },
  user_delete: { label: "Utilizador Eliminado", icon: <UserMinus className="h-4 w-4" />, color: "text-red-500" },
  invitation_sent: { label: "Convite Enviado", icon: <Mail className="h-4 w-4" />, color: "text-green-500" },
  invitation_delete: { label: "Convite Eliminado", icon: <Trash2 className="h-4 w-4" />, color: "text-orange-500" },
  user_create: { label: "Utilizador Criado", icon: <UserPlus className="h-4 w-4" />, color: "text-emerald-500" },
};

export default function Admin() {
  const { role: currentUserRole, user: currentUser, loading: authLoading } = useAuthContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  
  // Invitation form state
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<AppRole>("member");
  
  // Audit log filters
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [userFilter, setUserFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [sendingInvite, setSendingInvite] = useState(false);
  const { payments: allPayments, confirmPayment, cancelPayment } = usePayments();

  // Helper function to get current user's name
  const getCurrentUserName = () => {
    const currentProfile = users.find(u => u.user_id === currentUser?.id);
    return currentProfile?.full_name || currentUser?.email || "Admin";
  };

  // Log audit action
  const logAuditAction = async (
    action: string,
    targetType: string,
    targetId: string | null,
    targetName: string | null,
    oldValue: string | null = null,
    newValue: string | null = null
  ) => {
    try {
      const { error } = await supabase
        .from("audit_logs")
        .insert({
          user_id: currentUser?.id,
          user_name: getCurrentUserName(),
          action,
          target_type: targetType,
          target_id: targetId,
          target_name: targetName,
          old_value: oldValue,
          new_value: newValue,
        });

      if (error) {
        console.error("Error logging audit action:", error);
      } else {
        // Refresh audit logs
        fetchAuditLogs();
      }
    } catch (error) {
      console.error("Error logging audit action:", error);
    }
  };

  // Fetch audit logs
  const fetchAuditLogs = async () => {
    try {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      setAuditLogs(data || []);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
    } finally {
      setLogsLoading(false);
    }
  };

  // Redirect non-admins
  useEffect(() => {
    if (!authLoading && currentUserRole !== "admin") {
      toast({
        variant: "destructive",
        title: "Acesso negado",
        description: "Apenas administradores podem aceder a esta página",
      });
      navigate("/projects");
    }
  }, [currentUserRole, authLoading, navigate, toast]);

  // Fetch users with their roles and invitations
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch profiles
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false });

        if (profilesError) throw profilesError;

        // Fetch user roles
        const { data: roles, error: rolesError } = await supabase
          .from("user_roles")
          .select("*");

        if (rolesError) throw rolesError;

        // Create a map of user_id to role
        const roleMap = new Map<string, AppRole>();
        roles?.forEach((r) => {
          roleMap.set(r.user_id, r.role as AppRole);
        });

        // Combine profiles with roles
        const usersWithRoles: UserWithRole[] = (profiles || []).map((profile) => ({
          id: profile.id,
          user_id: profile.user_id,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          email: profile.user_id,
          role: roleMap.get(profile.user_id) || "member",
          created_at: profile.created_at,
        }));

        setUsers(usersWithRoles);

        // Fetch invitations
        const { data: invitationsData, error: invitationsError } = await supabase
          .from("invitations")
          .select("*")
          .order("created_at", { ascending: false });

        if (invitationsError) throw invitationsError;

        setInvitations((invitationsData || []).map(inv => ({
          ...inv,
          role: inv.role as AppRole,
        })));

        // Fetch audit logs
        await fetchAuditLogs();
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível carregar os dados",
        });
      } finally {
        setLoading(false);
      }
    };

    if (currentUserRole === "admin") {
      fetchData();
    }
  }, [currentUserRole, toast]);

  const handleRoleChange = async (userId: string, newRole: AppRole) => {
    // Prevent changing own role
    if (userId === currentUser?.id) {
      toast({
        variant: "destructive",
        title: "Operação não permitida",
        description: "Não pode alterar o seu próprio role",
      });
      return;
    }

    const targetUser = users.find(u => u.user_id === userId);
    const oldRole = targetUser?.role;

    setUpdatingUserId(userId);

    try {
      // Check if user already has a role entry
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (existingRole) {
        // Update existing role
        const { error } = await supabase
          .from("user_roles")
          .update({ role: newRole })
          .eq("user_id", userId);

        if (error) throw error;
      } else {
        // Insert new role
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role: newRole });

        if (error) throw error;
      }

      // Update local state
      setUsers((prev) =>
        prev.map((u) =>
          u.user_id === userId ? { ...u, role: newRole } : u
        )
      );

      // Log the action
      await logAuditAction(
        "role_change",
        "user",
        userId,
        targetUser?.full_name || null,
        oldRole ? roleLabels[oldRole] : null,
        roleLabels[newRole]
      );

      toast({
        title: "Role atualizado",
        description: `O utilizador foi atualizado para ${roleLabels[newRole]}`,
      });
    } catch (error) {
      console.error("Error updating role:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar o role",
      });
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string | null) => {
    // Prevent self-deletion
    if (userId === currentUser?.id) {
      toast({
        variant: "destructive",
        title: "Operação não permitida",
        description: "Não pode eliminar a sua própria conta",
      });
      return;
    }

    setDeletingUserId(userId);

    try {
      const { data, error } = await supabase.functions.invoke("delete-user", {
        body: { userId },
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      // Log the action before removing from state
      await logAuditAction(
        "user_delete",
        "user",
        userId,
        userName,
        null,
        null
      );

      // Remove user from local state
      setUsers((prev) => prev.filter((u) => u.user_id !== userId));

      toast({
        title: "Utilizador eliminado",
        description: `${userName || "O utilizador"} foi eliminado com sucesso`,
      });
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível eliminar o utilizador",
      });
    } finally {
      setDeletingUserId(null);
    }
  };

  const handleSendInvitation = async () => {
    if (!inviteEmail || !inviteRole) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Preencha todos os campos",
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail)) {
      toast({
        variant: "destructive",
        title: "Email inválido",
        description: "Por favor introduza um email válido",
      });
      return;
    }

    setSendingInvite(true);

    try {
      const { data, error } = await supabase.functions.invoke("send-invitation", {
        body: { email: inviteEmail, role: inviteRole },
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      // Add new invitation to local state
      if (data?.invitation) {
        setInvitations((prev) => [{
          id: data.invitation.id,
          email: data.invitation.email,
          role: data.invitation.role as AppRole,
          expires_at: data.invitation.expires_at,
          accepted_at: null,
          created_at: new Date().toISOString(),
        }, ...prev]);
      }

      // Log the action
      await logAuditAction(
        "invitation_sent",
        "invitation",
        data?.invitation?.id || null,
        inviteEmail,
        null,
        roleLabels[inviteRole]
      );

      toast({
        title: "Convite enviado",
        description: `Convite enviado para ${inviteEmail}`,
      });

      // Reset form and close dialog
      setInviteEmail("");
      setInviteRole("member");
      setInviteDialogOpen(false);
    } catch (error) {
      console.error("Error sending invitation:", error);
      toast({
        variant: "destructive",
        title: "Erro ao enviar convite",
        description: error instanceof Error ? error.message : "Não foi possível enviar o convite",
      });
    } finally {
      setSendingInvite(false);
    }
  };

  const handleDeleteInvitation = async (invitationId: string, email: string) => {
    try {
      const { error } = await supabase
        .from("invitations")
        .delete()
        .eq("id", invitationId);

      if (error) throw error;

      // Log the action
      await logAuditAction(
        "invitation_delete",
        "invitation",
        invitationId,
        email,
        null,
        null
      );

      setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));

      toast({
        title: "Convite eliminado",
        description: "O convite foi eliminado com sucesso",
      });
    } catch (error) {
      console.error("Error deleting invitation:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível eliminar o convite",
      });
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const filteredUsers = users.filter((user) =>
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingInvitations = invitations.filter(
    (inv) => !inv.accepted_at && new Date(inv.expires_at) > new Date()
  );

  const stats = {
    total: users.length,
    admins: users.filter((u) => u.role === "admin").length,
    portfolioManagers: users.filter((u) => u.role === "portfolio_manager").length,
    projectManagers: users.filter((u) => u.role === "project_manager").length,
    managers: users.filter((u) => u.role === "manager").length,
    members: users.filter((u) => u.role === "member").length,
    observers: users.filter((u) => u.role === "observer").length,
    pendingInvites: pendingInvitations.length,
  };

  if (authLoading || (currentUserRole !== "admin" && !authLoading)) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Administração</h1>
          <p className="text-muted-foreground">
            Gerir utilizadores e atribuir permissões
          </p>
        </div>
        <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Mail className="h-4 w-4" />
              Convidar Utilizador
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Convidar Novo Utilizador</DialogTitle>
              <DialogDescription>
                Envie um convite por email para adicionar um novo utilizador ao sistema.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="utilizador@exemplo.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as AppRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="portfolio_manager">Gestor de Portfólio</SelectItem>
                    <SelectItem value="project_manager">Gestor de Projecto</SelectItem>
                    <SelectItem value="member">Membro</SelectItem>
                    <SelectItem value="observer">Observador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSendInvitation} disabled={sendingInvite} className="gap-2">
                {sendingInvite ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Enviar Convite
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.admins}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gest. Portfólio</CardTitle>
            <UserCog className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.portfolioManagers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gest. Projecto</CardTitle>
            <UserCog className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.projectManagers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Membros</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.members + stats.managers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Convites</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">{stats.pendingInvites}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            Utilizadores
          </TabsTrigger>
          <TabsTrigger value="invitations" className="gap-2">
            <Mail className="h-4 w-4" />
            Convites
            {pendingInvitations.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                {pendingInvitations.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="permissions" className="gap-2">
            <Settings className="h-4 w-4" />
            Permissões
          </TabsTrigger>
          <TabsTrigger value="effective" className="gap-2">
            <Eye className="h-4 w-4" />
            Perm. Efectivas
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-2">
            <Banknote className="h-4 w-4" />
            Pagamentos
            {allPayments.filter(p => p.status === 'pending').length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                {allPayments.filter(p => p.status === 'pending').length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-2">
            <History className="h-4 w-4" />
            Logs de Auditoria
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Utilizadores</CardTitle>
                  <CardDescription>
                    Lista de todos os utilizadores registados no sistema
                  </CardDescription>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Pesquisar utilizadores..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                      <Skeleton className="h-8 w-24" />
                    </div>
                  ))}
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  {searchTerm
                    ? "Nenhum utilizador encontrado com esse nome"
                    : "Nenhum utilizador registado"}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Utilizador</TableHead>
                      <TableHead>Role Atual</TableHead>
                      <TableHead>Data de Registo</TableHead>
                      <TableHead>Alterar Role</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={user.avatar_url || undefined} />
                              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                {getInitials(user.full_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">
                                {user.full_name || "Sem nome"}
                                {user.user_id === currentUser?.id && (
                                  <span className="ml-2 text-xs text-muted-foreground">(Você)</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={roleBadgeVariants[user.role]}>
                            {roleLabels[user.role]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(user.created_at).toLocaleDateString("pt-PT", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={user.role}
                            onValueChange={(value) => handleRoleChange(user.user_id, value as AppRole)}
                            disabled={updatingUserId === user.user_id || user.user_id === currentUser?.id}
                          >
                            <SelectTrigger className="w-36">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Administrador</SelectItem>
                              <SelectItem value="portfolio_manager">Gestor de Portfólio</SelectItem>
                              <SelectItem value="project_manager">Gestor de Projecto</SelectItem>
                              <SelectItem value="member">Membro</SelectItem>
                              <SelectItem value="observer">Observador</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right">
                          {user.user_id === currentUser?.id ? (
                            <span className="text-xs text-muted-foreground">—</span>
                          ) : (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                  disabled={deletingUserId === user.user_id}
                                >
                                  {deletingUserId === user.user_id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Eliminar utilizador</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem a certeza que deseja eliminar{" "}
                                    <span className="font-semibold text-foreground">
                                      {user.full_name || "este utilizador"}
                                    </span>
                                    ? Esta ação é irreversível e todos os dados associados serão permanentemente eliminados.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteUser(user.user_id, user.full_name)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Eliminar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invitations">
          <Card>
            <CardHeader>
              <CardTitle>Convites Enviados</CardTitle>
              <CardDescription>
                Gerir convites pendentes e ver histórico de convites
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                      <Skeleton className="h-8 w-20" />
                    </div>
                  ))}
                </div>
              ) : invitations.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum convite enviado</p>
                  <p className="text-sm mt-1">Clique em "Convidar Utilizador" para enviar um convite</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invitations.map((invitation) => {
                      const isExpired = !invitation.accepted_at && new Date(invitation.expires_at) <= new Date();
                      const isAccepted = !!invitation.accepted_at;

                      return (
                        <TableRow key={invitation.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <span className="font-medium">{invitation.email}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={roleBadgeVariants[invitation.role]}>
                              {roleLabels[invitation.role]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {isAccepted ? (
                              <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Aceite
                              </Badge>
                            ) : isExpired ? (
                              <Badge variant="outline" className="text-muted-foreground">
                                <Clock className="h-3 w-3 mr-1" />
                                Expirado
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-200">
                                <Clock className="h-3 w-3 mr-1" />
                                Pendente
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(invitation.created_at).toLocaleDateString("pt-PT", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </TableCell>
                          <TableCell className="text-right">
                            {!isAccepted && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Eliminar convite</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem a certeza que deseja eliminar o convite para{" "}
                                      <span className="font-semibold text-foreground">
                                        {invitation.email}
                                      </span>
                                      ?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteInvitation(invitation.id, invitation.email)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Eliminar
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions">
          <PermissionsManager />
        </TabsContent>

        <TabsContent value="effective">
          <EffectivePermissionsViewer />
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Logs de Auditoria
                  </CardTitle>
                  <CardDescription>
                    Histórico de todas as ações administrativas realizadas no sistema
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchAuditLogs}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Atualizar
                </Button>
              </div>
              
              {/* Filters Section */}
              <div className="mt-4 flex flex-wrap gap-3 items-center">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Filtros:</span>
                </div>
                
                {/* Action Type Filter */}
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger className="w-[180px] h-9">
                    <SelectValue placeholder="Tipo de ação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as ações</SelectItem>
                    <SelectItem value="role_change">Alteração de Role</SelectItem>
                    <SelectItem value="user_delete">Utilizador Eliminado</SelectItem>
                    <SelectItem value="invitation_sent">Convite Enviado</SelectItem>
                    <SelectItem value="invitation_delete">Convite Eliminado</SelectItem>
                    <SelectItem value="user_create">Utilizador Criado</SelectItem>
                  </SelectContent>
                </Select>
                
                {/* User Filter */}
                <Select value={userFilter} onValueChange={setUserFilter}>
                  <SelectTrigger className="w-[180px] h-9">
                    <SelectValue placeholder="Utilizador" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os utilizadores</SelectItem>
                    {[...new Set(auditLogs.map(log => log.user_name).filter(Boolean))].map((userName) => (
                      <SelectItem key={userName} value={userName!}>
                        {userName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* Date From */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 gap-2">
                      <CalendarDays className="h-4 w-4" />
                      {dateFrom ? format(dateFrom, "dd MMM yyyy", { locale: pt }) : "Data início"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateFrom}
                      onSelect={setDateFrom}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                
                {/* Date To */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 gap-2">
                      <CalendarDays className="h-4 w-4" />
                      {dateTo ? format(dateTo, "dd MMM yyyy", { locale: pt }) : "Data fim"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateTo}
                      onSelect={setDateTo}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                
                {/* Clear Filters */}
                {(actionFilter !== "all" || userFilter !== "all" || dateFrom || dateTo) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 gap-2 text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setActionFilter("all");
                      setUserFilter("all");
                      setDateFrom(undefined);
                      setDateTo(undefined);
                    }}
                  >
                    <X className="h-4 w-4" />
                    Limpar
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 rounded-lg border">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (() => {
                // Apply filters
                const filteredLogs = auditLogs.filter((log) => {
                  // Action filter
                  if (actionFilter !== "all" && log.action !== actionFilter) return false;
                  
                  // User filter
                  if (userFilter !== "all" && log.user_name !== userFilter) return false;
                  
                  // Date from filter
                  if (dateFrom) {
                    const logDate = new Date(log.created_at);
                    if (isBefore(logDate, startOfDay(dateFrom))) return false;
                  }
                  
                  // Date to filter
                  if (dateTo) {
                    const logDate = new Date(log.created_at);
                    if (isAfter(logDate, endOfDay(dateTo))) return false;
                  }
                  
                  return true;
                });
                
                return filteredLogs.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum log de auditoria encontrado</p>
                  <p className="text-sm mt-1">
                    {auditLogs.length > 0 
                      ? "Tente ajustar os filtros de pesquisa" 
                      : "As ações administrativas serão registadas aqui"}
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-3">
                    {filteredLogs.map((log) => {
                      const actionConfig = actionLabels[log.action] || {
                        label: log.action,
                        icon: <History className="h-4 w-4" />,
                        color: "text-muted-foreground",
                      };

                      return (
                        <div
                          key={log.id}
                          className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                        >
                          <div className={`p-2 rounded-full bg-muted ${actionConfig.color}`}>
                            {actionConfig.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium">{actionConfig.label}</span>
                              {log.target_name && (
                                <>
                                  <span className="text-muted-foreground">•</span>
                                  <span className="text-sm text-muted-foreground truncate">
                                    {log.target_name}
                                  </span>
                                </>
                              )}
                            </div>
                            <div className="mt-1 text-sm text-muted-foreground">
                              {log.action === "role_change" && log.old_value && log.new_value && (
                                <span>
                                  Role alterado de{" "}
                                  <Badge variant="outline" className="mx-1 font-normal">
                                    {log.old_value}
                                  </Badge>
                                  para{" "}
                                  <Badge variant="outline" className="ml-1 font-normal">
                                    {log.new_value}
                                  </Badge>
                                </span>
                              )}
                              {log.action === "invitation_sent" && log.new_value && (
                                <span>
                                  Convite enviado com role{" "}
                                  <Badge variant="outline" className="ml-1 font-normal">
                                    {log.new_value}
                                  </Badge>
                                </span>
                              )}
                              {log.action === "user_delete" && (
                                <span>Utilizador removido permanentemente do sistema</span>
                              )}
                              {log.action === "invitation_delete" && (
                                <span>Convite cancelado e removido</span>
                              )}
                            </div>
                            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                              <span>Por: {log.user_name || "Sistema"}</span>
                              <span>•</span>
                              <span>
                                {new Date(log.created_at).toLocaleString("pt-PT", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              );
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <AdminPaymentManager
            payments={allPayments}
            onConfirm={confirmPayment}
            onCancel={cancelPayment}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
