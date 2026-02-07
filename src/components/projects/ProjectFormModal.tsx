import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useOrganization } from "@/contexts/OrganizationContext";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarIcon, Loader2, X } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useCreateProject, useUpdateProject, useProjectSDGs, useSaveProjectSDGs } from "@/hooks/useProjects";
import { useSectors, useSDGs, useProvinces, useFunders } from "@/hooks/useGovernance";
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
  sector_id: z.string().optional(),
  province_id: z.string().optional(),
  funder_id: z.string().optional(),
  sdg_ids: z.array(z.string()).optional(),
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
  const saveProjectSDGs = useSaveProjectSDGs();
  const { data: sectors = [] } = useSectors();
  const { data: sdgs = [] } = useSDGs();
  const { data: provinces = [] } = useProvinces();
  const { data: funders = [] } = useFunders();
  const { data: projectSDGs = [] } = useProjectSDGs(project?.id);
  const { organization } = useOrganization();
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
      sector_id: undefined,
      province_id: undefined,
      funder_id: undefined,
      sdg_ids: [],
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
          sector_id: (project as any).sector_id || undefined,
          province_id: (project as any).province_id || undefined,
          funder_id: (project as any).funder_id || undefined,
          sdg_ids: projectSDGs.map(s => s.id),
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
          sector_id: undefined,
          province_id: undefined,
          funder_id: undefined,
          sdg_ids: [],
        });
      }
    }
  }, [open, project, form, projectSDGs]);

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
      program_id: project?.program_id ?? null,
      sector_id: values.sector_id || null,
      province_id: values.province_id || null,
      funder_id: values.funder_id || null,
      organization_id: organization?.id || null,
    };

    let savedProject: DbProject;
    if (isEditing && project) {
      savedProject = await updateProject.mutateAsync({ id: project.id, ...projectData });
    } else {
      savedProject = await createProject.mutateAsync(projectData);
    }
    
    // Save SDG associations
    if (values.sdg_ids && values.sdg_ids.length > 0) {
      await saveProjectSDGs.mutateAsync({
        projectId: savedProject.id,
        sdgIds: values.sdg_ids,
      });
    } else if (isEditing) {
      // Clear SDGs if none selected
      await saveProjectSDGs.mutateAsync({
        projectId: savedProject.id,
        sdgIds: [],
      });
    }
    
    onOpenChange(false);
  };

  const isPending = createProject.isPending || updateProject.isPending || saveProjectSDGs.isPending;

  const selectedSDGs = form.watch("sdg_ids") || [];
  
  const toggleSDG = (sdgId: string) => {
    const current = form.getValues("sdg_ids") || [];
    if (current.includes(sdgId)) {
      form.setValue("sdg_ids", current.filter(id => id !== sdgId));
    } else {
      form.setValue("sdg_ids", [...current, sdgId]);
    }
  };

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

            {/* Sector, Província, Financiador */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="sector_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sector</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione o sector" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {sectors.map((sector) => (
                          <SelectItem key={sector.id} value={sector.id}>
                            {sector.name}
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
                name="province_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Província</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione a província" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {provinces.map((province) => (
                          <SelectItem key={province.id} value={province.id}>
                            {province.name}
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
                name="funder_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Financiador</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione o financiador" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {funders.map((funder) => (
                          <SelectItem key={funder.id} value={funder.id}>
                            {funder.acronym ? `${funder.acronym} - ${funder.name}` : funder.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* ODS - Objetivos de Desenvolvimento Sustentável */}
            <FormField
              control={form.control}
              name="sdg_ids"
              render={() => (
                <FormItem>
                  <FormLabel>ODS - Objetivos de Desenvolvimento Sustentável</FormLabel>
                  <FormDescription>
                    Seleccione os ODS relacionados com este projecto
                  </FormDescription>
                  
                  {/* Selected SDGs badges */}
                  {selectedSDGs.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {selectedSDGs.map((sdgId) => {
                        const sdg = sdgs.find(s => s.id === sdgId);
                        if (!sdg) return null;
                        return (
                          <Badge
                            key={sdgId}
                            variant="secondary"
                            className="pr-1 gap-1"
                            style={{ backgroundColor: sdg.color ? `${sdg.color}20` : undefined }}
                          >
                            <span 
                              className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] text-white font-bold"
                              style={{ backgroundColor: sdg.color || 'hsl(var(--primary))' }}
                            >
                              {sdg.number}
                            </span>
                            <span className="text-xs truncate max-w-[120px]">{sdg.name}</span>
                            <button
                              type="button"
                              onClick={() => toggleSDG(sdgId)}
                              className="ml-0.5 hover:bg-muted rounded"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        );
                      })}
                    </div>
                  )}

                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          {selectedSDGs.length > 0 
                            ? `${selectedSDGs.length} ODS seleccionado(s)`
                            : "Seleccione os ODS..."}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0" align="start">
                      <ScrollArea className="h-[300px]">
                        <div className="p-2 space-y-1">
                          {sdgs.map((sdg) => (
                            <div
                              key={sdg.id}
                              className={cn(
                                "flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-muted transition-colors",
                                selectedSDGs.includes(sdg.id) && "bg-muted"
                              )}
                              onClick={() => toggleSDG(sdg.id)}
                            >
                              <Checkbox
                                checked={selectedSDGs.includes(sdg.id)}
                                onCheckedChange={() => toggleSDG(sdg.id)}
                              />
                              <span 
                                className="w-6 h-6 rounded flex items-center justify-center text-xs text-white font-bold shrink-0"
                                style={{ backgroundColor: sdg.color || 'hsl(var(--primary))' }}
                              >
                                {sdg.number}
                              </span>
                              <span className="text-sm">{sdg.name}</span>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

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
