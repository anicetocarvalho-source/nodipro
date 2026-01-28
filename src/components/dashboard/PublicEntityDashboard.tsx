import {
  FolderKanban,
  CheckCircle,
  Clock,
  AlertTriangle,
  Target,
  FileCheck,
  Landmark,
  Globe,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface PublicEntityDashboardProps {
  userName: string;
}

const stats = [
  {
    title: "Projectos Activos",
    value: 24,
    change: "+3 este mês",
    changeType: "positive" as const,
    icon: FolderKanban,
  },
  {
    title: "Taxa de Execução",
    value: "68%",
    change: "+5% vs trimestre anterior",
    changeType: "positive" as const,
    icon: CheckCircle,
  },
  {
    title: "Conformidade Legal",
    value: "94%",
    change: "12 documentos pendentes",
    changeType: "neutral" as const,
    icon: FileCheck,
  },
  {
    title: "ODS Impactados",
    value: 8,
    change: "De 17 objectivos",
    changeType: "positive" as const,
    icon: Globe,
  },
];

const sdgProgress = [
  { number: 1, name: "Erradicação da Pobreza", progress: 45, color: "#E5243B" },
  { number: 4, name: "Educação de Qualidade", progress: 72, color: "#C5192D" },
  { number: 6, name: "Água Potável e Saneamento", progress: 58, color: "#26BDE2" },
  { number: 8, name: "Trabalho Digno e Crescimento Económico", progress: 63, color: "#A21942" },
  { number: 9, name: "Indústria, Inovação e Infraestrutura", progress: 41, color: "#FD6925" },
];

const complianceItems = [
  { name: "Relatório Trimestral Q4", status: "pending", dueDate: "31 Jan 2026" },
  { name: "Auditoria Financeira 2025", status: "in_progress", dueDate: "15 Fev 2026" },
  { name: "Plano Anual de Actividades", status: "completed", dueDate: "15 Jan 2026" },
  { name: "Relatório de Impacto Social", status: "pending", dueDate: "28 Fev 2026" },
];

const budgetByProvince = [
  { province: "Luanda", allocated: 45000000, executed: 32000000 },
  { province: "Benguela", allocated: 25000000, executed: 18500000 },
  { province: "Huambo", allocated: 20000000, executed: 12000000 },
  { province: "Cabinda", allocated: 15000000, executed: 9800000 },
];

export function PublicEntityDashboard({ userName }: PublicEntityDashboardProps) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="default" className="bg-success">Concluído</Badge>;
      case "in_progress":
        return <Badge variant="default" className="bg-info">Em Curso</Badge>;
      case "pending":
        return <Badge variant="default" className="bg-warning">Pendente</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-foreground">
              {getGreeting()}, {userName}! 👋
            </h1>
            <Badge variant="outline" className="border-primary text-primary">
              <Landmark className="h-3 w-3 mr-1" />
              Entidade Pública
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Painel de controlo para gestão de projectos públicos e conformidade.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column - SDG Progress */}
        <div className="xl:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Progresso dos Objectivos de Desenvolvimento Sustentável
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {sdgProgress.map((sdg) => (
                <div key={sdg.number} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                        style={{ backgroundColor: sdg.color }}
                      >
                        {sdg.number}
                      </div>
                      <span className="text-sm font-medium">{sdg.name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{sdg.progress}%</span>
                  </div>
                  <Progress value={sdg.progress} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Budget by Province */}
          <Card>
            <CardHeader>
              <CardTitle>Execução Orçamental por Província</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {budgetByProvince.map((item) => {
                  const percentage = Math.round((item.executed / item.allocated) * 100);
                  return (
                    <div key={item.province} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{item.province}</span>
                        <span className="text-muted-foreground">
                          {formatCurrency(item.executed)} / {formatCurrency(item.allocated)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={percentage} className="h-2 flex-1" />
                        <span className="text-sm font-medium w-12">{percentage}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Compliance */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-primary" />
                Conformidade e Relatórios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {complianceItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">Prazo: {item.dueDate}</p>
                    </div>
                    {getStatusBadge(item.status)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Alerts */}
          <Card className="border-warning/50 bg-warning/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-warning">
                <AlertTriangle className="h-5 w-5" />
                Alertas de Conformidade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-background">
                  <p className="text-sm font-medium">Auditoria Pendente</p>
                  <p className="text-xs text-muted-foreground">
                    3 projectos aguardam validação do Tribunal de Contas
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-background">
                  <p className="text-sm font-medium">Documentação Incompleta</p>
                  <p className="text-xs text-muted-foreground">
                    2 projectos com documentos obrigatórios em falta
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
