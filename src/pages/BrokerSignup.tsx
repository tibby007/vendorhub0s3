import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import {
  ChartBarIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  BoltIcon,
  UserGroupIcon,
  SparklesIcon,
  TrophyIcon,
  RocketLaunchIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import type { RegisterCredentials } from '../types';

const STRIPE_PRICES = {
  solo: 'price_1Rts5RB1YJBVEg8w2JUUjm1U', // Solo Annual $499
  pro: 'price_1Rts7OB1YJBVEg8wZIxyh5Fb',  // Pro Annual $979
  enterprise: 'price_1Rts8XB1YJBVEg8w80Ay7OgO' // Enterprise Annual $3,970
};

export const BrokerSignup: React.FC = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedPlan = searchParams.get('plan') || 'pro';

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterCredentials & { confirm_password: string }>();

  const password = watch('password');

  const planDetails = {
    solo: { name: 'Solo', price: '$499/year', vendors: '3 vendors', deals: '25 deals/month' },
    pro: { name: 'Pro', price: '$979/year', vendors: '7 vendors', deals: '100 deals/month' },
    enterprise: { name: 'Enterprise', price: '$3,970/year', vendors: 'Unlimited vendors', deals: 'Unlimited deals' }
  };

  const currentPlan = planDetails[selectedPlan as keyof typeof planDetails] || planDetails.pro;

  const onSubmit = async (data: RegisterCredentials & { confirm_password: string }) => {
    setLoading(true);
    setError('');

    try {
      // Step 1: Create user account in Supabase
      const response = await fetch('/.netlify/functions/auth-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          first_name: data.first_name,
          last_name: data.last_name,
          organization_name: data.organization_name,
          role: 'broker',
          phone: data.phone,
          plan: selectedPlan
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create account');
      }

      // Step 2: Redirect to Stripe Checkout
      const stripe = (window as any).Stripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);
      
      if (!stripe) {
        throw new Error('Stripe failed to load');
      }
      
      const checkoutResponse = await fetch('/.netlify/functions/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price_id: STRIPE_PRICES[selectedPlan as keyof typeof STRIPE_PRICES],
          customer_email: data.email,
          success_url: `${window.location.origin}/dashboard?setup=success`,
          cancel_url: `${window.location.origin}/broker-signup?plan=${selectedPlan}`
        })
      });

      if (!checkoutResponse.ok) {
        const errorData = await checkoutResponse.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { sessionId } = await checkoutResponse.json();
      
      // Redirect to Stripe Checkout
      const { error: stripeError } = await stripe.redirectToCheckout({ sessionId });
      
      if (stripeError) {
        throw new Error(stripeError.message);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-orange-50 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-green-100 to-transparent rounded-full opacity-60 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-orange-100 to-transparent rounded-full opacity-60 blur-3xl"></div>
      
      <div className="relative flex min-h-screen">
        {/* Left Panel - Benefits */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-600 to-green-700 text-white relative">
          <div className="absolute inset-0 bg-gradient-to-br from-green-600 via-green-700 to-green-800 opacity-90"></div>
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
            <div className="absolute bottom-20 left-10 w-24 h-24 bg-orange-400/20 rounded-full blur-lg"></div>
          </div>
          
          <div className="relative flex flex-col justify-center px-12 py-16">
            <div className="max-w-md">
              {/* Logo */}
              <div className="flex items-center space-x-3 mb-8">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <ChartBarIcon className="w-7 h-7 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-white">VendorHub OS</h1>
              </div>
              
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-green-100 text-sm font-semibold mb-8">
                <SparklesIcon className="w-4 h-4 mr-2" />
                Launch Your Broker Platform
              </div>
              
              <h2 className="text-4xl font-bold mb-6 leading-tight">
                Join the Future of
                <span className="block bg-gradient-to-r from-orange-300 to-orange-400 bg-clip-text text-transparent">
                  Equipment Finance
                </span>
              </h2>
              
              <p className="text-green-100 text-lg mb-8 leading-relaxed">
                Transform your brokerage with the industry's most advanced platform for equipment financing.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-500 rounded-lg flex items-center justify-center shadow-lg">
                    <BoltIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white mb-1">30% Faster Processing</h3>
                    <p className="text-green-100">Streamline deals from application to funding with automated workflows.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-green-400 to-green-500 rounded-lg flex items-center justify-center shadow-lg">
                    <UserGroupIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white mb-1">Unlimited Vendor Network</h3>
                    <p className="text-green-100">Seamlessly manage and expand your vendor relationships.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-500 rounded-lg flex items-center justify-center shadow-lg">
                    <ShieldCheckIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white mb-1">Bank-Grade Security</h3>
                    <p className="text-green-100">SOC 2 compliant platform with enterprise-level protection.</p>
                  </div>
                </div>
              </div>
              
              {/* Stats */}
              <div className="mt-12 pt-8 border-t border-white/20">
                <div className="grid grid-cols-2 gap-6 text-center">
                  <div>
                    <div className="text-3xl font-bold text-white mb-1">99.9%</div>
                    <div className="text-green-200 text-sm">Platform Uptime</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-white mb-1">&lt; 24hrs</div>
                    <div className="text-green-200 text-sm">Setup Time</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Form */}
        <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-12 xl:px-16 py-12">
          <div className="mx-auto w-full max-w-lg">
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center justify-center mb-8">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                  <ChartBarIcon className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">VendorHub OS</h1>
              </div>
            </div>
            
            <div className="text-center lg:text-left mb-8">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-green-100 text-green-800 text-sm font-semibold mb-6">
                <SparklesIcon className="w-4 h-4 mr-2" />
                Almost There!
              </div>
              
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                Complete Your
                <span className="block bg-gradient-to-r from-green-600 to-orange-600 bg-clip-text text-transparent">
                  Registration
                </span>
              </h2>
              
              <p className="text-xl text-gray-600">
                Set up your account and start transforming your equipment finance business today.
              </p>
            </div>

            {/* Selected Plan Display */}
            <div className="bg-white rounded-2xl shadow-xl border-2 border-green-200 p-6 mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                    {selectedPlan === 'solo' && <RocketLaunchIcon className="w-6 h-6 text-white" />}
                    {selectedPlan === 'pro' && <TrophyIcon className="w-6 h-6 text-white" />}
                    {selectedPlan === 'enterprise' && <BuildingOfficeIcon className="w-6 h-6 text-white" />}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{currentPlan.name} Plan</h3>
                    <p className="text-green-600 font-semibold">{currentPlan.vendors} • {currentPlan.deals}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black bg-gradient-to-r from-green-600 to-orange-600 bg-clip-text text-transparent">
                    {currentPlan.price}
                  </div>
                  <Link 
                    to="/pricing" 
                    className="text-sm text-green-600 hover:text-green-700 font-semibold inline-flex items-center mt-1"
                  >
                    Change plan →
                  </Link>
                </div>
              </div>
            </div>

            <div className="">
              {error && (
                <div className="mb-6 bg-red-50 border-l-4 border-red-400 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3 text-sm text-red-700 font-medium">{error}</div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="First name"
                    {...register('first_name', {
                      required: 'First name is required',
                    })}
                    error={errors.first_name?.message}
                  />
                  <Input
                    label="Last name"
                    {...register('last_name', {
                      required: 'Last name is required',
                    })}
                    error={errors.last_name?.message}
                  />
                </div>

                <Input
                  label="Business email"
                  type="email"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: 'Please enter a valid email address',
                    },
                  })}
                  error={errors.email?.message}
                />

                <Input
                  label="Company name"
                  {...register('organization_name', {
                    required: 'Company name is required',
                  })}
                  error={errors.organization_name?.message}
                />

                <Input
                  label="Phone number"
                  type="tel"
                  {...register('phone')}
                  error={errors.phone?.message}
                />

                <Input
                  label="Password"
                  type="password"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 8,
                      message: 'Password must be at least 8 characters',
                    },
                    pattern: {
                      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                      message: 'Password must contain uppercase, lowercase, number, and special character',
                    },
                  })}
                  error={errors.password?.message}
                />

                <Input
                  label="Confirm password"
                  type="password"
                  {...register('confirm_password', {
                    required: 'Please confirm your password',
                    validate: (value) => value === password || 'Passwords do not match',
                  })}
                  error={errors.confirm_password?.message}
                />

                <div className="bg-gradient-to-r from-green-50 to-orange-50 border border-green-200 p-6 rounded-xl">
                  <div className="flex items-center mb-4">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mr-3">
                      <CheckCircleIcon className="w-5 h-5 text-white" />
                    </div>
                    <h4 className="text-lg font-bold text-gray-900">What happens next?</h4>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 font-bold text-sm">1</span>
                      </div>
                      <p className="text-gray-700 font-medium">Complete secure payment with Stripe</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 font-bold text-sm">2</span>
                      </div>
                      <p className="text-gray-700 font-medium">Access your dashboard immediately</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 font-bold text-sm">3</span>
                      </div>
                      <p className="text-gray-700 font-medium">Start inviting vendors to your network</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 font-bold text-sm">4</span>
                      </div>
                      <p className="text-gray-700 font-medium">Begin processing deals 30% faster</p>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  loading={loading}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-4 text-lg font-bold shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300"
                >
                  <RocketLaunchIcon className="w-5 h-5 mr-2" />
                  {loading ? 'Setting Up Your Account...' : 'Complete Registration & Pay'}
                </Button>

                <div className="text-center space-y-4">
                  <p className="text-sm text-gray-600">
                    By continuing, you agree to our{' '}
                    <a href="#" className="text-green-600 hover:text-green-700 font-semibold">Terms of Service</a>
                    {' '}and{' '}
                    <a href="#" className="text-green-600 hover:text-green-700 font-semibold">Privacy Policy</a>.
                  </p>
                  
                  <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
                    <div className="flex items-center">
                      <ShieldCheckIcon className="w-4 h-4 text-green-500 mr-1" />
                      Secure Payment
                    </div>
                    <div className="flex items-center">
                      <CheckCircleIcon className="w-4 h-4 text-green-500 mr-1" />
                      Cancel Anytime
                    </div>
                    <div className="flex items-center">
                      <CheckCircleIcon className="w-4 h-4 text-green-500 mr-1" />
                      24/7 Support
                    </div>
                  </div>
                </div>
              </form>

              <div className="mt-8 text-center">
                <span className="text-gray-600">
                  Already have an account?{' '}
                  <Link
                    to="/login"
                    className="text-green-600 hover:text-green-700 font-bold"
                  >
                    Sign in →
                  </Link>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};