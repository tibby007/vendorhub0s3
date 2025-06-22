
import React from 'react';

interface DemoInfoPanelProps {
  email: string;
  password: string;
}

const DemoInfoPanel = ({ email, password }: DemoInfoPanelProps) => {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <h4 className="text-sm font-medium text-blue-900 mb-2">Demo Access</h4>
      <p className="text-xs text-blue-700">
        {email && password ? 
          'Demo credentials have been automatically filled in. Click "Access Demo" to continue.' :
          'Use the demo credentials from your registration email or the credentials modal to login.'
        }
        Demo sessions are limited to 30 minutes.
      </p>
      {email && password && (
        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-800">
          <strong>Ready to go!</strong> Your demo credentials are loaded and ready to use.
        </div>
      )}
    </div>
  );
};

export default DemoInfoPanel;
