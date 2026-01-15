import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { pt } from "date-fns/locale";
import { Download, FileText, TrendingUp, TrendingDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  useBudgetSummary, 
  useBudgetEntriesByCategory, 
  useBudgetEntriesByPhase,
  useCreateBudgetSnapshot
} from "@/hooks/useBudget";
import { DbProject } from "@/types/database";

interface BudgetReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: DbProject[];
  defaultProjectId?: string;
}

const formatCurrency = (value: number) => {
  return `${value.toLocaleString()} AOA`;
};

export default function BudgetReportModal({
  open,
  onOpenChange,
  projects,
  defaultProjectId,
}: BudgetReportModalProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(defaultProjectId);
  const [periodType, setPeriodType] = useState<'monthly' | 'quarterly'>('monthly');
  
  const { data: summary } = useBudgetSummary(selectedProjectId);
  const { data: categoryData = [] } = useBudgetEntriesByCategory(selectedProjectId);
  const { data: phaseData = [] } = useBudgetEntriesByPhase(selectedProjectId);
  const createSnapshot = useCreateBudgetSnapshot();
  
  const selectedProject = projects.find(p => p.id === selectedProjectId);
  
  const reportData = useMemo(() => {
    const now = new Date();
    const periodStart = startOfMonth(periodType === 'quarterly' ? subMonths(now, 2) : now);
    const periodEnd = endOfMonth(now);
    
    return {
      period: periodType === 'monthly' 
        ? format(now, 'MMMM yyyy', { locale: pt })
        : `${format(periodStart, 'MMM', { locale: pt })} - ${format(periodEnd, 'MMM yyyy', { locale: pt })}`,
      periodStart,
      periodEnd,
    };
  }, [periodType]);
  
  const handleGenerateSnapshot = async () => {
    if (!selectedProjectId) return;
    
    const categoryBreakdown: Record<string, { planned: number; actual: number }> = {};
    categoryData.forEach(cat => {
      categoryBreakdown[cat.name] = { planned: cat.planned, actual: cat.actual };
    });
    
    const phaseBreakdown: Record<string, { planned: number; actual: number }> = {};
    phaseData.forEach(phase => {
      phaseBreakdown[phase.name] = { planned: phase.planned, actual: phase.actual };
    });
    
    await createSnapshot.mutateAsync({
      project_id: selectedProjectId,
      snapshot_date: format(new Date(), 'yyyy-MM-dd'),
      period_type: periodType,
      total_planned: summary?.totalPlanned || 0,
      total_actual: summary?.totalActual || 0,
      variance: summary?.variance || 0,
      variance_percentage: summary?.variancePercentage || 0,
      category_breakdown: categoryBreakdown,
      phase_breakdown: phaseBreakdown,
      notes: null,
    });
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Relatório Financeiro
          </DialogTitle>
          <DialogDescription>
            Visualize e exporte o relatório orçamental do período selecionado.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4">
            <Select 
              value={selectedProjectId || "all"} 
              onValueChange={(v) => setSelectedProjectId(v === "all" ? undefined : v)}
            >
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Selecione um projecto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os projectos</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={periodType} onValueChange={(v: any) => setPeriodType(v)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Mensal</SelectItem>
                <SelectItem value="quarterly">Trimestral</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Report Content */}
          <Card>
            <CardContent className="p-6 space-y-6">
              {/* Header */}
              <div className="text-center border-b pb-4">
                <h2 className="text-xl font-bold">
                  {selectedProject ? selectedProject.name : 'Relatório Consolidado'}
                </h2>
                <p className="text-muted-foreground">
                  Relatório Financeiro - {reportData.period}
                </p>
              </div>
              
              {/* Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Orçamento Planeado</p>
                  <p className="text-2xl font-bold">{formatCurrency(summary?.totalPlanned || 0)}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Valor Executado</p>
                  <p className="text-2xl font-bold">{formatCurrency(summary?.totalActual || 0)}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Taxa de Execução</span>
                  <span className="font-medium">{(summary?.executionPercentage || 0).toFixed(1)}%</span>
                </div>
                <Progress value={summary?.executionPercentage || 0} className="h-3" />
              </div>
              
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  {(summary?.variance || 0) >= 0 ? (
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-500" />
                  )}
                  <span className="font-medium">Variação</span>
                </div>
                <span className={`text-lg font-bold ${(summary?.variance || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {(summary?.variance || 0) >= 0 ? '+' : ''}{formatCurrency(summary?.variance || 0)}
                </span>
              </div>
              
              <Separator />
              
              {/* Category Breakdown */}
              <div>
                <h3 className="font-semibold mb-3">Distribuição por Categoria</h3>
                <div className="space-y-3">
                  {categoryData.map((cat) => (
                    <div key={cat.name} className="flex items-center justify-between text-sm">
                      <span>{cat.name}</span>
                      <div className="flex gap-4">
                        <span className="text-muted-foreground">Plan: {formatCurrency(cat.planned)}</span>
                        <span>Exec: {formatCurrency(cat.actual)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {phaseData.length > 0 && (
                <>
                  <Separator />
                  
                  {/* Phase Breakdown */}
                  <div>
                    <h3 className="font-semibold mb-3">Distribuição por Fase</h3>
                    <div className="space-y-3">
                      {phaseData.map((phase) => {
                        const percentage = phase.planned > 0 ? (phase.actual / phase.planned) * 100 : 0;
                        return (
                          <div key={phase.name} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span>{phase.name}</span>
                              <span>{percentage.toFixed(0)}%</span>
                            </div>
                            <Progress value={Math.min(percentage, 100)} className="h-2" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
              
              {/* Footer */}
              <div className="text-center text-xs text-muted-foreground pt-4 border-t">
                Gerado em {format(new Date(), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: pt })}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          {selectedProjectId && (
            <Button 
              onClick={handleGenerateSnapshot}
              disabled={createSnapshot.isPending}
            >
              <Download className="h-4 w-4 mr-2" />
              {createSnapshot.isPending ? "A guardar..." : "Guardar Snapshot"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
