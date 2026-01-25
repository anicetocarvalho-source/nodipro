import { useState } from "react";
import { Link2, X, AlertTriangle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  DependencyType,
  TaskDependencyWithDetails,
  DEPENDENCY_TYPE_LABELS,
  DEPENDENCY_TYPE_DESCRIPTIONS,
  isTaskBlocked,
} from "@/hooks/useTaskDependencies";

interface TaskOption {
  id: string;
  title: string;
  column_id: string;
}

interface DependencySelectorProps {
  taskId: string | undefined;
  dependencies: TaskDependencyWithDetails[];
  availableTasks: TaskOption[];
  onAddDependency: (predecessorId: string, type: DependencyType, lagDays: number) => void;
  onRemoveDependency: (dependencyId: string) => void;
  onUpdateDependency: (dependencyId: string, type: DependencyType, lagDays: number) => void;
  isLoading?: boolean;
}

const COLUMN_LABELS: Record<string, string> = {
  backlog: "Backlog",
  todo: "A Fazer",
  in_progress: "Em Progresso",
  review: "Em Revisão",
  done: "Concluído",
};

export function DependencySelector({
  taskId,
  dependencies,
  availableTasks,
  onAddDependency,
  onRemoveDependency,
  onUpdateDependency,
  isLoading,
}: DependencySelectorProps) {
  const [selectedPredecessor, setSelectedPredecessor] = useState<string>("");
  const [selectedType, setSelectedType] = useState<DependencyType>("FS");
  const [lagDays, setLagDays] = useState<number>(0);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const { blocked, blockers } = isTaskBlocked(dependencies);

  // Filter out tasks that are already dependencies or the task itself
  const existingPredecessorIds = dependencies.map((d) => d.predecessor_id);
  const filteredTasks = availableTasks.filter(
    (t) => t.id !== taskId && !existingPredecessorIds.includes(t.id)
  );

  const handleAddDependency = () => {
    if (selectedPredecessor) {
      onAddDependency(selectedPredecessor, selectedType, lagDays);
      setSelectedPredecessor("");
      setSelectedType("FS");
      setLagDays(0);
      setPopoverOpen(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          <Link2 className="h-4 w-4" />
          Dependências (Predecessoras)
        </Label>
        
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={filteredTasks.length === 0 || !taskId}
            >
              Adicionar
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Tarefa Predecessora</Label>
                <Select value={selectedPredecessor} onValueChange={setSelectedPredecessor}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione uma tarefa..." />
                  </SelectTrigger>
                  <SelectContent>
                    <ScrollArea className="max-h-48">
                      {filteredTasks.map((task) => (
                        <SelectItem key={task.id} value={task.id}>
                          <div className="flex items-center gap-2">
                            <span className="truncate max-w-[180px]">{task.title}</span>
                            <Badge variant="outline" className="text-[10px]">
                              {COLUMN_LABELS[task.column_id] || task.column_id}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </ScrollArea>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  Tipo de Dependência
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="font-medium">FS (Fim-para-Início)</p>
                        <p className="text-xs text-muted-foreground">
                          A tarefa só inicia após a predecessora terminar
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Select value={selectedType} onValueChange={(v) => setSelectedType(v as DependencyType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(DEPENDENCY_TYPE_LABELS) as DependencyType[]).map((type) => (
                      <SelectItem key={type} value={type}>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="font-mono text-xs">
                            {type}
                          </Badge>
                          <span>{DEPENDENCY_TYPE_LABELS[type]}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Atraso (dias)</Label>
                <Input
                  type="number"
                  min={-365}
                  max={365}
                  value={lagDays}
                  onChange={(e) => setLagDays(parseInt(e.target.value) || 0)}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">
                  Positivo = atraso, Negativo = antecipação
                </p>
              </div>

              <Button
                type="button"
                className="w-full"
                onClick={handleAddDependency}
                disabled={!selectedPredecessor || isLoading}
              >
                Adicionar Dependência
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Blocked Warning */}
      {blocked && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20">
          <AlertTriangle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-warning">Tarefa Bloqueada</p>
            <ul className="text-xs text-muted-foreground space-y-0.5">
              {blockers.map((blocker, i) => (
                <li key={i}>• {blocker}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Dependencies List */}
      {dependencies.length > 0 ? (
        <div className="space-y-2 border rounded-lg p-3 bg-muted/30">
          {dependencies.map((dep) => (
            <div
              key={dep.id}
              className="flex items-center gap-2 group"
            >
              <Link2 className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <span className="text-sm truncate block">
                  {dep.predecessor?.title || "Tarefa não encontrada"}
                </span>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {dep.dependency_type}
                  </Badge>
                  {dep.lag_days !== 0 && (
                    <span>
                      {dep.lag_days > 0 ? `+${dep.lag_days}` : dep.lag_days} dias
                    </span>
                  )}
                  {dep.predecessor && (
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-[10px]",
                        dep.predecessor.column_id === "done" && "bg-success/20 text-success"
                      )}
                    >
                      {COLUMN_LABELS[dep.predecessor.column_id] || dep.predecessor.column_id}
                    </Badge>
                  )}
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onRemoveDependency(dep.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-2">
          Nenhuma dependência configurada
        </p>
      )}
    </div>
  );
}
