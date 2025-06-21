
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DemoSessionManager from '@/components/demo/DemoSessionManager';
import { DemoAnalytics, DEMO_EVENTS } from '@/utils/demoAnalytics';

interface DemoSessionWrapperProps {
  children: React.ReactNode;
}

const DemoSessionWrapper: React.FC<DemoSessionWrapperProps> = ({ children }) => {
  const navigate = useNavigate();
  const [isDemoSession, setIsDemoSession] = useState(false);

  useEffect(() => {
    const demoSession = DemoAnalytics.isActiveSession();
    setIsDemoSession(demoSession);

    if (demoSession) {
      DemoAnalytics.trackEvent(DEMO_EVENTS.PAGE_VIEW, { page: 'login' });
    }
  }, []);

  const handleSessionExpired = () => {
    DemoAnalytics.trackEvent(DEMO_EVENTS.SESSION_EXPIRED);
    DemoAnalytics.endSession();
    setIsDemoSession(false);
    navigate('/demo-credentials');
  };

  return (
    <>
      {isDemoSession && (
        <DemoSessionManager 
          sessionDuration={30}
          onSessionExpired={handleSessionExpired}
        />
      )}
      {children}
    </>
  );
};

export default DemoSessionWrapper;
