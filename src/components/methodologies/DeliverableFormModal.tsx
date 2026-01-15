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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useCreateTemplateDeliverable, useUpdateTemplateDeliverable } from "@/hooks/useMethodologies";
import { TemplateDeliverable } from "@/types/methodology";

const formSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  description: z.string().optional(),
  is_mandatory: z.boolean().default(true),
  position: z.coerce.number().min(0),
});

type FormValues = z.infer<typeof formSchema>;

interface DeliverableFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phaseId: string;
  deliverable?: TemplateDeliverable | null;
  existingCount: number;
}

export default function DeliverableFormModal({
  open,
  onOpenChange,
  phaseId,
  deliverable,
  existingCount,
}: DeliverableFormModalProps) {
  const createDeliverable = useCreateTemplateDeliverable();
  const updateDeliverable = useUpdateTemplateDeliverable();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      is_mandatory: true,
      position: existingCount,
    },
  });
  
  const isEditing = !!deliverable;
  const isPending = createDeliverable.isPending || updateDeliverable.isPending;
  
  useEffect(() => {
    if (open) {
      if (deliverable) {
        form.reset({
          name: deliverable.name,
          description: deliverable.description || "",
          is_mandatory: deliverable.is_mandatory,
          position: deliverable.position,
        });
      } else {
        form.reset({
          name: "",
          description: "",
          is_mandatory: true,
          position: existingCount,
        });
      }
    }
  }, [open, deliverable, existingCount, form]);
  
  const onSubmit = async (values: FormValues) => {
    if (isEditing && deliverable) {
      await updateDeliverable.mutateAsync({
        id: deliverable.id,
        ...values,
      });
    } else {
      await createDeliverable.mutateAsync({
        phase_id: phaseId,
        name: values.name,
        description: values.description || null,
        is_mandatory: values.is_mandatory,
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
            {isEditing ? "Editar Entregável" : "Novo Entregável"}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Atualize as informações do entregável."
              : "Adicione um novo entregável a esta fase."
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
                  <FormLabel>Nome do Entregável</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Relatório de Progresso" {...field} />
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
                      placeholder="Descrição do entregável e requisitos..."
                      className="resize-none"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="is_mandatory"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Obrigatório</FormLabel>
                    <FormDescription>
                      Entregáveis obrigatórios devem ser completados para avançar
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
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
                {isPending ? "A guardar..." : isEditing ? "Guardar" : "Criar Entregável"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
