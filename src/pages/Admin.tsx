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
import { Users, Shield, Search, UserCog, Trash2, Loader2, Mail, Send, Clock, CheckCircle2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

const roleLabels: Record<AppRole, string> = {
  admin: "Administrador",
  manager: "Gestor",
  member: "Membro",
};

const roleBadgeVariants: Record<AppRole, "default" | "secondary" | "outline"> = {
  admin: "default",
  manager: "secondary",
  member: "outline",
};

export default function Admin() {
  const { role: currentUserRole, user: currentUser, loading: authLoading } = useAuthContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  
  // Invitation form state
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<AppRole>("member");
  const [sendingInvite, setSendingInvite] = useState(false);

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

    setUpdatingUserId(userId);

    try {
      // Check if user already has a role entry
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .single();

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

  const handleDeleteInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from("invitations")
        .delete()
        .eq("id", invitationId);

      if (error) throw error;

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

  const expiredInvitations = invitations.filter(
    (inv) => !inv.accepted_at && new Date(inv.expires_at) <= new Date()
  );

  const acceptedInvitations = invitations.filter((inv) => inv.accepted_at);

  const stats = {
    total: users.length,
    admins: users.filter((u) => u.role === "admin").length,
    managers: users.filter((u) => u.role === "manager").length,
    members: users.filter((u) => u.role === "member").length,
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
                    <SelectItem value="manager">Gestor</SelectItem>
                    <SelectItem value="member">Membro</SelectItem>
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
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Utilizadores</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administradores</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.admins}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gestores</CardTitle>
            <UserCog className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary-foreground">{stats.managers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Membros</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.members}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Convites Pendentes</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">{stats.pendingInvites}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
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
                          <SelectItem value="manager">Gestor</SelectItem>
                          <SelectItem value="member">Membro</SelectItem>
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
                      const isPending = !isExpired && !isAccepted;

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
                                      onClick={() => handleDeleteInvitation(invitation.id)}
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
      </Tabs>
    </div>
  );
}
