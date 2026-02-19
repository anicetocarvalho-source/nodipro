import { useState } from 'react';
import { CheckCircle, XCircle, Clock, Receipt, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import type { PlatformPayment } from '@/hooks/usePlatformAdmin';

interface Props {
  payments: PlatformPayment[];
  loading: boolean;
  onConfirm: (paymentId: string, notes?: string) => Promise<boolean>;
  onCancel: (paymentId: string) => Promise<boolean>;
}

const statusLabels: Record<string, string> = {
  pending: 'Pendente', confirmed: 'Confirmado', expired: 'Expirado', cancelled: 'Cancelado',
};

const statusVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'secondary', confirmed: 'default', expired: 'destructive', cancelled: 'outline',
};

export function GlobalPaymentsManager({ payments, loading, onConfirm, onCancel }: Props) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  const filtered = payments.filter(p => statusFilter === 'all' || p.status === statusFilter);

  const handleConfirm = async () => {
    if (!confirmingId) return;
    setProcessing(true);
    const ok = await onConfirm(confirmingId, notes || undefined);
    toast({ title: ok ? 'Pagamento confirmado!' : 'Erro ao confirmar.', variant: ok ? 'default' : 'destructive' });
    setProcessing(false); setConfirmingId(null); setNotes('');
  };

  const handleCancel = async () => {
    if (!cancellingId) return;
    setProcessing(true);
    const ok = await onCancel(cancellingId);
    toast({ title: ok ? 'Pagamento rejeitado.' : 'Erro.', variant: ok ? 'default' : 'destructive' });
    setProcessing(false); setCancellingId(null);
  };

  const pendingCount = payments.filter(p => p.status === 'pending').length;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            Pagamentos Globais
            {pendingCount > 0 && <Badge variant="destructive">{pendingCount} pendentes</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filtrar por status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="confirmed">Confirmados</SelectItem>
              <SelectItem value="expired">Expirados</SelectItem>
              <SelectItem value="cancelled">Cancelados</SelectItem>
            </SelectContent>
          </Select>

          <div className="rounded-md border overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organização</TableHead>
                  <TableHead>Referência</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Acções</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">A carregar…</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhum pagamento encontrado.</TableCell></TableRow>
                ) : (
                  filtered.map(p => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-medium text-sm">{p.organization_name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono font-bold">{p.reference_code}</TableCell>
                      <TableCell>{p.plan_name || '—'}</TableCell>
                      <TableCell>{p.amount.toLocaleString('pt-AO')} {p.currency}</TableCell>
                      <TableCell>{p.billing_period === 'yearly' ? 'Anual' : 'Mensal'}</TableCell>
                      <TableCell><Badge variant={statusVariants[p.status]}>{statusLabels[p.status] || p.status}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{new Date(p.created_at).toLocaleDateString('pt-AO')}</TableCell>
                      <TableCell>
                        {p.status === 'pending' && (
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" className="text-destructive h-7" onClick={() => setCancellingId(p.id)}>
                              <XCircle className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="sm" className="h-7" onClick={() => setConfirmingId(p.id)}>
                              <CheckCircle className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!confirmingId} onOpenChange={o => !o && setConfirmingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Pagamento</AlertDialogTitle>
            <AlertDialogDescription>O plano será activado imediatamente para esta organização.</AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea placeholder="Notas opcionais…" value={notes} onChange={e => setNotes(e.target.value)} />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={processing}>
              {processing ? 'A processar…' : 'Confirmar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!cancellingId} onOpenChange={o => !o && setCancellingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rejeitar Pagamento</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que pretende rejeitar esta referência?</AlertDialogDescription>
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
