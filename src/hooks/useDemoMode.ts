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
    const updateConfig = () => {
      const demoMode = sessionStorage.getItem('demo_mode');
      const demoRole = sessionStorage.getItem('demo_role') as 'Partner Admin' | 'Vendor' | null;
      
      setConfig({
        isDemo: demoMode === 'true',
        demoRole: demoRole
      });
    };

    // Initial check
    updateConfig();

    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'demo_mode' || e.key === 'demo_role') {
        updateConfig();
      }
    };

    // Listen for manual sessionStorage changes (custom event)
    const handleDemoModeChange = () => {
      updateConfig();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('demo-mode-changed', handleDemoModeChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('demo-mode-changed', handleDemoModeChange);
    };
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
  
  // Trigger custom event to notify components
  window.dispatchEvent(new Event('demo-mode-changed'));
};

export const exitDemoMode = () => {
  sessionStorage.removeItem('demo_mode');
  sessionStorage.removeItem('demo_role');
  
  // Trigger custom event to notify components
  window.dispatchEvent(new Event('demo-mode-changed'));
};