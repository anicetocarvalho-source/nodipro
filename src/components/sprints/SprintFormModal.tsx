import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { DbSprint } from "@/types/database";

const schema = z.object({
  name: z.string().min(2, "Nome obrigatório"),
  goal: z.string().optional(),
  start_date: z.date({ required_error: "Data de início obrigatória" }),
  end_date: z.date({ required_error: "Data de fim obrigatória" }),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sprint?: DbSprint | null;
  projectId: string;
  onSave: (data: { name: string; goal?: string; start_date: string; end_date: string; project_id: string; status: string; velocity: number }) => void;
  isLoading?: boolean;
}

export function SprintFormModal({ open, onOpenChange, sprint, projectId, onSave, isLoading }: Props) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", goal: "" },
  });

  useEffect(() => {
    if (open) {
      if (sprint) {
        form.reset({
          name: sprint.name,
          goal: sprint.goal || "",
          start_date: new Date(sprint.start_date),
          end_date: new Date(sprint.end_date),
        });
      } else {
        const today = new Date();
        const twoWeeksLater = new Date(today);
        twoWeeksLater.setDate(today.getDate() + 14);
        form.reset({ name: "", goal: "", start_date: today, end_date: twoWeeksLater });
      }
    }
  }, [open, sprint, form]);

  const onSubmit = (values: FormValues) => {
    onSave({
      name: values.name,
      goal: values.goal || undefined,
      start_date: format(values.start_date, "yyyy-MM-dd"),
      end_date: format(values.end_date, "yyyy-MM-dd"),
      project_id: projectId,
      status: sprint?.status || "planning",
      velocity: sprint?.velocity || 0,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{sprint ? "Editar Sprint" : "Novo Sprint"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Nome *</FormLabel>
                <FormControl><Input placeholder="Ex: Sprint 1" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="goal" render={({ field }) => (
              <FormItem>
                <FormLabel>Objectivo do Sprint</FormLabel>
                <FormControl><Textarea placeholder="Objectivo principal..." rows={2} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              {(["start_date", "end_date"] as const).map((fieldName) => (
                <FormField key={fieldName} control={form.control} name={fieldName} render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{fieldName === "start_date" ? "Início" : "Fim"} *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                            {field.value ? format(field.value, "PPP", { locale: pt }) : "Seleccione"}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus className="p-3 pointer-events-auto" />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )} />
              ))}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={isLoading}>{sprint ? "Guardar" : "Criar Sprint"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
