// Check if user needs to set up subscription
export const needsSubscriptionSetup = (user: any, subscriptionData: any): boolean => {
  if (!user) return false;
  
  // OWNER BYPASS: support@emergestack.dev NEVER needs subscription setup
  if (user.email === 'support@emergestack.dev') {
    return false;
  }
  
  // Demo users don't need subscription setup
  if (user.email?.includes('demo-') || user.email?.includes('@demo.com')) {
    return false;
  }
  
  // CRITICAL: Only Brokers (Partner Admin) need subscriptions - Vendors are invited by brokers
  const userRole = user.user_metadata?.role || user.role;
  if (userRole !== 'Partner Admin' && userRole !== 'Broker Admin') {
    return false; // Vendors, Loan Officers, etc. never need subscription setup
  }
  
  // If user has active subscription or trial, they don't need setup
  if (subscriptionData?.subscribed || subscriptionData?.trial_active) {
    return false;
  }
  
  // Check if user has an active trial period (from subscription_end date)
  if (subscriptionData?.subscription_end) {
    const trialEnd = new Date(subscriptionData.subscription_end);
    const now = new Date();
    if (trialEnd > now) {
      return false; // Trial is still active, no setup needed
    }
  }
  
  // Check if user is newly created (less than 5 minutes old)
  const userCreatedAt = new Date(user.created_at);
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const isNewUser = userCreatedAt > fiveMinutesAgo;
  
  return isNewUser || !subscriptionData;
};

// Check if user should be redirected to subscription page
export const shouldRedirectToSubscription = (user: any, subscriptionData: any, currentPath: string): boolean => {
  // Don't redirect if already on subscription page
  if (currentPath === '/subscription' || currentPath === '/checkout') {
    return false;
  }
  
  // Don't redirect if on auth page
  if (currentPath === '/auth' || currentPath === '/landing') {
    return false;
  }
  
  return needsSubscriptionSetup(user, subscriptionData);
};