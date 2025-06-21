
import React from 'react';
import { Clock, Users, Shield, CheckCircle } from 'lucide-react';

const DemoBenefits = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <div className="text-center p-4 bg-vendor-green-50 rounded-lg">
        <Clock className="w-8 h-8 text-vendor-green-600 mx-auto mb-2" />
        <h3 className="font-semibold text-gray-900">30-Min Session</h3>
        <p className="text-sm text-gray-600">Full platform access</p>
      </div>
      <div className="text-center p-4 bg-vendor-green-50 rounded-lg">
        <Users className="w-8 h-8 text-vendor-green-600 mx-auto mb-2" />
        <h3 className="font-semibold text-gray-900">Real Data</h3>
        <p className="text-sm text-gray-600">Pre-loaded scenarios</p>
      </div>
      <div className="text-center p-4 bg-vendor-green-50 rounded-lg">
        <Shield className="w-8 h-8 text-vendor-green-600 mx-auto mb-2" />
        <h3 className="font-semibold text-gray-900">Secure Access</h3>
        <p className="text-sm text-gray-600">Encrypted credentials</p>
      </div>
      <div className="text-center p-4 bg-vendor-green-50 rounded-lg">
        <CheckCircle className="w-8 h-8 text-vendor-green-600 mx-auto mb-2" />
        <h3 className="font-semibold text-gray-900">No Commitment</h3>
        <p className="text-sm text-gray-600">Explore freely</p>
      </div>
    </div>
  );
};

export default DemoBenefits;
