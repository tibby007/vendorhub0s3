
import React from 'react';
import { Shield } from 'lucide-react';

const DemoSecurityNotice = () => {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <Shield className="w-4 h-4 text-blue-600" />
        <span className="text-sm font-medium text-blue-900">Security & Privacy</span>
      </div>
      <ul className="text-xs text-blue-800 space-y-1">
        <li>• All data is encrypted in transit and at rest</li>
        <li>• Demo credentials are securely generated and time-limited</li>
        <li>• No production data access - isolated demo environment</li>
        <li>• Your information is protected per our privacy policy</li>
      </ul>
    </div>
  );
};

export default DemoSecurityNotice;
