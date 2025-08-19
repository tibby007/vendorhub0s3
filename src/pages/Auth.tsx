
import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import LoginForm from '@/components/auth/LoginForm';
import { secureSessionManager } from '@/utils/secureSessionManager';

const Auth = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Handle auth errors from URL
    const error = searchParams.get('error');
    const error_description = searchParams.get('error_description');

    if (error) {
      console.error('🚨 Auth error from URL:', error, error_description);
      
      let errorMessage = error_description || error;
      if (error.includes('token_expired')) {
        errorMessage = 'The authentication link has expired. Please request a new one.';
      } else if (error.includes('invalid_request')) {
        errorMessage = 'Invalid authentication request. Please try again.';
      }
      
      toast({
        title: "Authentication Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Clean up URL
      navigate('/auth', { replace: true });
      return;
    }

    // Show success message for magic link/password reset (Supabase handles the actual auth)
    const type = searchParams.get('type');
    if (type && !error) {
      console.log('✅ Auth success callback detected, type:', type);
      
      // Clean up the URL
      navigate('/auth', { replace: true });
      
      // Show success message
      if (type === 'recovery') {
        toast({
          title: "Password Reset Successful",
          description: "You are now logged in. You can update your password in settings.",
        });
      } else if (type === 'magiclink') {
        toast({
          title: "Magic Link Success",
          description: "You have been successfully logged in!",
        });
      }
    }
  }, [searchParams, navigate]);

  useEffect(() => {
    // Redirect authenticated users
    if (!isLoading && user) {
      console.log('🏠 User authenticated, checking redirect from Auth page');
      
      // Check if user came from landing page with plan selection
      const checkSelectedPlan = async () => {
        const selectedPlan = await secureSessionManager.getSecureItem('selectedPlan');
        console.log('🔍 [Auth.tsx] Checking for selected plan:', { 
          hasSelectedPlan: !!selectedPlan
        });
        
        if (selectedPlan) {
          console.log('🎯 User has selected plan, proceeding DIRECTLY to Stripe checkout');
          
          try {
            const planData = selectedPlan;
          console.log('📋 Plan details:', planData);
          
          // Clear the stored plan
          await secureSessionManager.removeSecureItem('selectedPlan');
          
          // Import necessary modules and go directly to Stripe
          import('@/utils/netlifyFunctions').then(({ invokeFunction }) => {
            import('@/integrations/supabase/client').then(({ supabase }) => {
              supabase.auth.getSession().then(({ data: { session } }) => {
                if (session) {
                  // Map plan data to price IDs
                  const priceMap = {
                    'basic': {
                      monthly: 'price_1RpnAlB1YJBVEg8wCN2IXtYJ',
                      annual: 'price_1RpnBKB1YJBVEg8wbbe6nbYG'
                    },
                    'pro': {
                      monthly: 'price_1RpnBjB1YJBVEg8wXBbCplTi',
                      annual: 'price_1RpnC1B1YJBVEg8wGElD9KAG'
                    },
                    'premium': {
                      monthly: 'price_1RpnCLB1YJBVEg8wI01MZIi1',
                      annual: 'price_1RpnCYB1YJBVEg8wWiT9eQNc'
                    }
                  };
                  
                  const planPrices = priceMap[planData.tierId as keyof typeof priceMap];
                  if (planPrices) {
                    const priceId = planData.isAnnual ? planPrices.annual : planPrices.monthly;
                    
                    console.log('🚀 Going directly to Stripe checkout with:', { 
                      priceId, 
                      tier: planData.tierId, 
                      isAnnual: planData.isAnnual 
                    });
                    
                    invokeFunction('create-checkout', {
                      body: {
                        priceId,
                        tier: planData.tierId,
                        isAnnual: planData.isAnnual,
                      },
                      headers: {
                        Authorization: `Bearer ${session.access_token}`,
                      },
                    }).then(({ data, error }) => {
                      if (error) {
                        console.error('Checkout error:', error);
                        navigate('/subscription', { replace: true });
                      } else {
                        console.log('✅ Redirecting to Stripe checkout');
                        window.location.href = data.url;
                      }
                    }).catch((error) => {
                      console.error('Checkout error:', error);
                      navigate('/subscription', { replace: true });
                    });
                  } else {
                    console.error('Invalid plan ID:', planData.tierId);
                    navigate('/subscription', { replace: true });
                  }
                } else {
                  console.error('No session available');
                  navigate('/subscription', { replace: true });
                }
              });
            });
          });
        } catch (error) {
          console.error('Error processing selected plan:', error);
          navigate('/subscription', { replace: true });
        }
        
          return; // Exit early
        }
        
        // Check if this is a new user (just confirmed email) without plan selection
        const type = searchParams.get('type');
        const isNewUser = type === 'signup' || type === 'magiclink' || type === 'email';
        const intent = searchParams.get('intent');
        
        if (isNewUser || intent === 'subscription' || !user.user_metadata?.has_completed_setup) {
          console.log('🎯 New user without plan selection, redirecting to subscription setup');
          navigate('/subscription', { replace: true });
        } else {
          console.log('🏠 Existing user, redirecting to dashboard');
          navigate('/dashboard', { replace: true });
        }
      };
      
      checkSelectedPlan();
    }
  }, [user, isLoading, navigate, searchParams]);

  // Show loading while checking auth status
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-vendor-green-50 via-white to-vendor-gold-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-vendor-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication status...</p>
        </div>
      </div>
    );
  }

  // Show loading when processing Stripe checkout
  const [checkingPlan, setCheckingPlan] = React.useState(true);
  
  React.useEffect(() => {
    if (user && !isLoading) {
      secureSessionManager.getSecureItem('selectedPlan').then(plan => {
        setCheckingPlan(false);
      });
    } else {
      setCheckingPlan(false);
    }
  }, [user, isLoading]);
  
  if (checkingPlan && user && !isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-vendor-green-50 via-white to-vendor-gold-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-vendor-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to Stripe checkout...</p>
        </div>
      </div>
    );
  }

  // If user is logged in, show redirecting message (shouldn't happen with proper loading state)
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-vendor-green-50 via-white to-vendor-gold-50">
        <div className="text-center">
          <p className="text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return <LoginForm />;
};

export default Auth;
