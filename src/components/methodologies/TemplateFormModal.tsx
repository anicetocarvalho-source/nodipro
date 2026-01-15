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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateProjectTemplate, useUpdateProjectTemplate } from "@/hooks/useMethodologies";
import { ProjectTemplate, Sector } from "@/types/methodology";
import { useAuthContext } from "@/contexts/AuthContext";

const formSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  description: z.string().optional(),
  sector_id: z.string().min(1, "Selecione um sector"),
  is_default: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

interface TemplateFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: ProjectTemplate | null;
  sectorId?: string | null;
  sectors: Sector[];
}

export default function TemplateFormModal({
  open,
  onOpenChange,
  template,
  sectorId,
  sectors,
}: TemplateFormModalProps) {
  const { user } = useAuthContext();
  const createTemplate = useCreateProjectTemplate();
  const updateTemplate = useUpdateProjectTemplate();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      sector_id: "",
      is_default: false,
    },
  });
  
  const isEditing = !!template;
  const isPending = createTemplate.isPending || updateTemplate.isPending;
  
  useEffect(() => {
    if (open) {
      if (template) {
        form.reset({
          name: template.name,
          description: template.description || "",
          sector_id: template.sector_id,
          is_default: template.is_default,
        });
      } else {
        form.reset({
          name: "",
          description: "",
          sector_id: sectorId || "",
          is_default: false,
        });
      }
    }
  }, [open, template, sectorId, form]);
  
  const onSubmit = async (values: FormValues) => {
    if (isEditing && template) {
      await updateTemplate.mutateAsync({
        id: template.id,
        ...values,
      });
    } else {
      await createTemplate.mutateAsync({
        name: values.name,
        description: values.description || null,
        sector_id: values.sector_id,
        is_default: values.is_default,
        created_by: user?.id || null,
      });
    }
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Template" : "Novo Template"}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Atualize as informações do template de projecto."
              : "Crie um novo template de projecto para o sector selecionado."
            }
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="sector_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sector</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um sector" />
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
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Template</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Construção de Escolas" {...field} />
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
                      placeholder="Descrição do template e quando utilizá-lo..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="is_default"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Template Padrão</FormLabel>
                    <FormDescription>
                      Definir como template padrão para este sector
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
                {isPending ? "A guardar..." : isEditing ? "Guardar" : "Criar Template"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
