
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const RootRedirect = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Check for magic link authentication tokens in the URL
    const access_token = searchParams.get('access_token');
    const refresh_token = searchParams.get('refresh_token');
    const type = searchParams.get('type');
    const error = searchParams.get('error');

    // If we have auth tokens or errors, redirect to /auth to handle them
    if (access_token || refresh_token || type || error) {
      console.log('Magic link tokens detected at root, redirecting to /auth for processing');
      navigate(`/auth?${searchParams.toString()}`, { replace: true });
      return;
    }

    // Only proceed with normal redirect logic if no auth tokens are present
    if (!isLoading) {
      if (user) {
        console.log('User found at root, redirecting to dashboard');
        navigate('/dashboard', { replace: true });
      } else {
        console.log('No user at root, redirecting to landing');
        navigate('/landing', { replace: true });
      }
    }
  }, [user, isLoading, navigate, searchParams]);

  // Show loading while checking auth status
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-vendor-green-50 via-white to-vendor-gold-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-vendor-green-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Checking authentication...</p>
      </div>
    </div>
  );
};

export default RootRedirect;
