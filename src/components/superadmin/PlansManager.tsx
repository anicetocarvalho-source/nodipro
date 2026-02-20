import { useState } from 'react';
import { Package, Plus, Pencil, ToggleLeft, ToggleRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { PlanFormModal } from './PlanFormModal';
import type { PlatformPlan } from '@/hooks/usePlatformAdmin';

interface Props {
  plans: PlatformPlan[];
  loading: boolean;
  onCreatePlan: (plan: Omit<PlatformPlan, 'id' | 'is_active'>) => Promise<boolean>;
  onUpdatePlan: (plan: PlatformPlan) => Promise<boolean>;
  onTogglePlan: (planId: string) => Promise<boolean>;
}

export function PlansManager({ plans, loading, onCreatePlan, onUpdatePlan, onTogglePlan }: Props) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlatformPlan | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const { toast } = useToast();

  const handleToggle = async (planId: string) => {
    setToggling(planId);
    const ok = await onTogglePlan(planId);
    toast({ title: ok ? 'Estado do plano alterado.' : 'Erro ao alterar estado.', variant: ok ? 'default' : 'destructive' });
    setToggling(null);
  };

  const handleSave = async (plan: Omit<PlatformPlan, 'id' | 'is_active'> & { id?: string; is_active?: boolean }) => {
    let ok: boolean;
    if (editingPlan) {
      ok = await onUpdatePlan({ ...plan, id: editingPlan.id, is_active: editingPlan.is_active } as PlatformPlan);
    } else {
      ok = await onCreatePlan(plan);
    }
    toast({ title: ok ? 'Plano guardado com sucesso!' : 'Erro ao guardar plano.', variant: ok ? 'default' : 'destructive' });
    if (ok) { setFormOpen(false); setEditingPlan(null); }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Planos de Subscrição ({plans.length})
            </CardTitle>
            <Button size="sm" onClick={() => { setEditingPlan(null); setFormOpen(true); }}>
              <Plus className="h-4 w-4 mr-1" />Novo Plano
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Mensal</TableHead>
                  <TableHead>Anual</TableHead>
                  <TableHead>Projectos</TableHead>
                  <TableHead>Membros</TableHead>
                  <TableHead>Portfólios</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acções</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">A carregar…</TableCell></TableRow>
                ) : plans.length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Nenhum plano encontrado.</TableCell></TableRow>
                ) : plans.map(p => (
                  <TableRow key={p.id} className={!p.is_active ? 'opacity-50' : ''}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="font-mono text-sm">{p.slug}</TableCell>
                    <TableCell>{Number(p.price_monthly).toLocaleString('pt-AO')} {p.currency}</TableCell>
                    <TableCell>{Number(p.price_yearly).toLocaleString('pt-AO')} {p.currency}</TableCell>
                    <TableCell className="text-center">{p.max_projects === -1 ? '∞' : p.max_projects}</TableCell>
                    <TableCell className="text-center">{p.max_members === -1 ? '∞' : p.max_members}</TableCell>
                    <TableCell className="text-center">{p.max_portfolios === -1 ? '∞' : p.max_portfolios}</TableCell>
                    <TableCell>
                      <Badge variant={p.is_active ? 'default' : 'secondary'}>
                        {p.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setEditingPlan(p); setFormOpen(true); }}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleToggle(p.id)} disabled={toggling === p.id}>
                          {p.is_active ? <ToggleRight className="h-3.5 w-3.5" /> : <ToggleLeft className="h-3.5 w-3.5" />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <PlanFormModal
        open={formOpen}
        onOpenChange={o => { if (!o) { setFormOpen(false); setEditingPlan(null); } }}
        plan={editingPlan}
        onSave={handleSave}
      />
    </>
  );
}
