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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Users, Shield, Search, UserCog } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface UserWithRole {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string;
  role: AppRole;
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
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

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

  // Fetch users with their roles
  useEffect(() => {
    const fetchUsers = async () => {
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
          email: profile.user_id, // We'll use user_id as placeholder since we can't access auth.users
          role: roleMap.get(profile.user_id) || "member",
          created_at: profile.created_at,
        }));

        setUsers(usersWithRoles);
      } catch (error) {
        console.error("Error fetching users:", error);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível carregar os utilizadores",
        });
      } finally {
        setLoading(false);
      }
    };

    if (currentUserRole === "admin") {
      fetchUsers();
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

  const stats = {
    total: users.length,
    admins: users.filter((u) => u.role === "admin").length,
    managers: users.filter((u) => u.role === "manager").length,
    members: users.filter((u) => u.role === "member").length,
  };

  if (authLoading || (currentUserRole !== "admin" && !authLoading)) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Administração</h1>
        <p className="text-muted-foreground">
          Gerir utilizadores e atribuir permissões
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
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
      </div>

      {/* Users Table */}
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
                  <TableHead className="text-right">Alterar Role</TableHead>
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
                    <TableCell className="text-right">
                      <Select
                        value={user.role}
                        onValueChange={(value) => handleRoleChange(user.user_id, value as AppRole)}
                        disabled={updatingUserId === user.user_id || user.user_id === currentUser?.id}
                      >
                        <SelectTrigger className="w-36 ml-auto">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Administrador</SelectItem>
                          <SelectItem value="manager">Gestor</SelectItem>
                          <SelectItem value="member">Membro</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
