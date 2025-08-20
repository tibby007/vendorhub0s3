import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, User } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DemoSessionManagerProps {
  sessionDuration?: number; // ignored - no time limits
  onSessionExpired?: () => void; // ignored
  onUpgradePrompted?: () => void; // ignored
  onUpgradeClicked?: () => void;
}

const DemoSessionManager = ({ 
  onUpgradeClicked
}: DemoSessionManagerProps) => {
  const handleUpgradeClick = () => {
    onUpgradeClicked?.();
  };

  return (
    <div className="fixed top-4 right-4 z-50 w-80">
      <Card className="shadow-lg border-vendor-green-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-vendor-green-600" />
              <span className="text-sm font-medium">Demo Mode</span>
            </div>
          </div>
          
          <div className="text-center mb-3">
            <div className="text-sm text-vendor-green-600 font-medium">
              Unlimited Access
            </div>
            <div className="text-xs text-gray-500">explore all features</div>
          </div>

          <div className="space-y-2">
            <Button 
              asChild 
              size="sm" 
              className="w-full bg-vendor-green-600 hover:bg-vendor-green-700"
              onClick={handleUpgradeClick}
            >
              <Link to="/auth">
                Get Full Access
                <ArrowRight className="w-3 h-3 ml-2" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DemoSessionManager;