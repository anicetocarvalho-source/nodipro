import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useCreateProject, useUpdateProject } from "@/hooks/useProjects";
import { DbProject, ProjectStatus } from "@/types/database";

const projectFormSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório").max(100, "Nome deve ter no máximo 100 caracteres"),
  description: z.string().trim().max(1000, "Descrição deve ter no máximo 1000 caracteres").optional(),
  client: z.string().trim().max(100, "Cliente deve ter no máximo 100 caracteres").optional(),
  status: z.enum(["active", "delayed", "completed", "on_hold"] as const),
  progress: z.coerce.number().min(0, "Progresso mínimo é 0").max(100, "Progresso máximo é 100"),
  start_date: z.date().optional(),
  end_date: z.date().optional(),
  budget: z.coerce.number().min(0, "Orçamento deve ser positivo").optional(),
  spent: z.coerce.number().min(0, "Valor gasto deve ser positivo").optional(),
}).refine((data) => {
  if (data.start_date && data.end_date) {
    return data.end_date >= data.start_date;
  }
  return true;
}, {
  message: "Data de fim deve ser posterior à data de início",
  path: ["end_date"],
});

type ProjectFormValues = z.infer<typeof projectFormSchema>;

const statusOptions: { value: ProjectStatus; label: string }[] = [
  { value: "active", label: "Activo" },
  { value: "on_hold", label: "Pausado" },
  { value: "delayed", label: "Atrasado" },
  { value: "completed", label: "Concluído" },
];

interface ProjectFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: DbProject | null;
}

export function ProjectFormModal({ open, onOpenChange, project }: ProjectFormModalProps) {
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const isEditing = !!project;
  
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: "",
      description: "",
      client: "",
      status: "active",
      progress: 0,
      budget: undefined,
      spent: undefined,
    },
  });

  // Reset form when project changes or modal opens
  useEffect(() => {
    if (open) {
      if (project) {
        form.reset({
          name: project.name,
          description: project.description || "",
          client: project.client || "",
          status: project.status,
          progress: project.progress,
          start_date: project.start_date ? new Date(project.start_date) : undefined,
          end_date: project.end_date ? new Date(project.end_date) : undefined,
          budget: project.budget ?? undefined,
          spent: project.spent ?? undefined,
        });
      } else {
        form.reset({
          name: "",
          description: "",
          client: "",
          status: "active",
          progress: 0,
          budget: undefined,
          spent: undefined,
        });
      }
    }
  }, [open, project, form]);

  const onSubmit = async (values: ProjectFormValues) => {
    const projectData = {
      name: values.name,
      description: values.description || null,
      client: values.client || null,
      status: values.status,
      progress: values.progress,
      start_date: values.start_date ? format(values.start_date, "yyyy-MM-dd") : null,
      end_date: values.end_date ? format(values.end_date, "yyyy-MM-dd") : null,
      budget: values.budget ?? null,
      spent: values.spent ?? null,
    };

    if (isEditing && project) {
      await updateProject.mutateAsync({ id: project.id, ...projectData });
    } else {
      await createProject.mutateAsync(projectData);
    }
    
    onOpenChange(false);
  };

  const isPending = createProject.isPending || updateProject.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Projecto" : "Novo Projecto"}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Modifique os dados do projecto." 
              : "Preencha os dados para criar um novo projecto."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Nome */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Projecto *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Sistema de Gestão de Vendas" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Descrição */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descreva o objectivo e escopo do projecto..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Cliente */}
            <FormField
              control={form.control}
              name="client"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Empresa ABC, Lda" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status e Progresso */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione o estado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="progress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Progresso (%)</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} max={100} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Datas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Início</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd 'de' MMMM, yyyy", { locale: pt })
                            ) : (
                              <span>Seleccione a data</span>
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
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Fim</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd 'de' MMMM, yyyy", { locale: pt })
                            ) : (
                              <span>Seleccione a data</span>
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
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Orçamento */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="budget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Orçamento (AOA)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={0} 
                        placeholder="0"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormDescription>
                      Valor total planeado para o projecto
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="spent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Gasto (AOA)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={0} 
                        placeholder="0"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormDescription>
                      Valor já executado
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Botões */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isEditing ? "A guardar..." : "A criar..."}
                  </>
                ) : (
                  isEditing ? "Guardar Alterações" : "Criar Projecto"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
