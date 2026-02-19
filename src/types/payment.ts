export type PaymentMethod = 'reference_multicaixa' | 'stripe' | 'manual';
export type PaymentStatus = 'pending' | 'confirmed' | 'expired' | 'cancelled' | 'refunded';

export interface PaymentReference {
  id: string;
  organization_id: string;
  subscription_id: string | null;
  plan_id: string;
  payment_method: PaymentMethod;
  status: PaymentStatus;
  reference_code: string;
  amount: number;
  currency: string;
  billing_period: string;
  notes: string | null;
  confirmed_by: string | null;
  confirmed_at: string | null;
  expires_at: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  plan_name?: string;
  organization_name?: string;
}
