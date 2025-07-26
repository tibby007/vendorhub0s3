import { supabase } from '@/integrations/supabase/client';

export interface PlanLimits {
  vendorLimit: number;
  storageLimit: bigint;
  planType: string;
  billingStatus: string;
}

export const checkPlanLimits = async (partnerId: string): Promise<PlanLimits> => {
  const { data: partner, error } = await supabase
    .from('partners')
    .select('plan_type, billing_status, vendor_limit, storage_limit')
    .eq('id', partnerId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch partner data: ${error.message}`);
  }

  // Block access if subscription canceled/past due
  if (['canceled', 'past_due', 'unpaid'].includes(partner.billing_status)) {
    throw new Error('Subscription required. Please update your billing to continue using VendorHub.');
  }

  return {
    vendorLimit: partner.vendor_limit,
    storageLimit: BigInt(partner.storage_limit || 0),
    planType: partner.plan_type,
    billingStatus: partner.billing_status
  };
};

export interface VendorLimitCheck {
  allowed: boolean;
  message: string;
  current: number;
  limit: number;
}

export const checkVendorLimit = async (partnerId: string): Promise<VendorLimitCheck> => {
  try {
    const limits = await checkPlanLimits(partnerId);
    
    const { count: vendorCount } = await supabase
      .from('vendors')
      .select('*', { count: 'exact' })
      .eq('partner_admin_id', partnerId);

    const current = vendorCount || 0;
    const limit = limits.vendorLimit;

    if (current >= limit) {
      return {
        allowed: false,
        message: `Vendor limit reached. You can add up to ${limit} vendors on your ${limits.planType} plan. Please upgrade to add more vendors.`,
        current,
        limit
      };
    }

    return {
      allowed: true,
      message: `You can add ${limit - current} more vendors on your ${limits.planType} plan.`,
      current,
      limit
    };
  } catch (error) {
    return {
      allowed: false,
      message: error instanceof Error ? error.message : 'Failed to check vendor limits',
      current: 0,
      limit: 0
    };
  }
};

export const formatStorageSize = (bytes: bigint): string => {
  const gb = Number(bytes) / (1024 * 1024 * 1024);
  return `${gb.toFixed(1)} GB`;
};

export const getPlanDisplayName = (planType: string): string => {
  const names = {
    basic: 'Basic',
    pro: 'Pro', 
    premium: 'Premium'
  };
  return names[planType as keyof typeof names] || 'Basic';
};

export const getPlanColor = (planType: string): string => {
  const colors = {
    basic: 'text-blue-600',
    pro: 'text-purple-600',
    premium: 'text-gold-600'
  };
  return colors[planType as keyof typeof colors] || 'text-blue-600';
};

export const getBillingStatusColor = (status: string): string => {
  const colors = {
    active: 'text-green-600',
    trialing: 'text-blue-600',
    past_due: 'text-yellow-600',
    canceled: 'text-red-600',
    unpaid: 'text-red-600'
  };
  return colors[status as keyof typeof colors] || 'text-gray-600';
};

export const getBillingStatusText = (status: string): string => {
  const texts = {
    active: 'Active',
    trialing: 'Trial',
    past_due: 'Past Due',
    canceled: 'Canceled',
    unpaid: 'Payment Failed'
  };
  return texts[status as keyof typeof texts] || 'Unknown';
};