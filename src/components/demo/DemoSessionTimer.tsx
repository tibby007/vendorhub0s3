import React from 'react';
import { useDemoMode } from '@/hooks/useDemoMode';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Clock, AlertTriangle, X } from 'lucide-react';

const DemoSessionTimer: React.FC = () => {
  const { isDemo, timeRemaining, exitDemoMode } = useDemoMode();

  if (!isDemo || !timeRemaining) {
    return null;
  }

  const minutes = Math.floor(timeRemaining / 60000);
  const seconds = Math.floor((timeRemaining % 60000) / 1000);
  const isWarning = timeRemaining < 120000; // 2 minutes warning
  const isCritical = timeRemaining < 30000; // 30 seconds critical

  const formatTime = () => {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getAlertVariant = () => {
    if (isCritical) return 'destructive';
    if (isWarning) return 'default';
    return 'default';
  };

  const getIcon = () => {
    if (isCritical) return <AlertTriangle className="h-4 w-4" />;
    if (isWarning) return <Clock className="h-4 w-4" />;
    return <Clock className="h-4 w-4" />;
  };

  const getMessage = () => {
    if (isCritical) {
      return `Demo session expires in ${formatTime()}. Please save your work.`;
    }
    if (isWarning) {
      return `Demo session expires in ${formatTime()}.`;
    }
    return `Demo session: ${formatTime()} remaining`;
  };

  return (
    <Alert variant={getAlertVariant()} className="mb-4">
      {getIcon()}
      <AlertDescription className="flex items-center justify-between">
        <span>{getMessage()}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={exitDemoMode}
          className="ml-2 h-6 px-2"
        >
          <X className="h-3 w-3" />
        </Button>
      </AlertDescription>
    </Alert>
  );
};

export default DemoSessionTimer; 