import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Briefcase,
  Target,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  RefreshCw,
  LayoutDashboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { ExecutiveKPICard } from "@/components/governance/ExecutiveKPICard";
import { AdvancedFilters, GovernanceFilters } from "@/components/governance/AdvancedFilters";
import { PortfolioOverviewCard } from "@/components/governance/PortfolioOverviewCard";
import { SectorBreakdownChart } from "@/components/governance/SectorBreakdownChart";
import { StatusDistributionChart } from "@/components/governance/StatusDistributionChart";
import { BudgetExecutionGauge } from "@/components/governance/BudgetExecutionGauge";

import {
  useSectors,
  useSDGs,
  useProvinces,
  useFunders,
  useGovernanceStats,
  useSectorStats,
  usePortfolioSummaries,
  useProjectsByStatus,
} from "@/hooks/useGovernance";

function formatCurrency(value: number) {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}B AOA`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M AOA`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(0)}K AOA`;
  }
  return `${value.toLocaleString()} AOA`;
}

export default function Governance() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<GovernanceFilters>({});

  // Reference data queries
  const { data: sectors, isLoading: loadingSectors } = useSectors();
  const { data: sdgs, isLoading: loadingSDGs } = useSDGs();
  const { data: provinces, isLoading: loadingProvinces } = useProvinces();
  const { data: funders, isLoading: loadingFunders } = useFunders();

  // Filtered data queries
  const { data: stats, isLoading: loadingStats, refetch: refetchStats } = useGovernanceStats(filters);
  const { data: sectorStats, isLoading: loadingSectorStats } = useSectorStats(filters);
  const { data: portfolios, isLoading: loadingPortfolios } = usePortfolioSummaries();
  const { data: statusData, isLoading: loadingStatus } = useProjectsByStatus(filters);

  const isLoading = loadingStats || loadingSectors || loadingSDGs || loadingProvinces || loadingFunders;

  const handleRefresh = () => {
    refetchStats();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl bg-primary/10">
              <LayoutDashboard className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Painel Executivo de Governação</h1>
              <p className="text-muted-foreground">
                Visão macro de portfólios, indicadores de alto nível e análise estratégica.
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Advanced Filters */}
      <AdvancedFilters
        sectors={sectors || []}
        sdgs={sdgs || []}
        provinces={provinces || []}
        funders={funders || []}
        filters={filters}
        onFiltersChange={setFilters}
        isLoading={isLoading}
      />

      {/* Executive KPIs */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          <ExecutiveKPICard
            title="Portfólios"
            value={stats?.totalPortfolios || 0}
            subtitle={`${stats?.totalPrograms || 0} programas`}
            icon={Briefcase}
            iconColor="text-primary"
            size="md"
          />
          <ExecutiveKPICard
            title="Total de Projectos"
            value={stats?.totalProjects || 0}
            subtitle={`${stats?.projectsOnTrack || 0} em progresso`}
            icon={Target}
            iconColor="text-blue-500"
            size="md"
          />
          <ExecutiveKPICard
            title="Orçamento Global"
            value={formatCurrency(stats?.totalBudget || 0)}
            subtitle={`${stats?.executionRate || 0}% executado`}
            icon={DollarSign}
            iconColor="text-emerald-500"
            progress={stats?.executionRate}
            size="md"
          />
          <ExecutiveKPICard
            title="Progresso Médio"
            value={`${stats?.averageProgress || 0}%`}
            subtitle={`${stats?.projectsCompleted || 0} concluídos`}
            icon={TrendingUp}
            iconColor="text-success"
            progress={stats?.averageProgress}
            trend={{
              value: stats?.averageProgress && stats.averageProgress >= 50 ? "Bom" : "Atenção",
              type: stats?.averageProgress && stats.averageProgress >= 50 ? "positive" : "neutral",
            }}
            size="md"
          />
          <ExecutiveKPICard
            title="Projectos em Risco"
            value={stats?.projectsAtRisk || 0}
            subtitle="com atrasos"
            icon={AlertTriangle}
            iconColor={stats?.projectsAtRisk && stats.projectsAtRisk > 0 ? "text-destructive" : "text-success"}
            trend={{
              value: stats?.projectsAtRisk === 0 ? "Excelente" : "Requer atenção",
              type: stats?.projectsAtRisk === 0 ? "positive" : "negative",
            }}
            size="md"
          />
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Distribution */}
        <StatusDistributionChart
          data={statusData || []}
          isLoading={loadingStatus}
        />

        {/* Budget Execution */}
        <BudgetExecutionGauge
          budget={stats?.totalBudget || 0}
          spent={stats?.totalSpent || 0}
        />

        {/* Sector Breakdown */}
        <SectorBreakdownChart
          data={sectorStats || []}
          isLoading={loadingSectorStats}
        />
      </div>

      {/* Portfolios Overview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Visão Geral dos Portfólios</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate("/portfolio")}>
            Ver todos
          </Button>
        </CardHeader>
        <CardContent>
          {loadingPortfolios ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          ) : portfolios?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum portfólio encontrado.</p>
              <Button variant="link" onClick={() => navigate("/portfolio")}>
                Criar Portfólio
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {portfolios?.slice(0, 6).map((portfolio) => (
                <PortfolioOverviewCard
                  key={portfolio.id}
                  portfolio={portfolio}
                  onClick={() => navigate("/portfolio")}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Active Projects */}
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/20">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Projectos Activos</p>
                <p className="text-3xl font-bold">{stats?.projectsOnTrack || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Completed Projects */}
        <Card className="bg-gradient-to-br from-success/5 to-success/10 border-success/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-success/20">
                <CheckCircle className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Projectos Concluídos</p>
                <p className="text-3xl font-bold">{stats?.projectsCompleted || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* At Risk */}
        <Card className={`bg-gradient-to-br ${
          stats?.projectsAtRisk && stats.projectsAtRisk > 0 
            ? "from-destructive/5 to-destructive/10 border-destructive/20" 
            : "from-muted/5 to-muted/10 border-muted/20"
        }`}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${
                stats?.projectsAtRisk && stats.projectsAtRisk > 0 
                  ? "bg-destructive/20" 
                  : "bg-muted/20"
              }`}>
                <AlertTriangle className={`h-6 w-6 ${
                  stats?.projectsAtRisk && stats.projectsAtRisk > 0 
                    ? "text-destructive" 
                    : "text-muted-foreground"
                }`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Em Risco / Atrasados</p>
                <p className="text-3xl font-bold">{stats?.projectsAtRisk || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
