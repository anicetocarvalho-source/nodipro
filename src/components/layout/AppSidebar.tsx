import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard, FolderKanban, Briefcase, BarChart3, AlertTriangle, Users, FileText,
  MessageSquare, Wallet, ClipboardList, ChevronLeft, ChevronRight, ChevronDown, Settings,
  HelpCircle, LogOut, ShieldCheck, Layers, Building2, Grid3X3, Gauge, ShoppingBag,
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
  labelKey: string;
  path: string;
  requiresPermission?: keyof ReturnType<typeof usePermissions>;
}

interface MenuGroup {
  labelKey: string;
  items: MenuItem[];
}

export function AppSidebar() {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const permissions = usePermissions();
  const { signOut } = useAuthContext();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    planning: true, operations: true, management: true,
  });

  const toggleGroup = (key: string) => {
    setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const menuGroups: MenuGroup[] = [
    {
      labelKey: "nav.planning",
      items: [
        { icon: LayoutDashboard, labelKey: "nav.dashboard", path: "/dashboard" },
        { icon: Building2, labelKey: "nav.governance", path: "/governance", requiresPermission: "canViewBudget" },
        { icon: FolderKanban, labelKey: "nav.projects", path: "/projects" },
        { icon: Briefcase, labelKey: "nav.portfolio", path: "/portfolio" },
      ],
    },
    {
      labelKey: "nav.operations",
      items: [
        { icon: Layers, labelKey: "nav.methodologies", path: "/methodologies" },
        { icon: Grid3X3, labelKey: "nav.logframe", path: "/logframe" },
        { icon: BarChart3, labelKey: "nav.kpi", path: "/kpi" },
        { icon: Gauge, labelKey: "nav.evm", path: "/evm", requiresPermission: "canViewBudget" },
        { icon: ShoppingBag, labelKey: "nav.procurement", path: "/procurement", requiresPermission: "canViewBudget" },
        { icon: AlertTriangle, labelKey: "nav.risks", path: "/risks", requiresPermission: "canManageRisks" },
        { icon: Users, labelKey: "nav.team", path: "/team" },
      ],
    },
    {
      labelKey: "nav.management",
      items: [
        { icon: FileText, labelKey: "nav.documents", path: "/documents" },
        { icon: MessageSquare, labelKey: "nav.communication", path: "/communication" },
        { icon: Wallet, labelKey: "nav.budget", path: "/budget", requiresPermission: "canViewBudget" },
        { icon: ClipboardList, labelKey: "nav.reports", path: "/reports", requiresPermission: "canAccessReports" },
      ],
    },
  ];

  const bottomMenuItems: MenuItem[] = [
    { icon: Settings, labelKey: "nav.settings", path: "/settings" },
    { icon: HelpCircle, labelKey: "nav.help", path: "/help" },
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
    const label = t(item.labelKey);

    const content = (
      <NavLink
        to={item.path}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200",
          "hover:bg-sidebar-accent group",
          active ? "bg-sidebar-primary text-sidebar-primary-foreground" : "text-sidebar-foreground/80 hover:text-sidebar-foreground"
        )}
      >
        <Icon className={cn("h-4.5 w-4.5 flex-shrink-0", active && "text-sidebar-primary-foreground")} />
        {!collapsed && (
          <span className={cn("text-sm font-medium truncate", active && "text-sidebar-primary-foreground")}>
            {label}
          </span>
        )}
      </NavLink>
    );

    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" className="bg-foreground text-background">{label}</TooltipContent>
        </Tooltip>
      );
    }
    return content;
  };

  return (
    <aside className={cn("fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col", collapsed ? "w-16" : "w-64")}>
      <div className="h-16 flex items-center justify-center px-4 border-b border-sidebar-border">
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <NavLink to="/">
              <img src={logoLight} alt="NODIPRO" className={cn("h-8 object-contain transition-all duration-300 hover:scale-105 hover:brightness-110 cursor-pointer", collapsed ? "w-8" : "w-auto max-w-[180px]")} />
            </NavLink>
          </TooltipTrigger>
          <TooltipContent side="right" className="bg-foreground text-background">{t("nav.goToDashboard")}</TooltipContent>
        </Tooltip>
      </div>

      <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)} className="absolute -right-3 top-20 h-6 w-6 rounded-full bg-card border border-border shadow-sm hover:bg-accent">
        {collapsed ? <ChevronRight className="h-3 w-3 text-foreground" /> : <ChevronLeft className="h-3 w-3 text-foreground" />}
      </Button>

      <nav className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-1">
        {menuGroups.map((group) => {
          const visibleItems = filterItems(group.items);
          if (visibleItems.length === 0) return null;
          const groupKey = group.labelKey.split(".")[1];

          if (collapsed) {
            return visibleItems.map((item) => <MenuItemComponent key={item.path} item={item} />);
          }

          return (
            <Collapsible key={group.labelKey} open={openGroups[groupKey] !== false} onOpenChange={() => toggleGroup(groupKey)}>
              <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/50 hover:text-sidebar-foreground/70 transition-colors">
                <span>{t(group.labelKey)}</span>
                <ChevronDown className={cn("h-3 w-3 transition-transform duration-200", openGroups[groupKey] !== false ? "rotate-0" : "-rotate-90")} />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-0.5 mt-0.5">
                {visibleItems.map((item) => <MenuItemComponent key={item.path} item={item} />)}
              </CollapsibleContent>
            </Collapsible>
          );
        })}
        {permissions.canAccessAdmin && (
          <MenuItemComponent item={{ icon: ShieldCheck, labelKey: "nav.admin", path: "/admin" }} />
        )}
      </nav>

      <div className="border-t border-sidebar-border p-3 space-y-1">
        {bottomMenuItems.map((item) => <MenuItemComponent key={item.path} item={item} />)}
        <button onClick={signOut} className={cn("flex items-center gap-3 px-3 py-2 rounded-lg w-full transition-all duration-200", "text-sidebar-foreground/80 hover:text-destructive hover:bg-destructive/10")}>
          <LogOut className="h-4.5 w-4.5 flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">{t("nav.logout")}</span>}
        </button>
      </div>
    </aside>
  );
}
