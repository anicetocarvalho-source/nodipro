import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { CreditCard, Crown } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { usePayments } from '@/hooks/usePayments';
import { PlanCard } from '@/components/subscription/PlanCard';
import { PlanChangeConfirmDialog } from '@/components/subscription/PlanChangeConfirmDialog';
import { PaymentReferenceModal } from '@/components/subscription/PaymentReferenceModal';
import { PaymentHistoryCard } from '@/components/subscription/PaymentHistoryCard';
import { UsageBar } from '@/components/subscription/UsageBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import type { QuotaResult } from '@/types/subscription';
import type { PaymentReference } from '@/types/payment';
import { usePermissions } from '@/hooks/usePermissions';

export default function Subscription() {
  const { isAdmin } = usePermissions();

  if (!isAdmin) {
    return <Navigate to="/profile" replace />;
  }
  const { subscription, currentPlan, plans, loading, selectPlan, isTrial, trialDaysLeft, checkQuota } = useSubscription();
  const { payments, createReference } = usePayments();
  const [yearly, setYearly] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const { toast } = useToast();
  const [quotas, setQuotas] = useState<Record<string, QuotaResult>>({});
  const [pendingPlanId, setPendingPlanId] = useState<string | null>(null);
  const [generatedPayment, setGeneratedPayment] = useState<PaymentReference | null>(null);

  useEffect(() => {
    if (!currentPlan) return;
    const loadQuotas = async () => {
      const [project, member, portfolio] = await Promise.all([
        checkQuota('project'),
        checkQuota('member'),
        checkQuota('portfolio'),
      ]);
      setQuotas({ project, member, portfolio });
    };
    loadQuotas();
  }, [currentPlan]);

  // Refresh quotas when dialog opens
  useEffect(() => {
    if (!pendingPlanId || !currentPlan) return;
    const refreshQuotas = async () => {
      const [project, member, portfolio] = await Promise.all([
        checkQuota('project'),
        checkQuota('member'),
        checkQuota('portfolio'),
      ]);
      setQuotas({ project, member, portfolio });
    };
    refreshQuotas();
  }, [pendingPlanId]);

  const pendingPlan = pendingPlanId ? plans.find(p => p.id === pendingPlanId) ?? null : null;

  const handleSelectPlan = (planId: string) => {
    setPendingPlanId(planId);
  };

  const handleConfirmChange = async () => {
    if (!pendingPlanId) return;
    const selectedPlan = plans.find(p => p.id === pendingPlanId);
    if (!selectedPlan) return;

    setSelecting(true);

    // For free plan, activate directly
    if (selectedPlan.slug === 'free' || selectedPlan.price_monthly === 0) {
      const result = await selectPlan(pendingPlanId);
      if (result.success) {
        toast({ title: 'Plano actualizado!', description: 'Plano gratuito activado com sucesso.' });
      } else if (result.conflicts?.length) {
        toast({ title: 'Downgrade bloqueado', description: result.conflicts[0], variant: 'destructive' });
      } else {
        toast({ title: 'Erro', description: 'Não foi possível alterar o plano.', variant: 'destructive' });
      }
    } else {
      // Generate Multicaixa reference for paid plans
      const price = yearly ? selectedPlan.price_yearly : selectedPlan.price_monthly;
      const payment = await createReference(pendingPlanId, price, yearly ? 'yearly' : 'monthly');
      if (payment) {
        setGeneratedPayment(payment);
        toast({ title: 'Referência gerada!', description: 'Use a referência Multicaixa para efectuar o pagamento.' });
      } else {
        toast({ title: 'Erro', description: 'Não foi possível gerar a referência de pagamento.', variant: 'destructive' });
      }
    }

    setSelecting(false);
    setPendingPlanId(null);
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

      {/* Payment history */}
      <PaymentHistoryCard payments={payments} />

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

      <PlanChangeConfirmDialog
        open={!!pendingPlanId}
        currentPlan={currentPlan}
        newPlan={pendingPlan}
        quotas={quotas}
        yearly={yearly}
        isLoading={selecting}
        onConfirm={handleConfirmChange}
        onCancel={() => setPendingPlanId(null)}
      />

      <PaymentReferenceModal
        open={!!generatedPayment}
        onClose={() => setGeneratedPayment(null)}
        payment={generatedPayment}
        planName={generatedPayment ? plans.find(p => p.id === generatedPayment.plan_id)?.name : undefined}
      />
    </div>
  );
}
