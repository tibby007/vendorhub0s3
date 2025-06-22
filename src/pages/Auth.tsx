
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

    // Check if this is a successful auth callback (magic link or password reset)
    const access_token = searchParams.get('access_token');
    const refresh_token = searchParams.get('refresh_token');

    if (access_token || refresh_token || type) {
      console.log('Auth callback detected, type:', type);
      
      // Clean up the URL immediately - Supabase has already processed the tokens
      navigate('/auth', { replace: true });
      
      // Show appropriate success message
      if (type === 'recovery') {
        toast({
          title: "Password Reset Successful",
          description: "You are now logged in. You can update your password in settings.",
        });
      } else if (type === 'signup') {
        toast({
          title: "Email Confirmed",
          description: "Your account has been confirmed. Welcome!",
        });
      } else if (type === 'magiclink' || access_token) {
        toast({
          title: "Magic Link Success",
          description: "You have been successfully logged in!",
        });
      }
    }
  }, [searchParams, navigate]);

  useEffect(() => {
    // Redirect authenticated users to dashboard
    if (!isLoading && user) {
      console.log('User authenticated, redirecting to dashboard');
      navigate('/dashboard', { replace: true });
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

  // If user is logged in, show redirecting message
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
