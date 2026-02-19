import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { User, Settings, CreditCard, ArrowLeft, ChevronLeft, ChevronRight, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { TopBar } from "./TopBar";
import { Breadcrumbs } from "./Breadcrumbs";
import { usePlatformAdmin } from "@/hooks/usePlatformAdmin";
import logoLight from "@/assets/logo-light.svg";

interface AccountLayoutProps {
  children: React.ReactNode;
}

const accountMenuItems = [
  { icon: User, labelKey: "nav.profile", path: "/profile" },
  { icon: Settings, labelKey: "nav.settings", path: "/settings" },
  { icon: CreditCard, labelKey: "nav.subscription", path: "/subscription" },
];

export function AccountLayout({ children }: AccountLayoutProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { isPlatformAdmin } = usePlatformAdmin();

  const isActive = (path: string) => location.pathname === path;

  const backPath = isPlatformAdmin ? "/superadmin" : "/dashboard";
  const backLabelKey = isPlatformAdmin ? "Backoffice SaaS" : "nav.backToDashboard";
  const visibleMenuItems = isPlatformAdmin
    ? accountMenuItems.filter(i => i.path === "/profile")
    : accountMenuItems;

  const Sidebar = () => (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-center px-4 border-b border-sidebar-border">
        <NavLink to="/">
          <img
            src={logoLight}
            alt="NODIPRO"
            className={cn(
              "h-8 object-contain transition-all duration-300 hover:scale-105 hover:brightness-110 cursor-pointer",
              collapsed ? "w-8" : "w-auto max-w-[160px]"
            )}
          />
        </NavLink>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 h-6 w-6 rounded-full bg-card border border-border shadow-sm hover:bg-accent flex items-center justify-center"
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3 text-foreground" />
        ) : (
          <ChevronLeft className="h-3 w-3 text-foreground" />
        )}
      </button>

      {/* Back to Dashboard */}
      <div className="p-3">
        <NavLink
          to={backPath}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-200"
        >
          {isPlatformAdmin ? <ShieldCheck className="h-4.5 w-4.5 flex-shrink-0" /> : <ArrowLeft className="h-4.5 w-4.5 flex-shrink-0" />}
          {!collapsed && (
            <span className="text-sm font-medium">{isPlatformAdmin ? backLabelKey : t(backLabelKey)}</span>
          )}
        </NavLink>
      </div>

      {/* Separator */}
      <div className="mx-3 border-t border-sidebar-border" />

      {/* Account menu */}
      <nav className="flex-1 p-3 space-y-0.5">
        {!collapsed && (
          <span className="block px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
            {t("nav.myAccount")}
          </span>
        )}
        {visibleMenuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          const label = t(item.labelKey);

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200",
                "hover:bg-sidebar-accent group",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/80 hover:text-sidebar-foreground"
              )}
            >
              <Icon
                className={cn(
                  "h-4.5 w-4.5 flex-shrink-0",
                  active && "text-sidebar-primary-foreground"
                )}
              />
              {!collapsed && (
                <span
                  className={cn(
                    "text-sm font-medium truncate",
                    active && "text-sidebar-primary-foreground"
                  )}
                >
                  {label}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar - hidden on mobile */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-foreground/50 z-50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className={cn("min-h-screen flex flex-col transition-all duration-300", collapsed ? "lg:ml-16" : "lg:ml-60")}>
        <TopBar onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} />
        <main className="flex-1 p-4 lg:p-6">
          <Breadcrumbs />
          {children}
        </main>
      </div>
    </div>
  );
}
