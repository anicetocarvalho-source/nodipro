import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AppRole, roleLabels } from "@/hooks/useAuth";
import { PermissionName } from "@/hooks/usePermissions";
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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, 
  FolderKanban, 
  CheckSquare, 
  FileText, 
  Wallet, 
  Users, 
  BarChart3,
  Settings,
  Loader2,
  Layers,
} from "lucide-react";

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface RolePermission {
  role: AppRole;
  permission_id: string;
}

const categoryConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  project: { label: "Projectos", icon: FolderKanban, color: "text-blue-500" },
  portfolio: { label: "Portfólio", icon: BarChart3, color: "text-purple-500" },
  program: { label: "Programas", icon: Layers, color: "text-violet-500" },
  task: { label: "Tarefas", icon: CheckSquare, color: "text-green-500" },
  document: { label: "Documentos", icon: FileText, color: "text-orange-500" },
  budget: { label: "Orçamento", icon: Wallet, color: "text-emerald-500" },
  team: { label: "Equipa", icon: Users, color: "text-cyan-500" },
  report: { label: "Relatórios", icon: BarChart3, color: "text-indigo-500" },
  admin: { label: "Administração", icon: Shield, color: "text-red-500" },
};

const roles: AppRole[] = ["admin", "portfolio_manager", "project_manager", "member", "observer"];

export function PermissionsManager() {
  const { toast } = useToast();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [permResult, rolePermResult] = await Promise.all([
        supabase.from("permissions").select("*").order("category", { ascending: true }),
        supabase.from("role_permissions").select("*"),
      ]);

      if (permResult.error) throw permResult.error;
      if (rolePermResult.error) throw rolePermResult.error;

      setPermissions(permResult.data || []);
      setRolePermissions((rolePermResult.data || []).map(rp => ({
        ...rp,
        role: rp.role as AppRole,
      })));
    } catch (error) {
      console.error("Error fetching permissions:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar as permissões",
      });
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (role: AppRole, permissionId: string): boolean => {
    return rolePermissions.some(
      (rp) => rp.role === role && rp.permission_id === permissionId
    );
  };

  const togglePermission = async (role: AppRole, permissionId: string, currentlyHas: boolean) => {
    // Don't allow modifying admin permissions
    if (role === "admin") {
      toast({
        variant: "destructive",
        title: "Operação não permitida",
        description: "O role de Administrador tem todas as permissões por defeito",
      });
      return;
    }

    setUpdating(`${role}-${permissionId}`);

    try {
      if (currentlyHas) {
        // Remove permission
        const { error } = await supabase
          .from("role_permissions")
          .delete()
          .eq("role", role)
          .eq("permission_id", permissionId);

        if (error) throw error;

        setRolePermissions((prev) =>
          prev.filter((rp) => !(rp.role === role && rp.permission_id === permissionId))
        );
      } else {
        // Add permission
        const { error } = await supabase
          .from("role_permissions")
          .insert({ role, permission_id: permissionId });

        if (error) throw error;

        setRolePermissions((prev) => [...prev, { role, permission_id: permissionId }]);
      }

      toast({
        title: "Permissão atualizada",
        description: currentlyHas
          ? "Permissão removida com sucesso"
          : "Permissão adicionada com sucesso",
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

  const groupedPermissions = permissions.reduce((acc, perm) => {
    if (!acc[perm.category]) {
      acc[perm.category] = [];
    }
    acc[perm.category].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

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
          <Settings className="h-5 w-5" />
          Matriz de Permissões
        </CardTitle>
        <CardDescription>
          Configure as permissões de cada role. O Administrador tem todas as permissões por defeito.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="project" className="space-y-4">
          <TabsList className="flex-wrap h-auto gap-1">
            {Object.entries(categoryConfig).map(([key, config]) => {
              const Icon = config.icon;
              return (
                <TabsTrigger key={key} value={key} className="gap-1.5">
                  <Icon className={`h-4 w-4 ${config.color}`} />
                  {config.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {Object.entries(groupedPermissions).map(([category, perms]) => {
            const config = categoryConfig[category] || { label: category, icon: Shield, color: "text-gray-500" };
            const Icon = config.icon;

            return (
              <TabsContent key={category} value={category}>
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[300px]">Permissão</TableHead>
                        {roles.map((role) => (
                          <TableHead key={role} className="text-center w-[120px]">
                            <Badge variant="outline" className="text-xs">
                              {roleLabels[role].split(" ")[0]}
                            </Badge>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {perms.map((perm) => (
                        <TableRow key={perm.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium text-sm">{perm.description}</div>
                              <div className="text-xs text-muted-foreground font-mono">
                                {perm.name}
                              </div>
                            </div>
                          </TableCell>
                          {roles.map((role) => {
                            const has = hasPermission(role, perm.id);
                            const isUpdating = updating === `${role}-${perm.id}`;
                            const isAdmin = role === "admin";

                            return (
                              <TableCell key={role} className="text-center">
                                {isUpdating ? (
                                  <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                                ) : (
                                  <Switch
                                    checked={has}
                                    disabled={isAdmin}
                                    onCheckedChange={() => togglePermission(role, perm.id, has)}
                                    className={isAdmin ? "opacity-50 cursor-not-allowed" : ""}
                                  />
                                )}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </TabsContent>
            );
          })}
        </Tabs>
      </CardContent>
    </Card>
  );
}
