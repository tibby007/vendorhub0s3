import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useSubscriptionManager } from '@/hooks/useSubscriptionManager';
import { useSubscription } from '@/providers/SubscriptionProvider';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import BillingStatus from '@/components/billing/BillingStatus';
import SubscriptionPlans from '@/components/subscription/SubscriptionPlans';
import TrialCountdown from '@/components/subscription/TrialCountdown';
import { needsSubscriptionSetup } from '@/utils/subscriptionUtils';

const Subscription = () => {
  const { user, loading } = useAuth();
  const { subscription } = useSubscriptionManager();
  const { subscription: subData, isTrialUser, daysRemaining } = useSubscription();
  const navigate = useNavigate();
  const [isNewUser, setIsNewUser] = useState(false);

  // Detect if user is currently on trial
  const isCurrentlyOnTrial = isTrialUser && subData.status === 'trial';

  // Trial Status Banner Component
  const TrialStatusBanner = () => {
    if (!isCurrentlyOnTrial) return null;
    
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Your trial expires in {daysRemaining} days
            </h3>
            <p className="text-sm text-yellow-700 mt-1">
              Choose a plan below to continue using VendorHub after your trial ends.
            </p>
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (!loading && user) {
      // Check if user just completed payment
      const urlParams = new URLSearchParams(window.location.search);
      const success = urlParams.get('success');
      const sessionId = urlParams.get('session_id');
      
      if ((success === 'true' || sessionId) && !subscription.isLoading) {
        console.log('Payment success detected, redirecting to dashboard...');
        navigate('/dashboard?subscription=success', { replace: true });
        return;
      }
      
      // Check if this is a new user who needs to set up subscription
      // Don't show setup if user has trial, active, or trialing status
      const hasSubscriptionAccess = subscription.subscribed || 
                                   subscription.status === 'trial' || 
                                   subscription.status === 'active' ||
                                   subscription.status === 'trialing' ||
                                   subscription.billingStatus === 'trialing' ||
                                   subscription.billingStatus === 'active';
      const needsSetup = !hasSubscriptionAccess && subscription.status !== 'loading';
      setIsNewUser(needsSetup);
      
      console.log('Subscription page - subscription status:', subscription.status, 'subscribed:', subscription.subscribed, 'needsSetup:', needsSetup);
      
      // Check if user came from landing page with a selected plan
      const selectedPlan = sessionStorage.getItem('selectedPlan');
      console.log('🔍 Checking for stored plan:', selectedPlan);
      
      if (selectedPlan && needsSetup) {
        try {
          const planData = JSON.parse(selectedPlan);
          console.log('🎯 Found stored plan selection, proceeding to Stripe checkout:', planData);
          console.log('📋 Plan details - tierId:', planData.tierId, 'tierName:', planData.tierName, 'isAnnual:', planData.isAnnual);
          
          // Clear the stored plan
          sessionStorage.removeItem('selectedPlan');
          
          // Show loading while redirecting to auto checkout
          setIsNewUser(false); // Prevent showing the subscription page
          
          // Use the auto checkout flow from SubscriptionPlans component
          setTimeout(() => {
            navigate('/subscription?auto=true&plan=' + encodeURIComponent(JSON.stringify(planData)), { replace: true });
          }, 100); // Small delay to ensure state is set
          
          return; // Exit early to show loading
        } catch (error) {
          console.error('Error parsing stored plan:', error);
        }
      }
    }
  }, [user, loading, subscription, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-vendor-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading subscription information...</p>
        </div>
      </div>
    );
  }

  // Show loading when redirecting to auto checkout
  const selectedPlan = sessionStorage.getItem('selectedPlan');
  if (selectedPlan && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-vendor-green-50 via-white to-vendor-gold-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-vendor-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to checkout...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    navigate('/auth');
    return null;
  }

  // Show subscription plans for new users who need to set up subscription
  if (isNewUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-vendor-green-50 via-white to-vendor-gold-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome to VendorHub! 🎉
              </h1>
              <p className="text-lg text-gray-600 mb-4">
                Choose your plan to start your 3-day free trial
              </p>
              <p className="text-sm text-gray-500">
                No credit card required for the trial. You can cancel anytime.
              </p>
            </div>
            
            <SubscriptionPlans />
          </div>
        </div>
      </div>
    );
  }

  // Show subscription management for existing users
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

          <TrialStatusBanner />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-semibold mb-4">Current Subscription</h2>
              <BillingStatus />
            </div>
            
            <div>
              <h2 className="text-xl font-semibold mb-4">Manage Subscription</h2>
              <div className="space-y-4">
                <SubscriptionPlans />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Subscription;