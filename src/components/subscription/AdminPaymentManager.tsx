import { useState } from 'react';
import { CheckCircle, XCircle, Clock, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
import { useToast } from '@/hooks/use-toast';
import type { PaymentReference } from '@/types/payment';

interface AdminPaymentManagerProps {
  payments: PaymentReference[];
  onConfirm: (paymentId: string, notes?: string) => Promise<boolean>;
  onCancel: (paymentId: string) => Promise<boolean>;
}

export function AdminPaymentManager({ payments, onConfirm, onCancel }: AdminPaymentManagerProps) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  const pendingPayments = payments.filter(p => p.status === 'pending');

  const handleConfirm = async () => {
    if (!confirmingId) return;
    setProcessing(true);
    const success = await onConfirm(confirmingId, notes || undefined);
    if (success) {
      toast({ title: 'Pagamento confirmado!', description: 'A subscrição foi activada.' });
    } else {
      toast({ title: 'Erro', description: 'Não foi possível confirmar o pagamento.', variant: 'destructive' });
    }
    setProcessing(false);
    setConfirmingId(null);
    setNotes('');
  };

  const handleCancel = async () => {
    if (!cancellingId) return;
    setProcessing(true);
    const success = await onCancel(cancellingId);
    if (success) {
      toast({ title: 'Pagamento cancelado.' });
    }
    setProcessing(false);
    setCancellingId(null);
  };

  if (pendingPayments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            Pagamentos Pendentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Nenhum pagamento pendente de confirmação.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            Pagamentos Pendentes
            <Badge variant="secondary">{pendingPayments.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {pendingPayments.map((p) => {
            const expiresAt = new Date(p.expires_at);
            const hoursLeft = Math.max(0, Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60)));

            return (
              <div key={p.id} className="flex items-center justify-between border rounded-lg p-4">
                <div className="space-y-1">
                  <p className="font-mono text-lg font-bold">{p.reference_code}</p>
                  <p className="text-sm text-muted-foreground">
                    {p.amount.toLocaleString('pt-AO')} {p.currency} · {p.billing_period === 'yearly' ? 'Anual' : 'Mensal'}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    Expira em {hoursLeft}h · {new Date(p.created_at).toLocaleDateString('pt-AO')}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive"
                    onClick={() => setCancellingId(p.id)}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Rejeitar
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setConfirmingId(p.id)}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Confirmar
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Confirm dialog */}
      <AlertDialog open={!!confirmingId} onOpenChange={(o) => !o && setConfirmingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Pagamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que pretende confirmar este pagamento? O plano será activado imediatamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="Notas opcionais (ex: nº do comprovativo)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={processing}>
              {processing ? 'A processar…' : 'Confirmar Pagamento'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel dialog */}
      <AlertDialog open={!!cancellingId} onOpenChange={(o) => !o && setCancellingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rejeitar Pagamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que pretende rejeitar esta referência de pagamento?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} disabled={processing} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {processing ? 'A processar…' : 'Rejeitar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
