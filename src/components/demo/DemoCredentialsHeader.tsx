import React from 'react';
import { Button } from '@/components/ui/button';
import { Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const DemoCredentialsHeader = () => {
  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-vendor-green-500 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">VendorHub Demo Access</h1>
              <p className="text-gray-600">Your personalized demo environment is ready</p>
            </div>
          </div>
          <Button asChild>
            <Link to="/">← Back to Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DemoCredentialsHeader;