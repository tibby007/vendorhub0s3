
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useDemoMode } from '@/hooks/useDemoMode';

const RootRedirect = () => {
  const { user, isLoading } = useAuth();
  const { isDemo, demoRole } = useDemoMode();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Check for auth tokens or auth-related parameters
    const access_token = searchParams.get('access_token');
    const refresh_token = searchParams.get('refresh_token');
    const type = searchParams.get('type');
    const error = searchParams.get('error');
    const token_hash = searchParams.get('token_hash');

    // If we have any auth-related parameters, redirect to /auth immediately
    if (access_token || refresh_token || type || error || token_hash) {
      console.log('🔐 Auth parameters detected at root, redirecting to /auth');
      navigate(`/auth?${searchParams.toString()}`, { replace: true });
      return;
    }

    // Wait for auth to finish loading before making redirect decisions
    if (!isLoading) {
      // Check for demo mode
      if (isDemo && demoRole) {
        console.log('🎭 Demo mode active at root, redirecting to dashboard. Demo role:', demoRole);
        navigate('/dashboard', { replace: true });
        return;
      }
      
      if (user) {
        console.log('🏠 User authenticated at root, redirecting to dashboard:', user.email);
        // Immediate redirect to dashboard for authenticated users
        const queryString = searchParams.toString();
        const dashboardUrl = queryString ? `/dashboard?${queryString}` : '/dashboard';
        navigate(dashboardUrl, { replace: true });
      } else {
        console.log('🏠 No user at root, redirecting to landing');
        navigate('/landing', { replace: true });
      }
    }
  }, [user, isLoading, navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-vendor-green-50 via-white to-vendor-gold-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-vendor-green-500 mx-auto mb-4"></div>
        <p className="text-gray-600">
          {isLoading ? 'Loading...' : 'Redirecting...'}
        </p>
      </div>
    </div>
  );
};

export default RootRedirect;
