import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { Loader2 } from 'lucide-react';

export default function Onboarding() {
  const { user, loading: authLoading } = useAuthContext();
  const { needsOnboarding, loading: orgLoading } = useOrganization();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!orgLoading && !needsOnboarding && user) {
      navigate('/projects', { replace: true });
    }
  }, [needsOnboarding, orgLoading, user, navigate]);

  if (authLoading || orgLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !needsOnboarding) {
    return null;
  }

  return <OnboardingWizard />;
}
