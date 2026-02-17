import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";
import { Search, ChevronDown, Menu, LogOut, User, Settings, Sun, Moon, Monitor, Bell } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GlobalSearchCommand } from "@/components/layout/GlobalSearchCommand";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RoleBadge } from "@/components/ui/role-badge";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { useIntegrityNotifications } from "@/hooks/useIntegrityNotifications";

interface TopBarProps {
  onMobileMenuToggle?: () => void;
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();

  const cycleTheme = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };

  const getIcon = () => {
    if (theme === "dark") return <Moon className="h-5 w-5" />;
    if (theme === "light") return <Sun className="h-5 w-5" />;
    return <Monitor className="h-5 w-5" />;
  };

  const getLabel = () => {
    if (theme === "dark") return t("settings.themeDark");
    if (theme === "light") return t("settings.themeLight");
    return t("settings.themeSystem");
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" onClick={cycleTheme}>{getIcon()}</Button>
      </TooltipTrigger>
      <TooltipContent><p>{t("topbar.themeLabel", { theme: getLabel() })}</p></TooltipContent>
    </Tooltip>
  );
}

export function TopBar({ onMobileMenuToggle }: TopBarProps) {
  const { t } = useTranslation();
  const [searchOpen, setSearchOpen] = useState(false);
  const { profile, role, signOut } = useAuthContext();
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useIntegrityNotifications();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setSearchOpen(true); }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMobileMenuToggle}><Menu className="h-5 w-5" /></Button>

      <button onClick={() => setSearchOpen(true)} className="relative flex-1 max-w-md mx-4 flex items-center gap-2 h-10 rounded-md border border-transparent bg-secondary/50 px-3 text-sm text-muted-foreground hover:bg-secondary hover:border-border transition-colors cursor-pointer">
        <Search className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-left truncate">{t("topbar.searchPlaceholder")}</span>
        <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">⌘K</kbd>
      </button>

      <GlobalSearchCommand open={searchOpen} onOpenChange={setSearchOpen} />

      <div className="flex items-center gap-2 lg:gap-4">
        <ThemeToggle />
        <NotificationBell notifications={notifications} unreadCount={unreadCount} onMarkAsRead={markAsRead} onMarkAllAsRead={markAllAsRead} onClearAll={clearAll} />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">{getInitials(profile?.full_name)}</AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col items-start">
                <span className="text-sm font-medium">{profile?.full_name || t("topbar.user")}</span>
                <RoleBadge role={role} size="sm" showIcon={false} className="mt-0.5" />
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground hidden md:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>{t("auth.myAccount")}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/profile")}><User className="mr-2 h-4 w-4" />{t("nav.profile")}</DropdownMenuItem>
            <DropdownMenuItem><Settings className="mr-2 h-4 w-4" />{t("auth.preferences")}</DropdownMenuItem>
            <DropdownMenuItem><Bell className="mr-2 h-4 w-4" />{t("auth.notifications")}</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={signOut}><LogOut className="mr-2 h-4 w-4" />{t("nav.logout")}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
