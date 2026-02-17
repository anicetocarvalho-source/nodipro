import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LogFrameIndicator, INDICATOR_FREQUENCY_OPTIONS } from "@/types/logframe";

interface FormValues {
  name: string;
  description: string;
  unit: string;
  baseline_value: string;
  target_value: string;
  current_value: string;
  data_source: string;
  frequency: string;
  responsible: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingIndicator?: LogFrameIndicator | null;
  onSubmit: (values: FormValues) => void;
  isLoading?: boolean;
}

export function LogFrameIndicatorFormModal({ open, onOpenChange, editingIndicator, onSubmit, isLoading }: Props) {
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormValues>({
    defaultValues: { name: "", description: "", unit: "", baseline_value: "", target_value: "", current_value: "", data_source: "", frequency: "", responsible: "" },
  });

  useEffect(() => {
    if (editingIndicator) {
      reset({
        name: editingIndicator.name,
        description: editingIndicator.description || "",
        unit: editingIndicator.unit || "",
        baseline_value: editingIndicator.baseline_value?.toString() || "",
        target_value: editingIndicator.target_value?.toString() || "",
        current_value: editingIndicator.current_value?.toString() || "",
        data_source: editingIndicator.data_source || "",
        frequency: editingIndicator.frequency || "",
        responsible: editingIndicator.responsible || "",
      });
    } else {
      reset({ name: "", description: "", unit: "", baseline_value: "", target_value: "", current_value: "", data_source: "", frequency: "", responsible: "" });
    }
  }, [editingIndicator, open, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editingIndicator ? "Editar" : "Adicionar"} Indicador</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Nome do Indicador *</Label>
            <Input {...register("name", { required: "Obrigatório" })} placeholder="Ex: Nº de beneficiários directos" className="mt-1" />
            {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea {...register("description")} placeholder="Definição detalhada do indicador" className="mt-1" rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Unidade</Label>
              <Input {...register("unit")} placeholder="%, nº, USD" className="mt-1" />
            </div>
            <div>
              <Label>Frequência</Label>
              <Select value={watch("frequency")} onValueChange={(v) => setValue("frequency", v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {INDICATOR_FREQUENCY_OPTIONS.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Valor Base</Label>
              <Input {...register("baseline_value")} type="number" step="any" className="mt-1" />
            </div>
            <div>
              <Label>Meta</Label>
              <Input {...register("target_value")} type="number" step="any" className="mt-1" />
            </div>
            <div>
              <Label>Valor Actual</Label>
              <Input {...register("current_value")} type="number" step="any" className="mt-1" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Fonte de Dados</Label>
              <Input {...register("data_source")} placeholder="Relatórios, inquéritos..." className="mt-1" />
            </div>
            <div>
              <Label>Responsável</Label>
              <Input {...register("responsible")} placeholder="Nome ou equipa" className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isLoading}>{editingIndicator ? "Guardar" : "Adicionar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
