
import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface BillingToggleProps {
  isAnnual: boolean;
  onToggle: (isAnnual: boolean) => void;
}

const BillingToggle = ({ isAnnual, onToggle }: BillingToggleProps) => {
  return (
    <div className="flex items-center justify-center gap-4 p-4 bg-gray-50 rounded-lg inline-flex">
      <Label htmlFor="billing-toggle" className={!isAnnual ? 'font-medium' : 'text-gray-500'}>
        Monthly
      </Label>
      <Switch
        id="billing-toggle"
        checked={isAnnual}
        onCheckedChange={onToggle}
      />
      <Label htmlFor="billing-toggle" className={isAnnual ? 'font-medium' : 'text-gray-500'}>
        Annual
      </Label>
      <Badge variant="secondary" className="bg-green-100 text-green-700">
        Save 17%
      </Badge>
    </div>
  );
};

export default BillingToggle;
