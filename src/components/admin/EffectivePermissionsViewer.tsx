import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AppRole, roleLabels } from "@/hooks/useAuth";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { 
  Shield, 
  FolderKanban, 
  CheckSquare, 
  FileText, 
  Wallet, 
  Users, 
  BarChart3,
  Eye,
  Search,
  Check,
  X,
  ArrowUp,
  ArrowDown,
  Minus,
  User,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface UserWithRole {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: AppRole;
}

interface EffectivePermission {
  permission_name: string;
  granted: boolean;
  category: string;
}

interface PermissionOverride {
  permission_id: string;
  granted: boolean;
  project_id: string | null;
}

const categoryConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  project: { label: "Projectos", icon: FolderKanban, color: "text-blue-500" },
  portfolio: { label: "Portfólio", icon: BarChart3, color: "text-purple-500" },
  task: { label: "Tarefas", icon: CheckSquare, color: "text-green-500" },
  document: { label: "Documentos", icon: FileText, color: "text-orange-500" },
  budget: { label: "Orçamento", icon: Wallet, color: "text-emerald-500" },
  team: { label: "Equipa", icon: Users, color: "text-cyan-500" },
  report: { label: "Relatórios", icon: BarChart3, color: "text-indigo-500" },
  admin: { label: "Administração", icon: Shield, color: "text-red-500" },
};

