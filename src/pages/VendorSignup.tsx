import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import type { RegisterCredentials } from '../types';

export const VendorSignup: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [invitationData, setInvitationData] = useState<any>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<RegisterCredentials & { confirm_password: string }>();

  const password = watch('password');

  useEffect(() => {
    const validateInvitation = async () => {
      if (!token) {
        setError('Invalid invitation link. Please contact your broker for a valid invitation.');
        return;
      }

      try {
        const response = await fetch(`/.netlify/functions/invitations-validate?token=${token}`);
        if (!response.ok) {
          throw new Error('Invalid or expired invitation');
        }
        
        const data = await response.json();
        setInvitationData(data);
        
        // Pre-fill email if provided in invitation
        if (data.email) {
          setValue('email', data.email);
        }
      } catch (err) {
        setError('Invalid or expired invitation link. Please contact your broker for a new invitation.');
      }
    };

    validateInvitation();
  }, [token, setValue]);

  const onSubmit = async (data: RegisterCredentials & { confirm_password: string }) => {
    if (!token || !invitationData) {
      setError('Invalid invitation. Please use a valid invitation link.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/.netlify/functions/auth-register-vendor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          first_name: data.first_name,
          last_name: data.last_name,
          phone: data.phone,
          invitation_token: token,
          organization_id: invitationData.organization_id,
          role: 'vendor'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create account');
      }

      // Redirect to login with success message
      navigate('/login?message=account_created&type=vendor');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Invalid Invitation Link</h2>
            <p className="text-gray-600 mb-4">
              This page requires a valid invitation from a broker. Please contact your broker to receive a proper invitation link.
            </p>
            <Link to="/">
              <Button variant="outline">Return Home</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Panel - Vendor Benefits */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-secondary to-primary text-white">
        <div className="flex flex-col justify-center px-12">
          <div className="max-w-md">
            <h2 className="text-3xl font-bold mb-6">Welcome to VendorHub OS</h2>
            <p className="text-xl mb-8 text-white text-opacity-90">
              You've been invited to join {invitationData?.broker_name}'s vendor network
            </p>
            <div className="space-y-6">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold">No Cost to You</h3>
                  <p className="text-white text-opacity-90">Free access to submit applications and manage your deals.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold">Pre-Qualification Tools</h3>
                  <p className="text-white text-opacity-90">Instantly assess customer financing prospects before applying.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold">Real-Time Deal Tracking</h3>
                  <p className="text-white text-opacity-90">See exactly where each application stands in the approval process.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold">Direct Communication</h3>
                  <p className="text-white text-opacity-90">Message your broker directly about specific deals and get faster responses.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div>
            <Link to="/" className="text-primary font-bold text-2xl">
              VendorHub OS
            </Link>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Join as a Vendor
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Complete your account setup to start submitting applications
            </p>
          </div>

          {invitationData && (
            <Card className="mt-6 border-secondary">
              <div className="p-4 bg-secondary bg-opacity-5">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Invited by {invitationData.broker_name}</h3>
                    <p className="text-sm text-gray-600">
                      Equipment Finance Broker • {invitationData.broker_email}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          )}

          <div className="mt-8">
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
                <div className="text-sm text-red-700">{error}</div>
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
                label="Email address"
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

              <div className="bg-green-50 p-4 rounded-md border border-green-200">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">
                      Free for Vendors
                    </h3>
                    <div className="mt-2 text-sm text-green-700">
                      <p>
                        There's no cost to join as a vendor. Start submitting applications and managing your deals immediately after account creation.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                loading={loading}
                className="w-full"
              >
                Create Vendor Account
              </Button>

              <p className="text-xs text-gray-500 text-center">
                By creating an account, you agree to our{' '}
                <a href="#" className="text-primary hover:text-primary/80">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="text-primary hover:text-primary/80">Privacy Policy</a>.
              </p>
            </form>

            <div className="mt-6 text-center">
              <span className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="text-primary hover:text-primary/80 font-medium"
                >
                  Sign in
                </Link>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};