
import { User, Session } from '@supabase/supabase-js';

export interface AuthUser extends User {
  role?: string;
  name?: string;
  partnerId?: string;
}

export interface SubscriptionData {
  subscribed: boolean;
  subscription_tier?: string;
  subscription_end?: string;
}

export interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  subscriptionData: SubscriptionData | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshSubscription: (forceRefresh?: boolean) => Promise<void>;
  checkSubscriptionAccess: (requiredTier?: string) => boolean;
  isLoading: boolean;
}
