import { useNavigate } from "react-router-dom";
import {
  FolderKanban,
  Heart,
  Users,
  Globe,
  DollarSign,
  Target,
  HandHeart,
  MapPin,
  ExternalLink,
  Banknote,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardData } from "@/hooks/useDashboardData";
import { usePermissions } from "@/hooks/usePermissions";

interface NGOEntityDashboardProps {
  userName: string;
}

export function NGOEntityDashboard({ userName }: NGOEntityDashboardProps) {
  const navigate = useNavigate();
  const {
    stats,
    projects,
    sdgProgress,
    budgetByProvince,
    funderData,
    isLoading,
  } = useDashboardData();
  const { canViewBudget } = usePermissions();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  };

  const formatCompactNumber = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  };

  const getImpactBadge = (projectCount: number) => {
    if (projectCount >= 3) {
      return <Badge variant="default" className="bg-success">Alto</Badge>;
    } else if (projectCount >= 1) {
      return <Badge variant="default" className="bg-info">Médio</Badge>;
    }
    return <Badge variant="secondary">Baixo</Badge>;
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Skeleton className="xl:col-span-2 h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  const dynamicStats = [
    {
      title: "Projectos Activos",
      value: stats.activeProjects,
      change: `+${stats.completedProjects} concluídos`,
      changeType: "positive" as const,
      icon: FolderKanban,
      href: "/projects",
    },
    {
      title: "Tarefas em Progresso",
      value: stats.inProgressTasks,
      change: `${stats.completedTasks} concluídas`,
      changeType: "positive" as const,
      icon: Users,
      href: "/projects",
    },
    {
      title: "ODS Impactados",
      value: stats.sdgsImpacted,
      change: "De 17 objectivos",
      changeType: "positive" as const,
      icon: Globe,
      href: "/governance",
    },
    ...(canViewBudget ? [{
      title: "Fundos Captados",
      value: formatCompactNumber(stats.totalBudget),
      change: `${stats.executionRate}% executado`,
      changeType: "positive" as const,
      icon: DollarSign,
      href: "/budget",
    }] : []),
    {
      title: "Beneficiários",
      value: formatCompactNumber(stats.totalBeneficiaries),
      change: `${formatCompactNumber(stats.directBeneficiaries)} directos`,
      changeType: stats.totalBeneficiaries > 0 ? "positive" as const : "neutral" as const,
      icon: HandHeart,
      href: "/beneficiaries",
    },
    ...(canViewBudget ? [{
      title: "Taxa Desembolso",
      value: `${stats.disbursementRate}%`,
      change: `${formatCurrency(stats.totalDisbursed)} desembolsado`,
      changeType: stats.disbursementRate >= 50 ? "positive" as const : "neutral" as const,
      icon: Banknote,
      href: "/disbursements",
    }] : []),
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-foreground">
              {getGreeting()}, {userName}! 👋
            </h1>
            <Badge variant="outline" className="border-success text-success">
              <HandHeart className="h-3 w-3 mr-1" />
              ONG
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Acompanhe o impacto social, financiadores e beneficiários dos seus projectos.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {dynamicStats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column - Impact & Funders */}
        <div className="xl:col-span-2 space-y-6">
          {/* Impact by SDG */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary" />
                Impacto por ODS
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs text-primary" onClick={() => navigate("/governance")}>
                Ver governação
                <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {sdgProgress.length > 0 ? (
                sdgProgress.slice(0, 5).map((sdg) => {
                  const progressPercent = Math.min(sdg.projectCount * 20, 100);
                  return (
                    <div key={sdg.id} className="p-4 rounded-lg bg-muted/50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                            style={{ backgroundColor: sdg.color || "#666" }}
                          >
                            {sdg.number}
                          </div>
                          <span className="font-medium">{sdg.name}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {sdg.projectCount} projecto{sdg.projectCount !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={progressPercent} className="h-2 flex-1" />
                        <span className="text-sm font-medium w-12">{progressPercent}%</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  Nenhum ODS associado aos projectos ainda.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Funders */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Financiadores Activos
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs text-primary" onClick={() => navigate("/budget")}>
                Ver orçamento
                <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              {funderData.length > 0 ? (
                <div className="space-y-3">
                  {funderData.slice(0, 5).map((funder) => (
                    <div
                      key={funder.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                    >
                      <div>
                        <p className="font-medium">
                          {funder.name}
                          {funder.acronym && ` (${funder.acronym})`}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {funder.projectCount} projecto{funder.projectCount !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(funder.totalAmount)}</p>
                        <Badge variant="default" className="bg-success">Activo</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  Nenhum financiador associado aos projectos.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - SDGs & Regional */}
        <div className="space-y-6">
          {/* SDG Impact Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Impacto ODS
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sdgProgress.length > 0 ? (
                <div className="space-y-3">
                  {sdgProgress.slice(0, 5).map((sdg) => (
                    <div
                      key={sdg.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                          style={{ backgroundColor: sdg.color || "#666" }}
                        >
                          {sdg.number}
                        </div>
                        <span className="text-sm">{sdg.name}</span>
                      </div>
                      {getImpactBadge(sdg.projectCount)}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  Associe ODS aos seus projectos.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Regional Presence */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Presença Regional
              </CardTitle>
            </CardHeader>
            <CardContent>
              {budgetByProvince.length > 0 ? (
                <div className="space-y-3">
                  {budgetByProvince.map((region) => {
                    const percentage = region.allocated > 0
                      ? Math.round((region.executed / region.allocated) * 100)
                      : 0;
                    return (
                      <button
                        key={region.province}
                        className="w-full flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left"
                        onClick={() => navigate("/governance")}
                      >
                        <div>
                          <p className="font-medium">{region.province}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(region.allocated)} alocados
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{percentage}%</p>
                          <p className="text-xs text-muted-foreground">executado</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  Associe províncias aos seus projectos.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
