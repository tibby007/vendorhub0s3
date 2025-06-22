
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
      const finalRedirectUrl = redirectUrl || (
        window.location.hostname === 'localhost' 
          ? `${window.location.origin}/auth`
          : 'https://vendorhubos.com/auth'
      );

      console.log(`Initiating ${type} for ${email} with redirect:`, finalRedirectUrl);

      if (type === 'magic_link') {
        // Generate magic link token through Supabase
        const { data, error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: finalRedirectUrl,
            shouldCreateUser: false
          }
        });

        if (error) {
          throw error;
        }

        // Send custom branded email
        const { error: emailError } = await supabase.functions.invoke('send-auth-email', {
          body: {
            email,
            type: 'magic_link',
            link: finalRedirectUrl
          }
        });

        if (emailError) {
          throw new Error(`Email delivery failed: ${emailError.message}`);
        }

        toast.success('Magic Link Sent!', {
          description: 'Check your email for a secure login link.'
        });

      } else if (type === 'password_reset') {
        // Generate password reset token through Supabase
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: finalRedirectUrl
        });

        // Don't throw on "user not found" for security
        if (error && !error.message.includes('not found')) {
          throw error;
        }

        // Send custom branded email
        const { error: emailError } = await supabase.functions.invoke('send-auth-email', {
          body: {
            email,
            type: 'password_reset',
            link: finalRedirectUrl
          }
        });

        if (emailError) {
          throw new Error(`Email delivery failed: ${emailError.message}`);
        }

        toast.success('Password Reset Sent!', {
          description: 'Check your email for reset instructions.'
        });
      }

      return { success: true };

    } catch (error: any) {
      console.error(`${type} error:`, error);
      
      if (error.message.includes('rate limit') || error.message.includes('too many')) {
        toast.error('Too many requests', {
          description: 'Please wait before requesting another email.'
        });
      } else if (error.message.includes('User not found') && type === 'magic_link') {
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
