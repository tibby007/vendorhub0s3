
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Star, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BillingToggle from '@/components/subscription/BillingToggle';

const Pricing = () => {
  const navigate = useNavigate();
  const [isAnnual, setIsAnnual] = useState(false);

  const pricingTiers = [
    {
      name: "VendorHub Basic",
      monthlyPrice: 97,
      annualPrice: 970,
      setupFee: 297,
      description: "Perfect for small partner networks",
      features: [
        "Up to 3 vendors",
        "50 submissions/month",
        "Basic reporting",
        "Email support",
        "Standard document storage"
      ],
      popular: false,
      buttonText: "Start 3-Day Free Trial",
      monthlyPriceId: "price_1Rc1dbB1YJBVEg8wlVQbLAIR",
      annualPriceId: "price_basic_annual" // You'll need to create this
    },
    {
      name: "VendorHub Pro",
      monthlyPrice: 197,
      annualPrice: 1970,
      setupFee: 497,
      description: "Ideal for growing businesses",
      features: [
        "Up to 7 vendors",
        "500 submissions/month",
        "Advanced analytics",
        "Priority support",
        "Unlimited document storage",
        "White-label branding",
        "PreQual tool"
      ],
      popular: true,
      buttonText: "Start 3-Day Free Trial",
      monthlyPriceId: "price_1Rc1eXB1YJBVEg8wXyhCVw7X",
      annualPriceId: "price_pro_annual" // You'll need to create this
    },
    {
      name: "VendorHub Premium",
      monthlyPrice: 397,
      annualPrice: 3970,
      setupFee: 797,
      description: "For enterprise-scale operations",
      features: [
        "Unlimited vendors",
        "Unlimited submissions",
        "White-label solution",
        "Dedicated support",
        "Full API access",
        "Advanced security",
        "Training & onboarding"
      ],
      popular: false,
      buttonText: "Start 3-Day Free Trial",
      monthlyPriceId: "price_1Rc1fkB1YJBVEg8wqjcXMzEK",
      annualPriceId: "price_premium_annual" // You'll need to create this
    }
  ];

  const handleSubscribeClick = (tier: any) => {
    const priceId = isAnnual ? tier.annualPriceId : tier.monthlyPriceId;
    
    // Store the selected plan info for the checkout process
    sessionStorage.setItem('selectedPlan', JSON.stringify({
      priceId,
      tier: tier.name.replace('VendorHub ', ''),
      isAnnual,
      setupFee: tier.setupFee
    }));
    
    // Navigate to auth page with subscription intent
    navigate('/auth?subscribe=true');
  };

  return (
    <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-vendor-gold-25">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            Choose the plan that fits your business size and growth goals
          </p>
          
          {/* Billing Toggle */}
          <div className="mb-8">
            <BillingToggle 
              isAnnual={isAnnual} 
              onToggle={setIsAnnual}
            />
          </div>
          
          <div className="inline-flex items-center gap-2 bg-vendor-gold-100 text-vendor-gold-800 px-4 py-2 rounded-full text-sm font-medium border border-vendor-gold-200">
            <Calendar className="w-4 h-4" />
            All plans include a 3-day free trial
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 max-w-6xl mx-auto items-center lg:items-stretch">
          {pricingTiers.map((tier, index) => (
            <Card 
              key={index} 
              className={`relative flex-1 ${
                tier.popular 
                  ? 'ring-2 ring-vendor-gold-400 shadow-2xl scale-105 bg-white border-vendor-gold-200' 
                  : 'shadow-lg border-gray-200 hover:border-vendor-gold-200'
              } transition-all duration-300 hover:shadow-xl`}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-vendor-gold-500 to-vendor-gold-600 text-white px-6 py-2 shadow-lg">
                    <Star className="w-4 h-4 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center">
                <CardTitle className="text-xl">{tier.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">
                    ${isAnnual ? tier.annualPrice : tier.monthlyPrice}
                  </span>
                  <span className="text-gray-600">
                    {isAnnual ? '/year' : '/month'}
                  </span>
                  {isAnnual && (
                    <div className="text-sm text-vendor-green-600 font-medium mt-1">
                      Save 17%
                    </div>
                  )}
                </div>
                <div className="text-sm text-gray-500 mt-2">
                  + ${tier.setupFee} setup fee
                </div>
                <CardDescription className="mt-2">{tier.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col">
                <ul className="space-y-3 mb-6 flex-1">
                  {tier.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-vendor-green-500 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className={`w-full ${
                    tier.popular 
                      ? 'bg-gradient-to-r from-vendor-gold-500 to-vendor-gold-600 hover:from-vendor-gold-600 hover:to-vendor-gold-700 text-white shadow-lg' 
                      : 'border-vendor-green-500 text-vendor-green-600 hover:bg-vendor-green-50'
                  }`}
                  variant={tier.popular ? 'default' : 'outline'}
                  onClick={() => handleSubscribeClick(tier)}
                >
                  {tier.buttonText}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Setup Fee Notice */}
        <div className="text-center mt-12">
          <Card className="inline-block p-6 bg-gradient-to-r from-vendor-gold-50 to-vendor-gold-100 border-vendor-gold-200 shadow-lg">
            <div className="flex items-center gap-3">
              <Star className="w-6 h-6 text-vendor-gold-600" />
              <div>
                <p className="font-medium text-vendor-gold-900">All Plans Include Setup & Onboarding</p>
                <p className="text-sm text-vendor-gold-700">One-time setup fee covers full platform configuration and training</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
