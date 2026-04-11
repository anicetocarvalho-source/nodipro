import { useSubscription } from '@/hooks/useSubscription';
import { UpgradePrompt } from './UpgradePrompt';
import type { PlanFeatures } from '@/types/subscription';

interface FeatureGateProps {
  feature: keyof PlanFeatures;
  featureLabel: string;
  children: React.ReactNode;
}

export function FeatureGate({ feature, featureLabel, children }: FeatureGateProps) {
  const { hasFeature, loading, currentPlan } = useSubscription();

  if (loading) return null;

  // If no plan at all, still allow (onboarding not yet complete)
  if (!currentPlan) return <>{children}</>;

  if (!hasFeature(feature)) {
    return <UpgradePrompt feature={featureLabel} />;
  }

  return <>{children}</>;
}
