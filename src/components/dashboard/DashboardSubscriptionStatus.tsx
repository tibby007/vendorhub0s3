import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Clock, CreditCard } from 'lucide-react';

interface DashboardSubscriptionStatusProps {
  user: any;
}

const DashboardSubscriptionStatus: React.FC<DashboardSubscriptionStatusProps> = ({ user }) => {
  const [subscriptionStatus, setSubscriptionStatus] = useState<'loading' | 'no_subscription' | 'active' | 'trial' | 'past_due'>('loading');
  const [partnerData, setPartnerData] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkSubscription = async () => {
      if (!user?.id) return;

      try {
        const { data, error } = await supabase
          .from('partners')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.warn('Error fetching partner data:', error);
          setSubscriptionStatus('no_subscription');
          return;
        }
        
        if (!data) {
          // No subscription found - new user
          setSubscriptionStatus('no_subscription');
        } else {
          setPartnerData(data);
          const status = data.billing_status;
          if (status === 'active' || status === 'trial' || status === 'past_due') {
            setSubscriptionStatus(status);
          } else {
            setSubscriptionStatus('trial');
          }
        }
      } catch (error) {
        console.error('Error checking subscription:', error);
        setSubscriptionStatus('no_subscription');
      }
    };

    checkSubscription();
  }, [user]);

  const handleStartSubscription = () => {
    navigate('/pricing');
  };

  if (subscriptionStatus === 'loading') {
    return (
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-blue-600 animate-pulse" />
            <p className="text-blue-800">Loading subscription status...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (subscriptionStatus === 'no_subscription') {
    return (
      <Card className="bg-gradient-to-r from-vendor-green-50 to-vendor-gold-50 border-vendor-green-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-vendor-green-800">
            <CheckCircle className="h-5 w-5" />
            <span>Welcome to VendorHub!</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-vendor-green-700 mb-4">
            Start your subscription to unlock all features and begin managing your vendor network effectively.
          </p>
          <Button 
            onClick={handleStartSubscription} 
            className="w-full bg-vendor-green-600 hover:bg-vendor-green-700"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Choose Your Plan
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (subscriptionStatus === 'trial') {
    const trialDaysLeft = partnerData?.trial_end 
      ? Math.ceil((new Date(partnerData.trial_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : 0;

    return (
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-blue-800">
              <Clock className="h-5 w-5" />
              <span>Trial Active</span>
            </div>
            <Badge variant="secondary">
              {trialDaysLeft > 0 ? `${trialDaysLeft} days left` : 'Expires soon'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-blue-700 mb-4">
            {trialDaysLeft > 0 
              ? `${trialDaysLeft} days left in your free trial. Complete your subscription to continue access.`
              : 'Your trial expires soon. Complete your subscription to maintain access.'
            }
          </p>
          <Button 
            variant="outline" 
            onClick={() => navigate('/settings/billing')}
            className="w-full"
          >
            Complete Subscription
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (subscriptionStatus === 'past_due') {
    return (
      <Card className="bg-red-50 border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-red-800">
            <AlertTriangle className="h-5 w-5" />
            <span>Payment Required</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-700 mb-4">
            Your subscription payment is past due. Update your billing to continue using VendorHub.
          </p>
          <Button 
            variant="destructive" 
            onClick={() => navigate('/settings/billing')}
            className="w-full"
          >
            Update Billing
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Active subscription
  return (
    <Card className="bg-green-50 border-green-200">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-green-800">
            <CheckCircle className="h-5 w-5" />
            <span>
              {partnerData?.plan_type?.charAt(0)?.toUpperCase() + partnerData?.plan_type?.slice(1)} Plan Active
            </span>
          </div>
          <Badge variant="default" className="bg-green-600">Active</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-green-700 mb-4">
          Your subscription is active and all features are available.
        </p>
        <Button 
          variant="outline" 
          onClick={() => navigate('/settings/billing')}
          className="w-full"
        >
          Manage Billing
        </Button>
      </CardContent>
    </Card>
  );
};

export default DashboardSubscriptionStatus;