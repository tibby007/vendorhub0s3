
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import LoginForm from '@/components/auth/LoginForm';

const Auth = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If user is already logged in, redirect to dashboard
    if (!isLoading && user) {
      console.log('User is authenticated, redirecting to dashboard');
      navigate('/dashboard');
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
