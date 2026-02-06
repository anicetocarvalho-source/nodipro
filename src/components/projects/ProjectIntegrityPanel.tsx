import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  AlertCircle,
  Info,
  FileText,
  DollarSign,
  CheckCircle2,
  Users,
  ExternalLink,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useProjectIntegrity, IntegrityCheck } from "@/hooks/useProjectIntegrity";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-AO", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value) + " AOA";

const severityConfig = {
  error: {
    icon: AlertCircle,
    className: "text-destructive bg-destructive/10 border-destructive/20",
    badgeClass: "bg-destructive/10 text-destructive",
    label: "Crítico",
  },
  warning: {
    icon: AlertTriangle,
    className: "text-warning bg-warning/10 border-warning/20",
    badgeClass: "bg-warning/10 text-warning",
    label: "Aviso",
  },
  info: {
    icon: Info,
    className: "text-info bg-info/10 border-info/20",
    badgeClass: "bg-info/10 text-info",
    label: "Info",
  },
};

const moduleIcons = {
  budget: DollarSign,
  tasks: CheckCircle2,
  documents: FileText,
  team: Users,
};

function IntegrityCheckItem({ check }: { check: IntegrityCheck }) {
  const navigate = useNavigate();
  const config = severityConfig[check.severity];
  const SeverityIcon = config.icon;
  const ModuleIcon = moduleIcons[check.module];

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border ${config.className}`}>
      <SeverityIcon className="h-4 w-4 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">{check.title}</p>
          <Tooltip>
            <TooltipTrigger>
              <ModuleIcon className="h-3 w-3 opacity-50" />
            </TooltipTrigger>
            <TooltipContent>{check.module}</TooltipContent>
          </Tooltip>
        </div>
        <p className="text-xs opacity-80 mt-0.5">{check.description}</p>
      </div>
      {check.actionLabel && check.actionRoute && (
        <Button
          variant="ghost"
          size="sm"
          className="shrink-0 h-7 text-xs"
          onClick={() => navigate(check.actionRoute!)}
        >
          {check.actionLabel}
          <ExternalLink className="h-3 w-3 ml-1" />
        </Button>
      )}
    </div>
  );
}

interface ProjectIntegrityPanelProps {
  projectId: string;
}

export function ProjectIntegrityPanel({ projectId }: ProjectIntegrityPanelProps) {
  const navigate = useNavigate();
  const { data, isLoading } = useProjectIntegrity(projectId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const scoreColor =
    data.integrityScore >= 80
      ? "text-success"
      : data.integrityScore >= 50
        ? "text-warning"
        : "text-destructive";

  const errorCount = data.integrityChecks.filter(c => c.severity === "error").length;
  const warningCount = data.integrityChecks.filter(c => c.severity === "warning").length;

  return (
    <div className="space-y-4">
      {/* Integrity Score */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              Integridade do Projecto
            </CardTitle>
            <span className={`text-lg font-bold ${scoreColor}`}>{data.integrityScore}%</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Progress value={data.integrityScore} className="h-2" />
          <div className="flex items-center gap-2 flex-wrap">
            {errorCount > 0 && (
              <Badge variant="outline" className={severityConfig.error.badgeClass}>
                {errorCount} crítico{errorCount > 1 ? "s" : ""}
              </Badge>
            )}
            {warningCount > 0 && (
              <Badge variant="outline" className={severityConfig.warning.badgeClass}>
                {warningCount} aviso{warningCount > 1 ? "s" : ""}
              </Badge>
            )}
            {data.integrityChecks.length === 0 && (
              <Badge variant="outline" className="bg-success/10 text-success">
                Sem problemas detectados
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cross-Module Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Resumo Cruzado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Budget Link */}
          <button
            onClick={() => navigate("/budget")}
            className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
          >
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded bg-warning/10">
                <DollarSign className="h-3.5 w-3.5 text-warning" />
              </div>
              <div>
                <p className="text-sm font-medium">Orçamento</p>
                <p className="text-xs text-muted-foreground">
                  {data.budgetEntriesCount} entrada{data.budgetEntriesCount !== 1 ? "s" : ""}
                  {data.budgetPending > 0 && ` · ${formatCurrency(data.budgetPending)} pendente`}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold">{data.budgetExecutionRate}%</p>
              <p className="text-xs text-muted-foreground">execução</p>
            </div>
          </button>

          {/* Documents Link */}
          <button
            onClick={() => navigate("/documents")}
            className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
          >
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded bg-info/10">
                <FileText className="h-3.5 w-3.5 text-info" />
              </div>
              <div>
                <p className="text-sm font-medium">Documentos</p>
                <p className="text-xs text-muted-foreground">
                  {data.approvedDocuments} aprovado{data.approvedDocuments !== 1 ? "s" : ""}
                  {data.pendingDocuments > 0 && ` · ${data.pendingDocuments} pendente${data.pendingDocuments !== 1 ? "s" : ""}`}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold">{data.totalDocuments}</p>
              <p className="text-xs text-muted-foreground">total</p>
            </div>
          </button>

          {/* Team Link */}
          <button
            onClick={() => navigate("/team")}
            className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
          >
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded bg-primary/10">
                <Users className="h-3.5 w-3.5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Equipa</p>
                <p className="text-xs text-muted-foreground">
                  {data.teamSize} membro{data.teamSize !== 1 ? "s" : ""}
                  {data.unassignedTasks > 0 && ` · ${data.unassignedTasks} tarefa${data.unassignedTasks !== 1 ? "s" : ""} s/ responsável`}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold">{data.taskCompletionRate}%</p>
              <p className="text-xs text-muted-foreground">conclusão</p>
            </div>
          </button>
        </CardContent>
      </Card>

      {/* Integrity Checks */}
      {data.integrityChecks.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Alertas de Integração</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.integrityChecks
              .sort((a, b) => {
                const order = { error: 0, warning: 1, info: 2 };
                return order[a.severity] - order[b.severity];
              })
              .map(check => (
                <IntegrityCheckItem key={check.id} check={check} />
              ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
