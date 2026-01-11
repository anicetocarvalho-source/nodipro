import { FileText, MessageSquare, CheckCircle, Upload, UserPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Activity {
  id: string;
  user: { name: string; initials: string };
  action: string;
  target: string;
  time: string;
  type: "comment" | "task" | "document" | "upload" | "team";
}

interface ActivityFeedProps {
  activities: Activity[];
}

const typeConfig = {
  comment: { icon: MessageSquare, color: "text-info" },
  task: { icon: CheckCircle, color: "text-success" },
  document: { icon: FileText, color: "text-primary" },
  upload: { icon: Upload, color: "text-warning" },
  team: { icon: UserPlus, color: "text-chart-5" },
};

export function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-lg font-semibold">Actividade Recente</CardTitle>
        <Button variant="ghost" size="sm" className="text-primary">
          Ver tudo
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.map((activity, index) => {
          const Icon = typeConfig[activity.type].icon;
          return (
            <div key={activity.id} className="flex gap-3">
              <div className="relative">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {activity.user.initials}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={cn(
                    "absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-card flex items-center justify-center",
                    typeConfig[activity.type].color
                  )}
                >
                  <Icon className="h-2.5 w-2.5" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className="font-medium">{activity.user.name}</span>{" "}
                  <span className="text-muted-foreground">{activity.action}</span>{" "}
                  <span className="font-medium text-primary">{activity.target}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{activity.time}</p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
