import { useState, useMemo } from "react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Calendar,
  User,
  Search,
  Filter,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { DbTask } from "@/types/database";
import { useTasks } from "@/hooks/useTasks";

const priorityConfig: Record<string, { label: string; className: string; order: number }> = {
  high: { label: "Alta", className: "bg-destructive/10 text-destructive border-destructive/30", order: 1 },
  medium: { label: "Média", className: "bg-warning/10 text-warning border-warning/30", order: 2 },
  low: { label: "Baixa", className: "bg-muted text-muted-foreground border-muted", order: 3 },
};

const columnConfig: Record<string, { label: string; className: string; order: number }> = {
  backlog: { label: "Backlog", className: "bg-muted text-muted-foreground", order: 1 },
  todo: { label: "A Fazer", className: "bg-secondary text-secondary-foreground", order: 2 },
  in_progress: { label: "Em Progresso", className: "bg-info/10 text-info", order: 3 },
  review: { label: "Revisão", className: "bg-warning/10 text-warning", order: 4 },
  done: { label: "Concluído", className: "bg-success/10 text-success", order: 5 },
};

type SortField = "title" | "priority" | "column_id" | "assignee_name" | "due_date" | "updated_at";
type SortDirection = "asc" | "desc";

interface TaskListViewProps {
  projectId: string;
}

export function TaskListView({ projectId }: TaskListViewProps) {
  const { data: tasks = [], isLoading } = useTasks(projectId);
  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("updated_at");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3.5 w-3.5 ml-1 opacity-40" />;
    return sortDir === "asc"
      ? <ArrowUp className="h-3.5 w-3.5 ml-1 text-primary" />
      : <ArrowDown className="h-3.5 w-3.5 ml-1 text-primary" />;
  };

  const filteredAndSorted = useMemo(() => {
    let result = [...tasks];

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.assignee_name?.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q)
      );
    }

    // Priority filter
    if (filterPriority !== "all") {
      result = result.filter((t) => t.priority === filterPriority);
    }

    // Status filter
    if (filterStatus !== "all") {
      result = result.filter((t) => t.column_id === filterStatus);
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "title":
          cmp = a.title.localeCompare(b.title);
          break;
        case "priority":
          cmp = (priorityConfig[a.priority]?.order ?? 9) - (priorityConfig[b.priority]?.order ?? 9);
          break;
        case "column_id":
          cmp = (columnConfig[a.column_id]?.order ?? 9) - (columnConfig[b.column_id]?.order ?? 9);
          break;
        case "assignee_name":
          cmp = (a.assignee_name || "zzz").localeCompare(b.assignee_name || "zzz");
          break;
        case "due_date":
          cmp = (a.due_date || "9999").localeCompare(b.due_date || "9999");
          break;
        case "updated_at":
          cmp = a.updated_at.localeCompare(b.updated_at);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [tasks, search, filterPriority, filterStatus, sortField, sortDir]);

  const formatDueDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    try {
      return format(new Date(dateStr), "d MMM yyyy", { locale: pt });
    } catch {
      return dateStr;
    }
  };

  const isDueOverdue = (dateStr: string | null) => {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date(new Date().setHours(0, 0, 0, 0));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar tarefas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Prioridade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas prioridades</SelectItem>
            <SelectItem value="high">Alta</SelectItem>
            <SelectItem value="medium">Média</SelectItem>
            <SelectItem value="low">Baixa</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos estados</SelectItem>
            <SelectItem value="backlog">Backlog</SelectItem>
            <SelectItem value="todo">A Fazer</SelectItem>
            <SelectItem value="in_progress">Em Progresso</SelectItem>
            <SelectItem value="review">Revisão</SelectItem>
            <SelectItem value="done">Concluído</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>{filteredAndSorted.length} tarefa{filteredAndSorted.length !== 1 ? "s" : ""}</span>
        {(filterPriority !== "all" || filterStatus !== "all" || search.trim()) && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => {
              setSearch("");
              setFilterPriority("all");
              setFilterStatus("all");
            }}
          >
            Limpar filtros
          </Button>
        )}
      </div>

      {/* Table */}
      {filteredAndSorted.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {tasks.length === 0
            ? "Nenhuma tarefa criada neste projecto."
            : "Nenhuma tarefa corresponde aos filtros aplicados."}
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[40%]">
                  <button
                    className="flex items-center text-xs font-medium uppercase tracking-wider hover:text-foreground transition-colors"
                    onClick={() => handleSort("title")}
                  >
                    Tarefa <SortIcon field="title" />
                  </button>
                </TableHead>
                <TableHead className="w-[12%]">
                  <button
                    className="flex items-center text-xs font-medium uppercase tracking-wider hover:text-foreground transition-colors"
                    onClick={() => handleSort("priority")}
                  >
                    Prioridade <SortIcon field="priority" />
                  </button>
                </TableHead>
                <TableHead className="w-[14%]">
                  <button
                    className="flex items-center text-xs font-medium uppercase tracking-wider hover:text-foreground transition-colors"
                    onClick={() => handleSort("column_id")}
                  >
                    Estado <SortIcon field="column_id" />
                  </button>
                </TableHead>
                <TableHead className="w-[16%]">
                  <button
                    className="flex items-center text-xs font-medium uppercase tracking-wider hover:text-foreground transition-colors"
                    onClick={() => handleSort("assignee_name")}
                  >
                    Responsável <SortIcon field="assignee_name" />
                  </button>
                </TableHead>
                <TableHead className="w-[14%]">
                  <button
                    className="flex items-center text-xs font-medium uppercase tracking-wider hover:text-foreground transition-colors"
                    onClick={() => handleSort("due_date")}
                  >
                    Prazo <SortIcon field="due_date" />
                  </button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSorted.map((task) => {
                const priority = priorityConfig[task.priority] || priorityConfig.medium;
                const status = columnConfig[task.column_id] || { label: task.column_id, className: "bg-muted text-muted-foreground", order: 9 };
                const dueDateStr = formatDueDate(task.due_date);
                const overdue = isDueOverdue(task.due_date) && task.column_id !== "done";

                return (
                  <TableRow key={task.id} className="group hover:bg-muted/30">
                    <TableCell>
                      <div className="space-y-0.5">
                        <p className={cn(
                          "font-medium text-sm",
                          task.column_id === "done" && "line-through text-muted-foreground"
                        )}>
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {task.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-xs", priority.className)}>
                        {priority.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-xs", status.className)}>
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {task.assignee_name ? (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                              {task.assignee_initials || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm truncate">{task.assignee_name}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {dueDateStr ? (
                        <div className={cn(
                          "flex items-center gap-1.5 text-sm",
                          overdue && "text-destructive font-medium"
                        )}>
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{dueDateStr}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
