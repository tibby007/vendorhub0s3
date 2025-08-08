import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import type { LoginCredentials } from '../../types';

export const LoginForm: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginCredentials>();

  const onSubmit = async (data: LoginCredentials) => {
    setLoading(true);
    setError('');

    const result = await signIn(data);
    if (result.error) {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-accent-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link to="/" className="inline-block text-primary-600 font-bold text-2xl mb-6">
            VendorHub OS
          </Link>
          <h2 className="text-3xl font-bold text-secondary-900">
            Welcome back
          </h2>
          <p className="mt-2 text-secondary-600">
            Sign in to your account to continue
          </p>
        </div>

        <Card>
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            <Input
              label="Email address"
              type="email"
              autoComplete="email"
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
              label="Password"
              type="password"
              autoComplete="current-password"
              {...register('password', {
                required: 'Password is required',
              })}
              error={errors.password?.message}
            />

            <div className="flex items-center justify-between">
              <Link
                to="/forgot-password"
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                Forgot your password?
              </Link>
            </div>

            <Button
              type="submit"
              size="lg"
              loading={loading}
              className="w-full"
            >
              Sign in
            </Button>

            <div className="text-center space-y-4">
              <div className="text-sm text-secondary-600">
                Don't have an account?
              </div>
              <div className="flex flex-col space-y-2">
                <Link to="/broker-signup">
                  <Button variant="outline" size="sm" className="w-full">
                    Sign up as Broker
                  </Button>
                </Link>
                <div className="text-xs text-secondary-500">
                  Vendors: You must be invited by a broker to join
                </div>
              </div>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};