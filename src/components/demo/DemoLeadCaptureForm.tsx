
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import DemoHeader from './DemoHeader';
import DemoBenefits from './DemoBenefits';
import DemoRegistrationForm from './DemoRegistrationForm';
import DemoSecurityNotice from './DemoSecurityNotice';

interface DemoLeadCaptureFormProps {
  onSuccess: (credentials: { email: string; password: string; role: string }) => void;
}

const DemoLeadCaptureForm = ({ onSuccess }: DemoLeadCaptureFormProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-vendor-green-50 via-white to-vendor-gold-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <DemoHeader />
        <CardContent>
          <DemoBenefits />
          <DemoRegistrationForm onSuccess={onSuccess} />
          <div className="mt-4">
            <DemoSecurityNotice />
          </div>
          <p className="text-xs text-gray-500 text-center mt-4">
            By proceeding, you agree to our terms and privacy policy. We'll use this information to personalize your secure demo experience.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default DemoLeadCaptureForm;
