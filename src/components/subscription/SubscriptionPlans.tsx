
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { invokeFunction } from '@/utils/netlifyFunctions';
import { Users, Zap, Star } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { SubscriptionPlan } from '@/types/subscription';
import BillingToggle from './BillingToggle';
import PlanCard from './PlanCard';
import AdditionalFeatures from './AdditionalFeatures';

const SubscriptionPlans = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [isAnnual, setIsAnnual] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const plans: SubscriptionPlan[] = [
    {
      id: 'basic',
      name: 'VendorHub Basic',
      description: 'Perfect for small teams getting started',
      monthlyPrice: 97,
      annualPrice: 97 * 12 * 0.83, // 17% savings
      monthlyPriceId: 'price_1Rc1dbB1YJBVEg8wlVQbLAIR',
      annualPriceId: 'price_1Rc1e7B1YJBVEg8wjKH1HiZ0',
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
      monthlyPriceId: 'price_1Rc1eXB1YJBVEg8wXyhCVw7X',
      annualPriceId: 'price_1Rc1etB1YJBVEg8wbEgve1jj',
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
      monthlyPrice: 397,
      annualPrice: 397 * 12 * 0.83, // 17% savings
      monthlyPriceId: 'price_1Rc1fkB1YJBVEg8wqjcXMzEK',
      annualPriceId: 'price_1Rc1fkB1YJBVEg8wSBzyX6WQ',
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

  const handleSubscribe = async (plan: SubscriptionPlan) => {
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
      
      // Check if we should use direct mode
      const urlParams = new URLSearchParams(window.location.search);
      const useDirect = urlParams.get('direct') === 'true';
      
      console.log('Checkout attempt:', {
        plan: plan.id,
        priceId,
        isAnnual,
        useDirect,
        hasSession: !!session
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

      // Open Stripe checkout in a new tab
      window.open(data.url, '_blank');
      
      toast({
        title: "Redirecting to Checkout",
        description: "Opening Stripe checkout in a new tab...",
      });
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
  };

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
          />
        ))}
      </div>

      <AdditionalFeatures />
    </div>
  );
};

export default SubscriptionPlans;
