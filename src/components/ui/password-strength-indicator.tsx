import React from 'react';
import { getPasswordStrength } from '@/lib/validation';
import { cn } from '@/lib/utils';

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  className
}) => {
  // Always call all hooks first - no early returns before hooks
  const { score, feedback } = getPasswordStrength(password);
  
  // Don't show indicator for empty passwords - render-time condition is OK
  if (!password) return null;

  const getStrengthText = (score: number) => {
    if (score <= 2) return 'Weak';
    if (score <= 4) return 'Fair';
    if (score <= 5) return 'Good';
    return 'Strong';
  };

  const getStrengthColor = (score: number) => {
    if (score <= 2) return 'bg-destructive';
    if (score <= 4) return 'bg-warning';
    if (score <= 5) return 'bg-primary';
    return 'bg-success';
  };

  const strengthText = getStrengthText(score);
  const strengthColor = getStrengthColor(score);
  const progressWidth = Math.min((score / 6) * 100, 100);

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Password strength:</span>
        <span className={cn(
          'font-medium',
          score <= 2 && 'text-destructive',
          score > 2 && score <= 4 && 'text-warning',
          score > 4 && score <= 5 && 'text-primary',
          score > 5 && 'text-success'
        )}>
          {strengthText}
        </span>
      </div>
      
      <div className="w-full bg-muted rounded-full h-2">
        <div
          className={cn('h-2 rounded-full transition-all duration-300', strengthColor)}
          style={{ width: `${progressWidth}%` }}
        />
      </div>

      {feedback.length > 0 && (
        <ul className="text-xs text-muted-foreground space-y-1">
          {feedback.map((item, index) => (
            <li key={index} className="flex items-center gap-1">
              <span className="text-destructive">•</span>
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};