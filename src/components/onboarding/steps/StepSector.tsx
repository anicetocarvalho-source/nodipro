import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { OnboardingData } from '../OnboardingWizard';
import { ArrowLeft } from 'lucide-react';

interface StepSectorProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
  canProceed: boolean;
}

export function StepSector({ data, updateData, onNext, onBack }: StepSectorProps) {
  const { data: sectors, isLoading } = useQuery({
    queryKey: ['sectors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sectors')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  // Different sector recommendations based on entity type
  const getRecommendedSectors = () => {
    if (data.entity_type === 'public') {
      return ['Infraestruturas', 'Saúde', 'Educação', 'Energia', 'Agricultura'];
    }
    if (data.entity_type === 'ngo') {
      return ['Saúde', 'Educação', 'Ambiente', 'Direitos Humanos'];
    }
    return ['Tecnologia', 'Finanças', 'Consultoria'];
  };

  const recommendedSectors = getRecommendedSectors();

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Qual é o seu sector?</h2>
        <p className="text-muted-foreground">
          Seleccione o sector principal de actuação
          {data.entity_type === 'private' && ' (opcional)'}
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[...Array(9)].map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {sectors?.map((sector) => {
            const isSelected = data.sector_id === sector.id;
            const isRecommended = recommendedSectors.some(
              (s) => sector.name.toLowerCase().includes(s.toLowerCase())
            );

            return (
              <Card
                key={sector.id}
                className={cn(
                  'cursor-pointer transition-all hover:border-primary/50 relative',
                  isSelected && 'border-primary ring-2 ring-primary/20 bg-primary/5'
                )}
                onClick={() =>
                  updateData({
                    sector_id: isSelected ? null : sector.id,
                  })
                }
              >
                <CardContent className="p-4 text-center">
                  {sector.icon && (
                    <div className="text-2xl mb-2">{sector.icon}</div>
                  )}
                  <p className="font-medium text-sm">{sector.name}</p>
                  {isRecommended && !isSelected && (
                    <span className="absolute top-1 right-1 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                      Sugerido
                    </span>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack} size="lg">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <Button onClick={onNext} size="lg">
          {data.sector_id ? 'Continuar' : 'Saltar'}
        </Button>
      </div>
    </div>
  );
}
