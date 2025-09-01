
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from '@/hooks/use-toast';
import LoginForm from '@/components/auth/LoginForm';
import PasswordResetForm from '@/components/auth/PasswordResetForm';
import { secureSessionManager } from '@/utils/secureSessionManager';
import { invokeFunction } from '@/utils/netlifyFunctions';
import { supabase } from '@/integrations/supabase/client';
import { secureLogger } from '@/utils/secureLogger';

// Function to create 3-day trial for new users
// Define a minimal user type compatible with AuthProvider's user shape
type BasicUser = {
  id: string;
  email?: string | null;
  name?: string | null;
  role?: string | null;
  user_metadata?: Record<string, unknown>;
};
const createTrialForNewUser = async (user: BasicUser) => {
  const trialEndDate = new Date();
  trialEndDate.setDate(trialEndDate.getDate() + 3); // 3 days from now
  
  try {
    // Create partner record with trial
    const { error: partnerError } = await supabase
      .from('partners')
      .insert({
        name: user.name || user.email?.split('@')[0] || 'New Partner',
        contact_email: user.email || undefined,
        plan_type: 'basic',
        billing_status: 'trialing',
        trial_end: trialEndDate.toISOString(),
        current_period_end: trialEndDate.toISOString(),
        vendor_limit: 1, // Basic plan limit
        storage_limit: 5368709120, // 5GB in bytes
        storage_used: 0
      });
    
    if (partnerError) {
      console.log('Partner creation failed, trying upsert:', partnerError);
      // Try upsert in case record exists
      await supabase
        .from('partners')
        .upsert({
          contact_email: user.email || undefined,
          name: user.name || user.email?.split('@')[0] || 'New Partner',
          plan_type: 'basic',
          billing_status: 'trialing',
          trial_end: trialEndDate.toISOString(),
          current_period_end: trialEndDate.toISOString(),
          vendor_limit: 1,
          storage_limit: 5368709120,
          storage_used: 0
        }, { onConflict: 'contact_email' });
    }
    
    // Create subscriber record with trial
    const { error: subscriberError } = await supabase
      .from('subscribers')
      .insert({
        email: user.email || undefined,
        user_id: user.id,
        subscribed: false,
        subscription_tier: 'Basic',
        subscription_end: trialEndDate.toISOString(),
        trial_active: true
      });
    
    if (subscriberError) {
      console.log('Subscriber creation failed, trying upsert:', subscriberError);
      // Try upsert in case record exists
      await supabase
        .from('subscribers')
        .upsert({
          email: user.email || undefined,
          user_id: user.id,
          subscribed: false,
          subscription_tier: 'Basic', 
          subscription_end: trialEndDate.toISOString(),
          trial_active: true
        }, { onConflict: 'email' });
    }
    
    // Create users table record to link auth.user to partner
     const { error: usersError } = await supabase
       .from('users')
       .insert({
         id: user.id,
         email: user.email,
         name: user.name || user.email?.split('@')[0] || 'New Partner',
         role: 'Partner Admin'
       });
     
     if (usersError) {
       console.log('Users creation failed, trying upsert:', usersError);
       // Try upsert in case record exists
       await supabase
         .from('users')
         .upsert({
           id: user.id,
           email: user.email,
           name: user.name || user.email?.split('@')[0] || 'New Partner',
           role: 'Partner Admin'
         }, { onConflict: 'id' });
     }
     
    secureLogger.info(`3-day trial created for new user (email: ${user.email ?? 'unknown'}, trial_end: ${trialEndDate.toISOString()})`, {
    component: 'Auth',
    action: 'trial_created',
    userId: user.id
    });
     
   } catch (error) {
     const message = error instanceof Error ? error.message : 'Unknown error creating trial records';
     secureLogger.error(message, {
       component: 'Auth',
       action: 'trial_creation_error'
     });
     throw error;
   }
 };

