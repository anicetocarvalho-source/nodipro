import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  Briefcase,
  BarChart3,
  AlertTriangle,
  Users,
  FileText,
  MessageSquare,
  Wallet,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Settings,
  HelpCircle,
  LogOut,
  ShieldCheck,
  Layers,
  Building2,
  Grid3X3,
  Gauge,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuthContext } from "@/contexts/AuthContext";
import logoLight from "@/assets/logo-light.svg";

interface MenuItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
  requiresPermission?: keyof ReturnType<typeof usePermissions>;
}

interface MenuGroup {
  label: string;
  items: MenuItem[];
}

const bottomMenuItems: MenuItem[] = [
  { icon: Settings, label: "Configurações", path: "/settings" },
  { icon: HelpCircle, label: "Ajuda", path: "/help" },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const permissions = usePermissions();
  const { signOut } = useAuthContext();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    planning: true,
    operations: true,
    management: true,
  });

  const toggleGroup = (key: string) => {
    setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Menu groups organized by function
  const menuGroups: MenuGroup[] = [
    {
      label: "Planeamento",
      items: [
        { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
        { icon: Building2, label: "Governação", path: "/governance", requiresPermission: "canViewBudget" },
        { icon: FolderKanban, label: "Projectos", path: "/projects" },
        { icon: Briefcase, label: "Portfólio", path: "/portfolio" },
      ],
    },
    {
      label: "Operações",
      items: [
        { icon: Layers, label: "Metodologias", path: "/methodologies" },
        { icon: Grid3X3, label: "Quadro Lógico", path: "/logframe" },
        { icon: BarChart3, label: "Indicadores", path: "/kpi" },
        { icon: Gauge, label: "Valor Ganho (EVM)", path: "/evm", requiresPermission: "canViewBudget" },
        { icon: AlertTriangle, label: "Riscos", path: "/risks", requiresPermission: "canManageRisks" },
        { icon: Users, label: "Equipa", path: "/team" },
      ],
    },
    {
      label: "Gestão",
      items: [
        { icon: FileText, label: "Documentos", path: "/documents" },
        { icon: MessageSquare, label: "Comunicação", path: "/communication" },
        { icon: Wallet, label: "Orçamento", path: "/budget", requiresPermission: "canViewBudget" },
        { icon: ClipboardList, label: "Relatórios", path: "/reports", requiresPermission: "canAccessReports" },
      ],
    },
  ];

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const filterItems = (items: MenuItem[]) =>
    items.filter((item) => {
      if (!item.requiresPermission) return true;
      return permissions[item.requiresPermission];
    });

  const MenuItemComponent = ({ item }: { item: MenuItem }) => {
    const Icon = item.icon;
    const active = isActive(item.path);

    const content = (
      <NavLink
        to={item.path}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200",
          "hover:bg-sidebar-accent group",
          active
            ? "bg-sidebar-primary text-sidebar-primary-foreground"
            : "text-sidebar-foreground/80 hover:text-sidebar-foreground"
        )}
      >
        <Icon className={cn("h-4.5 w-4.5 flex-shrink-0", active && "text-sidebar-primary-foreground")} />
        {!collapsed && (
          <span className={cn("text-sm font-medium truncate", active && "text-sidebar-primary-foreground")}>
            {item.label}
          </span>
        )}
      </NavLink>
    );

    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" className="bg-foreground text-background">
            {item.label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return content;
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-center px-4 border-b border-sidebar-border">
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <NavLink to="/">
              <img
                src={logoLight}
                alt="NODIPRO"
                className={cn(
                  "h-8 object-contain transition-all duration-300 hover:scale-105 hover:brightness-110 cursor-pointer",
                  collapsed ? "w-8" : "w-auto max-w-[180px]"
                )}
              />
            </NavLink>
          </TooltipTrigger>
          <TooltipContent side="right" className="bg-foreground text-background">
            Ir para Dashboard
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Toggle button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 h-6 w-6 rounded-full bg-card border border-border shadow-sm hover:bg-accent"
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3 text-foreground" />
        ) : (
          <ChevronLeft className="h-3 w-3 text-foreground" />
        )}
      </Button>

      {/* Main menu with groups */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-1">
        {menuGroups.map((group) => {
          const visibleItems = filterItems(group.items);
          if (visibleItems.length === 0) return null;
          const groupKey = group.label.toLowerCase();

          if (collapsed) {
            // When collapsed, just show icons without groups
            return visibleItems.map((item) => (
              <MenuItemComponent key={item.path} item={item} />
            ));
          }

          return (
            <Collapsible
              key={group.label}
              open={openGroups[groupKey] !== false}
              onOpenChange={() => toggleGroup(groupKey)}
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/50 hover:text-sidebar-foreground/70 transition-colors">
                <span>{group.label}</span>
                <ChevronDown
                  className={cn(
                    "h-3 w-3 transition-transform duration-200",
                    openGroups[groupKey] !== false ? "rotate-0" : "-rotate-90"
                  )}
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-0.5 mt-0.5">
                {visibleItems.map((item) => (
                  <MenuItemComponent key={item.path} item={item} />
                ))}
              </CollapsibleContent>
            </Collapsible>
          );
        })}

        {/* Admin menu - only visible to admins */}
        {permissions.canAccessAdmin && (
          <MenuItemComponent item={{ icon: ShieldCheck, label: "Administração", path: "/admin" }} />
        )}
      </nav>

      {/* Bottom menu */}
      <div className="border-t border-sidebar-border p-3 space-y-1">
        {bottomMenuItems.map((item) => (
          <MenuItemComponent key={item.path} item={item} />
        ))}

        {/* Logout */}
        <button
          onClick={signOut}
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg w-full transition-all duration-200",
            "text-sidebar-foreground/80 hover:text-destructive hover:bg-destructive/10"
          )}
        >
          <LogOut className="h-4.5 w-4.5 flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Sair</span>}
        </button>
      </div>
    </aside>
  );
}
