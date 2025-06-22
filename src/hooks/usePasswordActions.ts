
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const usePasswordActions = () => {
  const [isSendingMagicLink, setIsSendingMagicLink] = useState(false);
  const [isSendingPasswordReset, setIsSendingPasswordReset] = useState(false);

  const handleSendMagicLink = async (email: string) => {
    if (!email) {
      toast.error('Please enter your email address first');
      return;
    }

    setIsSendingMagicLink(true);

    try {
      // Direct redirect to /auth to avoid token consumption by root redirect
      const redirectUrl = window.location.hostname === 'localhost' 
        ? `${window.location.origin}/auth`
        : 'https://vendorhubos.com/auth';

      console.log('Sending magic link with redirect URL:', redirectUrl);

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectUrl
        }
      });

      if (error) {
        console.error('Magic link error:', error);
        
        if (error.message.includes('rate limit') || error.message.includes('too many')) {
          toast.error('Too many requests', {
            description: 'Please wait a moment before requesting another magic link.'
          });
        } else {
          toast.error('Failed to send magic link', {
            description: error.message
          });
        }
        return;
      }

      toast.success('Magic Link Sent!', {
        description: 'Check your email (including spam folder) for a magic link to sign in.'
      });

    } catch (error: any) {
      console.error('Magic link error:', error);
      toast.error('Failed to send magic link', {
        description: 'Please try again later.'
      });
    } finally {
      setIsSendingMagicLink(false);
    }
  };

  const handleForgotPassword = async (email: string) => {
    if (!email) {
      toast.error('Please enter your email address first');
      return;
    }

    setIsSendingPasswordReset(true);

    try {
      // Direct redirect to /auth to avoid token consumption by root redirect
      const redirectUrl = window.location.hostname === 'localhost' 
        ? `${window.location.origin}/auth`
        : 'https://vendorhubos.com/auth';

      console.log('Sending password reset with redirect URL:', redirectUrl);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl
      });

      if (error) {
        console.error('Password reset error:', error);
        
        if (error.message.includes('rate limit') || error.message.includes('too many')) {
          toast.error('Rate limit exceeded', {
            description: 'Please wait 60 seconds before requesting another password reset.'
          });
        } else if (error.message.includes('not found')) {
          // Don't reveal if email exists for security
          toast.success('Password Reset Email Sent!', {
            description: 'If an account exists with that email, you will receive reset instructions.'
          });
        } else {
          toast.error('Failed to send password reset email', {
            description: error.message
          });
        }
        return;
      }

      toast.success('Password Reset Email Sent!', {
        description: 'Check your email (including spam folder) for password reset instructions.'
      });

    } catch (error: any) {
      console.error('Password reset error:', error);
      toast.error('Failed to send password reset email', {
        description: 'Please try again later.'
      });
    } finally {
      setIsSendingPasswordReset(false);
    }
  };

  return {
    isSendingMagicLink,
    isSendingPasswordReset,
    handleSendMagicLink,
    handleForgotPassword
  };
};
