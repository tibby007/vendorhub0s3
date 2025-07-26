import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, CreditCard, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const SetupComplete = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const planType = searchParams.get('plan');
  const isAnnual = searchParams.get('annual') === 'true';

  useEffect(() => {
    if (!planType) {
      navigate('/pricing');
      return;
    }

    toast({
      title: "Setup Fee Paid Successfully!",
      description: "Your one-time setup fee has been processed. Complete your subscription to get started.",
    });
  }, [planType, navigate, toast]);

  const proceedToSubscription = async () => {
    setIsRedirecting(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Authentication Required",
          description: "Please log in to complete your subscription",
          variant: "destructive",
        });
        navigate('/auth');
        return;
      }

      // Create subscription checkout (not setup fee)
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          tier: planType,
          isSetupFee: false, // This is the subscription checkout
          isAnnual: isAnnual
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error creating subscription checkout:', error);
      toast({
        title: "Error",
        description: "Failed to start subscription checkout. Please try again.",
        variant: "destructive",
      });
      setIsRedirecting(false);
    }
  };

  const planDetails = {
    basic: { name: 'Basic', monthlyPrice: 97, annualPrice: 970 },
    pro: { name: 'Pro', monthlyPrice: 197, annualPrice: 1970 },
    premium: { name: 'Premium', monthlyPrice: 397, annualPrice: 3970 }
  };

  const plan = planDetails[planType as keyof typeof planDetails];

  if (!plan) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-vendor-green-50 via-white to-vendor-gold-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-red-600">Invalid plan selection</p>
              <Button onClick={() => navigate('/pricing')} className="mt-4">
                Return to Pricing
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-vendor-green-50 via-white to-vendor-gold-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-gray-900">
            Setup Fee Complete!
          </CardTitle>
          <CardDescription className="text-lg">
            Your one-time setup and onboarding fee has been successfully processed.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Next Step: Complete Your Subscription</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Selected Plan:</span>
                <span className="font-semibold text-gray-900">{plan.name}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Billing Cycle:</span>
                <span className="font-semibold text-gray-900">
                  {isAnnual ? 'Annual' : 'Monthly'}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Subscription Price:</span>
                <span className="font-semibold text-gray-900">
                  ${isAnnual ? plan.annualPrice : plan.monthlyPrice}
                  {isAnnual ? '/year' : '/month'}
                </span>
              </div>

              {isAnnual && (
                <div className="flex justify-between items-center text-green-600">
                  <span>Annual Savings:</span>
                  <span className="font-semibold">
                    Save ${(plan.monthlyPrice * 12) - plan.annualPrice}/year
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">What happens next:</h4>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                Complete your subscription setup with a 3-day free trial
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                Get immediate access to your VendorHub dashboard
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                Receive personalized onboarding and setup assistance
              </li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button 
              onClick={proceedToSubscription}
              disabled={isRedirecting}
              className="flex-1 bg-vendor-green-600 hover:bg-vendor-green-700"
            >
              {isRedirecting ? (
                "Redirecting..."
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Complete Subscription
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => navigate('/pricing')}
              disabled={isRedirecting}
            >
              Back to Pricing
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SetupComplete;