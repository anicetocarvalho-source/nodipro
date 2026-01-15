import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { useCreateTemplatePhase, useUpdateTemplatePhase } from "@/hooks/useMethodologies";
import { TemplatePhase } from "@/types/methodology";

const formSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  description: z.string().optional(),
  duration_days: z.coerce.number().min(1, "Duração mínima é 1 dia").optional(),
  position: z.coerce.number().min(0),
});

type FormValues = z.infer<typeof formSchema>;

interface PhaseFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: string;
  phase?: TemplatePhase | null;
  existingCount: number;
}

export default function PhaseFormModal({
  open,
  onOpenChange,
  templateId,
  phase,
  existingCount,
}: PhaseFormModalProps) {
  const createPhase = useCreateTemplatePhase();
  const updatePhase = useUpdateTemplatePhase();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      duration_days: undefined,
      position: existingCount,
    },
  });
  
  const isEditing = !!phase;
  const isPending = createPhase.isPending || updatePhase.isPending;
  
  useEffect(() => {
    if (open) {
      if (phase) {
        form.reset({
          name: phase.name,
          description: phase.description || "",
          duration_days: phase.duration_days || undefined,
          position: phase.position,
        });
      } else {
        form.reset({
          name: "",
          description: "",
          duration_days: undefined,
          position: existingCount,
        });
      }
    }
  }, [open, phase, existingCount, form]);
  
  const onSubmit = async (values: FormValues) => {
    if (isEditing && phase) {
      await updatePhase.mutateAsync({
        id: phase.id,
        ...values,
      });
    } else {
      await createPhase.mutateAsync({
        template_id: templateId,
        name: values.name,
        description: values.description || null,
        duration_days: values.duration_days || null,
        position: values.position,
      });
    }
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Fase" : "Nova Fase"}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Atualize as informações da fase do template."
              : "Adicione uma nova fase ao template de projecto."
            }
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Fase</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Iniciação" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descrição das actividades desta fase..."
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
                name="duration_days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duração (dias)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="30" 
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Posição</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={0}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "A guardar..." : isEditing ? "Guardar" : "Criar Fase"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
