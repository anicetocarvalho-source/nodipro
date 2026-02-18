import { useState } from 'react';
import { CreditCard, Crown } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { PlanCard } from '@/components/subscription/PlanCard';
import { UsageBar } from '@/components/subscription/UsageBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import type { QuotaResult } from '@/types/subscription';
import { useEffect } from 'react';

export default function Subscription() {
  const { subscription, currentPlan, plans, loading, selectPlan, isTrial, trialDaysLeft, checkQuota } = useSubscription();
  const [yearly, setYearly] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const { toast } = useToast();
  const [quotas, setQuotas] = useState<Record<string, QuotaResult>>({});

  useEffect(() => {
    async function loadQuotas() {
      const resources = ['project', 'member', 'portfolio'];
      const results: Record<string, QuotaResult> = {};
      for (const r of resources) {
        results[r] = await checkQuota(r);
      }
      setQuotas(results);
    }
    if (!loading && currentPlan) loadQuotas();
  }, [loading, currentPlan]);

  const handleSelectPlan = async (planId: string) => {
    setSelecting(true);
    const success = await selectPlan(planId);
    if (success) {
      toast({ title: 'Plano actualizado!', description: 'O seu plano foi alterado com sucesso.' });
    } else {
      toast({ title: 'Erro', description: 'Não foi possível alterar o plano.', variant: 'destructive' });
    }
    setSelecting(false);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <CreditCard className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Subscrição</h1>
      </div>

      {/* Current plan summary */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              Plano Actual
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentPlan ? (
              <>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold">{currentPlan.name}</span>
                  {isTrial && <Badge variant="secondary">Trial — {trialDaysLeft} dias restantes</Badge>}
                  {subscription?.status === 'active' && <Badge className="bg-primary">Activo</Badge>}
                </div>
                <p className="text-muted-foreground">{currentPlan.description}</p>
              </>
            ) : (
              <p className="text-muted-foreground">Nenhum plano activo. Seleccione um plano abaixo.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Utilização</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {quotas.project && <UsageBar label="Projectos" current={quotas.project.current} max={quotas.project.max} />}
            {quotas.member && <UsageBar label="Membros" current={quotas.member.current} max={quotas.member.max} />}
            {quotas.portfolio && <UsageBar label="Portfólios" current={quotas.portfolio.current} max={quotas.portfolio.max} />}
            {!currentPlan && <p className="text-sm text-muted-foreground">Seleccione um plano para ver os limites.</p>}
          </CardContent>
        </Card>
      </div>

      {/* Plan comparison */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Comparar Planos</h2>
        <div className="flex items-center gap-3 mb-6">
          <Label htmlFor="billing" className={!yearly ? 'font-semibold' : 'text-muted-foreground'}>Mensal</Label>
          <Switch id="billing" checked={yearly} onCheckedChange={setYearly} />
          <Label htmlFor="billing" className={yearly ? 'font-semibold' : 'text-muted-foreground'}>
            Anual <span className="text-primary text-xs font-medium ml-1">-17%</span>
          </Label>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
          {plans.map(plan => (
            <PlanCard
              key={plan.id}
              plan={plan}
              yearly={yearly}
              isCurrentPlan={currentPlan?.id === plan.id}
              onSelect={handleSelectPlan}
              isLoading={selecting}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
