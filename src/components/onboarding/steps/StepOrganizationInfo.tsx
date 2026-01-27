import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { OrganizationSize, ORG_SIZE_LABELS, ENTITY_TYPE_LABELS } from '@/types/organization';
import { OnboardingData } from '../OnboardingWizard';
import { ArrowLeft, Loader2, Building2, Users, Sparkles } from 'lucide-react';

interface StepOrganizationInfoProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
  onComplete: () => void;
  canProceed: boolean;
  isSubmitting: boolean;
}

const SIZE_OPTIONS: OrganizationSize[] = ['small', 'medium', 'large', 'enterprise'];

export function StepOrganizationInfo({
  data,
  updateData,
  onBack,
  onComplete,
  canProceed,
  isSubmitting,
}: StepOrganizationInfoProps) {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Quase lá!</h2>
        <p className="text-muted-foreground">
          Preencha os dados da sua organização
        </p>
      </div>

      <div className="space-y-6">
        {/* Organization name */}
        <div className="space-y-2">
          <Label htmlFor="name" className="text-base">
            Nome da Organização *
          </Label>
          <Input
            id="name"
            placeholder={
              data.entity_type === 'public'
                ? 'Ex: Ministério das Obras Públicas'
                : data.entity_type === 'ngo'
                ? 'Ex: Fundação para o Desenvolvimento Social'
                : 'Ex: TechCorp Angola'
            }
            value={data.name}
            onChange={(e) => updateData({ name: e.target.value })}
            className="h-12 text-lg"
          />
          {data.name && data.name.length < 3 && (
            <p className="text-sm text-destructive">
              O nome deve ter pelo menos 3 caracteres
            </p>
          )}
        </div>

        {/* Organization size */}
        <div className="space-y-3">
          <Label className="text-base">Dimensão da Organização</Label>
          <div className="grid grid-cols-2 gap-3">
            {SIZE_OPTIONS.map((size) => {
              const { label, employees } = ORG_SIZE_LABELS[size];
              const isSelected = data.size === size;

              return (
                <Card
                  key={size}
                  className={cn(
                    'cursor-pointer transition-all hover:border-primary/50',
                    isSelected && 'border-primary ring-2 ring-primary/20 bg-primary/5'
                  )}
                  onClick={() => updateData({ size })}
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    <Users className={cn('h-5 w-5', isSelected ? 'text-primary' : 'text-muted-foreground')} />
                    <div>
                      <p className="font-medium text-sm">{label}</p>
                      <p className="text-xs text-muted-foreground">{employees}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description" className="text-base">
            Descrição (opcional)
          </Label>
          <Textarea
            id="description"
            placeholder="Breve descrição da missão e actividades da organização..."
            value={data.description}
            onChange={(e) => updateData({ description: e.target.value })}
            rows={3}
          />
        </div>
      </div>

      {/* Summary card */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <h4 className="font-medium flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-primary" />
            Resumo da Configuração
          </h4>
          <div className="grid gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tipo:</span>
              <span className="font-medium">
                {data.entity_type ? ENTITY_TYPE_LABELS[data.entity_type].label : '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Dimensão:</span>
              <span className="font-medium">{ORG_SIZE_LABELS[data.size].label}</span>
            </div>
            {data.name && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Organização:</span>
                <span className="font-medium">{data.name}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack} size="lg" disabled={isSubmitting}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <Button onClick={onComplete} disabled={!canProceed || isSubmitting} size="lg">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              A criar...
            </>
          ) : (
            <>
              <Building2 className="mr-2 h-4 w-4" />
              Criar Organização
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
