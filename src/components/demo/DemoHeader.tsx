
import React from 'react';
import { Building2 } from 'lucide-react';
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const DemoHeader = () => {
  return (
    <CardHeader className="text-center">
      <div className="w-16 h-16 bg-vendor-green-500 rounded-xl flex items-center justify-center mx-auto mb-4">
        <Building2 className="w-8 h-8 text-white" />
      </div>
      <CardTitle className="text-2xl">Experience VendorHub Live</CardTitle>
      <CardDescription className="text-lg">
        Get instant access to a secure, personalized demo environment with real data and features
      </CardDescription>
    </CardHeader>
  );
};

export default DemoHeader;
