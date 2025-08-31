import React from 'react';
import { AlertTriangle, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useSubscriptionManager } from '@/hooks/useSubscriptionManager';

interface ReadOnlyGuardProps {
  children: React.ReactNode;
  allowedInReadOnly?: boolean; // Some components can still be viewed in read-only
}

const ReadOnlyGuard: React.FC<ReadOnlyGuardProps> = ({ 
  children, 
  allowedInReadOnly = false 
}) => {
  const { subscription, isTrialUser, daysRemaining } = useSubscriptionManager();
  const navigate = useNavigate();

  // Check if trial is expired (not subscribed, no active trial, and end date passed)
  const isTrialExpired = !subscription.subscribed && 
                        !subscription.trial_active && 
                        subscription.endDate && 
                        new Date(subscription.endDate) <= new Date();

  const isReadOnlyMode = isTrialExpired && subscription.status === 'expired';

  // If not in read-only mode, show content normally
  if (!isReadOnlyMode || allowedInReadOnly) {
    return <>{children}</>;
  }

  // Show read-only overlay
  return (
    <div className="relative">
      {/* Render children but make them visually disabled */}
      <div className="opacity-50 pointer-events-none">
        {children}
      </div>
      
      {/* Read-only overlay */}
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-lg border-2 border-red-200">
        <div className="text-center p-6 max-w-md">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-red-100 p-3">
              <Lock className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            Trial Expired - Read Only Mode
          </h3>
          <p className="text-red-600 text-sm mb-4">
            Your 3-day trial has ended. This content is now read-only. 
            Upgrade to continue creating and editing.
          </p>
          <Button 
            onClick={() => navigate('/subscription')}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Upgrade Now
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ReadOnlyGuard;