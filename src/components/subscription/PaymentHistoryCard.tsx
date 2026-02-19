import { Receipt, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { PaymentReference } from '@/types/payment';

interface PaymentHistoryCardProps {
  payments: PaymentReference[];
}

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive'; icon: typeof CheckCircle }> = {
  pending: { label: 'Pendente', variant: 'secondary', icon: Clock },
  confirmed: { label: 'Confirmado', variant: 'default', icon: CheckCircle },
  expired: { label: 'Expirado', variant: 'destructive', icon: XCircle },
  cancelled: { label: 'Cancelado', variant: 'destructive', icon: XCircle },
};

export function PaymentHistoryCard({ payments }: PaymentHistoryCardProps) {
  if (payments.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5 text-primary" />
          Histórico de Pagamentos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {payments.slice(0, 5).map((p) => {
            const s = STATUS_MAP[p.status] ?? STATUS_MAP.pending;
            const Icon = s.icon;
            return (
              <div key={p.id} className="flex items-center justify-between text-sm border-b last:border-0 pb-2 last:pb-0">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium font-mono">{p.reference_code}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(p.created_at).toLocaleDateString('pt-AO')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-medium">{p.amount.toLocaleString('pt-AO')} {p.currency}</span>
                  <Badge variant={s.variant}>{s.label}</Badge>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
