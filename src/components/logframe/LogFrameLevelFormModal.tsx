import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { LogFrameLevel, LOGFRAME_LEVEL_CONFIG, LogFrameLevelType } from "@/types/logframe";

interface FormValues {
  narrative: string;
  means_of_verification: string;
  assumptions: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  levelType: LogFrameLevelType;
  editingLevel?: LogFrameLevel | null;
  onSubmit: (values: FormValues) => void;
  isLoading?: boolean;
}

export function LogFrameLevelFormModal({ open, onOpenChange, levelType, editingLevel, onSubmit, isLoading }: Props) {
  const config = LOGFRAME_LEVEL_CONFIG[levelType];
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    defaultValues: { narrative: "", means_of_verification: "", assumptions: "" },
  });

  useEffect(() => {
    if (editingLevel) {
      reset({
        narrative: editingLevel.narrative,
        means_of_verification: editingLevel.means_of_verification || "",
        assumptions: editingLevel.assumptions || "",
      });
    } else {
      reset({ narrative: "", means_of_verification: "", assumptions: "" });
    }
  }, [editingLevel, open, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editingLevel ? "Editar" : "Adicionar"} {config.label}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Narrativa / Descrição *</Label>
            <Textarea {...register("narrative", { required: "Obrigatório" })} placeholder={config.description} className="mt-1" rows={3} />
            {errors.narrative && <p className="text-xs text-destructive mt-1">{errors.narrative.message}</p>}
          </div>
          <div>
            <Label>Meios de Verificação</Label>
            <Textarea {...register("means_of_verification")} placeholder="Como será medido ou verificado?" className="mt-1" rows={2} />
          </div>
          <div>
            <Label>Pressupostos / Riscos</Label>
            <Textarea {...register("assumptions")} placeholder="Condições externas necessárias para o sucesso" className="mt-1" rows={2} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isLoading}>{editingLevel ? "Guardar" : "Adicionar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
