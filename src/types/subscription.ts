export type SubscriptionStatus = 'trial' | 'active' | 'past_due' | 'cancelled' | 'expired';

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  currency: string;
  max_projects: number;
  max_members: number;
  max_storage_gb: number;
  max_portfolios: number;
  features: PlanFeatures;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface PlanFeatures {
  kanban: boolean;
  gantt: boolean;
  evm: boolean;
  logframe: boolean;
  risks: boolean;
  kpis: boolean;
  procurement: boolean;
  change_requests: boolean;
  budget_advanced: boolean;
  reports: boolean;
  scrum: boolean;
  api_access: boolean;
  stakeholders: boolean;
  briefings: boolean;
  disbursements: boolean;
}

export interface OrganizationSubscription {
  id: string;
  organization_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  trial_ends_at: string | null;
  current_period_start: string;
  current_period_end: string;
  cancelled_at: string | null;
  cancel_reason: string | null;
  created_at: string;
  updated_at: string;
  plan?: SubscriptionPlan;
}

export interface QuotaResult {
  allowed: boolean;
  current: number;
  max: number;
  plan_name?: string;
  plan_slug?: string;
  reason?: string;
}
