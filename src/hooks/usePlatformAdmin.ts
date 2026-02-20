import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

export interface PlatformOrganization {
  id: string;
  name: string;
  slug: string;
  entity_type: string;
  sector_name: string | null;
  created_at: string;
  member_count: number;
  project_count: number;
  plan_name: string | null;
  plan_slug: string | null;
  subscription_status: string | null;
  trial_ends_at: string | null;
}

export interface PlatformPayment {
  id: string;
  organization_id: string;
  organization_name: string;
  plan_id: string;
  plan_name: string | null;
  reference_code: string;
  amount: number;
  currency: string;
  billing_period: string;
  status: string;
  created_at: string;
  expires_at: string;
}

export interface MonthlyGrowth {
  month: string;
  new_orgs: number;
  revenue: number;
}

export interface PlatformMetrics {
  total_organizations: number;
  total_members: number;
  active_subscriptions: number;
  trial_subscriptions: number;
  expired_subscriptions: number;
  pending_payments: number;
  confirmed_payments: number;
  total_revenue: number;
  mrr: number;
  churn_rate: number;
  arpu: number;
  plan_distribution: { plan_name: string; plan_slug: string; count: number }[];
  monthly_growth: MonthlyGrowth[];
}

export interface PlatformPlan {
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
  features: Record<string, boolean>;
  is_active: boolean;
  sort_order: number;
}

export interface AuditLog {
  id: string;
  action: string;
  target_type: string;
  target_id: string | null;
  target_name: string | null;
  user_id: string;
  user_name: string | null;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
  ip_address: string | null;
}

export interface AuditLogsResult {
  total: number;
  logs: AuditLog[];
}

export interface OrgDetail {
  organization: {
    id: string; name: string; slug: string; entity_type: string;
    description: string | null; website: string | null; country: string | null;
    created_at: string; logo_url: string | null; size: string | null;
    sector_name: string | null; province_name: string | null;
  };
  members: { user_id: string; role: string; joined_at: string; is_primary: boolean; full_name: string | null; avatar_url: string | null }[];
  projects: { id: string; name: string; status: string; progress: number; budget: number; spent: number; created_at: string }[];
  payments: { id: string; reference_code: string; amount: number; currency: string; status: string; billing_period: string; created_at: string; confirmed_at: string | null; plan_name: string | null }[];
  subscription: { id: string; status: string; trial_ends_at: string | null; current_period_start: string; current_period_end: string; payment_method: string | null; plan_name: string; plan_slug: string; max_projects: number; max_members: number; max_storage_gb: number; max_portfolios: number } | null;
  quotas: { projects: number; members: number; portfolios: number };
}

