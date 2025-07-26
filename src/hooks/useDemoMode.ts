import { useState, useEffect } from 'react';

export interface DemoModeConfig {
  isDemo: boolean;
  demoRole: 'Partner Admin' | 'Vendor' | null;
}

export const useDemoMode = (): DemoModeConfig => {
  const [config, setConfig] = useState<DemoModeConfig>({
    isDemo: false,
    demoRole: null
  });

  useEffect(() => {
    const demoMode = sessionStorage.getItem('demo_mode');
    const demoRole = sessionStorage.getItem('demo_role') as 'Partner Admin' | 'Vendor' | null;
    
    setConfig({
      isDemo: demoMode === 'true',
      demoRole: demoRole
    });
  }, []);

  return config;
};

export const startDemoMode = (role: 'Partner Admin' | 'Vendor') => {
  sessionStorage.setItem('demo_mode', 'true');
  sessionStorage.setItem('demo_role', role);
  // Clear any existing auth data
  sessionStorage.removeItem('demoCredentials');
  sessionStorage.removeItem('isDemoMode');
  sessionStorage.removeItem('demoSessionActive');
  localStorage.removeItem('last_demo_time');
};

export const exitDemoMode = () => {
  sessionStorage.removeItem('demo_mode');
  sessionStorage.removeItem('demo_role');
};