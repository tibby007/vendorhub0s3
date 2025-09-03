
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useSubscription } from '@/providers/SubscriptionProvider';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { invokeFunction } from '@/utils/netlifyFunctions';
import { Users, Zap, Star } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { SubscriptionPlan } from '@/types/subscription';
import BillingToggle from './BillingToggle';
import PlanCard from './PlanCard';
import AdditionalFeatures from './AdditionalFeatures';

const SubscriptionPlans = () => {
  const { session } = useAuth();
  const { subscription, isTrialUser, daysRemaining } = useSubscription();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isAnnual, setIsAnnual] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  // Detect if user is currently on trial
  const isCurrentlyOnTrial = isTrialUser && subscription.status === 'trial';
  
  console.log('Subscription page - trial status:', {
    isTrialUser,
    status: subscription.status,
    isCurrentlyOnTrial,
    daysRemaining
  });

  // Base plan configuration
  const basePlans = [
    {
      id: 'basic',
      name: 'VendorHub Basic',
      description: 'Perfect for small teams getting started',
      monthlyPrice: 97,
      annualPrice: 97 * 12 * 0.83, // 17% savings
      maxVendors: 3,
      icon: <Users className="w-6 h-6" />,
      features: [
        { name: 'Up to 3 vendors', included: true },
        { name: 'Basic dashboard', included: true },
        { name: 'Customer application forms', included: true },
        { name: 'Email support', included: true },
        { name: 'Standard document storage', included: true },
        { name: 'Advanced analytics', included: false },
        { name: 'White-label branding', included: false },
        { name: 'API access', included: false },
        { name: 'Priority support', included: false }
      ]
    },
    {
      id: 'pro',
      name: 'VendorHub Pro',
      description: 'Ideal for growing businesses',
      monthlyPrice: 197,
      annualPrice: 197 * 12 * 0.83, // 17% savings
      maxVendors: 7,
      popular: true,
      icon: <Zap className="w-6 h-6" />,
      features: [
        { name: 'Up to 7 vendors', included: true },
        { name: 'Advanced dashboard', included: true },
        { name: 'Customer application forms', included: true },
        { name: 'Email support', included: true },
        { name: 'Unlimited document storage', included: true },
        { name: 'Advanced analytics', included: true },
        { name: 'White-label branding', included: true },
        { name: 'PreQual tool', included: true },
        { name: 'API access', included: false },
        { name: 'Priority support', included: false }
      ]
    },
    {
      id: 'premium',
      name: 'VendorHub Premium',
      description: 'For enterprise-scale operations',
      monthlyPrice: 497,
      annualPrice: 497 * 12 * 0.83, // 17% savings
      maxVendors: null,
      icon: <Star className="w-6 h-6" />,
      features: [
        { name: 'Unlimited vendors', included: true },
        { name: 'Enterprise dashboard', included: true },
        { name: 'Customer application forms', included: true },
        { name: 'Priority support', included: true },
        { name: 'Unlimited document storage', included: true },
        { name: 'Advanced analytics', included: true },
        { name: 'White-label branding', included: true },
        { name: 'PreQual tool', included: true },
        { name: 'Full API access', included: true },
        { name: 'Dedicated account manager', included: true }
      ]
    }
  ];

  // Configure plans based on trial status
  const plans: SubscriptionPlan[] = basePlans.map(plan => {
    if (isCurrentlyOnTrial) {
      // For trial users - direct upgrade without trial
      return {
        ...plan,
        monthlyPriceId: getPriceId(plan.id, 'monthly', false), // No trial
        annualPriceId: getPriceId(plan.id, 'annual', false),
        trialText: 'Upgrade now',
        upgradeText: plan.id === 'basic' ? 'Continue with Basic plan' : 
                    plan.id === 'pro' ? 'Upgrade to Pro plan' : 'Upgrade to Premium plan'
      };
    } else {
      // For new users - with trial
      return {
        ...plan,
        monthlyPriceId: getPriceId(plan.id, 'monthly', true), // With trial
        annualPriceId: getPriceId(plan.id, 'annual', true),
        trialText: '3-day free trial'
      };
    }
  });

  // Helper function to get price IDs
  function getPriceId(planId: string, billing: 'monthly' | 'annual', withTrial: boolean) {
    // For now, using existing price IDs - in production you'd have separate trial/no-trial price IDs
    const priceIds = {
      basic: {
        monthly: withTrial ? 'price_1RpnAlB1YJBVEg8wCN2IXtYJ' : 'price_1RpnAlB1YJBVEg8wCN2IXtYJ',
        annual: withTrial ? 'price_1RpnBKB1YJBVEg8wbbe6nbYG' : 'price_1RpnBKB1YJBVEg8wbbe6nbYG'
      },
      pro: {
        monthly: withTrial ? 'price_1RpnBjB1YJBVEg8wXBbCplTi' : 'price_1RpnBjB1YJBVEg8wXBbCplTi',
        annual: withTrial ? 'price_1RpnC1B1YJBVEg8wGElD9KAG' : 'price_1RpnC1B1YJBVEg8wGElD9KAG'
      },
      premium: {
        monthly: withTrial ? 'price_1RpnCLB1YJBVEg8wI01MZIi1' : 'price_1RpnCLB1YJBVEg8wI01MZIi1',
        annual: withTrial ? 'price_1RpnCYB1YJBVEg8wWiT9eQNc' : 'price_1RpnCYB1YJBVEg8wWiT9eQNc'
      }
    };
    
    return priceIds[planId as keyof typeof priceIds]?.[billing] || '';
  }

  const handleSubscribe = useCallback(async (plan: SubscriptionPlan) => {
    console.log('🎯 handleSubscribe called with plan:', { id: plan.id, name: plan.name });
    console.log('🎯 isAnnual state:', isAnnual);
    
    if (!session) {
      toast({
        title: "Authentication Required",
        description: "Please log in to subscribe to a plan",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    setLoadingPlan(plan.id);
    try {
      const priceId = isAnnual ? plan.annualPriceId : plan.monthlyPriceId;
      console.log('💳 Using priceId:', priceId, 'for plan:', plan.id);
      
      // Check if we should use direct mode
      const urlParams = new URLSearchParams(window.location.search);
      const useDirect = urlParams.get('direct') === 'true';
      
      console.log('Checkout attempt:', {
        plan: plan.id,
        priceId,
        isAnnual,
        useDirect,
        hasSession: !!session,
        sessionValid: !!(session?.access_token),
        tokenPrefix: session?.access_token ? session.access_token.substring(0, 20) + '...' : 'none'
      });
      
      const { data, error } = await invokeFunction('create-checkout', {
        body: {
          priceId,
          tier: plan.id, // Use plan.id which is already lowercase ('basic', 'pro', 'premium')
          isAnnual: isAnnual,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      // Redirect to Stripe checkout in the same window (better UX)
      window.location.href = data.url;
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast({
        title: "Error",
        description: "Failed to start checkout process. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingPlan(null);
    }
  }, [session, navigate, isAnnual]);

  // Use ref to avoid stale closure issues with handleSubscribe
  const handleSubscribeRef = useRef(handleSubscribe);
  handleSubscribeRef.current = handleSubscribe;
  
  // Check for auto-checkout from URL parameters - only run once per URL change
  const processedAutoCheckoutRef = useRef<string | null>(null);
  
  useEffect(() => {
    const autoCheckout = searchParams.get('auto');
    const planParam = searchParams.get('plan');
    const currentParams = `${autoCheckout}-${planParam}`;
    
    // Prevent processing the same auto-checkout twice
    if (currentParams === processedAutoCheckoutRef.current) {
      return;
    }
    
    if (autoCheckout === 'true' && planParam && session) {
      processedAutoCheckoutRef.current = currentParams;
      
      try {
        const planData = JSON.parse(decodeURIComponent(planParam));
        console.log('🚀 Auto-proceeding to checkout with plan from URL:', planData);
        console.log('🔍 Available plans:', plans.map(p => ({ id: p.id, name: p.name })));
        
        // Find the matching plan
        const plan = plans.find(p => p.id === planData.tierId);
        console.log('🎯 Found matching plan:', plan ? { id: plan.id, name: plan.name } : 'NOT FOUND');
        
        if (plan) {
          setIsAnnual(planData.isAnnual);
          console.log('💡 Setting isAnnual to:', planData.isAnnual);
          console.log('🚀 About to call handleSubscribe with plan:', plan.id);
          
          // Clear URL parameters to prevent re-triggering
          navigate('/subscription', { replace: true });
          
          // Use ref to avoid stale closure
          handleSubscribeRef.current(plan);
        } else {
          console.error('❌ Could not find plan with tierId:', planData.tierId);
        }
      } catch (error) {
        console.error('Error parsing plan from URL:', error);
      }
    } else {
      // Reset if not auto-checkout
      processedAutoCheckoutRef.current = null;
    }
  }, [searchParams, session, navigate]); // Removed plans and handleSubscribe from dependencies

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Choose Your VendorHub Plan
        </h2>
        <p className="text-lg text-gray-600 mb-8">
          Scale your vendor network with plans designed for every business size
        </p>
        
        <BillingToggle isAnnual={isAnnual} onToggle={setIsAnnual} />
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isAnnual={isAnnual}
            isLoading={loadingPlan === plan.id}
            onSubscribe={handleSubscribe}
            isCurrentlyOnTrial={isCurrentlyOnTrial}
          />
        ))}
      </div>

      <AdditionalFeatures />
    </div>
  );
};

export default SubscriptionPlans;
