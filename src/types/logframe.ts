export type LogFrameLevelType = 'goal' | 'purpose' | 'output' | 'activity';

export const LOGFRAME_LEVEL_CONFIG: Record<LogFrameLevelType, { label: string; pluralLabel: string; color: string; description: string }> = {
  goal: { label: 'Objectivo Geral', pluralLabel: 'Objectivos Gerais', color: 'bg-purple-500', description: 'Impacto de longo prazo ao qual o projecto contribui' },
  purpose: { label: 'Objectivo Específico', pluralLabel: 'Objectivos Específicos', color: 'bg-blue-500', description: 'Resultado directo esperado do projecto' },
  output: { label: 'Resultado', pluralLabel: 'Resultados', color: 'bg-emerald-500', description: 'Produtos ou serviços entregues pelo projecto' },
  activity: { label: 'Actividade', pluralLabel: 'Actividades', color: 'bg-amber-500', description: 'Acções concretas para produzir os resultados' },
};

export const LOGFRAME_HIERARCHY: LogFrameLevelType[] = ['goal', 'purpose', 'output', 'activity'];

export const INDICATOR_FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Diário' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensal' },
  { value: 'quarterly', label: 'Trimestral' },
  { value: 'semi_annual', label: 'Semestral' },
  { value: 'annual', label: 'Anual' },
];

export interface LogFrameLevel {
  id: string;
  project_id: string;
  parent_id: string | null;
  level_type: LogFrameLevelType;
  narrative: string;
  means_of_verification: string | null;
  assumptions: string | null;
  position: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  indicators?: LogFrameIndicator[];
  children?: LogFrameLevel[];
}

export interface LogFrameIndicator {
  id: string;
  level_id: string;
  name: string;
  description: string | null;
  unit: string | null;
  baseline_value: number | null;
  baseline_date: string | null;
  target_value: number | null;
  target_date: string | null;
  current_value: number | null;
  data_source: string | null;
  frequency: string | null;
  responsible: string | null;
  created_at: string;
  updated_at: string;
}

export type LogFrameLevelInsert = Omit<LogFrameLevel, 'id' | 'created_at' | 'updated_at' | 'indicators' | 'children'>;
export type LogFrameIndicatorInsert = Omit<LogFrameIndicator, 'id' | 'created_at' | 'updated_at'>;
