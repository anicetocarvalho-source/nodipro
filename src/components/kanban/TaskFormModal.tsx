import { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { CalendarIcon, Plus, X, GripVertical } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Task, Subtask } from "./KanbanCard";
import { DependencySelector } from "./DependencySelector";
import {
  useTaskDependencies,
  useAddTaskDependency,
  useDeleteTaskDependency,
  DependencyType,
} from "@/hooks/useTaskDependencies";
import { useTeamMembers } from "@/hooks/useTeamMembers";

const taskFormSchema = z.object({
  title: z.string().min(3, "O título deve ter pelo menos 3 caracteres").max(100, "O título deve ter no máximo 100 caracteres"),
  description: z.string().max(500, "A descrição deve ter no máximo 500 caracteres").optional(),
  priority: z.enum(["high", "medium", "low"], { required_error: "Seleccione uma prioridade" }),
  assigneeId: z.string().optional(),
  dueDate: z.date().optional(),
  itemType: z.enum(["epic", "story", "task"]).default("task"),
  storyPoints: z.number().min(0).max(100).optional(),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

interface TaskFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
  columnId: string;
  onSave: (task: Task, columnId: string, isNew: boolean) => void;
  projectId?: string;
  availableTasks?: { id: string; title: string; column_id: string }[];
}

export function TaskFormModal({
  open,
  onOpenChange,
  task,
  columnId,
  onSave,
  projectId,
  availableTasks = [],
}: TaskFormModalProps) {
  const isEditing = !!task;
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");

  // Team members from database
  const { data: dbTeamMembers = [] } = useTeamMembers(projectId);
  const teamMembers = useMemo(() => 
    dbTeamMembers.map(m => ({ id: m.id, name: m.name, initials: m.initials })),
    [dbTeamMembers]
  );

  // Dependencies hooks
  const { data: dependencies = [], isLoading: depsLoading } = useTaskDependencies(task?.id);
  const addDependency = useAddTaskDependency();
  const deleteDependency = useDeleteTaskDependency();

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
      assigneeId: undefined,
      dueDate: undefined,
      itemType: "task",
      storyPoints: 0,
    },
  });

  useEffect(() => {
    if (open) {
      if (task) {
        const assignee = task.assignee
          ? teamMembers.find((m) => m.initials === task.assignee?.initials)
          : undefined;

        form.reset({
          title: task.title,
          description: task.description || "",
          priority: task.priority,
          assigneeId: assignee?.id || undefined,
          dueDate: task.dueDate ? parsePortugueseDate(task.dueDate) : undefined,
          itemType: (task as any).itemType || "task",
          storyPoints: (task as any).storyPoints || 0,
        });
        setSubtasks(task.subtasks || []);
      } else {
        form.reset({
          title: "",
          description: "",
          priority: "medium",
          assigneeId: undefined,
          dueDate: undefined,
          itemType: "task",
          storyPoints: 0,
        });
        setSubtasks([]);
      }
      setNewSubtaskTitle("");
    }
  }, [open, task, form]);

  function parsePortugueseDate(dateStr: string): Date | undefined {
    try {
      const months: Record<string, number> = {
        Jan: 0, Fev: 1, Mar: 2, Abr: 3, Mai: 4, Jun: 5,
        Jul: 6, Ago: 7, Set: 8, Out: 9, Nov: 10, Dez: 11,
      };
      const parts = dateStr.split(" ");
      if (parts.length === 2) {
        const day = parseInt(parts[0]);
        const month = months[parts[1]];
        if (!isNaN(day) && month !== undefined) {
          return new Date(2025, month, day);
        }
      }
      return undefined;
    } catch {
      return undefined;
    }
  }

  function formatDateToPortuguese(date: Date): string {
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    return `${date.getDate()} ${months[date.getMonth()]}`;
  }

  const handleAddSubtask = () => {
    if (newSubtaskTitle.trim()) {
      const newSubtask: Subtask = {
        id: `st${Date.now()}`,
        title: newSubtaskTitle.trim(),
        completed: false,
      };
      setSubtasks([...subtasks, newSubtask]);
      setNewSubtaskTitle("");
    }
  };

  const handleRemoveSubtask = (subtaskId: string) => {
    setSubtasks(subtasks.filter((s) => s.id !== subtaskId));
  };

  const handleToggleSubtask = (subtaskId: string) => {
    setSubtasks(
      subtasks.map((s) =>
        s.id === subtaskId ? { ...s, completed: !s.completed } : s
      )
    );
  };

  const handleSubtaskKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddSubtask();
    }
  };

  function onSubmit(values: TaskFormValues) {
    const assignee = values.assigneeId
      ? teamMembers.find((m) => m.id === values.assigneeId)
      : undefined;

    const newTask: Task = {
      id: task?.id || `t${Date.now()}`,
      title: values.title,
      description: values.description || undefined,
      priority: values.priority,
      assignee: assignee ? { name: assignee.name, initials: assignee.initials } : undefined,
      dueDate: values.dueDate ? formatDateToPortuguese(values.dueDate) : undefined,
      comments: task?.comments,
      attachments: task?.attachments,
      labels: task?.labels,
      subtasks: subtasks.length > 0 ? subtasks : undefined,
      itemType: values.itemType,
      storyPoints: values.storyPoints || 0,
    };

    onSave(newTask, columnId, !isEditing);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Tarefa" : "Nova Tarefa"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Faça alterações à tarefa e clique em guardar."
              : "Preencha os detalhes da nova tarefa."}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-180px)] pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Item Type + Title */}
              <div className="grid grid-cols-3 gap-3">
                <FormField
                  control={form.control}
                  name="itemType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="epic">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-purple-500" />
                              Épico
                            </div>
                          </SelectItem>
                          <SelectItem value="story">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-blue-500" />
                              História
                            </div>
                          </SelectItem>
                          <SelectItem value="task">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-green-500" />
                              Tarefa
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Título *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Implementar módulo de relatórios" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva os detalhes..."
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />


              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prioridade *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="high">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-destructive" />
                              Alta
                            </div>
                          </SelectItem>
                          <SelectItem value="medium">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-warning" />
                              Média
                            </div>
                          </SelectItem>
                          <SelectItem value="low">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                              Baixa
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="storyPoints"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Story Points</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} max={100} placeholder="0" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="assigneeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Responsável</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Atribuir a..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {teamMembers.map((member) => (
                            <SelectItem key={member.id} value={member.id}>
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-medium text-primary">
                                  {member.initials}
                                </div>
                                {member.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Entrega</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: pt })
                            ) : (
                              <span>Seleccione uma data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Dependencies Section - Only show when editing */}
              {isEditing && task?.id && (
                <>
                  <Separator className="my-4" />
                  <DependencySelector
                    taskId={task.id}
                    dependencies={dependencies}
                    availableTasks={availableTasks}
                    onAddDependency={(predecessorId, type, lagDays) => {
                      addDependency.mutate({
                        taskId: task.id,
                        predecessorId,
                        dependencyType: type,
                        lagDays,
                        projectId,
                      });
                    }}
                    onRemoveDependency={(depId) => {
                      deleteDependency.mutate({ id: depId, taskId: task.id });
                    }}
                    onUpdateDependency={() => {}}
                    isLoading={depsLoading || addDependency.isPending || deleteDependency.isPending}
                  />
                </>
              )}

              {/* Subtasks Section */}
              <div className="space-y-3">
                <FormLabel>Subtarefas</FormLabel>
                
                {/* Add Subtask Input */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Adicionar subtarefa..."
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    onKeyDown={handleSubtaskKeyDown}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleAddSubtask}
                    disabled={!newSubtaskTitle.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Subtasks List */}
                {subtasks.length > 0 && (
                  <div className="space-y-2 border rounded-lg p-3 bg-muted/30">
                    {subtasks.map((subtask, index) => (
                      <div
                        key={subtask.id}
                        className="flex items-center gap-2 group"
                      >
                        <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
                        <Checkbox
                          id={subtask.id}
                          checked={subtask.completed}
                          onCheckedChange={() => handleToggleSubtask(subtask.id)}
                        />
                        <label
                          htmlFor={subtask.id}
                          className={cn(
                            "flex-1 text-sm cursor-pointer",
                            subtask.completed && "line-through text-muted-foreground"
                          )}
                        >
                          {subtask.title}
                        </label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleRemoveSubtask(subtask.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    
                    {/* Progress indicator */}
                    <div className="pt-2 border-t mt-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {subtasks.filter((s) => s.completed).length} de {subtasks.length} concluídas
                        </span>
                        <span>
                          {Math.round(
                            (subtasks.filter((s) => s.completed).length / subtasks.length) * 100
                          )}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {isEditing ? "Guardar Alterações" : "Criar Tarefa"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
