import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, X, Shield, Target, Users2 } from "lucide-react";
import { useScrumRoles, useAssignScrumRole, useRemoveScrumRole } from "@/hooks/useScrum";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { SCRUM_ROLE_OPTIONS, ScrumRole } from "@/types/database";
import { Skeleton } from "@/components/ui/skeleton";

interface ScrumRolesManagerProps {
  projectId: string;
}

const roleIcons: Record<ScrumRole, React.ElementType> = {
  product_owner: Target,
  scrum_master: Shield,
  dev_team: Users2,
};

const roleColors: Record<ScrumRole, string> = {
  product_owner: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30",
  scrum_master: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30",
  dev_team: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30",
};

export function ScrumRolesManager({ projectId }: ScrumRolesManagerProps) {
  const { data: roles = [], isLoading } = useScrumRoles(projectId);
  const { data: teamMembers = [] } = useTeamMembers(projectId);
  const assignRole = useAssignScrumRole();
  const removeRole = useRemoveScrumRole();
  const [addingRole, setAddingRole] = useState<ScrumRole | null>(null);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </CardContent>
      </Card>
    );
  }

  const getRolesForType = (role: ScrumRole) => roles.filter(r => r.scrum_role === role);
  
  const getAvailableMembers = (role: ScrumRole) => {
    const assigned = getRolesForType(role).map(r => r.user_name);
    return teamMembers.filter(m => !assigned.includes(m.name));
  };

  const handleAssign = (memberName: string, role: ScrumRole) => {
    const member = teamMembers.find(m => m.name === memberName);
    if (!member) return;
    assignRole.mutate({
      project_id: projectId,
      user_id: member.id,
      user_name: member.name,
      scrum_role: role,
    });
    setAddingRole(null);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Papéis Scrum</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {SCRUM_ROLE_OPTIONS.map(({ value, label }) => {
          const Icon = roleIcons[value];
          const assigned = getRolesForType(value);
          const isSingle = value !== "dev_team";
          const available = getAvailableMembers(value);
          const canAdd = isSingle ? assigned.length === 0 : true;

          return (
            <div key={value} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium">{label}</span>
                </div>
                {canAdd && available.length > 0 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => setAddingRole(addingRole === value ? null : value)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                )}
              </div>
              
              {assigned.length > 0 ? (
                <div className="space-y-1">
                  {assigned.map(role => (
                    <div key={role.id} className="flex items-center justify-between group">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="text-[8px] bg-primary/10 text-primary">
                            {role.user_name?.split(" ").map(n => n[0]).join("").slice(0, 2) || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs">{role.user_name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 opacity-0 group-hover:opacity-100"
                        onClick={() => removeRole.mutate({ id: role.id, projectId })}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-muted-foreground italic">Não atribuído</p>
              )}

              {addingRole === value && (
                <Select onValueChange={(v) => handleAssign(v, value)}>
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue placeholder="Seleccionar membro..." />
                  </SelectTrigger>
                  <SelectContent>
                    {available.map(m => (
                      <SelectItem key={m.id} value={m.name}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
