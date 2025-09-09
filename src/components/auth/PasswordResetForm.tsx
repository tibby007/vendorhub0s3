import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PasswordResetForm = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const [hashError, setHashError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Parse hash errors (e.g. #error=access_denied&error_code=otp_expired)
    const hash = window.location.hash?.startsWith('#') ? window.location.hash.slice(1) : '';
    if (hash) {
      const hp = new URLSearchParams(hash);
      const err = hp.get('error');
      const code = hp.get('error_code');
      const desc = hp.get('error_description');
      if (err || code) {
        const composed = `${code || err}${desc ? `: ${decodeURIComponent(desc)}` : ''}`;
        setHashError(composed);
        if (code === 'otp_expired') {
          toast.error('This password reset link is invalid or has expired. Please request a new one.');
        } else {
          toast.error(`Authentication error: ${composed}`);
        }
      }
    }

    // Immediate session check
    supabase.auth.getSession().then(({ data }) => {
      const present = !!data.session;
      setHasRecoverySession(present);
      if (present) {
        toast.success('Recovery session detected. You can set a new password.');
      }
    });

    // Listen for PASSWORD_RECOVERY events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session) {
        setHasRecoverySession(true);
        setHashError(null);
        toast.success('Recovery session established. You can set a new password.');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasRecoverySession) {
      toast.error('No valid recovery session. Please open the latest reset link from your email.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        throw error;
      }

      toast.success('Password updated successfully!');
      navigate('/dashboard');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Password reset error:', error);
      toast.error('Failed to update password: ' + message);
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
              <span className="text-red-600">The reset link appears invalid or expired.</span>
            ) : (
              'Enter a new password for your account.'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hashError ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-700">
                Reset links are single-use and time-limited. Please request a new reset email.
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
                  Waiting for a valid recovery session from your email link. If you arrived here without clicking the link, request a new reset.
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

export default PasswordResetForm;