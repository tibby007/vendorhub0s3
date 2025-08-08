import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  CheckCircleIcon, 
  XMarkIcon,
  ShieldCheckIcon,
  LockClosedIcon,
  CreditCardIcon,
  SparklesIcon,
  TrophyIcon,
  RocketLaunchIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  BoltIcon
} from '@heroicons/react/24/outline';
import { Button } from '../components/ui/Button';
import type { SubscriptionTier } from '../types';

const pricingTiers = [
  {
    id: 'solo' as SubscriptionTier,
    name: 'Solo',
    icon: RocketLaunchIcon,
    monthlyPrice: 49.99,
    annualPrice: 499,
    description: 'Perfect for individual brokers getting started',
    features: [
      'Up to 3 vendors',
      '1 loan officer',
      '5GB storage',
      'Email support',
      'Basic reporting',
      'Standard deal workflows',
    ],
    notIncluded: [
      'API access',
      'White-label branding',
      'Priority support',
      'Advanced analytics',
    ],
    stripePriceIdMonthly: 'price_solo_monthly',
    stripePriceIdAnnual: 'price_solo_annual',
    popular: false,
    color: 'orange',
  },
  {
    id: 'pro' as SubscriptionTier,
    name: 'Pro',
    icon: TrophyIcon,
    monthlyPrice: 97.99,
    annualPrice: 979,
    description: 'Ideal for growing brokerage firms',
    features: [
      'Up to 7 vendors',
      'Up to 3 loan officers',
      '25GB storage',
      'Priority support + Phone',
      'Advanced analytics',
      'API access',
      'White-label branding',
      'Custom deal workflows',
      'Basic integrations',
    ],
    notIncluded: [
      'SSO integration',
      'Custom integrations',
      'Dedicated account manager',
    ],
    stripePriceIdMonthly: 'price_pro_monthly',
    stripePriceIdAnnual: 'price_pro_annual',
    popular: true,
    color: 'green',
  },
  {
    id: 'enterprise' as SubscriptionTier,
    name: 'Enterprise',
    icon: BuildingOfficeIcon,
    monthlyPrice: 397,
    annualPrice: 3970,
    description: 'For established firms with high volume',
    features: [
      'Unlimited vendors',
      'Up to 10 loan officers',
      'Unlimited storage',
      'Dedicated support',
      'Full API access',
      'SSO integration',
      'Custom integrations',
      'White-label options',
      'Advanced compliance tools',
      'Custom onboarding',
      'SLA guarantees',
    ],
    notIncluded: [],
    stripePriceIdMonthly: 'price_enterprise_monthly',
    stripePriceIdAnnual: 'price_enterprise_annual',
    popular: false,
    color: 'gray',
  },
];

interface PricingProps {
  showHeader?: boolean;
  selectedTier?: SubscriptionTier;
}

