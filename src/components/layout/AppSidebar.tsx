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
  Settings,
  HelpCircle,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: FolderKanban, label: "Projectos", path: "/projects" },
  { icon: Briefcase, label: "Portfólio", path: "/portfolio" },
  { icon: BarChart3, label: "Indicadores", path: "/kpi" },
  { icon: AlertTriangle, label: "Riscos", path: "/risks" },
  { icon: Users, label: "Equipa", path: "/team" },
  { icon: FileText, label: "Documentos", path: "/documents" },
  { icon: MessageSquare, label: "Comunicação", path: "/communication" },
  { icon: Wallet, label: "Orçamento", path: "/budget" },
  { icon: ClipboardList, label: "Relatórios", path: "/reports" },
];

const bottomMenuItems = [
  { icon: Settings, label: "Configurações", path: "/settings" },
  { icon: HelpCircle, label: "Ajuda", path: "/help" },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const MenuItem = ({ item }: { item: typeof menuItems[0] }) => {
    const Icon = item.icon;
    const active = isActive(item.path);

    const content = (
      <NavLink
        to={item.path}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
          "hover:bg-sidebar-accent group",
          active
            ? "bg-sidebar-primary text-sidebar-primary-foreground"
            : "text-sidebar-foreground/80 hover:text-sidebar-foreground"
        )}
      >
        <Icon className={cn("h-5 w-5 flex-shrink-0", active && "text-sidebar-primary-foreground")} />
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
      <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
              <span className="text-sidebar-primary-foreground font-bold text-lg">N</span>
            </div>
            <span className="text-sidebar-foreground font-semibold text-lg">NODIPRO</span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center mx-auto">
            <span className="text-sidebar-primary-foreground font-bold text-lg">N</span>
          </div>
        )}
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

      {/* Main menu */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-1">
        {menuItems.map((item) => (
          <MenuItem key={item.path} item={item} />
        ))}
      </nav>

      {/* Bottom menu */}
      <div className="border-t border-sidebar-border p-3 space-y-1">
        {bottomMenuItems.map((item) => (
          <MenuItem key={item.path} item={item} />
        ))}
        
        {/* Logout */}
        <button
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg w-full transition-all duration-200",
            "text-sidebar-foreground/80 hover:text-destructive hover:bg-destructive/10"
          )}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Sair</span>}
        </button>
      </div>
    </aside>
  );
}
