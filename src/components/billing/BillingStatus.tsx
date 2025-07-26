import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  getPlanDisplayName, 
  getPlanColor, 
  getBillingStatusColor, 
  getBillingStatusText,
  formatStorageSize 
} from '@/utils/planLimits';
import { CreditCard, Package, Users, HardDrive } from 'lucide-react';

interface BillingData {
  plan_type: string;
  billing_status: string;
  trial_end: string | null;
  current_period_end: string | null;
  vendor_limit: number;
  storage_limit: number;
  storage_used: number;
  stripe_customer_id: string | null;
}

const BillingStatus = () => {
  const [billingData, setBillingData] = useState<BillingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isManaging, setIsManaging] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchBillingData();
  }, [user]);

  const fetchBillingData = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('partners')
        .select('plan_type, billing_status, trial_end, current_period_end, vendor_limit, storage_limit, storage_used, stripe_customer_id')
        .eq('id', user.partnerId || user.id)
        .single();

      if (error) throw error;
      setBillingData(data);
    } catch (error) {
      console.error('Error fetching billing data:', error);
      toast({
        title: "Error",
        description: "Failed to load billing information",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openCustomerPortal = async () => {
    if (!billingData?.stripe_customer_id) {
      toast({
        title: "No Subscription",
        description: "You don't have an active subscription to manage",
        variant: "destructive",
      });
      return;
    }

    setIsManaging(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;
      
      window.open(data.url, '_blank');
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast({
        title: "Error",
        description: "Failed to open billing portal",
        variant: "destructive",
      });
    } finally {
      setIsManaging(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Billing Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading billing information...</div>
        </CardContent>
      </Card>
    );
  }

  if (!billingData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Billing Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">No billing information found</div>
        </CardContent>
      </Card>
    );
  }

  const isTrialing = billingData.billing_status === 'trialing';
  const trialDaysLeft = isTrialing && billingData.trial_end 
    ? Math.ceil((new Date(billingData.trial_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="space-y-6">
      {/* Main billing status card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Billing Status
          </CardTitle>
          <CardDescription>
            Manage your VendorHub subscription and billing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={getPlanColor(billingData.plan_type)}>
                  {getPlanDisplayName(billingData.plan_type)} Plan
                </Badge>
                <Badge variant="outline" className={getBillingStatusColor(billingData.billing_status)}>
                  {getBillingStatusText(billingData.billing_status)}
                </Badge>
              </div>
              
              {isTrialing && trialDaysLeft > 0 && (
                <p className="text-sm text-orange-600">
                  {trialDaysLeft} days left in trial
                </p>
              )}
              
              {billingData.current_period_end && (
                <p className="text-sm text-muted-foreground">
                  {billingData.billing_status === 'active' ? 'Next billing date: ' : 'Period ends: '}
                  {new Date(billingData.current_period_end).toLocaleDateString()}
                </p>
              )}
            </div>
            
            <Button 
              onClick={openCustomerPortal}
              disabled={isManaging || !billingData.stripe_customer_id}
              variant="outline"
            >
              {isManaging ? 'Opening...' : 'Manage Billing'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Plan limits overview */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" />
              Vendor Limit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Used</span>
                <span>{billingData.vendor_limit === 999999 ? 'Unlimited' : `0 / ${billingData.vendor_limit}`}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <HardDrive className="h-4 w-4" />
              Storage Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Used</span>
                <span>
                  {formatStorageSize(BigInt(billingData.storage_used || 0))} / 
                  {formatStorageSize(BigInt(billingData.storage_limit || 0))}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BillingStatus;