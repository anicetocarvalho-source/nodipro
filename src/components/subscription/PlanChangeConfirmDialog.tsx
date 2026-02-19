import { AlertTriangle, ArrowUp, ArrowDown } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import type { SubscriptionPlan, QuotaResult } from '@/types/subscription';

interface PlanChangeConfirmDialogProps {
  open: boolean;
  currentPlan: SubscriptionPlan | null;
  newPlan: SubscriptionPlan | null;
  quotas: Record<string, QuotaResult>;
  yearly: boolean;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

interface Conflict {
  label: string;
  current: number;
  max: number;
}

function getConflicts(quotas: Record<string, QuotaResult>, newPlan: SubscriptionPlan): Conflict[] {
  const conflicts: Conflict[] = [];
  const checks: { key: string; label: string; field: keyof SubscriptionPlan }[] = [
    { key: 'project', label: 'Projectos', field: 'max_projects' },
    { key: 'member', label: 'Membros', field: 'max_members' },
    { key: 'portfolio', label: 'Portfólios', field: 'max_portfolios' },
  ];
  for (const { key, label, field } of checks) {
    const limit = newPlan[field] as number;
    const quota = quotas[key];
    if (limit !== -1 && quota && quota.current > limit) {
      conflicts.push({ label, current: quota.current, max: limit });
    }
  }
  return conflicts;
}

function formatLimit(val: number) {
  return val === -1 ? 'Ilimitado' : String(val);
}

function LimitRow({ label, current, next }: { label: string; current: string; next: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span>
        <span className="font-medium">{current}</span>
        <span className="text-muted-foreground mx-1">→</span>
        <span className="font-medium">{next}</span>
      </span>
    </div>
  );
}

export function PlanChangeConfirmDialog({
  open,
  currentPlan,
  newPlan,
  quotas,
  yearly,
  isLoading,
  onConfirm,
  onCancel,
}: PlanChangeConfirmDialogProps) {
  if (!newPlan) return null;

  const currentPrice = currentPlan ? (yearly ? currentPlan.price_yearly : currentPlan.price_monthly) : 0;
  const newPrice = yearly ? newPlan.price_yearly : newPlan.price_monthly;
  const isUpgrade = newPrice > currentPrice;
  const conflicts = newPlan ? getConflicts(quotas, newPlan) : [];
  const hasConflicts = conflicts.length > 0;

  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            Confirmar Alteração de Plano
            {isUpgrade ? (
              <Badge className="bg-green-600 hover:bg-green-700 text-white"><ArrowUp className="h-3 w-3 mr-1" />Upgrade</Badge>
            ) : (
              <Badge variant="destructive"><ArrowDown className="h-3 w-3 mr-1" />Downgrade</Badge>
            )}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {currentPlan
              ? `De "${currentPlan.name}" para "${newPlan.name}".`
              : `Activar o plano "${newPlan.name}".`}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3 py-2">
          {/* Price change */}
          <div className="flex justify-between text-sm font-medium border-b pb-2">
            <span>Preço ({yearly ? 'anual' : 'mensal'})</span>
            <span>
              ${currentPrice} → ${newPrice}
            </span>
          </div>

          {/* Limits comparison */}
          <LimitRow
            label="Projectos"
            current={currentPlan ? formatLimit(currentPlan.max_projects) : '—'}
            next={formatLimit(newPlan.max_projects)}
          />
          <LimitRow
            label="Membros"
            current={currentPlan ? formatLimit(currentPlan.max_members) : '—'}
            next={formatLimit(newPlan.max_members)}
          />
          <LimitRow
            label="Portfólios"
            current={currentPlan ? formatLimit(currentPlan.max_portfolios) : '—'}
            next={formatLimit(newPlan.max_portfolios)}
          />
          <LimitRow
            label="Armazenamento"
            current={currentPlan ? `${currentPlan.max_storage_gb}GB` : '—'}
            next={`${newPlan.max_storage_gb}GB`}
          />

          {/* Conflict warnings */}
          {hasConflicts && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 space-y-1.5 mt-2">
              <div className="flex items-center gap-2 text-destructive font-medium text-sm">
                <AlertTriangle className="h-4 w-4" />
                Não é possível efectuar o downgrade
              </div>
              {conflicts.map((c) => (
                <p key={c.label} className="text-sm text-destructive/90">
                  Tem {c.current} {c.label.toLowerCase()} activos mas o novo plano permite apenas {c.max}.
                </p>
              ))}
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={hasConflicts || isLoading}>
            {isLoading ? 'A processar…' : 'Confirmar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
