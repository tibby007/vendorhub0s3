
import React from 'react';
import { Button } from '@/components/ui/button';
import { usePasswordActions } from '@/hooks/usePasswordActions';

interface PasswordActionsProps {
  email: string;
  isLoading: boolean;
}

const PasswordActions = ({ email, isLoading }: PasswordActionsProps) => {
  const { 
    isSendingMagicLink, 
    isSendingPasswordReset, 
    handleSendMagicLink, 
    handleForgotPassword 
  } = usePasswordActions();

  return (
    <div className="space-y-2">
      <Button 
        type="button"
        variant="outline" 
        className="w-full" 
        disabled={!email || isSendingMagicLink || isLoading || isSendingPasswordReset}
        onClick={() => handleSendMagicLink(email)}
      >
        {isSendingMagicLink ? 'Sending Magic Link...' : 'Send Magic Link'}
      </Button>
      
      <Button 
        type="button"
        variant="ghost" 
        className="w-full text-sm" 
        disabled={!email || isSendingPasswordReset || isLoading || isSendingMagicLink}
        onClick={() => handleForgotPassword(email)}
      >
        {isSendingPasswordReset ? 'Sending Reset Email...' : 'Forgot Password?'}
      </Button>
    </div>
  );
};

export default PasswordActions;
