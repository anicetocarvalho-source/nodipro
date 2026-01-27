import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { OnboardingData } from '../OnboardingWizard';
import { ArrowLeft, MapPin } from 'lucide-react';

interface StepRegionProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
  canProceed: boolean;
}

export function StepRegion({ data, updateData, onNext, onBack }: StepRegionProps) {
  const { data: provinces, isLoading } = useQuery({
    queryKey: ['provinces'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('provinces')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  // Group provinces by region
  const groupedProvinces = provinces?.reduce((acc, province) => {
    const region = province.region || 'Outras';
    if (!acc[region]) acc[region] = [];
    acc[region].push(province);
    return acc;
  }, {} as Record<string, typeof provinces>);

  const showRegionalOption = data.entity_type === 'public' || data.entity_type === 'ngo';

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Onde está localizada?</h2>
        <p className="text-muted-foreground">
          Seleccione a província da sede
          {showRegionalOption && ' ou cobertura nacional'}
        </p>
      </div>

      {/* National option for public/NGO */}
      {showRegionalOption && (
        <Card
          className={cn(
            'cursor-pointer transition-all hover:border-primary/50',
            data.province_id === null && 'border-primary ring-2 ring-primary/20 bg-primary/5'
          )}
          onClick={() => updateData({ province_id: null })}
        >
          <CardContent className="flex items-center gap-4 p-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">Cobertura Nacional</p>
              <p className="text-sm text-muted-foreground">
                A organização actua em todo o território de Angola
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[...Array(18)].map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {groupedProvinces &&
            Object.entries(groupedProvinces).map(([region, regionProvinces]) => (
              <div key={region}>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">
                  {region}
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {regionProvinces?.map((province) => {
                    const isSelected = data.province_id === province.id;

                    return (
                      <Card
                        key={province.id}
                        className={cn(
                          'cursor-pointer transition-all hover:border-primary/50',
                          isSelected && 'border-primary ring-2 ring-primary/20 bg-primary/5'
                        )}
                        onClick={() =>
                          updateData({
                            province_id: isSelected ? null : province.id,
                          })
                        }
                      >
                        <CardContent className="p-3">
                          <p className="font-medium text-sm">{province.name}</p>
                          {province.code && (
                            <p className="text-xs text-muted-foreground">
                              {province.code}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack} size="lg">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <Button onClick={onNext} size="lg">
          Continuar
        </Button>
      </div>
    </div>
  );
}
