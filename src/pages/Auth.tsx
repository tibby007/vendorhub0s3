
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import LoginForm from '@/components/auth/LoginForm';

const Auth = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isProcessingAuth, setIsProcessingAuth] = useState(false);

  useEffect(() => {
    const handleAuthCallback = async () => {
      // Check for auth tokens in URL (magic link, password reset, email confirmation)
      const access_token = searchParams.get('access_token');
      const refresh_token = searchParams.get('refresh_token');
      const type = searchParams.get('type');
      const error = searchParams.get('error');
      const error_description = searchParams.get('error_description');

      // Handle auth errors
      if (error) {
        console.error('Auth error from URL:', error, error_description);
        toast({
          title: "Authentication Error",
          description: error_description || error,
          variant: "destructive",
        });
        // Clean up URL and show login form
        navigate('/auth', { replace: true });
        return;
      }

      // Handle auth tokens
      if (access_token && refresh_token) {
        setIsProcessingAuth(true);
        console.log('Processing auth callback with type:', type);

        try {
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token,
            refresh_token
          });

          if (sessionError) {
            console.error('Session error:', sessionError);
            toast({
              title: "Authentication Failed",
              description: "Failed to establish session. Please try again.",
              variant: "destructive",
            });
            navigate('/auth', { replace: true });
            return;
          }

          if (data.session) {
            console.log('Auth callback successful, session established');
            
            // Handle different auth types
            if (type === 'recovery') {
              toast({
                title: "Password Reset",
                description: "You can now set a new password.",
              });
              navigate('/dashboard', { replace: true });
            } else if (type === 'signup') {
              toast({
                title: "Email Confirmed",
                description: "Your account has been confirmed. Welcome!",
              });
              navigate('/dashboard', { replace: true });
            } else {
              // Magic link login
              toast({
                title: "Login Successful",
                description: "Welcome back!",
              });
              navigate('/dashboard', { replace: true });
            }
          }
        } catch (error) {
          console.error('Error processing auth callback:', error);
          toast({
            title: "Authentication Error",
            description: "Something went wrong. Please try again.",
            variant: "destructive",
          });
          navigate('/auth', { replace: true });
        } finally {
          setIsProcessingAuth(false);
        }
      }
    };

    handleAuthCallback();
  }, [searchParams, navigate]);

  useEffect(() => {
    // If user is already logged in and no tokens are being processed, redirect to dashboard
    if (!isLoading && user && !isProcessingAuth && !searchParams.get('access_token')) {
      console.log('User already authenticated, redirecting to dashboard');
      navigate('/dashboard', { replace: true });
      return;
    }
  }, [user, isLoading, navigate, isProcessingAuth, searchParams]);

  // Show loading while checking auth status or processing auth callback
  if (isLoading || isProcessingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-vendor-green-50 via-white to-vendor-gold-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-vendor-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {isProcessingAuth ? 'Processing magic link authentication...' : 'Checking authentication status...'}
          </p>
        </div>
      </div>
    );
  }

  // If user is logged in, don't render the login form (redirect will happen)
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
