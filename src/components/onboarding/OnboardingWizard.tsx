import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOrganization } from '@/contexts/OrganizationContext';
import { StepEntityType } from './steps/StepEntityType';
import { StepSector } from './steps/StepSector';
import { StepRegion } from './steps/StepRegion';
import { StepOrganizationInfo } from './steps/StepOrganizationInfo';
import { OnboardingProgress } from './OnboardingProgress';
import { EntityType, OrganizationSize } from '@/types/organization';
import { useToast } from '@/hooks/use-toast';

export interface OnboardingData {
  entity_type: EntityType | null;
  sector_id: string | null;
  province_id: string | null;
  name: string;
  size: OrganizationSize;
  description: string;
}

const STEPS = [
  { id: 1, title: 'Tipo de Entidade', description: 'Seleccione o tipo da sua organização' },
  { id: 2, title: 'Sector', description: 'Em que área actua a sua organização?' },
  { id: 3, title: 'Localização', description: 'Onde está sediada a sua organização?' },
  { id: 4, title: 'Informações', description: 'Dados da sua organização' },
];

export function OnboardingWizard() {
  const { createOrganization, refreshOrganization } = useOrganization();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    entity_type: null,
    sector_id: null,
    province_id: null,
    name: '',
    size: 'small',
    description: '',
  });

  const updateData = (updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = async () => {
    if (!data.entity_type || !data.name) {
      toast({
        title: 'Dados incompletos',
        description: 'Por favor preencha todos os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await createOrganization({
        name: data.name,
        entity_type: data.entity_type,
        sector_id: data.sector_id,
        province_id: data.province_id,
        size: data.size,
        description: data.description,
      });

      toast({
        title: 'Organização criada!',
        description: `Bem-vindo ao NODIPRO, ${data.name}!`,
      });

      await refreshOrganization();
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast({
        title: 'Erro ao criar organização',
        description: 'Por favor tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return data.entity_type !== null;
      case 2:
        return true; // Sector is optional for private entities
      case 3:
        return true; // Province is optional
      case 4:
        return data.name.trim().length >= 3;
      default:
        return false;
    }
  };

  const renderStep = () => {
    const props = {
      data,
      updateData,
      onNext: nextStep,
      onBack: prevStep,
      canProceed: canProceed(),
      isSubmitting,
    };

    switch (currentStep) {
      case 1:
        return <StepEntityType {...props} />;
      case 2:
        return <StepSector {...props} />;
      case 3:
        return <StepRegion {...props} />;
      case 4:
        return <StepOrganizationInfo {...props} onComplete={handleComplete} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 h-16 flex items-center">
          <h1 className="text-2xl font-bold text-primary">NODIPRO</h1>
        </div>
      </header>

      {/* Progress */}
      <OnboardingProgress steps={STEPS} currentStep={currentStep} />

      {/* Content */}
      <main className="flex-1 container mx-auto px-4 py-8 flex flex-col items-center justify-center max-w-2xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
