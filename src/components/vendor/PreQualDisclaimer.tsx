
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

const PreQualDisclaimer = () => {
  return (
    <Card className="bg-gray-50">
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-gray-600">
            <p className="font-medium mb-1">Disclaimer</p>
            <p>
              This pre-qualification tool provides an estimate based on the information provided. 
              Final approval is subject to full underwriting review, verification of information, 
              and additional requirements. This is not a guarantee of financing.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PreQualDisclaimer;
