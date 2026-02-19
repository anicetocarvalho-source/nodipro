import { useState, useEffect } from 'react';
import { CreditCard, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { PlatformOrganization } from '@/hooks/usePlatformAdmin';

interface Props {
  organizations: PlatformOrganization[];
  loading: boolean;
  onChangeSubscription: (orgId: string, planId: string) => Promise<boolean>;
}

interface Plan { id: string; name: string; slug: string; }

export function SubscriptionsManager({ organizations, loading, onChangeSubscription }: Props) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [changingOrg, setChangingOrg] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    supabase.from('subscription_plans').select('id, name, slug').order('slug').then(({ data }) => {
      if (data) setPlans(data);
    });
  }, []);

  const handleChange = async (orgId: string) => {
    if (!selectedPlan) return;
    setProcessing(true);
    const ok = await onChangeSubscription(orgId, selectedPlan);
    toast({ title: ok ? 'Plano alterado com sucesso!' : 'Erro ao alterar plano.', variant: ok ? 'default' : 'destructive' });
    setProcessing(false);
    setChangingOrg(null);
    setSelectedPlan('');
  };

  const withSubs = organizations.filter(o => o.subscription_status);
  const trialsExpiring = organizations.filter(o =>
    o.subscription_status === 'trial' && o.trial_ends_at &&
    new Date(o.trial_ends_at).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000
  );

  return (
    <div className="space-y-6">
      {trialsExpiring.length > 0 && (
        <Card className="border-amber-300 dark:border-amber-700">
          <CardHeader>
            <CardTitle className="text-sm text-amber-700 dark:text-amber-300">
              ⚠ Trials a expirar nos próximos 7 dias ({trialsExpiring.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {trialsExpiring.map(o => (
                <div key={o.id} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{o.name}</span>
                  <span className="text-muted-foreground">Expira: {new Date(o.trial_ends_at!).toLocaleDateString('pt-AO')}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Subscrições ({withSubs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organização</TableHead>
                  <TableHead>Plano Actual</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Trial Expira</TableHead>
                  <TableHead>Acções</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">A carregar…</TableCell></TableRow>
                ) : withSubs.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhuma subscrição encontrada.</TableCell></TableRow>
                ) : (
                  withSubs.map(o => (
                    <TableRow key={o.id}>
                      <TableCell className="font-medium">{o.name}</TableCell>
                      <TableCell><Badge variant="outline">{o.plan_name || '—'}</Badge></TableCell>
                      <TableCell>
                        <Badge variant={o.subscription_status === 'active' ? 'default' : 'secondary'}>
                          {o.subscription_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {o.trial_ends_at ? new Date(o.trial_ends_at).toLocaleDateString('pt-AO') : '—'}
                      </TableCell>
                      <TableCell>
                        {changingOrg === o.id ? (
                          <div className="flex items-center gap-2">
                            <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                              <SelectTrigger className="w-[140px] h-8">
                                <SelectValue placeholder="Plano" />
                              </SelectTrigger>
                              <SelectContent>
                                {plans.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                              </SelectContent>
                            </Select>
                            <Button size="sm" onClick={() => handleChange(o.id)} disabled={!selectedPlan || processing}>
                              {processing ? <RefreshCw className="h-3 w-3 animate-spin" /> : 'Aplicar'}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => { setChangingOrg(null); setSelectedPlan(''); }}>
                              Cancelar
                            </Button>
                          </div>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => setChangingOrg(o.id)}>
                            Alterar Plano
                          </Button>
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
    </div>
  );
}
