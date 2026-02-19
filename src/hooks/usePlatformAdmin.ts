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

export interface PlatformMetrics {
  total_organizations: number;
  total_members: number;
  active_subscriptions: number;
  trial_subscriptions: number;
  expired_subscriptions: number;
  pending_payments: number;
  confirmed_payments: number;
  total_revenue: number;
  plan_distribution: { plan_name: string; plan_slug: string; count: number }[];
}

export function usePlatformAdmin() {
  const { user } = useAuthContext();
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState<PlatformOrganization[]>([]);
  const [payments, setPayments] = useState<PlatformPayment[]>([]);
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
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

  const fetchAll = useCallback(async () => {
    setDataLoading(true);
    await Promise.all([fetchOrganizations(), fetchPayments(), fetchMetrics()]);
    setDataLoading(false);
  }, [fetchOrganizations, fetchPayments, fetchMetrics]);

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

  return {
    isPlatformAdmin, loading, organizations, payments, metrics, dataLoading,
    fetchAll, confirmPayment, cancelPayment, changeSubscription,
  };
}
