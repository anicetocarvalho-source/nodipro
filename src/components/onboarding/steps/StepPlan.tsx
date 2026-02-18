import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SubscriptionPlan, PlanFeatures } from '@/types/subscription';

interface StepPlanProps {
  onComplete: (planId: string) => void;
  onBack: () => void;
  isSubmitting: boolean;
}

const FEATURE_LABELS: Partial<Record<keyof PlanFeatures, string>> = {
  gantt: 'Gantt',
  evm: 'EVM',
  logframe: 'Quadro Lógico',
  kpis: 'KPIs',
  procurement: 'Aquisições',
  reports: 'Relatórios',
  scrum: 'Scrum',
};

export function StepPlan({ onComplete, onBack, isSubmitting }: StepPlanProps) {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
      .then(({ data }) => {
        if (data) {
          const parsed = data as unknown as SubscriptionPlan[];
          setPlans(parsed);
          const free = parsed.find(p => p.slug === 'free');
          if (free) setSelected(free.id);
        }
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Escolha o seu plano</h2>
        <p className="text-muted-foreground mt-1">Pode sempre fazer upgrade mais tarde</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {plans.map(plan => (
          <Card
            key={plan.id}
            className={cn(
              'cursor-pointer transition-all hover:border-primary/50',
              selected === plan.id && 'border-primary ring-2 ring-primary/20'
            )}
            onClick={() => setSelected(plan.id)}
          >
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">{plan.name}</h3>
                {plan.slug === 'professional' && <Badge>Popular</Badge>}
              </div>
              <p className="text-sm text-muted-foreground">{plan.description}</p>
              <div className="text-2xl font-bold">
                ${plan.price_monthly}<span className="text-sm font-normal text-muted-foreground">/mês</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {plan.max_projects === -1 ? '∞' : plan.max_projects} projectos · {plan.max_members === -1 ? '∞' : plan.max_members} membros
              </div>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(FEATURE_LABELS).map(([key, label]) => (
                  <span
                    key={key}
                    className={cn(
                      'inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full',
                      plan.features[key as keyof PlanFeatures]
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted text-muted-foreground/50'
                    )}
                  >
                    {plan.features[key as keyof PlanFeatures] ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                    {label}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>Voltar</Button>
        <Button onClick={() => selected && onComplete(selected)} disabled={!selected || isSubmitting}>
          {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />A criar...</> : 'Concluir'}
        </Button>
      </div>
    </div>
  );
}
