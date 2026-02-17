export type ProcurementMethod = 'direct' | 'shopping' | 'ncb' | 'icb' | 'sole_source' | 'framework';
export type ProcurementStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled';
export type ContractType = 'fixed_price' | 'time_material' | 'cost_plus' | 'unit_price' | 'framework';
export type ContractStatus = 'draft' | 'active' | 'completed' | 'terminated' | 'suspended';
export type SupplierStatus = 'active' | 'inactive' | 'blacklisted';
export type ProcurementCategory = 'goods' | 'services' | 'works' | 'consulting';

export const PROCUREMENT_METHODS: { value: ProcurementMethod; label: string }[] = [
  { value: 'direct', label: 'Contratação Directa' },
  { value: 'shopping', label: 'Consulta de Preços' },
  { value: 'ncb', label: 'Concurso Nacional (NCB)' },
  { value: 'icb', label: 'Concurso Internacional (ICB)' },
  { value: 'sole_source', label: 'Fonte Única' },
  { value: 'framework', label: 'Acordo-Quadro' },
];

export const PROCUREMENT_STATUSES: { value: ProcurementStatus; label: string; color: string }[] = [
  { value: 'planned', label: 'Planeado', color: 'bg-blue-500/10 text-blue-600' },
  { value: 'in_progress', label: 'Em Curso', color: 'bg-warning/10 text-warning' },
  { value: 'completed', label: 'Concluído', color: 'bg-success/10 text-success' },
  { value: 'cancelled', label: 'Cancelado', color: 'bg-destructive/10 text-destructive' },
];

export const CONTRACT_TYPES: { value: ContractType; label: string }[] = [
  { value: 'fixed_price', label: 'Preço Fixo' },
  { value: 'time_material', label: 'Tempo & Material' },
  { value: 'cost_plus', label: 'Custo + Taxa' },
  { value: 'unit_price', label: 'Preço Unitário' },
  { value: 'framework', label: 'Acordo-Quadro' },
];

export const CONTRACT_STATUSES: { value: ContractStatus; label: string; color: string }[] = [
  { value: 'draft', label: 'Rascunho', color: 'bg-muted text-muted-foreground' },
  { value: 'active', label: 'Activo', color: 'bg-success/10 text-success' },
  { value: 'completed', label: 'Concluído', color: 'bg-blue-500/10 text-blue-600' },
  { value: 'terminated', label: 'Terminado', color: 'bg-destructive/10 text-destructive' },
  { value: 'suspended', label: 'Suspenso', color: 'bg-warning/10 text-warning' },
];

export const SUPPLIER_STATUSES: { value: SupplierStatus; label: string; color: string }[] = [
  { value: 'active', label: 'Activo', color: 'bg-success/10 text-success' },
  { value: 'inactive', label: 'Inactivo', color: 'bg-muted text-muted-foreground' },
  { value: 'blacklisted', label: 'Bloqueado', color: 'bg-destructive/10 text-destructive' },
];

export const PROCUREMENT_CATEGORIES: { value: ProcurementCategory; label: string }[] = [
  { value: 'goods', label: 'Bens' },
  { value: 'services', label: 'Serviços' },
  { value: 'works', label: 'Obras' },
  { value: 'consulting', label: 'Consultoria' },
];
