
import { useState } from 'react';
import { useAuthEmail } from './useAuthEmail';

export const usePasswordActions = () => {
  const [isSendingMagicLink, setIsSendingMagicLink] = useState(false);
  const [isSendingPasswordReset, setIsSendingPasswordReset] = useState(false);
  const { sendAuthEmail } = useAuthEmail();

  const handleSendMagicLink = async (email: string) => {
    if (!email) {
      return;
    }

    setIsSendingMagicLink(true);
    
    try {
      await sendAuthEmail({
        email,
        type: 'magic_link'
      });
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
      await sendAuthEmail({
        email,
        type: 'password_reset'
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
