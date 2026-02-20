import { Building2, Users, CreditCard, TrendingUp, Clock, CheckCircle, DollarSign, BarChart3, UserMinus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar } from 'recharts';
import type { PlatformMetrics as Metrics } from '@/hooks/usePlatformAdmin';

interface Props {
  metrics: Metrics | null;
  loading: boolean;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

function StatCard({ icon: Icon, label, value, sub }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | number; sub?: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function PlatformMetricsView({ metrics, loading }: Props) {
  if (loading || !metrics) {
    return <p className="text-center py-8 text-muted-foreground">A carregar métricas…</p>;
  }

  const chartData = metrics.plan_distribution.map(p => ({
    name: p.plan_name, value: Number(p.count),
  }));

  const growthData = (metrics.monthly_growth || []).map(m => ({
    month: m.month,
    'Novas Orgs': Number(m.new_orgs),
    'Receita': Number(m.revenue),
  }));

  return (
    <div className="space-y-6">
      {/* KPI Cards - Row 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Building2} label="Organizações" value={metrics.total_organizations} />
        <StatCard icon={Users} label="Membros Totais" value={metrics.total_members} />
        <StatCard icon={TrendingUp} label="Receita Total (AOA)" value={Number(metrics.total_revenue).toLocaleString('pt-AO')} />
        <StatCard icon={CreditCard} label="Subscrições Activas" value={metrics.active_subscriptions}
          sub={`${metrics.trial_subscriptions} em trial · ${metrics.expired_subscriptions} expiradas`} />
      </div>

      {/* KPI Cards - Row 2: Financial */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} label="MRR (AOA)" value={Number(metrics.mrr || 0).toLocaleString('pt-AO')} sub="Receita Mensal Recorrente" />
        <StatCard icon={BarChart3} label="ARPU (AOA)" value={Number(metrics.arpu || 0).toLocaleString('pt-AO')} sub="Receita Média por Organização" />
        <StatCard icon={UserMinus} label="Taxa de Churn" value={`${metrics.churn_rate || 0}%`} sub="Canceladas + Expiradas / Total" />
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{metrics.pending_payments}</p>
                <p className="text-sm text-muted-foreground">Pagamentos Pendentes</p>
                <p className="text-xs text-muted-foreground mt-0.5">{metrics.confirmed_payments} confirmados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plan Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribuição por Plano</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={chartData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center py-8 text-muted-foreground">Sem dados disponíveis.</p>
            )}
          </CardContent>
        </Card>

        {/* Monthly Growth */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Crescimento Mensal (Últimos 6 Meses)</CardTitle>
          </CardHeader>
          <CardContent>
            {growthData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={growthData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Legend />
                  <Bar dataKey="Novas Orgs" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center py-8 text-muted-foreground">Sem dados de crescimento.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Revenue Evolution */}
      {growthData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Evolução de Receita Mensal (AOA)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  formatter={(value: number) => [value.toLocaleString('pt-AO') + ' AOA', 'Receita']}
                />
                <Line type="monotone" dataKey="Receita" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={{ fill: 'hsl(var(--chart-2))' }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
