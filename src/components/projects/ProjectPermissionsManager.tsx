import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuthContext } from "@/contexts/AuthContext";
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
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Shield, 
  Plus,
  Trash2,
  Loader2,
  UserPlus,
  Lock,
  LockOpen,
} from "lucide-react";

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface UserWithOverrides {
  user_id: string;
  full_name: string;
  email: string;
  initials: string;
  overrides: {
    permission_id: string;
    permission_name: string;
    granted: boolean;
  }[];
}

interface ProjectPermissionsManagerProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const categoryLabels: Record<string, string> = {
  project: "Projectos",
  portfolio: "Portfólio",
  task: "Tarefas",
  document: "Documentos",
  budget: "Orçamento",
  team: "Equipa",
  report: "Relatórios",
  admin: "Administração",
};

// Only show relevant project-level permissions
const projectRelevantCategories = ["project", "task", "document", "budget", "team"];

export function ProjectPermissionsManager({ projectId, open, onOpenChange }: ProjectPermissionsManagerProps) {
  const { toast } = useToast();
  const { user } = useAuthContext();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [usersWithOverrides, setUsersWithOverrides] = useState<UserWithOverrides[]>([]);
  const [allUsers, setAllUsers] = useState<{ id: string; full_name: string; email: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open, projectId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch permissions (only project-relevant)
      const { data: permData, error: permError } = await supabase
        .from("permissions")
        .select("*")
        .in("category", projectRelevantCategories)
        .order("category", { ascending: true });

      if (permError) throw permError;
      setPermissions(permData || []);

      // Fetch user overrides for this project
      const { data: overridesData, error: overridesError } = await supabase
        .from("user_permission_overrides")
        .select(`
          user_id,
          permission_id,
          granted,
          permissions (name, description)
        `)
        .eq("project_id", projectId);

      if (overridesError) throw overridesError;

      // Fetch profiles for users with overrides
      const userIds = [...new Set(overridesData?.map(o => o.user_id) || [])];
      
      let usersMap: Record<string, { full_name: string; email: string }> = {};
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", userIds);
        
        profilesData?.forEach(p => {
          usersMap[p.user_id] = { 
            full_name: p.full_name || "Utilizador", 
            email: "" 
          };
        });
      }

      // Group overrides by user
      const userOverridesMap: Record<string, UserWithOverrides> = {};
      overridesData?.forEach(override => {
        if (!userOverridesMap[override.user_id]) {
          const userInfo = usersMap[override.user_id] || { full_name: "Utilizador", email: "" };
          const initials = userInfo.full_name
            .split(" ")
            .map(n => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
          
          userOverridesMap[override.user_id] = {
            user_id: override.user_id,
            full_name: userInfo.full_name,
            email: userInfo.email,
            initials,
            overrides: [],
          };
        }
        
        userOverridesMap[override.user_id].overrides.push({
          permission_id: override.permission_id,
          permission_name: (override.permissions as any)?.name || "",
          granted: override.granted,
        });
      });

      setUsersWithOverrides(Object.values(userOverridesMap));

      // Fetch all users for the add dialog
      const { data: allProfilesData } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .limit(100);
      
      setAllUsers(
        (allProfilesData || []).map(p => ({
          id: p.user_id,
          full_name: p.full_name || "Utilizador",
          email: "",
        }))
      );
    } catch (error) {
      console.error("Error fetching project permissions:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar as permissões do projecto",
      });
    } finally {
      setLoading(false);
    }
  };

  const getUserOverride = (userId: string, permissionId: string): boolean | null => {
    const userOverrides = usersWithOverrides.find(u => u.user_id === userId);
    const override = userOverrides?.overrides.find(o => o.permission_id === permissionId);
    return override?.granted ?? null;
  };

  const toggleUserPermission = async (userId: string, permissionId: string, currentGranted: boolean | null) => {
    setUpdating(`${userId}-${permissionId}`);

    try {
      if (currentGranted !== null) {
        // Delete or toggle existing override
        if (currentGranted === false) {
          // If currently denied, delete the override (revert to role default)
          const { error } = await supabase
            .from("user_permission_overrides")
            .delete()
            .eq("user_id", userId)
            .eq("permission_id", permissionId)
            .eq("project_id", projectId);

          if (error) throw error;
        } else {
          // If currently granted, set to denied
          const { error } = await supabase
            .from("user_permission_overrides")
            .update({ granted: false })
            .eq("user_id", userId)
            .eq("permission_id", permissionId)
            .eq("project_id", projectId);

          if (error) throw error;
        }
      } else {
        // Create new override (grant permission)
        const { error } = await supabase
          .from("user_permission_overrides")
          .insert({
            user_id: userId,
            permission_id: permissionId,
            project_id: projectId,
            granted: true,
            created_by: user?.id,
          });

        if (error) throw error;
      }

      await fetchData();
      
      toast({
        title: "Permissão atualizada",
        description: "A permissão foi atualizada com sucesso",
      });
    } catch (error) {
      console.error("Error updating permission:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar a permissão",
      });
    } finally {
      setUpdating(null);
    }
  };

  const addUserOverride = async () => {
    if (!selectedUserId) return;

    // Check if user already has overrides
    if (usersWithOverrides.some(u => u.user_id === selectedUserId)) {
      toast({
        variant: "destructive",
        title: "Utilizador já existe",
        description: "Este utilizador já tem permissões configuradas para este projecto",
      });
      return;
    }

    setUpdating("adding");

    try {
      // Add a default permission override to include the user
      const firstPermission = permissions[0];
      if (firstPermission) {
        const { error } = await supabase
          .from("user_permission_overrides")
          .insert({
            user_id: selectedUserId,
            permission_id: firstPermission.id,
            project_id: projectId,
            granted: true,
            created_by: user?.id,
          });

        if (error) throw error;
      }

      await fetchData();
      setAddUserDialogOpen(false);
      setSelectedUserId("");
      
      toast({
        title: "Utilizador adicionado",
        description: "Pode agora configurar as permissões específicas deste utilizador",
      });
    } catch (error) {
      console.error("Error adding user:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível adicionar o utilizador",
      });
    } finally {
      setUpdating(null);
    }
  };

  const removeUserOverrides = async (userId: string) => {
    setUpdating(`remove-${userId}`);

    try {
      const { error } = await supabase
        .from("user_permission_overrides")
        .delete()
        .eq("user_id", userId)
        .eq("project_id", projectId);

      if (error) throw error;

      await fetchData();
      
      toast({
        title: "Permissões removidas",
        description: "Todas as permissões específicas do utilizador foram removidas",
      });
    } catch (error) {
      console.error("Error removing user overrides:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível remover as permissões",
      });
    } finally {
      setUpdating(null);
    }
  };

  const groupedPermissions = permissions.reduce((acc, perm) => {
    if (!acc[perm.category]) {
      acc[perm.category] = [];
    }
    acc[perm.category].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  const getPermissionStateIcon = (granted: boolean | null) => {
    if (granted === true) return <LockOpen className="h-4 w-4 text-success" />;
    if (granted === false) return <Lock className="h-4 w-4 text-destructive" />;
    return <span className="text-muted-foreground text-xs">—</span>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Permissões do Projecto
          </DialogTitle>
          <DialogDescription>
            Configure permissões específicas para utilizadores neste projecto. 
            Estas substituem as permissões do role global.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4 py-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : (
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-6">
              {/* Add user button */}
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  {usersWithOverrides.length} utilizador(es) com permissões específicas
                </p>
                <Button size="sm" onClick={() => setAddUserDialogOpen(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Adicionar Utilizador
                </Button>
              </div>

              {/* Users with overrides */}
              {usersWithOverrides.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Nenhuma permissão específica configurada para este projecto.
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      As permissões dos utilizadores seguem as definições globais dos seus roles.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                usersWithOverrides.map((userOverride) => (
                  <Card key={userOverride.user_id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {userOverride.initials}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-base">{userOverride.full_name}</CardTitle>
                            <CardDescription>{userOverride.overrides.length} permissões configuradas</CardDescription>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => removeUserOverrides(userOverride.user_id)}
                          disabled={updating === `remove-${userOverride.user_id}`}
                        >
                          {updating === `remove-${userOverride.user_id}` ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Permissão</TableHead>
                            <TableHead className="w-[100px] text-center">Estado</TableHead>
                            <TableHead className="w-[100px] text-center">Alternar</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Object.entries(groupedPermissions).map(([category, perms]) => (
                            perms.map((perm) => {
                              const granted = getUserOverride(userOverride.user_id, perm.id);
                              const isUpdating = updating === `${userOverride.user_id}-${perm.id}`;
                              
                              return (
                                <TableRow key={perm.id}>
                                  <TableCell>
                                    <div>
                                      <div className="font-medium text-sm">{perm.description}</div>
                                      <div className="text-xs text-muted-foreground">
                                        <Badge variant="outline" className="text-xs mr-2">
                                          {categoryLabels[perm.category]}
                                        </Badge>
                                        <span className="font-mono">{perm.name}</span>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {getPermissionStateIcon(granted)}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {isUpdating ? (
                                      <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                                    ) : (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => toggleUserPermission(userOverride.user_id, perm.id, granted)}
                                      >
                                        {granted === null ? "Conceder" : granted ? "Negar" : "Remover"}
                                      </Button>
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        )}

        {/* Add User Dialog */}
        <Dialog open={addUserDialogOpen} onOpenChange={setAddUserDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Utilizador</DialogTitle>
              <DialogDescription>
                Selecione um utilizador para configurar permissões específicas neste projecto.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar utilizador..." />
                </SelectTrigger>
                <SelectContent>
                  {allUsers
                    .filter(u => !usersWithOverrides.some(uo => uo.user_id === u.id))
                    .map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.full_name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddUserDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={addUserOverride} disabled={!selectedUserId || updating === "adding"}>
                {updating === "adding" && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Adicionar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
