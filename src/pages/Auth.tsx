
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import LoginForm from '@/components/auth/LoginForm';
import PasswordResetForm from '@/components/auth/PasswordResetForm';
import { secureSessionManager } from '@/utils/secureSessionManager';
import { invokeFunction } from '@/utils/netlifyFunctions';
import { supabase } from '@/integrations/supabase/client';
import { secureLogger } from '@/utils/secureLogger';

const Auth = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  useEffect(() => {
    // Check URL parameters for password recovery - only run when searchParams change
    const type = searchParams.get('type');
    const isRecovery = type === 'recovery';
    
    console.log('🔑 URL check - recovery type:', type, 'isRecovery:', isRecovery);
    
    setIsPasswordRecovery(isRecovery);
    setShowPasswordReset(isRecovery);
  }, [searchParams]);

  useEffect(() => {
    // Handle auth errors from URL
    const error = searchParams.get('error');
    const error_description = searchParams.get('error_description');

    if (error) {
      secureLogger.error(`Auth error from URL: ${error}`, {
        component: 'Auth',
        action: 'url_error_handling',
        errorDescription: error_description
      });
      
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

    // Handle password reset and magic link authentication
    const type = searchParams.get('type');
    if (type && !error) {
      secureLogger.info('Auth success callback detected', {
        component: 'Auth',
        action: 'auth_success',
        type
      });
      
      if (type === 'recovery') {
        // Show password reset form instead of redirecting
        setShowPasswordReset(true);
        // Clean up the URL but keep the component state
        navigate('/auth', { replace: true });
        return;
      } else if (type === 'magiclink') {
        // Clean up the URL
        navigate('/auth', { replace: true });
        toast({
          title: "Magic Link Success",
          description: "You have been successfully logged in!",
        });
      }
    }
  }, [searchParams, navigate]);

  useEffect(() => {
    // Don't redirect authenticated users if they need to reset their password
    if (!isLoading && user && !isPasswordRecovery) {
      secureLogger.info('User authenticated, checking redirect from Auth page', {
        component: 'Auth',
        action: 'authenticated_redirect',
        userId: user.id
      });
      
      // Check if user came from landing page with plan selection
      const checkSelectedPlan = async () => {
        const selectedPlan = await secureSessionManager.getSecureItem('selectedPlan');
        secureLogger.info('Checking for selected plan', { 
          component: 'Auth',
          action: 'plan_check',
          hasSelectedPlan: !!selectedPlan
        });
        
        if (selectedPlan) {
          secureLogger.info('User has selected plan, proceeding to Stripe checkout', {
            component: 'Auth',
            action: 'stripe_checkout_redirect',
            planId: selectedPlan.tierId
          });
          
          try {
            const planData = selectedPlan;
          
          // Clear the stored plan
          await secureSessionManager.removeSecureItem('selectedPlan');
          
          // Get session and go directly to Stripe
          const { data: { session } } = await supabase.auth.getSession();
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
              
              try {
                const { data, error } = await invokeFunction('create-checkout', {
                  body: {
                    priceId,
                    tier: planData.tierId,
                    isAnnual: planData.isAnnual,
                  },
                  headers: {
                    Authorization: `Bearer ${session.access_token}`,
                  },
                });
                
                if (error) {
                  secureLogger.error('Checkout error', {
                    component: 'Auth',
                    action: 'checkout_error'
                  });
                  navigate('/subscription', { replace: true });
                } else {
                  secureLogger.info('Redirecting to Stripe checkout', {
                    component: 'Auth',
                    action: 'stripe_redirect_success'
                  });
                  window.location.href = data.url;
                }
              } catch (error) {
                secureLogger.error('Checkout error', {
                  component: 'Auth',
                  action: 'checkout_exception'
                });
                navigate('/subscription', { replace: true });
              }
            } else {
              secureLogger.error('Invalid plan ID', {
                component: 'Auth',
                action: 'invalid_plan_id'
              });
              navigate('/subscription', { replace: true });
            }
          } else {
            secureLogger.error('No session available for checkout', {
              component: 'Auth',
              action: 'no_session'
            });
            navigate('/subscription', { replace: true });
          }
        } catch (error) {
          secureLogger.error('Error processing selected plan', {
            component: 'Auth',
            action: 'plan_processing_error'
          });
          navigate('/subscription', { replace: true });
        }
        
          return; // Exit early
        }
        
        // Check if this is a new user (just confirmed email) without plan selection
        const type = searchParams.get('type');
        const isNewUser = type === 'signup' || type === 'magiclink' || type === 'email';
        const intent = searchParams.get('intent');
        
        if (isNewUser || intent === 'subscription' || !user.user_metadata?.has_completed_setup) {
          secureLogger.info('New user without plan selection, redirecting to subscription setup', {
            component: 'Auth',
            action: 'new_user_redirect',
            intent
          });
          navigate('/subscription', { replace: true });
        } else {
          secureLogger.info('Existing user, redirecting to dashboard', {
            component: 'Auth',
            action: 'existing_user_redirect'
          });
          navigate('/dashboard', { replace: true });
        }
      };
      
      checkSelectedPlan();
    }
  }, [user, isLoading, navigate, searchParams, isPasswordRecovery]);

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

  // Show password reset form when recovery token is present
  if (showPasswordReset) {
    return <PasswordResetForm />;
  }

  return <LoginForm />;
};

export default Auth;
