import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import BillingStatus from '@/components/billing/BillingStatus';

const Subscription = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true);

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!user?.id) return;

      try {
        const { data, error } = await supabase
          .from('partners')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error && error.code === 'PGRST116') {
          // No subscription - redirect to pricing
          navigate('/pricing');
          return;
        } else if (error) {
          throw error;
        }

        setSubscriptionData(data);
      } catch (error) {
        console.error('Error fetching subscription:', error);
        // If there's an error, redirect to pricing
        navigate('/pricing');
      } finally {
        setIsLoadingSubscription(false);
      }
    };

    if (!isLoading && user) {
      fetchSubscription();
    }
  }, [user, isLoading, navigate]);

  if (isLoading || isLoadingSubscription) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-vendor-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading subscription information...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    navigate('/auth');
    return null;
  }

  if (!subscriptionData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-vendor-green-50 via-white to-vendor-gold-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">No Subscription Found</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">You don't have an active subscription. Choose a plan to get started.</p>
            <Button onClick={() => navigate('/pricing')} className="w-full">
              View Plans
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-vendor-green-50 via-white to-vendor-gold-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Subscription Management
            </h1>
            <p className="text-lg text-gray-600">
              Manage your VendorHub subscription and billing information
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-semibold mb-4">Current Subscription</h2>
              <BillingStatus />
            </div>
            
            <div>
              <h2 className="text-xl font-semibold mb-4">Manage Subscription</h2>
              <div className="space-y-4">
                <Button 
                  onClick={() => navigate('/pricing')} 
                  variant="outline"
                  className="w-full"
                >
                  View All Plans & Upgrade Options
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Subscription;