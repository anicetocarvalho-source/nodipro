import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { SubscriptionPlan, PlanFeatures } from '@/types/subscription';

interface PlanCardProps {
  plan: SubscriptionPlan;
  isCurrentPlan?: boolean;
  onSelect?: (planId: string) => void;
  isLoading?: boolean;
  yearly?: boolean;
}

const FEATURE_LABELS: Record<keyof PlanFeatures, string> = {
  kanban: 'Kanban Board',
  gantt: 'Diagrama de Gantt',
  evm: 'Gestão de Valor Agregado',
  logframe: 'Quadro Lógico',
  risks: 'Gestão de Riscos',
  kpis: 'KPIs e Métricas',
  procurement: 'Aquisições',
  change_requests: 'Pedidos de Alteração',
  budget_advanced: 'Orçamento Avançado',
  reports: 'Relatórios',
  scrum: 'Scrum / Sprints',
  api_access: 'Acesso API',
  stakeholders: 'Stakeholders',
  briefings: 'Briefings',
  disbursements: 'Desembolsos',
  funding_agreements: 'Acordos de Financiamento',
  lessons_learned: 'Lições Aprendidas',
  annual_work_plan: 'Plano de Trabalho Anual',
  audit_logs: 'Auditoria',
  beneficiaries: 'Beneficiários',
};

export function PlanCard({ plan, isCurrentPlan, onSelect, isLoading, yearly }: PlanCardProps) {
  const price = yearly ? plan.price_yearly : plan.price_monthly;
  const period = yearly ? '/ano' : '/mês';
  const isPopular = plan.slug === 'professional';

  return (
    <Card className={cn(
      'relative flex flex-col',
      isPopular && 'border-primary shadow-lg scale-105',
      isCurrentPlan && 'ring-2 ring-primary'
    )}>
      {isPopular && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Mais Popular</Badge>
      )}
      {isCurrentPlan && (
        <Badge variant="secondary" className="absolute -top-3 left-1/2 -translate-x-1/2">Plano Actual</Badge>
      )}
      <CardHeader className="text-center pb-2">
        <h3 className="text-xl font-bold">{plan.name}</h3>
        <p className="text-sm text-muted-foreground">{plan.description}</p>
        <div className="mt-4">
          <span className="text-4xl font-bold">
            {price === 0 ? 'Grátis' : new Intl.NumberFormat('pt-AO').format(price)}
          </span>
          {price > 0 && <span className="text-muted-foreground"> {plan.currency}{period}</span>}
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-3">
        <div className="space-y-1 text-sm">
          <div className="flex justify-between"><span>Projectos</span><span className="font-medium">{plan.max_projects === -1 ? 'Ilimitado' : plan.max_projects}</span></div>
          <div className="flex justify-between"><span>Membros</span><span className="font-medium">{plan.max_members === -1 ? 'Ilimitado' : plan.max_members}</span></div>
          <div className="flex justify-between"><span>Armazenamento</span><span className="font-medium">{plan.max_storage_gb}GB</span></div>
          <div className="flex justify-between"><span>Portfólios</span><span className="font-medium">{plan.max_portfolios === -1 ? 'Ilimitado' : plan.max_portfolios}</span></div>
        </div>
        <div className="border-t pt-3 space-y-1.5">
          {Object.entries(FEATURE_LABELS).map(([key, label]) => (
            <div key={key} className="flex items-center gap-2 text-sm">
              {plan.features[key as keyof PlanFeatures] ? (
                <Check className="h-4 w-4 text-primary flex-shrink-0" />
              ) : (
                <X className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
              )}
              <span className={plan.features[key as keyof PlanFeatures] ? '' : 'text-muted-foreground/60'}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          variant={isPopular ? 'default' : 'outline'}
          disabled={isCurrentPlan || isLoading}
          onClick={() => onSelect?.(plan.id)}
        >
          {isCurrentPlan ? 'Plano Actual' : price === 0 ? 'Começar Grátis' : 'Seleccionar Plano'}
        </Button>
      </CardFooter>
    </Card>
  );
}
