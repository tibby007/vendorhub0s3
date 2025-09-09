
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AuthEmailOptions {
  email: string;
  type: 'magic_link' | 'password_reset';
  redirectUrl?: string;
}

export const useAuthEmail = () => {
  const [isLoading, setIsLoading] = useState(false);

  const sendAuthEmail = async ({ email, type, redirectUrl }: AuthEmailOptions) => {
    setIsLoading(true);
    
    try {
      // Choose sensible defaults per flow if redirectUrl not provided
      const defaultRedirect = (() => {
        if (type === 'password_reset') {
          return window.location.hostname === 'localhost'
            ? `${window.location.origin}/password-reset`
            : 'https://vendorhubos.com/password-reset';
        }
        return window.location.hostname === 'localhost'
          ? `${window.location.origin}/auth`
          : 'https://vendorhubos.com/auth';
      })();

      const finalRedirectUrl = redirectUrl || defaultRedirect;

      console.log(`Initiating ${type} for ${email} with redirect:`, finalRedirectUrl);

      if (type === 'magic_link') {
        // Generate magic link token through Supabase (Supabase sends the email)
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: finalRedirectUrl,
            shouldCreateUser: false
          }
        });

        if (error) throw error;

        toast.success('Magic Link Sent!', {
          description: 'Check your email for a secure login link.'
        });

      } else if (type === 'password_reset') {
        // Request password reset (Supabase sends the email with the secure token)
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: finalRedirectUrl
        });

        // Don't throw on "user not found" for security
        if (error && !error.message.includes('not found')) {
          throw error;
        }

        // NOTE: We intentionally do NOT send any custom email here to avoid
        // users receiving a non-token link that would fail on arrival.
        toast.success('Password Reset Sent!', {
          description: 'Check your email for reset instructions.'
        });
      }

      return { success: true };

    } catch (error: any) {
      console.error(`${type} error:`, error);
      
      if (error.message?.toLowerCase?.().includes('rate limit') || error.message?.toLowerCase?.().includes('too many')) {
        toast.error('Too many requests', {
          description: 'Please wait before requesting another email.'
        });
      } else if (error.message?.includes('User not found') && type === 'magic_link') {
        toast.error('Account not found', {
          description: 'No account exists with that email address.'
        });
      } else {
        toast.error(`Failed to send ${type.replace('_', ' ')}`, {
          description: error.message || 'Please try again later.'
        });
      }
      
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    sendAuthEmail,
    isLoading
  };
};
