import { AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/hooks/useSubscription';
import { usePermissions } from '@/hooks/usePermissions';

export function TrialExpiredBanner() {
  const { subscription, loading, isTrial, trialDaysLeft } = useSubscription();
  const { isAdmin } = usePermissions();
  const navigate = useNavigate();

  if (loading) return null;

  const isExpired = subscription?.status === 'expired';
  const isTrialEnding = isTrial && trialDaysLeft <= 3 && trialDaysLeft > 0;

  if (!isExpired && !isTrialEnding) return null;

  const getMessage = () => {
    if (isExpired) {
      return isAdmin
        ? 'O seu período de teste expirou. Faça upgrade para continuar a utilizar todas as funcionalidades.'
        : 'O plano da sua organização expirou. Contacte o administrador do sistema para renovação ou upgrade.';
    }
    return isAdmin
      ? `O seu período de teste termina em ${trialDaysLeft} dia${trialDaysLeft > 1 ? 's' : ''}. Faça upgrade para não perder acesso.`
      : `O período de teste termina em ${trialDaysLeft} dia${trialDaysLeft > 1 ? 's' : ''}. Contacte o administrador do sistema para upgrade.`;
  };

  return (
    <div className={`px-4 py-2 flex items-center justify-between gap-3 text-sm ${
      isExpired 
        ? 'bg-destructive/10 border-b border-destructive/20 text-destructive' 
        : 'bg-warning/10 border-b border-warning/20 text-warning'
    }`}>
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 flex-shrink-0" />
        <span>{getMessage()}</span>
      </div>
      {isAdmin && (
        <Button size="sm" variant={isExpired ? 'destructive' : 'outline'} onClick={() => navigate('/subscription')} className="shrink-0">
          Ver Planos
        </Button>
      )}
    </div>
  );
}
