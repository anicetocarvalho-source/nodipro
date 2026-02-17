import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { RAGAssessment, getRagColors } from "@/lib/ragUtils";

interface RAGIndicatorProps {
  assessment: RAGAssessment;
  showDetails?: boolean;
  size?: "sm" | "md";
}

export function RAGIndicator({ assessment, showDetails = false, size = "sm" }: RAGIndicatorProps) {
  const colors = getRagColors(assessment.overall);
  const dotSize = size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3";

  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        <div className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium cursor-default", colors.bg, colors.text)}>
          <span className={cn("rounded-full shrink-0 animate-pulse", dotSize, colors.dot)} />
          {assessment.label}
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <div className="space-y-1.5 text-xs">
          <p className="font-semibold">{assessment.tooltip}</p>
          {showDetails && (
            <div className="flex gap-3 pt-1 border-t">
              <RAGDot status={assessment.schedule} label="Cronograma" />
              <RAGDot status={assessment.budget} label="Orçamento" />
              <RAGDot status={assessment.scope} label="Escopo" />
            </div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

function RAGDot({ status, label }: { status: string; label: string }) {
  const c = getRagColors(status as any);
  return (
    <span className="flex items-center gap-1">
      <span className={cn("h-2 w-2 rounded-full", c.dot)} />
      {label}
    </span>
  );
}
