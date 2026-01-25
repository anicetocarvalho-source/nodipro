import { Briefcase, TrendingUp, AlertTriangle, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PortfolioSummary } from "@/hooks/useGovernance";

interface PortfolioOverviewCardProps {
  portfolio: PortfolioSummary;
  onClick?: () => void;
}

function formatCurrency(value: number) {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(0)}K`;
  }
  return value.toLocaleString();
}

export function PortfolioOverviewCard({ portfolio, onClick }: PortfolioOverviewCardProps) {
  const executionRate = portfolio.budget > 0 
    ? Math.round((portfolio.spent / portfolio.budget) * 100) 
    : 0;

  return (
    <Card 
      className={cn(
        "hover:shadow-md transition-all cursor-pointer",
        portfolio.atRisk > 0 && "border-l-4 border-l-destructive"
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Briefcase className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">{portfolio.name}</CardTitle>
              <p className="text-xs text-muted-foreground">
                {portfolio.programsCount} programas • {portfolio.projectsCount} projectos
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className={cn(
              "text-xs",
              portfolio.status === "active"
                ? "bg-success/10 text-success border-success/20"
                : "bg-muted text-muted-foreground"
            )}
          >
            {portfolio.status === "active" ? "Activo" : "Inactivo"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress */}
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progresso Médio</span>
            <span className="font-medium">{portfolio.progress}%</span>
          </div>
          <Progress value={portfolio.progress} className="h-2" />
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-4 pt-2 border-t">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-primary">
              <DollarSign className="h-3 w-3" />
              <span className="text-sm font-bold">{formatCurrency(portfolio.budget)}</span>
            </div>
            <p className="text-xs text-muted-foreground">Orçamento</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-success">
              <TrendingUp className="h-3 w-3" />
              <span className="text-sm font-bold">{executionRate}%</span>
            </div>
            <p className="text-xs text-muted-foreground">Execução</p>
          </div>
          <div className="text-center">
            <div className={cn(
              "flex items-center justify-center gap-1",
              portfolio.atRisk > 0 ? "text-destructive" : "text-success"
            )}>
              <AlertTriangle className="h-3 w-3" />
              <span className="text-sm font-bold">{portfolio.atRisk}</span>
            </div>
            <p className="text-xs text-muted-foreground">Em Risco</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
