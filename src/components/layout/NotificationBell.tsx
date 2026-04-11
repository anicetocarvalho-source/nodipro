import { useNavigate } from "react-router-dom";
import {
  Bell, AlertCircle, AlertTriangle, Info, DollarSign, CheckCircle2,
  FileText, Users, ExternalLink, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { IntegrityNotification } from "@/hooks/useIntegrityNotifications";
import { DbNotification } from "@/hooks/useNotifications";

const severityConfig = {
  error: { icon: AlertCircle, bgClass: "bg-destructive/10", textClass: "text-destructive", dotClass: "bg-destructive" },
  warning: { icon: AlertTriangle, bgClass: "bg-warning/10", textClass: "text-warning", dotClass: "bg-warning" },
  info: { icon: Info, bgClass: "bg-info/10", textClass: "text-info", dotClass: "bg-info" },
};

const moduleIcons: Record<string, typeof DollarSign> = {
  budget: DollarSign, tasks: CheckCircle2, documents: FileText, team: Users,
};

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "agora";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

interface NotificationBellProps {
  notifications: IntegrityNotification[];
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  dbNotifications?: DbNotification[];
  onDbMarkAsRead?: (id: string) => void;
}

export function NotificationBell({
  notifications, unreadCount, onMarkAsRead, onMarkAllAsRead, onClearAll,
  dbNotifications = [], onDbMarkAsRead,
}: NotificationBellProps) {
  const navigate = useNavigate();

  const handleIntegrityClick = (n: IntegrityNotification) => {
    onMarkAsRead(n.id);
    if (n.check.actionRoute) navigate(n.check.actionRoute);
  };

  const handleDbClick = (n: DbNotification) => {
    onDbMarkAsRead?.(n.id);
    if (n.action_url) navigate(n.action_url);
  };

  const hasAny = notifications.length > 0 || dbNotifications.length > 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-destructive text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            Notificações
            {unreadCount > 0 && <Badge variant="secondary" className="text-xs">{unreadCount} nova{unreadCount > 1 ? "s" : ""}</Badge>}
          </span>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" className="text-xs text-primary h-7" onClick={onMarkAllAsRead}>Marcar lidas</Button>
            )}
            {hasAny && (
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-7" onClick={onClearAll}><Trash2 className="h-3 w-3" /></Button>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {!hasAny ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p>Sem notificações</p>
          </div>
        ) : (
          <ScrollArea className="max-h-80">
            <div className="space-y-1 p-1">
              {/* DB Notifications */}
              {dbNotifications.map((n) => {
                const config = severityConfig[n.type as keyof typeof severityConfig] || severityConfig.info;
                const SeverityIcon = config.icon;
                const ModuleIcon = moduleIcons[n.module || ""] || Info;
                return (
                  <button
                    key={`db-${n.id}`}
                    onClick={() => handleDbClick(n)}
                    className={cn(
                      "w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors hover:bg-muted/50",
                      !n.is_read && "bg-muted/30"
                    )}
                  >
                    <div className={cn("p-1.5 rounded-lg shrink-0 mt-0.5", config.bgClass)}>
                      <SeverityIcon className={cn("h-3.5 w-3.5", config.textClass)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={cn("text-sm truncate", !n.is_read ? "font-semibold" : "font-medium")}>{n.title}</p>
                        {!n.is_read && <span className={cn("h-2 w-2 rounded-full shrink-0", config.dotClass)} />}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{n.message}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <ModuleIcon className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{formatTimeAgo(new Date(n.created_at))}</span>
                      </div>
                    </div>
                    {n.action_url && <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-1" />}
                  </button>
                );
              })}

              {/* Integrity Notifications */}
              {notifications.map((notification) => {
                const config = severityConfig[notification.check.severity];
                const SeverityIcon = config.icon;
                const ModuleIcon = moduleIcons[notification.check.module] || Info;
                return (
                  <button
                    key={notification.id}
                    onClick={() => handleIntegrityClick(notification)}
                    className={cn(
                      "w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors hover:bg-muted/50",
                      !notification.isRead && "bg-muted/30"
                    )}
                  >
                    <div className={cn("p-1.5 rounded-lg shrink-0 mt-0.5", config.bgClass)}>
                      <SeverityIcon className={cn("h-3.5 w-3.5", config.textClass)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={cn("text-sm truncate", !notification.isRead ? "font-semibold" : "font-medium")}>{notification.check.title}</p>
                        {!notification.isRead && <span className={cn("h-2 w-2 rounded-full shrink-0", config.dotClass)} />}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{notification.check.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <ModuleIcon className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground truncate">{notification.projectName}</span>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground">{formatTimeAgo(notification.timestamp)}</span>
                      </div>
                    </div>
                    {notification.check.actionRoute && <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-1" />}
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