const Auth = () => {
  const { user, loading: isLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const [checkingPlan, setCheckingPlan] = React.useState(true);
  
  // Mirror refs to avoid adding state values to effect deps
  const showPasswordResetRef = useRef(showPasswordReset);
  const isPasswordRecoveryRef = useRef(isPasswordRecovery);

  useEffect(() => { showPasswordResetRef.current = showPasswordReset; }, [showPasswordReset]);
  useEffect(() => { isPasswordRecoveryRef.current = isPasswordRecovery; }, [isPasswordRecovery]);
  
  // Ref guards to prevent infinite loops
  const isProcessingRecovery = useRef(false);
  const lastRecoveryCheck = useRef<string | null>(null);
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Guard against infinite loops with ref-based checks
    const currentSearchParams = searchParams.toString();
    if (lastRecoveryCheck.current === currentSearchParams) {
      return; // Already processed these search params
    }
    lastRecoveryCheck.current = currentSearchParams;
    
    // Check URL parameters for password recovery - only run when searchParams change
    const type = searchParams.get('type');
    const isRecovery = type === 'recovery';
    
    console.log('🔑 URL check - recovery type:', type, 'isRecovery:', isRecovery);
    
    // Update state using functional form to avoid adding them to deps
    setIsPasswordRecovery(prev => (prev !== isRecovery ? isRecovery : prev));
    setShowPasswordReset(prev => (prev !== isRecovery ? isRecovery : prev));
  }, [searchParams]); // Only depends on searchParams

  // Handle PASSWORD_RECOVERY events from AuthContext
  useEffect(() => {
    if (isProcessingRecovery.current) return;
    
    // Listen for PASSWORD_RECOVERY auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && !isProcessingRecovery.current) {
        console.log('🔑 PASSWORD_RECOVERY event detected in Auth component');
        isProcessingRecovery.current = true;
        
        // Set password recovery state without causing loops
        if (!showPasswordResetRef.current) {
          setShowPasswordReset(true);
        }
        if (!isPasswordRecoveryRef.current) {
          setIsPasswordRecovery(true);
        }
        
        // Clear processing flag after a brief delay
        setTimeout(() => {
          isProcessingRecovery.current = false;
        }, 1000);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []); // Empty dependency array - only run once

  useEffect(() => {
    // Handle auth errors from URL
    const error = searchParams.get('error');
    const error_description = searchParams.get('error_description');

    if (error) {
      secureLogger.error(`Auth error from URL: ${error}${error_description ? ` (${error_description})` : ''}`, {
        component: 'Auth',
        action: 'url_error_handling'
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
      secureLogger.info(`Auth success callback detected (type: ${type})`, {
        component: 'Auth',
        action: 'auth_success'
      });

      if (type === 'recovery') {
        // Set processing flag to prevent loops during recovery
        isProcessingRecovery.current = true;
        
        // Show password reset form instead of redirecting
        setShowPasswordReset(true);
        setIsPasswordRecovery(true);
        
        // Clean up the URL but keep the component state
        navigate('/auth', { replace: true });
        
        // Clear processing flag after navigation
        setTimeout(() => {
          isProcessingRecovery.current = false;
        }, 1000);
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
    // Prevent multiple initializations during password recovery
    if (isProcessingRecovery.current) {
      console.log('🔄 Skipping navigation effect - recovery in progress');
      return;
    }
    
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
        secureLogger.info(`Checking for selected plan (has: ${!!selectedPlan})`, { 
          component: 'Auth',
          action: 'plan_check'
        });
        
        if (selectedPlan) {
          secureLogger.info('User has selected plan, proceeding to Stripe checkout', {
            component: 'Auth',
            action: 'stripe_checkout_redirect'
          });
          
          try {
            const planData: unknown = selectedPlan;
            
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
              } as const;
              
              const isObj = planData && typeof planData === 'object';
              const tierId = isObj && 'tierId' in (planData as Record<string, unknown>) ? (planData as Record<string, unknown>).tierId as string : undefined;
              const isAnnual = isObj && 'isAnnual' in (planData as Record<string, unknown>) ? Boolean((planData as Record<string, unknown>).isAnnual) : undefined;
              
              if (!tierId || typeof isAnnual !== 'boolean') {
                secureLogger.error('Invalid selected plan data', {
                  component: 'Auth',
                  action: 'invalid_selected_plan_data'
                });
                navigate('/subscription', { replace: true });
                return;
              }
              
              const planPrices = priceMap[tierId as keyof typeof priceMap];
              if (planPrices) {
                const priceId = isAnnual ? planPrices.annual : planPrices.monthly;
                
                try {
                  const { data, error } = await invokeFunction('create-checkout', {
                    body: {
                      priceId,
                      tier: tierId,
                      isAnnual,
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
         
         // OWNER BYPASS: support@emergestack.dev NEVER goes to subscription
         const isOwner = user.email === 'support@emergestack.dev';
         
         // CRITICAL: Only BROKERS need subscription setup - vendors are invited by brokers
         const userRole = user.user_metadata?.role || user.role;
         const isBrokerRole = userRole === 'Partner Admin' || userRole === 'Broker Admin';
         
         if (!isOwner && isBrokerRole && isNewUser) {
          secureLogger.info(`New user signup - creating 3-day trial and redirecting to dashboard (role: ${userRole}, email: ${user.email ?? 'unknown'})`, {
            component: 'Auth',
            action: 'new_user_trial_setup',
            userId: user.id
          });
           
           // Create 3-day trial for new user
           try {
             await createTrialForNewUser(user);
             navigate('/dashboard', { replace: true });
             return; // CRITICAL: Exit here so they don't fall through to subscription
           } catch (error) {
             const msg = error instanceof Error ? error.message : 'Unknown error creating trial for new user';
             secureLogger.error(`Failed to create trial for new user: ${msg}`, {
               component: 'Auth',
               action: 'trial_creation_failed'
             });
             // Fallback: still go to dashboard, trial will be handled later
             navigate('/dashboard', { replace: true });
             return; // CRITICAL: Exit here so they don't fall through to subscription
           }
         } else if (!isOwner && isBrokerRole && intent === 'subscription') {
          secureLogger.info(`Existing broker needs subscription setup (intent: ${intent}, role: ${userRole})`, {
            component: 'Auth',
            action: 'existing_broker_subscription',
            userId: user.id
          });
           navigate('/subscription', { replace: true });
         } else if (isOwner) {
          secureLogger.info('OWNER LOGIN - bypassing subscription, going to dashboard', {
            component: 'Auth',
            action: 'owner_bypass_redirect',
            userId: user.id
          });
           navigate('/dashboard', { replace: true });
         } else if (!isBrokerRole) {
          secureLogger.info(`Non-broker user (role: ${userRole}) going directly to dashboard`, {
            component: 'Auth',
            action: 'vendor_direct_redirect',
            userId: user.id
          });
           navigate('/dashboard', { replace: true });
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

  // Initialize checkingPlan based on selectedPlan presence
  React.useEffect(() => {
    if (user && !isLoading) {
      secureSessionManager.getSecureItem('selectedPlan').then(() => {
        setCheckingPlan(false);
      });
    } else {
      setCheckingPlan(false);
    }
  }, [user, isLoading]);
  
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
  
  // (moved useEffect above to comply with hooks rules)
  
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
