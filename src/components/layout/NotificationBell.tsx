import { useNavigate } from "react-router-dom";
import {
  Bell,
  AlertCircle,
  AlertTriangle,
  Info,
  DollarSign,
  CheckCircle2,
  FileText,
  Users,
  ExternalLink,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { IntegrityNotification } from "@/hooks/useIntegrityNotifications";

const severityConfig = {
  error: {
    icon: AlertCircle,
    bgClass: "bg-destructive/10",
    textClass: "text-destructive",
    dotClass: "bg-destructive",
  },
  warning: {
    icon: AlertTriangle,
    bgClass: "bg-warning/10",
    textClass: "text-warning",
    dotClass: "bg-warning",
  },
  info: {
    icon: Info,
    bgClass: "bg-info/10",
    textClass: "text-info",
    dotClass: "bg-info",
  },
};

const moduleIcons = {
  budget: DollarSign,
  tasks: CheckCircle2,
  documents: FileText,
  team: Users,
};

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "agora";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

interface NotificationBellProps {
  notifications: IntegrityNotification[];
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
}

export function NotificationBell({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
}: NotificationBellProps) {
  const navigate = useNavigate();

  const handleNotificationClick = (notification: IntegrityNotification) => {
    onMarkAsRead(notification.id);
    if (notification.check.actionRoute) {
      navigate(notification.check.actionRoute);
    }
  };

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
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {unreadCount} nova{unreadCount > 1 ? "s" : ""}
              </Badge>
            )}
          </span>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-primary h-7"
                onClick={onMarkAllAsRead}
              >
                Marcar lidas
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground h-7"
                onClick={onClearAll}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {notifications.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p>Sem notificações</p>
            <p className="text-xs mt-1">
              Alertas de integridade cruzada aparecerão aqui
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-80">
            <div className="space-y-1 p-1">
              {notifications.map((notification) => {
                const config = severityConfig[notification.check.severity];
                const SeverityIcon = config.icon;
                const ModuleIcon = moduleIcons[notification.check.module];

                return (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      "w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors",
                      "hover:bg-muted/50",
                      !notification.isRead && "bg-muted/30"
                    )}
                  >
                    {/* Severity indicator */}
                    <div className={cn("p-1.5 rounded-lg shrink-0 mt-0.5", config.bgClass)}>
                      <SeverityIcon className={cn("h-3.5 w-3.5", config.textClass)} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={cn(
                          "text-sm truncate",
                          !notification.isRead ? "font-semibold" : "font-medium"
                        )}>
                          {notification.check.title}
                        </p>
                        {!notification.isRead && (
                          <span className={cn("h-2 w-2 rounded-full shrink-0", config.dotClass)} />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {notification.check.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <ModuleIcon className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground truncate">
                          {notification.projectName}
                        </span>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground">
                          {formatTimeAgo(notification.timestamp)}
                        </span>
                      </div>
                    </div>

                    {/* Action hint */}
                    {notification.check.actionRoute && (
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-1" />
                    )}
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
