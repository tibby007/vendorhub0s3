
import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import LoginForm from '@/components/auth/LoginForm';

const Auth = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Handle auth errors from URL
    const error = searchParams.get('error');
    const error_description = searchParams.get('error_description');
    const type = searchParams.get('type');

    if (error) {
      console.error('Auth error from URL:', error, error_description);
      toast({
        title: "Authentication Error",
        description: error_description || error,
        variant: "destructive",
      });
      // Clean up URL
      navigate('/auth', { replace: true });
      return;
    }

    // Handle successful magic link authentication
    // Check if we have auth tokens in URL (indicates magic link was clicked)
    const access_token = searchParams.get('access_token');
    const refresh_token = searchParams.get('refresh_token');

    if (access_token || refresh_token || type) {
      console.log('Magic link tokens detected, cleaning up URL');
      // Clean up the URL immediately - Supabase has already processed the tokens
      navigate('/auth', { replace: true });
      
      // Show success message based on type
      if (type === 'recovery') {
        toast({
          title: "Password Reset",
          description: "You can now set a new password.",
        });
      } else if (type === 'signup') {
        toast({
          title: "Email Confirmed",
          description: "Your account has been confirmed. Welcome!",
        });
      } else {
        toast({
          title: "Login Successful",
          description: "Welcome back!",
        });
      }
    }
  }, [searchParams, navigate]);

  useEffect(() => {
    // If user is authenticated, redirect to dashboard
    if (!isLoading && user) {
      console.log('User is authenticated, redirecting to dashboard');
      navigate('/dashboard', { replace: true });
      return;
    }
  }, [user, isLoading, navigate]);

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
