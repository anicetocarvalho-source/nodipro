import { Copy, Clock, Banknote } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import type { PaymentReference } from '@/types/payment';

interface PaymentReferenceModalProps {
  open: boolean;
  onClose: () => void;
  payment: PaymentReference | null;
  planName?: string;
}

export function PaymentReferenceModal({ open, onClose, payment, planName }: PaymentReferenceModalProps) {
  const { toast } = useToast();

  if (!payment) return null;

  const copyReference = () => {
    navigator.clipboard.writeText(payment.reference_code);
    toast({ title: 'Copiado!', description: 'Referência copiada para a área de transferência.' });
  };

  const expiresAt = new Date(payment.expires_at);
  const hoursLeft = Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60)));

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5 text-primary" />
            Referência de Pagamento
          </DialogTitle>
          <DialogDescription>
            Use esta referência para efectuar o pagamento via Multicaixa.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {planName && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Plano</span>
              <span className="font-medium">{planName}</span>
            </div>
          )}

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Período</span>
            <span className="font-medium">{payment.billing_period === 'yearly' ? 'Anual' : 'Mensal'}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Valor</span>
            <span className="text-xl font-bold">{payment.amount.toLocaleString('pt-AO')} {payment.currency}</span>
          </div>

          <div className="rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 p-4 text-center space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Referência Multicaixa</p>
            <p className="text-2xl font-mono font-bold tracking-widest">{payment.reference_code}</p>
            <Button variant="ghost" size="sm" onClick={copyReference} className="gap-1.5">
              <Copy className="h-3.5 w-3.5" />
              Copiar
            </Button>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Válida por {hoursLeft} horas (expira {expiresAt.toLocaleDateString('pt-AO')} às {expiresAt.toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' })})</span>
          </div>

          <Badge variant="secondary" className="w-full justify-center py-1.5">
            Após pagamento, o plano será activado pelo administrador
          </Badge>
        </div>

        <Button variant="outline" onClick={onClose} className="w-full">
          Fechar
        </Button>
      </DialogContent>
    </Dialog>
  );
}
