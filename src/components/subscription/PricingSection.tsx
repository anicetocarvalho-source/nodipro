import { useState, useEffect, forwardRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PlanCard } from './PlanCard';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import type { SubscriptionPlan } from '@/types/subscription';

export const PricingSection = forwardRef<HTMLElement>((_props, ref) => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [yearly, setYearly] = useState(false);

  useEffect(() => {
    supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
      .then(({ data }) => {
        if (data) setPlans(data as unknown as SubscriptionPlan[]);
      });
  }, []);

  if (plans.length === 0) return null;

  return (
    <section ref={ref} className="container mx-auto px-4 py-20" id="pricing">
      <h3 className="text-2xl md:text-3xl font-bold text-center mb-4">
        Planos e Preços
      </h3>
      <p className="text-muted-foreground text-center mb-8 max-w-xl mx-auto">
        Escolha o plano ideal para a sua organização. Comece gratuitamente e faça upgrade quando precisar.
      </p>
      <div className="flex items-center justify-center gap-3 mb-10">
        <Label htmlFor="billing-toggle" className={!yearly ? 'font-semibold' : 'text-muted-foreground'}>Mensal</Label>
        <Switch id="billing-toggle" checked={yearly} onCheckedChange={setYearly} />
        <Label htmlFor="billing-toggle" className={yearly ? 'font-semibold' : 'text-muted-foreground'}>
          Anual <span className="text-primary text-xs font-medium ml-1">-17%</span>
        </Label>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
        {plans.map(plan => (
          <PlanCard key={plan.id} plan={plan} yearly={yearly} />
        ))}
      </div>
    </section>
  );
});

PricingSection.displayName = 'PricingSection';
