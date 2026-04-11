import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import type { SubscriptionPlan, OrganizationSubscription, QuotaResult, PlanFeatures } from '@/types/subscription';

export function useSubscription() {
  const { organization } = useOrganization();
  const [subscription, setSubscription] = useState<OrganizationSubscription | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlans = useCallback(async () => {
    const { data } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');
    if (data) setPlans(data as unknown as SubscriptionPlan[]);
  }, []);

  const fetchSubscription = useCallback(async () => {
    if (!organization) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('organization_subscriptions')
      .select('*, subscription_plans(*)')
      .eq('organization_id', organization.id)
      .in('status', ['trial', 'active', 'expired'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      const sub = data as any;
      const subData: OrganizationSubscription = {
        ...sub,
        plan: sub.subscription_plans as SubscriptionPlan,
      };
      
      // Frontend fallback: check if trial has expired
      if (subData.status === 'trial' && subData.trial_ends_at && new Date(subData.trial_ends_at) < new Date()) {
        subData.status = 'expired';
        // Also update in DB
        supabase
          .from('organization_subscriptions')
          .update({ status: 'expired', updated_at: new Date().toISOString() })
          .eq('id', subData.id)
          .then();
      }
      
      setSubscription(subData);
    } else {
      setSubscription(null);
    }
    setLoading(false);
  }, [organization]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const currentPlan = subscription?.plan ?? null;

  const hasFeature = (feature: keyof PlanFeatures): boolean => {
    if (!currentPlan) return false;
    return currentPlan.features[feature] ?? false;
  };

  const checkQuota = async (resourceType: string): Promise<QuotaResult> => {
    if (!organization) return { allowed: false, current: 0, max: 0, reason: 'no_organization' };

    const { data, error } = await supabase.rpc('check_org_quota', {
      _org_id: organization.id,
      _resource_type: resourceType,
    });

    if (error || !data) return { allowed: false, current: 0, max: 0, reason: 'error' };
    return data as unknown as QuotaResult;
  };

  const selectPlan = async (planId: string): Promise<{ success: boolean; conflicts?: string[] }> => {
    if (!organization) return { success: false };

    // Server-side downgrade validation
    const { data: validation, error: valError } = await supabase.rpc('validate_plan_downgrade', {
      _org_id: organization.id,
      _new_plan_id: planId,
    });

    if (valError || !validation) {
      console.error('Error validating downgrade:', valError);
      return { success: false };
    }

    const result = validation as unknown as { allowed: boolean; conflicts: string[] };
    if (!result.allowed) {
      return { success: false, conflicts: result.conflicts };
    }

    // Check if subscription already exists
    if (subscription) {
      const { error } = await supabase
        .from('organization_subscriptions')
        .update({ plan_id: planId, updated_at: new Date().toISOString() })
        .eq('id', subscription.id);
      if (error) { console.error('Error updating subscription:', error); return { success: false }; }
    } else {
      const freePlan = plans.find(p => p.slug === 'free');
      const selectedPlan = plans.find(p => p.id === planId);
      const isTrial = selectedPlan && selectedPlan.slug !== 'free';

      const { error } = await supabase
        .from('organization_subscriptions')
        .insert({
          organization_id: organization.id,
          plan_id: planId,
          status: isTrial ? 'trial' : 'active',
          trial_ends_at: isTrial ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() : null,
        });
      if (error) { console.error('Error creating subscription:', error); return { success: false }; }
    }

    await fetchSubscription();
    return { success: true };
  };

  const isFreePlan = currentPlan?.slug === 'free';
  const isTrial = subscription?.status === 'trial';
  const trialDaysLeft = subscription?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(subscription.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return {
    subscription,
    currentPlan,
    plans,
    loading,
    hasFeature,
    checkQuota,
    selectPlan,
    isFreePlan,
    isTrial,
    trialDaysLeft,
    refreshSubscription: fetchSubscription,
  };
}
