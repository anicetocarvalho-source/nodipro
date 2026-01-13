import { Shield, ShieldCheck, User, Eye, Briefcase, FolderKanban } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AppRole } from "@/hooks/useAuth";

interface RoleBadgeProps {
  role: AppRole | null;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const roleConfig: Record<AppRole, { label: string; icon: typeof Shield; className: string }> = {
  admin: {
    label: "Administrador",
    icon: ShieldCheck,
    className: "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20",
  },
  portfolio_manager: {
    label: "Gestor de Portfólio",
    icon: Briefcase,
    className: "bg-purple-500/10 text-purple-600 border-purple-500/20 hover:bg-purple-500/20",
  },
  project_manager: {
    label: "Gestor de Projecto",
    icon: FolderKanban,
    className: "bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/20",
  },
  manager: {
    label: "Gestor",
    icon: Shield,
    className: "bg-warning/10 text-warning border-warning/20 hover:bg-warning/20",
  },
  member: {
    label: "Membro",
    icon: User,
    className: "bg-info/10 text-info border-info/20 hover:bg-info/20",
  },
  observer: {
    label: "Observador",
    icon: Eye,
    className: "bg-muted text-muted-foreground border-border hover:bg-muted/80",
  },
};

const sizeConfig = {
  sm: "text-xs px-2 py-0.5",
  md: "text-sm px-2.5 py-0.5",
  lg: "text-sm px-3 py-1",
};

export function RoleBadge({ role, showIcon = true, size = "md", className }: RoleBadgeProps) {
  if (!role) return null;

  const config = roleConfig[role];
  if (!config) return null;
  
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium gap-1.5 transition-colors",
        sizeConfig[size],
        config.className,
        className
      )}
    >
      {showIcon && <Icon className={cn("h-3 w-3", size === "lg" && "h-3.5 w-3.5")} />}
      {config.label}
    </Badge>
  );
}

export function RoleIndicator({ role }: { role: AppRole | null }) {
  if (!role) return null;

  const config = roleConfig[role];
  if (!config) return null;
  
  const Icon = config.icon;

  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-2 rounded-lg border",
      config.className
    )}>
      <Icon className="h-4 w-4" />
      <div className="flex flex-col">
        <span className="text-xs text-muted-foreground">O seu papel</span>
        <span className="text-sm font-medium">{config.label}</span>
      </div>
    </div>
  );
}