export function usePlatformAdmin() {
  const { user } = useAuthContext();
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState<PlatformOrganization[]>([]);
  const [payments, setPayments] = useState<PlatformPayment[]>([]);
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
  const [plans, setPlans] = useState<PlatformPlan[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    supabase.rpc('is_platform_admin', { _user_id: user.id })
      .then(({ data }) => {
        setIsPlatformAdmin(!!data);
        setLoading(false);
      });
  }, [user]);

  const fetchOrganizations = useCallback(async () => {
    const { data, error } = await supabase.rpc('get_all_organizations');
    if (!error && data) setOrganizations(data as unknown as PlatformOrganization[]);
  }, []);

  const fetchPayments = useCallback(async () => {
    const { data, error } = await supabase.rpc('get_all_pending_payments');
    if (!error && data) setPayments(data as unknown as PlatformPayment[]);
  }, []);

  const fetchMetrics = useCallback(async () => {
    const { data, error } = await supabase.rpc('get_platform_metrics');
    if (!error && data) setMetrics(data as unknown as PlatformMetrics);
  }, []);

  const fetchPlans = useCallback(async () => {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .order('sort_order');
    if (!error && data) setPlans(data as unknown as PlatformPlan[]);
  }, []);

  const fetchAll = useCallback(async () => {
    setDataLoading(true);
    await Promise.all([fetchOrganizations(), fetchPayments(), fetchMetrics(), fetchPlans()]);
    setDataLoading(false);
  }, [fetchOrganizations, fetchPayments, fetchMetrics, fetchPlans]);

  const confirmPayment = useCallback(async (paymentId: string, notes?: string) => {
    const { data, error } = await supabase.rpc('platform_confirm_payment', {
      _payment_id: paymentId, _notes: notes || null,
    });
    if (!error && data) { await Promise.all([fetchPayments(), fetchMetrics()]); return true; }
    return false;
  }, [fetchPayments, fetchMetrics]);

  const cancelPayment = useCallback(async (paymentId: string) => {
    const { data, error } = await supabase.rpc('platform_cancel_payment', { _payment_id: paymentId });
    if (!error && data) { await Promise.all([fetchPayments(), fetchMetrics()]); return true; }
    return false;
  }, [fetchPayments, fetchMetrics]);

  const changeSubscription = useCallback(async (orgId: string, planId: string) => {
    const { data, error } = await supabase.rpc('platform_change_subscription', {
      _org_id: orgId, _plan_id: planId,
    });
    if (!error && data) { await Promise.all([fetchOrganizations(), fetchMetrics()]); return true; }
    return false;
  }, [fetchOrganizations, fetchMetrics]);

  const getOrgDetail = useCallback(async (orgId: string): Promise<OrgDetail | null> => {
    const { data, error } = await supabase.rpc('get_org_detail_for_admin', { _org_id: orgId });
    if (error || !data) return null;
    return data as unknown as OrgDetail;
  }, []);

  const createPlan = useCallback(async (plan: Omit<PlatformPlan, 'id' | 'is_active'>) => {
    const { data, error } = await supabase.rpc('platform_create_plan', {
      _name: plan.name, _slug: plan.slug, _description: plan.description || '',
      _price_monthly: plan.price_monthly, _price_yearly: plan.price_yearly, _currency: plan.currency,
      _max_projects: plan.max_projects, _max_members: plan.max_members, _max_storage_gb: plan.max_storage_gb,
      _max_portfolios: plan.max_portfolios, _features: plan.features as any, _sort_order: plan.sort_order,
    });
    if (!error && data) { await fetchPlans(); return true; }
    return false;
  }, [fetchPlans]);

  const updatePlan = useCallback(async (plan: PlatformPlan) => {
    const { data, error } = await supabase.rpc('platform_update_plan', {
      _plan_id: plan.id, _name: plan.name, _slug: plan.slug, _description: plan.description || '',
      _price_monthly: plan.price_monthly, _price_yearly: plan.price_yearly, _currency: plan.currency,
      _max_projects: plan.max_projects, _max_members: plan.max_members, _max_storage_gb: plan.max_storage_gb,
      _max_portfolios: plan.max_portfolios, _features: plan.features as any, _sort_order: plan.sort_order,
    });
    if (!error && data) { await fetchPlans(); return true; }
    return false;
  }, [fetchPlans]);

  const togglePlanActive = useCallback(async (planId: string) => {
    const { data, error } = await supabase.rpc('platform_toggle_plan', { _plan_id: planId });
    if (!error && data) { await fetchPlans(); return true; }
    return false;
  }, [fetchPlans]);

  const fetchAuditLogs = useCallback(async (params: {
    limit?: number; offset?: number; action_filter?: string | null;
    target_filter?: string | null; search?: string | null;
    date_from?: string | null; date_to?: string | null;
  }): Promise<AuditLogsResult> => {
    const { data, error } = await supabase.rpc('get_platform_audit_logs', {
      _limit: params.limit || 50,
      _offset: params.offset || 0,
      _action_filter: params.action_filter || null,
      _target_filter: params.target_filter || null,
      _search: params.search || null,
      _date_from: params.date_from || null,
      _date_to: params.date_to || null,
    });
    if (error || !data) return { total: 0, logs: [] };
    return data as unknown as AuditLogsResult;
  }, []);

  const createOrganization = useCallback(async (params: {
    name: string; entity_type: string; sector_id: string | null; province_id: string | null;
    size: string; description: string | null; owner_email: string; plan_id: string;
  }) => {
    const { data, error } = await supabase.rpc('platform_create_organization', {
      _name: params.name,
      _entity_type: params.entity_type,
      _sector_id: params.sector_id,
      _province_id: params.province_id,
      _size: params.size,
      _description: params.description,
      _owner_email: params.owner_email,
      _plan_id: params.plan_id,
    } as any);
    if (error) { console.error('Error creating organization:', error); return null; }
    await fetchAll();
    return data as unknown as { org_id: string; slug: string; owner_found: boolean; owner_email: string };
  }, [fetchAll]);

  return {
    isPlatformAdmin, loading, organizations, payments, metrics, plans, dataLoading,
    fetchAll, confirmPayment, cancelPayment, changeSubscription,
    getOrgDetail, createPlan, updatePlan, togglePlanActive, fetchAuditLogs,
    createOrganization,
  };
}
