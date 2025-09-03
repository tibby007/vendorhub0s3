
import { ReactNode } from 'react';

export interface PlanFeature {
  name: string;
  included: boolean;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  monthlyPriceId: string;
  annualPriceId: string;
  maxVendors: number | null;
  features: PlanFeature[];
  popular?: boolean;
  icon: ReactNode;
  trialText?: string;
  upgradeText?: string;
}
