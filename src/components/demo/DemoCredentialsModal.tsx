
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, ArrowRight, Lock, Mail, Timer } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

interface DemoCredentialsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  credentials: {
    email: string;
    password: string;
    role: string;
  };
  sessionId: string;
}

const DemoCredentialsModal = ({ isOpen, onOpenChange, credentials, sessionId }: DemoCredentialsModalProps) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success(`${field} copied to clipboard!`);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const copyAllCredentials = async () => {
    const credentialsText = `Demo Credentials:\nEmail: ${credentials.email}\nPassword: ${credentials.password}\nRole: ${credentials.role}`;
    await copyToClipboard(credentialsText, 'All credentials');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-vendor-green-500 rounded-lg flex items-center justify-center">
              <Lock className="w-4 h-4 text-white" />
            </div>
            Demo Access Ready!
          </DialogTitle>
          <DialogDescription>
            Your secure demo credentials have been generated. Please save these credentials before proceeding.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Session Info */}
          <div className="bg-vendor-green-50 border border-vendor-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Timer className="w-4 h-4 text-vendor-green-600" />
              <span className="text-sm font-medium text-vendor-green-900">Demo Session Active</span>
              <Badge variant="secondary" className="bg-vendor-green-100 text-vendor-green-700 text-xs">
                30 Minutes
              </Badge>
            </div>
            <p className="text-xs text-vendor-green-700">
              Session ID: {sessionId.substring(0, 16)}...
            </p>
          </div>

          {/* Credentials */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Your Demo Credentials
            </h4>
            
            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <Mail className="w-3 h-3" />
                Email
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-50 border rounded px-3 py-2 font-mono text-sm">
                  {credentials.email}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(credentials.email, 'Email')}
                  className="flex items-center gap-1"
                >
                  {copiedField === 'Email' ? (
                    <Check className="w-3 h-3 text-green-600" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </Button>
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                Password
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-50 border rounded px-3 py-2 font-mono text-sm">
                  {credentials.password}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(credentials.password, 'Password')}
                  className="flex items-center gap-1"
                >
                  {copiedField === 'Password' ? (
                    <Check className="w-3 h-3 text-green-600" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </Button>
              </div>
            </div>

            {/* Role Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-900">
                <strong>Demo Role:</strong> {credentials.role}
              </p>
              <p className="text-xs text-blue-700 mt-1">
                You'll have access to all features available to this role during your demo session.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 pt-4">
            <Button 
              onClick={copyAllCredentials}
              variant="outline" 
              className="w-full"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy All Credentials
            </Button>
            
            <Button asChild className="w-full bg-vendor-green-600 hover:bg-vendor-green-700">
              <Link to="/auth" className="flex items-center justify-center gap-2">
                Start Demo Session
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>

          {/* Warning */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs text-amber-800">
              <strong>Important:</strong> Please save these credentials before closing this dialog. 
              Your demo session will expire after 30 minutes of inactivity.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DemoCredentialsModal;
