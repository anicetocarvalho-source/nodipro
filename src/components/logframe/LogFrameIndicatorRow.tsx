import { Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { LogFrameIndicator, INDICATOR_FREQUENCY_OPTIONS } from "@/types/logframe";

interface Props {
  indicator: LogFrameIndicator;
  onEdit: (indicator: LogFrameIndicator) => void;
  onDelete: (id: string) => void;
}

export function LogFrameIndicatorRow({ indicator, onEdit, onDelete }: Props) {
  const progress = indicator.target_value && indicator.target_value > 0 && indicator.current_value != null
    ? Math.min(100, Math.round((indicator.current_value / indicator.target_value) * 100))
    : null;

  const freqLabel = INDICATOR_FREQUENCY_OPTIONS.find(f => f.value === indicator.frequency)?.label;

  return (
    <div className="flex items-center gap-3 p-2 rounded-md bg-muted/30 hover:bg-muted/60 transition-colors text-sm group">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">{indicator.name}</p>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
          {indicator.unit && <span>Unidade: {indicator.unit}</span>}
          {indicator.baseline_value != null && <span>Base: {indicator.baseline_value}</span>}
          {indicator.target_value != null && <span>Meta: {indicator.target_value}</span>}
          {indicator.current_value != null && <span>Actual: {indicator.current_value}</span>}
          {freqLabel && <span>Freq: {freqLabel}</span>}
        </div>
      </div>
      {progress !== null && (
        <div className="w-20 shrink-0">
          <Progress value={progress} className="h-2" />
          <p className="text-[10px] text-center text-muted-foreground mt-0.5">{progress}%</p>
        </div>
      )}
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEdit(indicator)}>
          <Edit2 className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => onDelete(indicator.id)}>
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
