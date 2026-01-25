import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface BudgetExecutionGaugeProps {
  budget: number;
  spent: number;
  title?: string;
}

function formatCurrency(value: number) {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(2)}B AOA`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M AOA`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K AOA`;
  }
  return `${value.toLocaleString()} AOA`;
}

export function BudgetExecutionGauge({ budget, spent, title = "Execução Orçamental" }: BudgetExecutionGaugeProps) {
  const executionRate = budget > 0 ? (spent / budget) * 100 : 0;
  const remaining = budget - spent;
  
  const getExecutionStatus = () => {
    if (executionRate >= 100) return { label: "Ultrapassado", color: "text-destructive", icon: TrendingUp };
    if (executionRate >= 80) return { label: "Elevado", color: "text-warning", icon: TrendingUp };
    if (executionRate >= 50) return { label: "Normal", color: "text-success", icon: Minus };
    return { label: "Baixo", color: "text-muted-foreground", icon: TrendingDown };
  };

  const status = getExecutionStatus();
  const StatusIcon = status.icon;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main gauge */}
        <div className="relative">
          <div className="flex items-end justify-center gap-2 mb-4">
            <span className="text-5xl font-bold">{Math.round(executionRate)}</span>
            <span className="text-2xl text-muted-foreground mb-1">%</span>
          </div>
          <Progress 
            value={Math.min(executionRate, 100)} 
            className={cn(
              "h-3 rounded-full",
              executionRate >= 100 && "[&>div]:bg-destructive",
              executionRate >= 80 && executionRate < 100 && "[&>div]:bg-warning"
            )}
          />
          <div className={cn("flex items-center justify-center gap-1 mt-2", status.color)}>
            <StatusIcon className="h-4 w-4" />
            <span className="text-sm font-medium">{status.label}</span>
          </div>
        </div>

        {/* Budget breakdown */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Orçamento Total</p>
            <p className="text-lg font-semibold">{formatCurrency(budget)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Executado</p>
            <p className="text-lg font-semibold text-primary">{formatCurrency(spent)}</p>
          </div>
        </div>

        {/* Remaining */}
        <div className="p-3 rounded-lg bg-muted/50 space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Disponível</p>
          <p className={cn(
            "text-xl font-bold",
            remaining < 0 ? "text-destructive" : "text-success"
          )}>
            {formatCurrency(Math.abs(remaining))}
            {remaining < 0 && " (défice)"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
