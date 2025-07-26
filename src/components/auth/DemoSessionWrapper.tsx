
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DemoSessionManager from '@/components/demo/DemoSessionManager';
import { DemoAnalytics, DEMO_EVENTS } from '@/utils/demoAnalytics';
import { supabase } from '@/integrations/supabase/client';

interface DemoSessionWrapperProps {
  children: React.ReactNode;
}

const DemoSessionWrapper: React.FC<DemoSessionWrapperProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isDemoSession, setIsDemoSession] = useState(false);

  useEffect(() => {
    const demoSession = DemoAnalytics.isActiveSession();
    setIsDemoSession(demoSession);

    if (demoSession) {
      // Track page views during demo session
      const page = location.pathname.replace('/', '') || 'home';
      DemoAnalytics.trackEvent(DEMO_EVENTS.PAGE_VIEW, { 
        page,
        timestamp: new Date().toISOString()
      });
      
      console.log('Demo session active - tracking page view:', page);
    }
  }, [location]);

  const handleSessionExpired = () => {
    console.log('Demo session expired');
    DemoAnalytics.trackEvent(DEMO_EVENTS.SESSION_EXPIRED);
    DemoAnalytics.endSession();
    
    // Clear all demo-related storage
    sessionStorage.removeItem('demo_credentials');
    sessionStorage.removeItem('isDemoMode');
    sessionStorage.removeItem('demo_session');
    
    // Force logout if authenticated as demo user
    supabase.auth.signOut();
    
    setIsDemoSession(false);
    navigate('/demo');
  };

  const handleUpgradePrompt = () => {
    DemoAnalytics.trackEvent(DEMO_EVENTS.UPGRADE_PROMPTED);
  };

  const handleUpgradeClick = () => {
    DemoAnalytics.trackEvent(DEMO_EVENTS.UPGRADE_CLICKED);
  };

  return (
    <>
      {isDemoSession && (
        <DemoSessionManager 
          sessionDuration={10}
          onSessionExpired={handleSessionExpired}
          onUpgradePrompted={handleUpgradePrompt}
          onUpgradeClicked={handleUpgradeClick}
        />
      )}
      {children}
    </>
  );
};

export default DemoSessionWrapper;
