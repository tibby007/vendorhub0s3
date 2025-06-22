
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
      const redirectUrl = window.location.hostname === 'localhost' 
        ? `${window.location.origin}/auth`
        : 'https://vendorhubos.com/auth';

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectUrl
        }
      });

      if (error) {
        console.error('Magic link error:', error);
        toast.error('Failed to send magic link', {
          description: error.message
        });
        return;
      }

      toast.success('Magic Link Sent!', {
        description: 'Check your email for a magic link to sign in.'
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
      const redirectUrl = window.location.hostname === 'localhost' 
        ? `${window.location.origin}/auth`
        : 'https://vendorhubos.com/auth';

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl
      });

      if (error) {
        console.error('Password reset error:', error);
        toast.error('Failed to send password reset email', {
          description: error.message
        });
        return;
      }

      toast.success('Password Reset Email Sent!', {
        description: 'Check your email for instructions to reset your password.'
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