export const Pricing: React.FC<PricingProps> = ({ 
  showHeader = true, 
  selectedTier 
}) => {
  const [loading, setLoading] = useState<SubscriptionTier | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [searchParams] = useSearchParams();
  const fromSignup = searchParams.get('from') === 'signup';

  const handleSubscription = async (tier: typeof pricingTiers[0]) => {
    setLoading(tier.id);

    try {
      // Redirect to broker signup with selected plan
      window.location.href = `/broker-signup?plan=${tier.id}`;
    } catch (error) {
      console.error('Subscription error:', error);
      alert('There was an error processing your subscription. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const calculateSavings = (monthly: number, annual: number) => {
    const monthlyTotal = monthly * 12;
    const savings = ((monthlyTotal - annual) / monthlyTotal) * 100;
    return Math.round(savings);
  };

  const formatPrice = (price: number, period: 'monthly' | 'annual') => {
    if (period === 'annual') {
      return price >= 1000 ? `$${(price / 1000).toFixed(1)}K` : `$${price.toLocaleString()}`;
    }
    return `$${price.toFixed(2)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30">
      {showHeader && (
        <header className="bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link to="/" className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                  <ChartBarIcon className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">VendorHub OS</span>
              </Link>
              <div className="flex items-center space-x-6">
                <div className="flex items-center text-sm text-gray-600">
                  <ShieldCheckIcon className="w-4 h-4 mr-1 text-green-600" />
                  Bank-level Security
                </div>
                <a href="mailto:sales@vendorhubos.com?subject=Schedule Demo" className="text-green-600 hover:text-green-700 font-semibold text-sm">
                  Schedule Demo
                </a>
                <div className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <Link to="/login" className="text-green-600 hover:text-green-700 font-semibold">
                    Sign in →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-green-100 text-green-800 text-sm font-semibold mb-8">
            <SparklesIcon className="w-4 h-4 mr-2" />
            Launching Soon - Join Our Early Access
          </div>
          
          <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Pricing That Scales With You
          </h1>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-12">
            {fromSignup 
              ? 'Complete your registration by selecting a subscription plan'
              : 'Professional equipment finance platform. Choose your plan and get started today.'
            }
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center mb-16">
            <div className="relative bg-gray-100 rounded-full p-1 flex shadow-inner">
              <button
                type="button"
                className={`${
                  billingPeriod === 'monthly'
                    ? 'bg-white text-gray-900 shadow-md'
                    : 'text-gray-500 hover:text-gray-700'
                } relative rounded-full py-3 px-8 text-sm font-semibold transition-all duration-300 flex items-center`}
                onClick={() => setBillingPeriod('monthly')}
              >
                <CreditCardIcon className="w-4 h-4 mr-2" />
                Monthly
              </button>
              <button
                type="button"
                className={`${
                  billingPeriod === 'annual'
                    ? 'bg-green-600 text-white shadow-lg'
                    : 'text-gray-500 hover:text-gray-700'
                } relative rounded-full py-3 px-8 text-sm font-semibold transition-all duration-300 ml-1 flex items-center`}
                onClick={() => setBillingPeriod('annual')}
              >
                <BoltIcon className="w-4 h-4 mr-2" />
                Annual
                <span className="ml-3 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white">
                  SAVE 17%
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {pricingTiers.map((tier) => {
              const savings = calculateSavings(tier.monthlyPrice, tier.annualPrice);
              const displayPrice = billingPeriod === 'monthly' 
                ? tier.monthlyPrice 
                : tier.annualPrice;

              const cardColors = {
                orange: 'border-orange-200 hover:border-orange-300',
                green: 'border-green-500 ring-2 ring-green-200 shadow-xl',
                gray: 'border-gray-200 hover:border-gray-300'
              };

              const iconColors = {
                orange: 'bg-orange-100 text-orange-600',
                green: 'bg-green-100 text-green-600',
                gray: 'bg-gray-100 text-gray-600'
              };

              return (
                <div
                  key={tier.id}
                  className={`relative rounded-3xl bg-white border-2 p-8 ${
                    tier.popular 
                      ? 'transform lg:scale-110 z-10 shadow-2xl border-green-500'
                      : cardColors[tier.color as keyof typeof cardColors]
                  } hover:shadow-xl transition-all duration-300 flex flex-col`}
                >
                  {tier.popular && (
                    <div className="absolute -top-5 left-1/2 transform -translate-x-1/2">
                      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg flex items-center">
                        <SparklesIcon className="w-4 h-4 mr-2" />
                        MOST POPULAR
                      </div>
                    </div>
                  )}

                  {/* Icon and Title */}
                  <div className="text-center mb-8">
                    <div className={`w-20 h-20 ${iconColors[tier.color as keyof typeof iconColors]} rounded-2xl flex items-center justify-center mx-auto mb-6`}>
                      <tier.icon className="w-10 h-10" />
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900 mb-2">{tier.name}</h3>
                    <p className="text-gray-600 text-lg">{tier.description}</p>
                  </div>

                  {/* Price */}
                  <div className="text-center mb-8">
                    <div className="flex items-baseline justify-center mb-2">
                      <span className="text-6xl font-black text-gray-900">
                        {formatPrice(displayPrice, billingPeriod)}
                      </span>
                      <span className="ml-2 text-2xl font-medium text-gray-500">
                        /{billingPeriod === 'monthly' ? 'month' : 'year'}
                      </span>
                    </div>
                    {billingPeriod === 'annual' && (
                      <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 border border-green-200">
                        <BoltIcon className="w-4 h-4 text-green-600 mr-1" />
                        <span className="text-sm text-green-700 font-bold">
                          You save {savings}% annually
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  <div className="flex-1 mb-8">
                    <ul className="space-y-4">
                      {tier.features.map((feature) => (
                        <li key={feature} className="flex items-start">
                          <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                            <CheckCircleIcon className="h-4 w-4 text-green-600" />
                          </div>
                          <span className="text-gray-700 font-medium">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {tier.notIncluded.length > 0 && (
                      <div className="mt-8 pt-6 border-t border-gray-100">
                        <ul className="space-y-3">
                          {tier.notIncluded.map((feature) => (
                            <li key={feature} className="flex items-start opacity-50">
                              <div className="flex-shrink-0 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                                <XMarkIcon className="h-3 w-3 text-gray-400" />
                              </div>
                              <span className="text-gray-400 text-sm line-through">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* CTA Button */}
                  <div className="mt-auto">
                    <Button
                      className={`w-full py-4 text-lg font-bold rounded-xl ${
                        tier.popular 
                          ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all'
                          : tier.color === 'gray'
                          ? 'bg-gray-900 hover:bg-black text-white'
                          : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-green-400 hover:bg-green-50'
                      }`}
                      loading={loading === tier.id}
                      onClick={() => handleSubscription(tier)}
                    >
                      {fromSignup ? (
                        <>
                          <CheckCircleIcon className="w-5 h-5 mr-2" />
                          Select {tier.name} Plan
                        </>
                      ) : (
                        <>
                          <BoltIcon className="w-5 h-5 mr-2" />
                          Get Started
                        </>
                      )}
                    </Button>
                    
                    <p className="mt-4 text-center text-sm text-gray-500">
                      Professional platform • Cancel anytime
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Enterprise-Grade Security & Trust
            </h2>
            <p className="text-xl text-gray-600">
              Your data and your clients' data are protected by the same security standards used by banks
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <ShieldCheckIcon className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2 text-lg">SOC 2 Certified</h3>
              <p className="text-gray-600">Type II Compliant</p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <LockClosedIcon className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2 text-lg">256-bit Encryption</h3>
              <p className="text-gray-600">Bank-level security</p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <CreditCardIcon className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2 text-lg">PCI Compliant</h3>
              <p className="text-gray-600">Secure payments</p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <ChartBarIcon className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2 text-lg">99.9% Uptime</h3>
              <p className="text-gray-600">SLA guaranteed</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto mt-20">
            <div className="text-center">
              <div className="text-5xl font-bold text-green-600 mb-2">Beta</div>
              <p className="text-gray-600 text-lg">Early Access Program</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-green-600 mb-2">Launch</div>
              <p className="text-gray-600 text-lg">Ready Platform</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-green-600 mb-2">30%</div>
              <p className="text-gray-600 text-lg">Faster Deal Closing</p>
            </div>
          </div>
        </div>
      </section>


      {/* Contact */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Questions? We're here to help.
          </h3>
          <p className="text-gray-600 mb-8">
            Our team of equipment finance experts is ready to help you choose the right plan and get started.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <a 
              href="mailto:sales@vendorhubos.com" 
              className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path>
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
              </svg>
              Email Sales Team
            </a>
            <a 
              href="tel:1-800-VENDOR-1" 
              className="inline-flex items-center px-6 py-3 border-2 border-green-600 text-green-600 rounded-lg font-semibold hover:bg-green-50 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"></path>
              </svg>
              Call 1-800-VENDOR-1
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};