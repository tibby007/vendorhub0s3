
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const usePasswordActions = () => {
  const [isSendingMagicLink, setIsSendingMagicLink] = useState(false);
  const [isSendingPasswordReset, setIsSendingPasswordReset] = useState(false);

  const handleSendMagicLink = async (email: string) => {
    if (!email) {
      return;
    }

    setIsSendingMagicLink(true);
    
    try {
      console.log('🔗 Sending built-in magic link to:', email);
      
      const redirectUrl = window.location.hostname === 'localhost' 
        ? `${window.location.origin}/password-reset`
        : 'https://vendorhubos.com/password-reset';

      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectUrl,
          shouldCreateUser: false
        }
      });

      if (error) {
        throw error;
      }

      console.log('✅ Magic link sent successfully');
      
      toast.success('Magic Link Sent!', {
        description: 'Check your email for a secure login link.'
      });

    } catch (error: any) {
      console.error('❌ Magic link error:', error);
      
      if (error.message.includes('rate limit') || error.message.includes('too many')) {
        toast.error('Too many requests', {
          description: 'Please wait before requesting another magic link.'
        });
      } else if (error.message.includes('User not found')) {
        toast.error('Account not found', {
          description: 'No account exists with that email address.'
        });
      } else {
        toast.error('Failed to send magic link', {
          description: error.message || 'Please try again later.'
        });
      }
    } finally {
      setIsSendingMagicLink(false);
    }
  };

  const handleForgotPassword = async (email: string) => {
    if (!email) {
      return;
    }

    setIsSendingPasswordReset(true);
    
    try {
      console.log('🔑 Sending built-in password reset to:', email);
      
      const redirectUrl = window.location.hostname === 'localhost' 
        ? `${window.location.origin}/password-reset`
        : 'https://vendorhubos.com/password-reset';

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl
      });

      // Don't throw on "user not found" for security
      if (error && !error.message.includes('not found')) {
        throw error;
      }

      console.log('✅ Password reset sent successfully');
      
      toast.success('Password Reset Sent!', {
        description: 'Check your email for reset instructions.'
      });

    } catch (error: any) {
      console.error('❌ Password reset error:', error);
      
      if (error.message.includes('rate limit') || error.message.includes('too many')) {
        toast.error('Too many requests', {
          description: 'Please wait before requesting another password reset.'
        });
      } else {
        toast.error('Failed to send password reset', {
          description: error.message || 'Please try again later.'
        });
      }
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
