
import React from 'react';
import { Building2 } from 'lucide-react';

interface LoginHeaderProps {
  isDemoSession: boolean;
}

const LoginHeader: React.FC<LoginHeaderProps> = ({ isDemoSession }) => {
  return (
    <div className="text-center mb-8">
      <div className="w-16 h-16 bg-vendor-green-500 rounded-xl flex items-center justify-center mx-auto mb-4">
        <Building2 className="w-8 h-8 text-white" />
      </div>
      <h1 className="text-3xl font-bold text-gray-900">VendorHub</h1>
      <p className="text-gray-600 mt-2">
        {isDemoSession ? 'Demo Access Portal' : 'Partner & Vendor Management Platform'}
      </p>
    </div>
  );
};

export default LoginHeader;