export function EffectivePermissionsViewer() {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<{ role: AppRole; permission_id: string }[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [effectivePermissions, setEffectivePermissions] = useState<EffectivePermission[]>([]);
  const [userOverrides, setUserOverrides] = useState<PermissionOverride[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [profilesResult, rolesResult, permissionsResult, rolePermsResult] = await Promise.all([
        supabase.from("profiles").select("*").order("full_name"),
        supabase.from("user_roles").select("*"),
        supabase.from("permissions").select("*").order("category"),
        supabase.from("role_permissions").select("*"),
      ]);

      if (profilesResult.error) throw profilesResult.error;
      if (rolesResult.error) throw rolesResult.error;
      if (permissionsResult.error) throw permissionsResult.error;
      if (rolePermsResult.error) throw rolePermsResult.error;

      const roleMap = new Map<string, AppRole>();
      rolesResult.data?.forEach((r) => {
        roleMap.set(r.user_id, r.role as AppRole);
      });

      const usersWithRoles: UserWithRole[] = (profilesResult.data || []).map((profile) => ({
        id: profile.id,
        user_id: profile.user_id,
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        role: roleMap.get(profile.user_id) || "member",
      }));

      setUsers(usersWithRoles);
      setPermissions(permissionsResult.data || []);
      setRolePermissions((rolePermsResult.data || []).map(rp => ({
        role: rp.role as AppRole,
        permission_id: rp.permission_id,
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

  const fetchUserPermissions = async (userId: string) => {
    setLoadingPermissions(true);
    try {
      // Fetch effective permissions using the database function
      const { data: effectiveData, error: effectiveError } = await supabase
        .rpc("get_user_permissions", { _user_id: userId });

      if (effectiveError) throw effectiveError;

      setEffectivePermissions(effectiveData || []);

      // Fetch user-specific overrides
      const { data: overridesData, error: overridesError } = await supabase
        .from("user_permission_overrides")
        .select("permission_id, granted, project_id")
        .eq("user_id", userId);

      if (overridesError) throw overridesError;

      setUserOverrides(overridesData || []);
    } catch (error) {
      console.error("Error fetching user permissions:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar as permissões do utilizador",
      });
    } finally {
      setLoadingPermissions(false);
    }
  };

  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId);
    fetchUserPermissions(userId);
  };

  const selectedUser = users.find(u => u.user_id === selectedUserId);

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Group permissions by category
  const groupedPermissions = permissions.reduce((acc, perm) => {
    if (!acc[perm.category]) {
      acc[perm.category] = [];
    }
    acc[perm.category].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  // Check if permission comes from role or override
  const getPermissionSource = (permissionId: string): "role" | "override_grant" | "override_revoke" | "none" => {
    const override = userOverrides.find(o => o.permission_id === permissionId && !o.project_id);
    if (override) {
      return override.granted ? "override_grant" : "override_revoke";
    }
    
    if (selectedUser?.role === "admin") return "role";
    
    const hasRolePermission = rolePermissions.some(
      rp => rp.role === selectedUser?.role && rp.permission_id === permissionId
    );
    
    return hasRolePermission ? "role" : "none";
  };

  const isPermissionGranted = (permissionName: string): boolean => {
    const effective = effectivePermissions.find(ep => ep.permission_name === permissionName);
    return effective?.granted ?? false;
  };

  const filteredUsers = users.filter(user => 
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.user_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-96" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Permissões Efectivas
        </CardTitle>
        <CardDescription>
          Visualize as permissões combinadas (role + overrides) de cada utilizador
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* User Selection */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar utilizador..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <Select value={selectedUserId || ""} onValueChange={handleUserSelect}>
            <SelectTrigger className="w-full sm:w-[300px]">
              <SelectValue placeholder="Selecione um utilizador" />
            </SelectTrigger>
            <SelectContent>
              <ScrollArea className="h-[300px]">
                {filteredUsers.map((user) => (
                  <SelectItem key={user.user_id} value={user.user_id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {getInitials(user.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{user.full_name || "Sem nome"}</span>
                      <Badge variant="outline" className="text-xs ml-1">
                        {roleLabels[user.role].split(" ")[0]}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </ScrollArea>
            </SelectContent>
          </Select>
        </div>

        {/* Selected User Info */}
        {selectedUser && (
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
            <Avatar className="h-12 w-12">
              <AvatarImage src={selectedUser.avatar_url || undefined} />
              <AvatarFallback>{getInitials(selectedUser.full_name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-semibold">{selectedUser.full_name || "Sem nome"}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary">{roleLabels[selectedUser.role]}</Badge>
                {selectedUser.role === "admin" && (
                  <Badge variant="default" className="bg-red-500">
                    <Shield className="h-3 w-3 mr-1" />
                    Todas as permissões
                  </Badge>
                )}
              </div>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <div className="flex items-center gap-2 justify-end">
                <span className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  Concedida
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  Negada
                </span>
              </div>
              <div className="flex items-center gap-2 justify-end mt-1">
                <span className="flex items-center gap-1 text-xs">
                  <ArrowUp className="h-3 w-3 text-emerald-500" />
                  Override +
                </span>
                <span className="flex items-center gap-1 text-xs">
                  <ArrowDown className="h-3 w-3 text-red-500" />
                  Override -
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Permissions Grid */}
        {selectedUserId && (
          <ScrollArea className="h-[500px]">
            {loadingPermissions ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedPermissions).map(([category, perms]) => {
                  const config = categoryConfig[category] || { label: category, icon: Shield, color: "text-gray-500" };
                  const Icon = config.icon;

                  return (
                    <div key={category} className="space-y-2">
                      <div className="flex items-center gap-2 sticky top-0 bg-background py-2">
                        <Icon className={`h-5 w-5 ${config.color}`} />
                        <h4 className="font-semibold">{config.label}</h4>
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[40%]">Permissão</TableHead>
                            <TableHead className="w-[20%] text-center">Estado</TableHead>
                            <TableHead className="w-[20%] text-center">Origem</TableHead>
                            <TableHead className="w-[20%] text-center">Detalhes</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {perms.map((perm) => {
                            const granted = isPermissionGranted(perm.name);
                            const source = getPermissionSource(perm.id);

                            return (
                              <TableRow key={perm.id}>
                                <TableCell>
                                  <div>
                                    <div className="font-medium text-sm">{perm.description}</div>
                                    <div className="text-xs text-muted-foreground font-mono">
                                      {perm.name}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${
                                          granted 
                                            ? "bg-green-100 dark:bg-green-900/30" 
                                            : "bg-red-100 dark:bg-red-900/30"
                                        }`}>
                                          {granted ? (
                                            <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                                          ) : (
                                            <X className="h-4 w-4 text-red-600 dark:text-red-400" />
                                          )}
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        {granted ? "Permissão concedida" : "Permissão negada"}
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </TableCell>
                                <TableCell className="text-center">
                                  {source === "role" && (
                                    <Badge variant="secondary" className="text-xs">
                                      <User className="h-3 w-3 mr-1" />
                                      Role
                                    </Badge>
                                  )}
                                  {source === "override_grant" && (
                                    <Badge variant="default" className="text-xs bg-emerald-500">
                                      <ArrowUp className="h-3 w-3 mr-1" />
                                      Override
                                    </Badge>
                                  )}
                                  {source === "override_revoke" && (
                                    <Badge variant="destructive" className="text-xs">
                                      <ArrowDown className="h-3 w-3 mr-1" />
                                      Override
                                    </Badge>
                                  )}
                                  {source === "none" && (
                                    <Badge variant="outline" className="text-xs">
                                      <Minus className="h-3 w-3 mr-1" />
                                      Nenhum
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell className="text-center">
                                  <span className="text-xs text-muted-foreground">
                                    {source === "role" 
                                      ? `Via ${roleLabels[selectedUser?.role || "member"]}`
                                      : source === "override_grant"
                                      ? "Adicionada manualmente"
                                      : source === "override_revoke"
                                      ? "Removida manualmente"
                                      : "Não atribuída"
                                    }
                                  </span>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        )}

        {!selectedUserId && (
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <User className="h-12 w-12 mb-4 opacity-50" />
            <p>Selecione um utilizador para ver as suas permissões efectivas</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
