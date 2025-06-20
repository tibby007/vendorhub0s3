
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Star } from 'lucide-react';
import { SubscriptionPlan } from '@/types/subscription';

interface PlanCardProps {
  plan: SubscriptionPlan;
  isAnnual: boolean;
  isLoading: boolean;
  onSubscribe: (plan: SubscriptionPlan) => void;
}

const PlanCard = ({ plan, isAnnual, isLoading, onSubscribe }: PlanCardProps) => {
  const getPrice = () => {
    return isAnnual ? Math.round(plan.annualPrice / 12) : plan.monthlyPrice;
  };

  const getSavings = () => {
    if (!isAnnual) return 0;
    return Math.round(((plan.monthlyPrice * 12) - plan.annualPrice) / (plan.monthlyPrice * 12) * 100);
  };

  return (
    <Card className={`relative ${plan.popular ? 'ring-2 ring-vendor-green-500 shadow-lg scale-105' : ''}`}>
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
              ${getPrice()}
            </span>
            <span className="text-gray-600 ml-2">/month</span>
          </div>
          {isAnnual && getSavings() > 0 && (
            <p className="text-sm text-green-600 mt-1">
              Save {getSavings()}% annually
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
          onClick={() => onSubscribe(plan)}
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : 'Start Free Trial'}
        </Button>
        
        <p className="text-xs text-gray-500 text-center mt-2">
          3-day free trial • No credit card required
        </p>
      </CardContent>
    </Card>
  );
};

export default PlanCard;
