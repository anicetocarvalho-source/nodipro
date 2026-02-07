import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Zap, Target, TrendingUp, Clock } from "lucide-react";
import { BurndownChart } from "./BurndownChart";
import { ScrumRolesManager } from "./ScrumRolesManager";
import { DefinitionOfDone } from "./DefinitionOfDone";
import { useSprints } from "@/hooks/useSprints";
import { useScrumConfig } from "@/hooks/useScrum";
import { useTasks } from "@/hooks/useTasks";
import { useState } from "react";

interface ScrumDashboardProps {
  projectId: string;
}

export function ScrumDashboard({ projectId }: ScrumDashboardProps) {
  const { data: sprints = [] } = useSprints(projectId);
  const { data: config } = useScrumConfig(projectId);
  const { data: tasks = [] } = useTasks(projectId);
  
  // Find active sprint or most recent
  const activeSprint = useMemo(() => {
    return sprints.find(s => s.status === "active") || sprints[0] || null;
  }, [sprints]);

  const [selectedSprintId, setSelectedSprintId] = useState<string>("");

  const currentSprintId = selectedSprintId || activeSprint?.id || "";
  
  // Sprint metrics
  const sprintTasks = useMemo(() => {
    if (!currentSprintId) return [];
    return tasks.filter(t => t.sprint_id === currentSprintId);
  }, [tasks, currentSprintId]);

  const sprintStats = useMemo(() => {
    const total = sprintTasks.length;
    const done = sprintTasks.filter(t => t.column_id === "done").length;
    const totalPoints = sprintTasks.reduce((sum, t) => sum + (t.story_points || 0), 0);
    const donePoints = sprintTasks.filter(t => t.column_id === "done")
      .reduce((sum, t) => sum + (t.story_points || 0), 0);
    
    // Calculate velocity from completed sprints
    const completedSprints = sprints.filter(s => s.status === "completed");
    const avgVelocity = completedSprints.length > 0
      ? completedSprints.reduce((sum, s) => sum + (s.velocity || 0), 0) / completedSprints.length
      : 0;

    return { total, done, totalPoints, donePoints, avgVelocity, completedSprints: completedSprints.length };
  }, [sprintTasks, sprints]);

  // Backlog items (tasks not assigned to any sprint)
  const backlogCount = useMemo(() => {
    return tasks.filter(t => !t.sprint_id && t.column_id !== "done").length;
  }, [tasks]);

  return (
    <div className="space-y-4">
      {/* Sprint Selector */}
      {sprints.length > 0 && (
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          <Select value={currentSprintId} onValueChange={setSelectedSprintId}>
            <SelectTrigger className="h-8 text-xs w-[200px]">
              <SelectValue placeholder="Seleccionar sprint..." />
            </SelectTrigger>
            <SelectContent>
              {sprints.map(s => (
                <SelectItem key={s.id} value={s.id}>
                  <div className="flex items-center gap-2">
                    <span>{s.name}</span>
                    {s.status === "active" && (
                      <Badge variant="secondary" className="text-[10px] px-1 py-0">Activo</Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Sprint Metrics */}
      <div className="grid grid-cols-2 gap-2">
        <Card>
          <CardContent className="p-3 flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <div>
              <p className="text-[10px] text-muted-foreground">Sprint Points</p>
              <p className="text-sm font-bold">{sprintStats.donePoints}/{sprintStats.totalPoints}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <div>
              <p className="text-[10px] text-muted-foreground">Velocidade Média</p>
              <p className="text-sm font-bold">{Math.round(sprintStats.avgVelocity)} pts</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <div>
              <p className="text-[10px] text-muted-foreground">Tarefas Sprint</p>
              <p className="text-sm font-bold">{sprintStats.done}/{sprintStats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-[10px] text-muted-foreground">Product Backlog</p>
              <p className="text-sm font-bold">{backlogCount} itens</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Burndown Chart */}
      {currentSprintId && (
        <BurndownChart projectId={projectId} sprintId={currentSprintId} />
      )}

      {/* Scrum Roles */}
      <ScrumRolesManager projectId={projectId} />

      {/* Definition of Done */}
      <DefinitionOfDone projectId={projectId} />

      {/* Ceremonies config */}
      {config && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Cerimónias</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Sprint Planning</span>
              <span>{config.sprint_planning_duration_hours}h</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Daily Standup</span>
              <span>{config.daily_standup_duration_minutes}min</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Sprint Review</span>
              <span>{config.sprint_review_duration_hours}h</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Retrospectiva</span>
              <span>{config.retrospective_duration_hours}h</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Duração Sprint</span>
              <span className="font-medium">{config.default_sprint_duration_days} dias</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
