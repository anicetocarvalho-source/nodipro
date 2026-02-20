import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { PlatformPlan } from '@/hooks/usePlatformAdmin';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: PlatformPlan | null;
  onSave: (plan: Omit<PlatformPlan, 'id' | 'is_active'>) => void;
}

const defaults = {
  name: '', slug: '', description: '',
  price_monthly: 0, price_yearly: 0, currency: 'AOA',
  max_projects: 3, max_members: 5, max_storage_gb: 1, max_portfolios: 0,
  features: {} as Record<string, boolean>, sort_order: 0,
};

export function PlanFormModal({ open, onOpenChange, plan, onSave }: Props) {
  const [form, setForm] = useState(defaults);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (plan) {
      setForm({
        name: plan.name, slug: plan.slug, description: plan.description || '',
        price_monthly: plan.price_monthly, price_yearly: plan.price_yearly, currency: plan.currency,
        max_projects: plan.max_projects, max_members: plan.max_members,
        max_storage_gb: plan.max_storage_gb, max_portfolios: plan.max_portfolios,
        features: plan.features || {}, sort_order: plan.sort_order,
      });
    } else {
      setForm(defaults);
    }
  }, [plan, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  const set = (key: string, value: any) => setForm(f => ({ ...f, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{plan ? 'Editar Plano' : 'Novo Plano'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={form.name} onChange={e => set('name', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input value={form.slug} onChange={e => set('slug', e.target.value)} required />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2} />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Preço Mensal</Label>
              <Input type="number" value={form.price_monthly} onChange={e => set('price_monthly', Number(e.target.value))} min={0} />
            </div>
            <div className="space-y-2">
              <Label>Preço Anual</Label>
              <Input type="number" value={form.price_yearly} onChange={e => set('price_yearly', Number(e.target.value))} min={0} />
            </div>
            <div className="space-y-2">
              <Label>Moeda</Label>
              <Input value={form.currency} onChange={e => set('currency', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Max. Projectos (-1 = ilimitado)</Label>
              <Input type="number" value={form.max_projects} onChange={e => set('max_projects', Number(e.target.value))} min={-1} />
            </div>
            <div className="space-y-2">
              <Label>Max. Membros (-1 = ilimitado)</Label>
              <Input type="number" value={form.max_members} onChange={e => set('max_members', Number(e.target.value))} min={-1} />
            </div>
            <div className="space-y-2">
              <Label>Max. Storage GB (-1 = ilimitado)</Label>
              <Input type="number" value={form.max_storage_gb} onChange={e => set('max_storage_gb', Number(e.target.value))} min={-1} />
            </div>
            <div className="space-y-2">
              <Label>Max. Portfólios (-1 = ilimitado)</Label>
              <Input type="number" value={form.max_portfolios} onChange={e => set('max_portfolios', Number(e.target.value))} min={-1} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Ordem de exibição</Label>
            <Input type="number" value={form.sort_order} onChange={e => set('sort_order', Number(e.target.value))} min={0} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving || !form.name || !form.slug}>
              {saving ? 'A guardar…' : plan ? 'Guardar' : 'Criar Plano'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
