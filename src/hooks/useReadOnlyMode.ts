import { useMemo } from 'react';
import { useSubscriptionManager } from '@/hooks/useSubscriptionManager';
import { useAuth } from '@/providers/AuthProvider';

export const useReadOnlyMode = () => {
  const { subscription, isTrialUser } = useSubscriptionManager();
  const { user } = useAuth();

  const isReadOnlyMode = useMemo(() => {
    // Owner bypass - never read-only
    if (user?.email === 'support@emergestack.dev') {
      return false;
    }

    // If subscribed, not read-only
    if (subscription.subscribed) {
      return false;
    }

    // If trial is still active, not read-only
    if (subscription.trial_active) {
      return false;
    }

    // Check if trial/subscription has expired
    const endDate = subscription.endDate || subscription.trialEnd;
    if (endDate && new Date(endDate) <= new Date()) {
      return true; // Trial expired, enable read-only mode
    }

    // If status is explicitly expired, read-only
    if (subscription.status === 'expired') {
      return true;
    }

    return false;
  }, [
    user?.email,
    subscription.subscribed,
    subscription.trial_active,
    subscription.endDate,
    subscription.trialEnd,
    subscription.status
  ]);

  const canPerformAction = (actionType: 'create' | 'edit' | 'delete' | 'view' = 'create') => {
    // Owner can always perform actions
    if (user?.email === 'support@emergestack.dev') {
      return true;
    }

    // If not in read-only mode, all actions allowed
    if (!isReadOnlyMode) {
      return true;
    }

    // In read-only mode, only 'view' actions allowed
    return actionType === 'view';
  };

  const getReadOnlyMessage = () => {
    if (!isReadOnlyMode) return null;

    return {
      title: 'Trial Expired - Read Only Mode',
      message: 'Your 3-day trial has ended. Upgrade to continue creating and editing.',
      action: 'Upgrade Now'
    };
  };

  return {
    isReadOnlyMode,
    canPerformAction,
    getReadOnlyMessage,
    trialExpired: isReadOnlyMode
  };
};