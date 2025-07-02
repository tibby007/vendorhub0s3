
import React from 'react';
import { Copy, Lock, Mail, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface DemoInfoPanelProps {
  email: string;
  password: string;
  role?: string;
}

const DemoInfoPanel = ({ email, password, role }: DemoInfoPanelProps) => {
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  return (
    <div className="bg-gradient-to-br from-vendor-green-50 to-vendor-gold-50 border border-vendor-green-200 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 bg-vendor-green-500 rounded-lg flex items-center justify-center">
          <User className="w-4 h-4 text-white" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-vendor-green-900">Demo Access Ready</h4>
          {role && <p className="text-xs text-vendor-green-700">Role: {role}</p>}
        </div>
      </div>

      {email && password ? (
        <div className="space-y-3">
          <p className="text-xs text-vendor-green-700 mb-3">
            Your demo credentials are ready to use. Demo sessions are limited to 30 minutes.
          </p>
          
          {/* Credentials Display */}
          <div className="bg-white rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Mail className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <span className="text-sm font-mono text-gray-900 truncate">{email}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(email, 'Email')}
                className="h-6 w-6 p-0 hover:bg-vendor-green-100"
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Lock className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <span className="text-sm font-mono text-gray-900">{'•'.repeat(password.length)}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(password, 'Password')}
                className="h-6 w-6 p-0 hover:bg-vendor-green-100"
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
          </div>

          <div className="bg-vendor-green-100 rounded-lg p-2">
            <p className="text-xs text-vendor-green-800 font-medium">
              ✅ Credentials are auto-filled and ready to go!
            </p>
          </div>
        </div>
      ) : (
        <p className="text-xs text-vendor-green-700">
          Use the demo credentials from your registration to login. Demo sessions are limited to 30 minutes.
        </p>
      )}
    </div>
  );
};

export default DemoInfoPanel;
