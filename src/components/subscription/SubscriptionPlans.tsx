
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Check, Star, Users, Zap, Headphones, Code, Calendar } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface PlanFeature {
  name: string;
  included: boolean;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  monthlyPriceId: string;
  annualPriceId: string;
  maxVendors: number | null;
  features: PlanFeature[];
  popular?: boolean;
  icon: React.ReactNode;
}

const SubscriptionPlans = () => {
  const { session } = useAuth();
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

  const getPrice = (plan: SubscriptionPlan) => {
    return isAnnual ? Math.round(plan.annualPrice / 12) : plan.monthlyPrice;
  };

  const getSavings = (plan: SubscriptionPlan) => {
    if (!isAnnual) return 0;
    return Math.round(((plan.monthlyPrice * 12) - plan.annualPrice) / (plan.monthlyPrice * 12) * 100);
  };

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (!session) {
      toast({
        title: "Authentication Required",
        description: "Please log in to subscribe to a plan",
        variant: "destructive",
      });
      return;
    }

    setLoadingPlan(plan.id);
    try {
      const priceId = isAnnual ? plan.annualPriceId : plan.monthlyPriceId;
      
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          priceId,
          tier: plan.name.replace('VendorHub ', ''),
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      // Open Stripe checkout in a new tab
      window.open(data.url, '_blank');
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast({
        title: "Error",
        description: "Failed to start checkout process",
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
        
        {/* Annual/Monthly Toggle */}
        <div className="flex items-center justify-center gap-4 p-4 bg-gray-50 rounded-lg inline-flex">
          <Label htmlFor="billing-toggle" className={!isAnnual ? 'font-medium' : 'text-gray-500'}>
            Monthly
          </Label>
          <Switch
            id="billing-toggle"
            checked={isAnnual}
            onCheckedChange={setIsAnnual}
          />
          <Label htmlFor="billing-toggle" className={isAnnual ? 'font-medium' : 'text-gray-500'}>
            Annual
          </Label>
          <Badge variant="secondary" className="bg-green-100 text-green-700">
            Save 17%
          </Badge>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {plans.map((plan) => (
          <Card 
            key={plan.id} 
            className={`relative ${plan.popular ? 'ring-2 ring-vendor-green-500 shadow-lg scale-105' : ''}`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-vendor-green-500 text-white px-4 py-1">
                  <Star className="w-3 h-3 mr-1" />
                  Most Popular
                </Badge>
              </div>
            )}
            
            <CardHeader className="text-center pb-4">
              <div className="w-12 h-12 bg-vendor-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <div className="text-vendor-green-600">
                  {plan.icon}
                </div>
              </div>
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <p className="text-gray-600 text-sm">{plan.description}</p>
              
              <div className="pt-4">
                <div className="flex items-baseline justify-center">
                  <span className="text-4xl font-bold text-gray-900">
                    ${getPrice(plan)}
                  </span>
                  <span className="text-gray-600 ml-2">/month</span>
                </div>
                {isAnnual && getSavings(plan) > 0 && (
                  <p className="text-sm text-green-600 mt-1">
                    Save {getSavings(plan)}% annually
                  </p>
                )}
                <div className="mt-2">
                  <span className="text-sm text-gray-500">
                    {plan.maxVendors ? `Up to ${plan.maxVendors} vendors` : 'Unlimited vendors'}
                  </span>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check 
                      className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                        feature.included ? 'text-green-500' : 'text-gray-300'
                      }`} 
                    />
                    <span className={feature.included ? 'text-gray-700' : 'text-gray-400'}>
                      {feature.name}
                    </span>
                  </li>
                ))}
              </ul>
              
              <Button 
                className={`w-full ${plan.popular ? 'bg-vendor-green-600 hover:bg-vendor-green-700' : ''}`}
                variant={plan.popular ? 'default' : 'outline'}
                onClick={() => handleSubscribe(plan)}
                disabled={loadingPlan === plan.id}
              >
                {loadingPlan === plan.id ? 'Processing...' : 'Start Free Trial'}
              </Button>
              
              <p className="text-xs text-gray-500 text-center mt-2">
                3-day free trial • No credit card required
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Additional Features */}
      <div className="bg-gray-50 rounded-lg p-8 mt-12">
        <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">
          All Plans Include
        </h3>
        <div className="grid md:grid-cols-4 gap-6">
          <div className="text-center">
            <Calendar className="w-8 h-8 text-vendor-green-600 mx-auto mb-3" />
            <h4 className="font-medium text-gray-900">3-Day Free Trial</h4>
            <p className="text-sm text-gray-600">No commitment, cancel anytime</p>
          </div>
          <div className="text-center">
            <Headphones className="w-8 h-8 text-vendor-green-600 mx-auto mb-3" />
            <h4 className="font-medium text-gray-900">Expert Support</h4>
            <p className="text-sm text-gray-600">Get help when you need it</p>
          </div>
          <div className="text-center">
            <Code className="w-8 h-8 text-vendor-green-600 mx-auto mb-3" />
            <h4 className="font-medium text-gray-900">Regular Updates</h4>
            <p className="text-sm text-gray-600">New features monthly</p>
          </div>
          <div className="text-center">
            <Users className="w-8 h-8 text-vendor-green-600 mx-auto mb-3" />
            <h4 className="font-medium text-gray-900">User Training</h4>
            <p className="text-sm text-gray-600">Onboarding and tutorials</p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="text-center bg-vendor-green-600 rounded-lg p-8 text-white">
        <h3 className="text-2xl font-bold mb-4">
          Ready to Scale Your Vendor Network?
        </h3>
        <p className="text-vendor-green-100 mb-6 max-w-2xl mx-auto">
          Join hundreds of Partner Admins who trust VendorHub to manage their vendor relationships and grow their business.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" variant="secondary" className="bg-white text-vendor-green-600 hover:bg-gray-100">
            Start Free Trial
          </Button>
          <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-vendor-green-600">
            Book a Demo
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPlans;
