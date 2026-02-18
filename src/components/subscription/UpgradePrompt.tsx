import { ArrowUpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface UpgradePromptProps {
  feature?: string;
  message?: string;
}

export function UpgradePrompt({ feature, message }: UpgradePromptProps) {
  const navigate = useNavigate();

  return (
    <Alert className="border-primary/50 bg-primary/5">
      <ArrowUpCircle className="h-5 w-5 text-primary" />
      <AlertTitle>Upgrade necessário</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>{message || `A funcionalidade "${feature}" não está incluída no seu plano actual.`}</span>
        <Button size="sm" onClick={() => navigate('/subscription')} className="ml-4 shrink-0">
          Ver Planos
        </Button>
      </AlertDescription>
    </Alert>
  );
}
