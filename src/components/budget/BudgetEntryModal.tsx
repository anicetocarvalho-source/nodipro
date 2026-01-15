import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import { cn } from "@/lib/utils";
import { useCreateBudgetEntry, useUpdateBudgetEntry, useCostCategories } from "@/hooks/useBudget";
import { BudgetEntry } from "@/types/budget";
import { DbProject } from "@/types/database";
import { useAuthContext } from "@/contexts/AuthContext";

const formSchema = z.object({
  project_id: z.string().min(1, "Selecione um projecto"),
  category_id: z.string().optional(),
  phase_name: z.string().optional(),
  description: z.string().min(3, "Descrição deve ter pelo menos 3 caracteres"),
  planned_amount: z.coerce.number().min(0, "Valor deve ser positivo"),
  actual_amount: z.coerce.number().min(0, "Valor deve ser positivo"),
  entry_date: z.date(),
  status: z.enum(['pending', 'approved', 'rejected', 'paid']),
  invoice_number: z.string().optional(),
  supplier: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface BudgetEntryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry?: BudgetEntry | null;
  projects: DbProject[];
  defaultProjectId?: string;
}

export default function BudgetEntryModal({
  open,
  onOpenChange,
  entry,
  projects,
  defaultProjectId,
}: BudgetEntryModalProps) {
  const { user } = useAuthContext();
  const { data: categories = [] } = useCostCategories();
  const createEntry = useCreateBudgetEntry();
  const updateEntry = useUpdateBudgetEntry();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      project_id: "",
      category_id: "",
      phase_name: "",
      description: "",
      planned_amount: 0,
      actual_amount: 0,
      entry_date: new Date(),
      status: 'pending',
      invoice_number: "",
      supplier: "",
      notes: "",
    },
  });
  
  const isEditing = !!entry;
  const isPending = createEntry.isPending || updateEntry.isPending;
  
  useEffect(() => {
    if (open) {
      if (entry) {
        form.reset({
          project_id: entry.project_id,
          category_id: entry.category_id || "",
          phase_name: entry.phase_name || "",
          description: entry.description,
          planned_amount: Number(entry.planned_amount),
          actual_amount: Number(entry.actual_amount),
          entry_date: new Date(entry.entry_date),
          status: entry.status,
          invoice_number: entry.invoice_number || "",
          supplier: entry.supplier || "",
          notes: entry.notes || "",
        });
      } else {
        form.reset({
          project_id: defaultProjectId || "",
          category_id: "",
          phase_name: "",
          description: "",
          planned_amount: 0,
          actual_amount: 0,
          entry_date: new Date(),
          status: 'pending',
          invoice_number: "",
          supplier: "",
          notes: "",
        });
      }
    }
  }, [open, entry, defaultProjectId, form]);
  
  const onSubmit = async (values: FormValues) => {
    const data = {
      project_id: values.project_id,
      category_id: values.category_id || null,
      phase_name: values.phase_name || null,
      description: values.description,
      planned_amount: values.planned_amount,
      actual_amount: values.actual_amount,
      entry_date: format(values.entry_date, 'yyyy-MM-dd'),
      status: values.status,
      invoice_number: values.invoice_number || null,
      supplier: values.supplier || null,
      notes: values.notes || null,
      task_id: null,
      created_by: user?.id || null,
      approved_by: null,
      approved_at: null,
    };
    
    if (isEditing && entry) {
      await updateEntry.mutateAsync({ id: entry.id, ...data });
    } else {
      await createEntry.mutateAsync(data);
    }
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Entrada Orçamental" : "Nova Entrada Orçamental"}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Atualize os detalhes da entrada orçamental."
              : "Registe um novo custo planeado ou executado."
            }
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="project_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Projecto</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um projecto" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
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
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria de Custo</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.code} - {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phase_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fase do Projecto</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Iniciação" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="entry_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data</FormLabel>
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
                              format(field.value, "dd/MM/yyyy")
                            ) : (
                              <span>Selecione uma data</span>
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
                        />
                      </PopoverContent>
                    </Popover>
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
                      placeholder="Descreva o custo ou item orçamental..."
                      className="resize-none"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="planned_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Planeado (AOA)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={0}
                        step={0.01}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="actual_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Executado (AOA)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={0}
                        step={0.01}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="supplier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fornecedor</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do fornecedor" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="invoice_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nº Factura</FormLabel>
                    <FormControl>
                      <Input placeholder="FAT-2024-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="approved">Aprovado</SelectItem>
                      <SelectItem value="rejected">Rejeitado</SelectItem>
                      <SelectItem value="paid">Pago</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Observações adicionais..."
                      className="resize-none"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "A guardar..." : isEditing ? "Guardar" : "Criar Entrada"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
