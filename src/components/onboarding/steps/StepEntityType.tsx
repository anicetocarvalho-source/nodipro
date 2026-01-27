import { Building2, Briefcase, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { EntityType, ENTITY_TYPE_LABELS } from '@/types/organization';
import { OnboardingData } from '../OnboardingWizard';

interface StepEntityTypeProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
  canProceed: boolean;
}

const ENTITY_OPTIONS: { type: EntityType; icon: typeof Building2 }[] = [
  { type: 'public', icon: Building2 },
  { type: 'private', icon: Briefcase },
  { type: 'ngo', icon: Heart },
];

export function StepEntityType({ data, updateData, onNext, canProceed }: StepEntityTypeProps) {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Que tipo de organização?</h2>
        <p className="text-muted-foreground">
          Seleccione o tipo para personalizarmos a sua experiência
        </p>
      </div>

      <div className="grid gap-4">
        {ENTITY_OPTIONS.map(({ type, icon: Icon }) => {
          const { label, description } = ENTITY_TYPE_LABELS[type];
          const isSelected = data.entity_type === type;
          
          return (
            <Card
              key={type}
              className={cn(
                'cursor-pointer transition-all hover:border-primary/50',
                isSelected && 'border-primary ring-2 ring-primary/20 bg-primary/5'
              )}
              onClick={() => updateData({ entity_type: type })}
            >
              <CardContent className="flex items-center gap-4 p-6">
                <div
                  className={cn(
                    'p-3 rounded-lg',
                    isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  )}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{label}</h3>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
                <div
                  className={cn(
                    'w-5 h-5 rounded-full border-2 transition-colors',
                    isSelected
                      ? 'border-primary bg-primary'
                      : 'border-muted-foreground'
                  )}
                >
                  {isSelected && (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-end">
        <Button onClick={onNext} disabled={!canProceed} size="lg">
          Continuar
        </Button>
      </div>

      {/* Feature preview based on selection */}
      {data.entity_type && (
        <div className="bg-muted/50 rounded-lg p-4 mt-6">
          <h4 className="font-medium text-sm mb-2">
            Funcionalidades para {ENTITY_TYPE_LABELS[data.entity_type].label}:
          </h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            {data.entity_type === 'public' && (
              <>
                <li>✓ Alinhamento com Objectivos de Desenvolvimento Sustentável (ODS)</li>
                <li>✓ Gestão de Financiadores Internacionais</li>
                <li>✓ Relatórios de Compliance e Auditoria</li>
                <li>✓ Fluxos de Aprovação Orçamental Multi-nível</li>
                <li>✓ Cobertura Multi-Provincial</li>
              </>
            )}
            {data.entity_type === 'private' && (
              <>
                <li>✓ Dashboard focado em ROI e Performance</li>
                <li>✓ Gestão de Clientes e Contratos</li>
                <li>✓ Metodologias Ágeis e Templates Simplificados</li>
                <li>✓ KPIs de Produtividade e Eficiência</li>
                <li>✓ Fluxos de Aprovação Simplificados</li>
              </>
            )}
            {data.entity_type === 'ngo' && (
              <>
                <li>✓ Alinhamento com ODS e Impacto Social</li>
                <li>✓ Gestão de Doadores e Financiadores</li>
                <li>✓ Relatórios de Prestação de Contas</li>
                <li>✓ Cobertura Multi-Provincial</li>
                <li>✓ Métricas de Impacto Comunitário</li>
              </>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
