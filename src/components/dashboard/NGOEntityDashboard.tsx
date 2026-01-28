import {
  FolderKanban,
  Heart,
  Users,
  Globe,
  DollarSign,
  Target,
  HandHeart,
  MapPin,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface NGOEntityDashboardProps {
  userName: string;
}

const stats = [
  {
    title: "Projectos Activos",
    value: 18,
    change: "+4 este trimestre",
    changeType: "positive" as const,
    icon: FolderKanban,
  },
  {
    title: "Beneficiários Directos",
    value: "12.5K",
    change: "+2.3K este ano",
    changeType: "positive" as const,
    icon: Users,
  },
  {
    title: "ODS Impactados",
    value: 11,
    change: "De 17 objectivos",
    changeType: "positive" as const,
    icon: Globe,
  },
  {
    title: "Fundos Captados",
    value: "45M",
    change: "82% da meta anual",
    changeType: "positive" as const,
    icon: DollarSign,
  },
];

const impactMetrics = [
  { category: "Educação", beneficiaries: 4500, target: 5000, icon: "📚" },
  { category: "Saúde", beneficiaries: 3200, target: 4000, icon: "🏥" },
  { category: "Água e Saneamento", beneficiaries: 2800, target: 3000, icon: "💧" },
  { category: "Segurança Alimentar", beneficiaries: 2000, target: 2500, icon: "🌾" },
];

const funders = [
  { name: "União Europeia", amount: 15000000, status: "active", endDate: "Dez 2026" },
  { name: "USAID", amount: 8500000, status: "active", endDate: "Jun 2026" },
  { name: "Banco Mundial", amount: 12000000, status: "pending", endDate: "Mar 2027" },
  { name: "Fundação Gates", amount: 5000000, status: "active", endDate: "Set 2026" },
];

const regionalPresence = [
  { province: "Luanda", projects: 5, beneficiaries: 3500 },
  { province: "Huambo", projects: 4, beneficiaries: 2800 },
  { province: "Benguela", projects: 3, beneficiaries: 2200 },
  { province: "Malanje", projects: 3, beneficiaries: 1800 },
  { province: "Uíge", projects: 3, beneficiaries: 2200 },
];

const sdgImpact = [
  { number: 1, name: "Erradicação da Pobreza", impact: "Alto", color: "#E5243B" },
  { number: 2, name: "Fome Zero", impact: "Médio", color: "#DDA63A" },
  { number: 3, name: "Saúde e Bem-Estar", impact: "Alto", color: "#4C9F38" },
  { number: 4, name: "Educação de Qualidade", impact: "Alto", color: "#C5192D" },
  { number: 6, name: "Água Potável", impact: "Médio", color: "#26BDE2" },
];

export function NGOEntityDashboard({ userName }: NGOEntityDashboardProps) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  const getFunderStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default" className="bg-success">Activo</Badge>;
      case "pending":
        return <Badge variant="default" className="bg-warning">Pendente</Badge>;
      case "completed":
        return <Badge variant="secondary">Concluído</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case "Alto":
        return <Badge variant="default" className="bg-success">Alto</Badge>;
      case "Médio":
        return <Badge variant="default" className="bg-info">Médio</Badge>;
      case "Baixo":
        return <Badge variant="secondary">Baixo</Badge>;
      default:
        return <Badge variant="secondary">{impact}</Badge>;
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
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column - Impact & Funders */}
        <div className="xl:col-span-2 space-y-6">
          {/* Impact by Category */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary" />
                Impacto por Categoria
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {impactMetrics.map((metric) => {
                const percentage = Math.round((metric.beneficiaries / metric.target) * 100);
                return (
                  <div key={metric.category} className="p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{metric.icon}</span>
                        <span className="font-medium">{metric.category}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {metric.beneficiaries.toLocaleString()} / {metric.target.toLocaleString()} beneficiários
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={percentage} className="h-2 flex-1" />
                      <span className="text-sm font-medium w-12">{percentage}%</span>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Funders */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Financiadores Activos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {funders.map((funder) => (
                  <div
                    key={funder.name}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="font-medium">{funder.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Termo: {funder.endDate}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(funder.amount)}</p>
                      {getFunderStatusBadge(funder.status)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - SDGs & Regional */}
        <div className="space-y-6">
          {/* SDG Impact */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Impacto ODS
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sdgImpact.map((sdg) => (
                  <div
                    key={sdg.number}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                        style={{ backgroundColor: sdg.color }}
                      >
                        {sdg.number}
                      </div>
                      <span className="text-sm">{sdg.name}</span>
                    </div>
                    {getImpactBadge(sdg.impact)}
                  </div>
                ))}
              </div>
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
              <div className="space-y-3">
                {regionalPresence.map((region) => (
                  <div
                    key={region.province}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="font-medium">{region.province}</p>
                      <p className="text-xs text-muted-foreground">
                        {region.projects} projectos
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{region.beneficiaries.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">beneficiários</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
