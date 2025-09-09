import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Eye, EyeOff } from 'lucide-react';

const PasswordReset = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const [hashError, setHashError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔑 Minimal PasswordReset page loaded');

    // Check for auth errors in the URL hash (Supabase uses hash params on redirects)
    const hash = window.location.hash?.startsWith('#') ? window.location.hash.slice(1) : '';
    if (hash) {
      const hashParams = new URLSearchParams(hash);
      const err = hashParams.get('error');
      const errCode = hashParams.get('error_code');
      const errDesc = hashParams.get('error_description');
      if (err || errCode) {
        const composed = `${errCode || err}${errDesc ? `: ${decodeURIComponent(errDesc)}` : ''}`;
        console.warn('⚠️ Password reset link error detected from hash:', composed);
        setHashError(composed);
        setMessage(
          errCode === 'otp_expired'
            ? 'This password reset link is invalid or has expired. Please request a new reset email.'
            : `Authentication error: ${composed}`
        );
      }
    }

    // Check immediately if a session exists (i.e., link successfully created a recovery session)
    supabase.auth.getSession().then(({ data }) => {
      const hasSession = !!data.session;
      console.log('🔎 Initial session check on reset page:', hasSession);
      setHasRecoverySession(hasSession);
      if (hasSession && !hashError) {
        setMessage('You can now set a new password');
      }
    });

    // Simple auth state listener - detect PASSWORD_RECOVERY session
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔐 Auth event in minimal page:', event, !!session);
      if (event === 'PASSWORD_RECOVERY' && session) {
        console.log('✅ Password recovery session detected');
        setHasRecoverySession(true);
        setHashError(null);
        setMessage('You can now set a new password');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasRecoverySession) {
      setMessage('This reset page does not have a valid recovery session. Please open the latest reset link from your email, or request a new one.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setMessage('Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      console.log('🔄 Updating password...');

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        throw error;
      }

      console.log('✅ Password updated successfully');
      setMessage('Password updated successfully! Redirecting to dashboard...');
      setIsSuccess(true);

      // User is already authenticated after password update, go directly to dashboard
      setTimeout(() => {
        // Use replace to avoid back button issues and prevent auth context conflicts
        window.location.replace('/dashboard');
      }, 2000);

    } catch (error: unknown) {
      console.error('❌ Password reset error:', error);
      const msg = error instanceof Error ? error.message : 'Unknown error';
      setMessage('Failed to update password: ' + msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-vendor-green-50 via-white to-vendor-gold-50 p-4">
      <Card className="w-full max-w-md shadow-lg border border-vendor-green-100">
        <CardHeader>
          <CardTitle>Reset Your Password</CardTitle>
          <CardDescription>
            {hashError ? (
              <span className="text-red-600">
                {message || 'The reset link appears to be invalid or expired.'}
              </span>
            ) : (
              'Enter a new password for your account.'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {message && !hashError && (
            <div className={`mb-4 text-sm ${isSuccess ? 'text-green-600' : 'text-gray-600'}`}>
              {message}
            </div>
          )}

          {hashError ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-700">
                For security, password reset links are single-use and time-limited. Please go back to the login page and request a new reset email.
              </p>
              <Button className="w-full" onClick={() => (window.location.href = '/auth')}>
                Return to Login
              </Button>
            </div>
          ) : (
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter your new password"
                    required
                    minLength={8}
                    disabled={!hasRecoverySession}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your new password"
                    required
                    minLength={8}
                    disabled={!hasRecoverySession}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {!hasRecoverySession && (
                <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                  Waiting for a valid recovery session from your email link. If you arrived here without clicking the link, please request a new password reset.
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading || !hasRecoverySession}>
                {isLoading ? 'Updating Password...' : 'Update Password'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PasswordReset;