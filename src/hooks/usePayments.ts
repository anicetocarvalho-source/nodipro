import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import type { PaymentReference } from '@/types/payment';

export function usePayments() {
  const { organization } = useOrganization();
  const [payments, setPayments] = useState<PaymentReference[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = useCallback(async () => {
    if (!organization) {
      setPayments([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('payment_references')
      .select('*')
      .eq('organization_id', organization.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching payments:', error);
    } else {
      setPayments((data ?? []) as unknown as PaymentReference[]);
    }
    setLoading(false);
  }, [organization]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const createReference = async (planId: string, amount: number, billingPeriod: 'monthly' | 'yearly'): Promise<PaymentReference | null> => {
    if (!organization) return null;

    // Generate reference code via SQL function
    const { data: refCode } = await supabase.rpc('generate_multicaixa_reference');
    if (!refCode) return null;

    const { data, error } = await supabase
      .from('payment_references')
      .insert({
        organization_id: organization.id,
        plan_id: planId,
        payment_method: 'reference_multicaixa',
        reference_code: refCode as string,
        amount,
        currency: 'AOA',
        billing_period: billingPeriod,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating payment reference:', error);
      return null;
    }

    await fetchPayments();
    return data as unknown as PaymentReference;
  };

  const confirmPayment = async (paymentId: string, notes?: string): Promise<boolean> => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return false;

    const { error } = await supabase
      .from('payment_references')
      .update({
        status: 'confirmed',
        confirmed_by: userData.user.id,
        confirmed_at: new Date().toISOString(),
        notes: notes || null,
      })
      .eq('id', paymentId);

    if (error) {
      console.error('Error confirming payment:', error);
      return false;
    }

    // Find the payment to get plan_id and activate subscription
    const payment = payments.find(p => p.id === paymentId);
    if (payment) {
      // Update or create active subscription
      const { data: existingSub } = await supabase
        .from('organization_subscriptions')
        .select('id')
        .eq('organization_id', payment.organization_id)
        .in('status', ['trial', 'active'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingSub) {
        await supabase
          .from('organization_subscriptions')
          .update({
            plan_id: payment.plan_id,
            status: 'active',
            payment_method: 'reference_multicaixa',
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingSub.id);
      } else {
        await supabase
          .from('organization_subscriptions')
          .insert({
            organization_id: payment.organization_id,
            plan_id: payment.plan_id,
            status: 'active',
            payment_method: 'reference_multicaixa',
          });
      }
    }

    await fetchPayments();
    return true;
  };

  const cancelPayment = async (paymentId: string): Promise<boolean> => {
    const { error } = await supabase
      .from('payment_references')
      .update({ status: 'cancelled' })
      .eq('id', paymentId);

    if (error) {
      console.error('Error cancelling payment:', error);
      return false;
    }

    await fetchPayments();
    return true;
  };

  return {
    payments,
    loading,
    createReference,
    confirmPayment,
    cancelPayment,
    refreshPayments: fetchPayments,
  };
}
