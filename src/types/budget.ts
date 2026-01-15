// Types for budget management

export type BudgetEntryStatus = 'pending' | 'approved' | 'rejected' | 'paid';

export interface CostCategory {
  id: string;
  name: string;
  description: string | null;
  code: string | null;
  parent_id: string | null;
  created_at: string;
}

export interface BudgetEntry {
  id: string;
  project_id: string;
  task_id: string | null;
  phase_name: string | null;
  category_id: string | null;
  description: string;
  planned_amount: number;
  actual_amount: number;
  entry_date: string;
  status: BudgetEntryStatus;
  invoice_number: string | null;
  supplier: string | null;
  notes: string | null;
  created_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  category?: CostCategory;
}

export interface BudgetAlert {
  id: string;
  project_id: string;
  alert_type: 'warning' | 'critical' | 'info';
  title: string;
  message: string;
  threshold_percentage: number | null;
  current_percentage: number | null;
  is_read: boolean;
  is_resolved: boolean;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
}

export interface BudgetSnapshot {
  id: string;
  project_id: string;
  snapshot_date: string;
  period_type: 'monthly' | 'quarterly' | 'yearly';
  total_planned: number;
  total_actual: number;
  variance: number;
  variance_percentage: number;
  category_breakdown: Record<string, { planned: number; actual: number }> | null;
  phase_breakdown: Record<string, { planned: number; actual: number }> | null;
  notes: string | null;
  created_at: string;
}

// Insert types
export type BudgetEntryInsert = Omit<BudgetEntry, 'id' | 'created_at' | 'updated_at' | 'category'>;
export type BudgetAlertInsert = Omit<BudgetAlert, 'id' | 'created_at'>;
export type BudgetSnapshotInsert = Omit<BudgetSnapshot, 'id' | 'created_at'>;
