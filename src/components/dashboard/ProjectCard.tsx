import { Calendar, Users, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface ProjectCardProps {
  name: string;
  client: string;
  status: "on_track" | "at_risk" | "delayed" | "completed";
  progress: number;
  deadline: string;
  team: { name: string; initials: string }[];
  priority: "high" | "medium" | "low";
}

const statusConfig = {
  on_track: { label: "No Prazo", className: "bg-success/10 text-success border-success/20" },
  at_risk: { label: "Em Risco", className: "bg-warning/10 text-warning border-warning/20" },
  delayed: { label: "Atrasado", className: "bg-destructive/10 text-destructive border-destructive/20" },
  completed: { label: "Concluído", className: "bg-primary/10 text-primary border-primary/20" },
};

const priorityConfig = {
  high: { label: "Alta", className: "bg-destructive text-destructive-foreground" },
  medium: { label: "Média", className: "bg-warning text-warning-foreground" },
  low: { label: "Baixa", className: "bg-muted text-muted-foreground" },
};

export function ProjectCard({
  name,
  client,
  status,
  progress,
  deadline,
  team,
  priority,
}: ProjectCardProps) {
  return (
    <Card className="hover:shadow-md transition-all hover:border-primary/30 cursor-pointer group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
              {name}
            </h3>
            <p className="text-sm text-muted-foreground">{client}</p>
          </div>
          <Badge variant="outline" className={cn(statusConfig[status].className)}>
            {statusConfig[status].label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progresso</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Info row */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{deadline}</span>
          </div>
          <Badge className={cn("text-xs", priorityConfig[priority].className)}>
            {priorityConfig[priority].label}
          </Badge>
        </div>

        {/* Team */}
        <div className="flex items-center justify-between">
          <div className="flex -space-x-2">
            {team.slice(0, 4).map((member, i) => (
              <Avatar key={i} className="h-7 w-7 border-2 border-card">
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {member.initials}
                </AvatarFallback>
              </Avatar>
            ))}
            {team.length > 4 && (
              <div className="h-7 w-7 rounded-full bg-muted border-2 border-card flex items-center justify-center">
                <span className="text-xs text-muted-foreground">+{team.length - 4}</span>
              </div>
            )}
          </div>
          {status === "at_risk" && (
            <AlertCircle className="h-4 w-4 text-warning" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
