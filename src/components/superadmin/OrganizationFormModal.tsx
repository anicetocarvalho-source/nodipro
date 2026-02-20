import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building2, AlertTriangle } from 'lucide-react';
import { useSectors, useProvinces } from '@/hooks/useOrganizationData';
import { ENTITY_TYPE_LABELS, ORG_SIZE_LABELS } from '@/types/organization';
import type { PlatformPlan } from '@/hooks/usePlatformAdmin';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plans: PlatformPlan[];
  onSubmit: (data: {
    name: string;
    entity_type: string;
    sector_id: string | null;
    province_id: string | null;
    size: string;
    description: string | null;
    owner_email: string;
    plan_id: string;
  }) => Promise<{ org_id: string; owner_found: boolean; owner_email: string } | null>;
}

export function OrganizationFormModal({ open, onOpenChange, plans, onSubmit }: Props) {
  const [name, setName] = useState('');
  const [entityType, setEntityType] = useState('');
  const [sectorId, setSectorId] = useState('');
  const [provinceId, setProvinceId] = useState('');
  const [size, setSize] = useState('small');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [planId, setPlanId] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { data: sectors } = useSectors();
  const { data: provinces } = useProvinces();

  const activePlans = plans.filter(p => p.is_active);

  const resetForm = () => {
    setName(''); setEntityType(''); setSectorId(''); setProvinceId('');
    setSize('small'); setOwnerEmail(''); setPlanId(''); setDescription('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !entityType || !ownerEmail.trim() || !planId) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setSubmitting(true);
    try {
      const result = await onSubmit({
        name: name.trim(),
        entity_type: entityType,
        sector_id: sectorId || null,
        province_id: provinceId || null,
        size,
        description: description.trim() || null,
        owner_email: ownerEmail.trim(),
        plan_id: planId,
      });

      if (result) {
        if (!result.owner_found) {
          toast.warning(`Organização criada, mas o utilizador ${result.owner_email} não foi encontrado. Será necessário convidá-lo manualmente.`);
        } else {
          toast.success('Organização criada com sucesso!');
        }
        resetForm();
        onOpenChange(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Nova Organização
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="org-name">Nome *</Label>
            <Input id="org-name" value={name} onChange={e => setName(e.target.value)} placeholder="Nome da organização" maxLength={100} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Entidade *</Label>
              <Select value={entityType} onValueChange={setEntityType} required>
                <SelectTrigger><SelectValue placeholder="Seleccionar…" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ENTITY_TYPE_LABELS).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Dimensão</Label>
              <Select value={size} onValueChange={setSize}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ORG_SIZE_LABELS).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Sector</Label>
              <Select value={sectorId} onValueChange={setSectorId}>
                <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                <SelectContent>
                  {sectors?.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Província</Label>
              <Select value={provinceId} onValueChange={setProvinceId}>
                <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                <SelectContent>
                  {provinces?.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="owner-email">Email do Owner *</Label>
            <Input id="owner-email" type="email" value={ownerEmail} onChange={e => setOwnerEmail(e.target.value)} placeholder="email@exemplo.com" maxLength={255} required />
            <p className="text-xs text-muted-foreground">Se o utilizador existir, será associado automaticamente. Caso contrário, será necessário convidá-lo.</p>
          </div>

          <div className="space-y-2">
            <Label>Plano *</Label>
            <Select value={planId} onValueChange={setPlanId} required>
              <SelectTrigger><SelectValue placeholder="Seleccionar plano…" /></SelectTrigger>
              <SelectContent>
                {activePlans.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} — {p.price_monthly.toLocaleString()} {p.currency}/mês
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="org-desc">Descrição</Label>
            <Textarea id="org-desc" value={description} onChange={e => setDescription(e.target.value)} placeholder="Descrição opcional…" maxLength={500} rows={3} />
          </div>

          <Alert variant="default" className="bg-muted/50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              A organização será criada com subscrição trial de 14 dias e onboarding marcado como completo.
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancelar</Button>
            <Button type="submit" disabled={submitting || !name.trim() || !entityType || !ownerEmail.trim() || !planId}>
              {submitting ? 'A criar…' : 'Criar Organização'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
