import { Building2, Users, CreditCard, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Building2} label="Organizações" value={metrics.total_organizations} />
        <StatCard icon={Users} label="Membros Totais" value={metrics.total_members} />
        <StatCard icon={TrendingUp} label="Receita Total (AOA)" value={metrics.total_revenue.toLocaleString('pt-AO')} />
        <StatCard icon={CreditCard} label="Subscrições Activas" value={metrics.active_subscriptions}
          sub={`${metrics.trial_subscriptions} em trial · ${metrics.expired_subscriptions} expiradas`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pagamentos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Pendentes</span>
              </div>
              <span className="text-xl font-bold">{metrics.pending_payments}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="h-4 w-4" />
                <span>Confirmados</span>
              </div>
              <span className="text-xl font-bold">{metrics.confirmed_payments}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
