
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, ArrowRight, Phone, X } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DemoSessionManagerProps {
  sessionDuration?: number; // in minutes
  onSessionExpired?: () => void;
}

const DemoSessionManager = ({ sessionDuration = 30, onSessionExpired }: DemoSessionManagerProps) => {
  const [timeRemaining, setTimeRemaining] = useState(sessionDuration * 60); // in seconds
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          onSessionExpired?.();
          return 0;
        }
        
        // Show upgrade prompt at 10 minutes and 5 minutes remaining
        if (prev === 600 || prev === 300) {
          setShowUpgradePrompt(true);
        }
        
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onSessionExpired]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    if (timeRemaining <= 300) return 'text-red-600'; // Last 5 minutes
    if (timeRemaining <= 600) return 'text-orange-600'; // Last 10 minutes
    return 'text-vendor-green-600';
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsMinimized(false)}
          className="bg-vendor-green-600 hover:bg-vendor-green-700 shadow-lg"
        >
          <Clock className="w-4 h-4 mr-2" />
          <span className={getTimeColor()}>{formatTime(timeRemaining)}</span>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="fixed top-4 right-4 z-50 w-80">
        <Card className="shadow-lg border-vendor-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-vendor-green-600" />
                <span className="text-sm font-medium">Demo Session</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(true)}
                className="h-6 w-6 p-0"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
            
            <div className="text-center mb-3">
              <div className={`text-2xl font-bold ${getTimeColor()}`}>
                {formatTime(timeRemaining)}
              </div>
              <div className="text-xs text-gray-500">remaining</div>
            </div>

            <div className="space-y-2">
              <Button 
                asChild 
                size="sm" 
                className="w-full bg-vendor-green-600 hover:bg-vendor-green-700"
              >
                <a href="https://api.leadconnectorhq.com/widget/bookings/vendorhub" target="_blank" rel="noopener noreferrer">
                  <Phone className="w-3 h-3 mr-2" />
                  Book Full Demo
                </a>
              </Button>
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link to="/auth">
                  Start Free Trial
                  <ArrowRight className="w-3 h-3 ml-2" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {showUpgradePrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-6 text-center">
              <Clock className="w-12 h-12 text-orange-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold mb-2">Demo Time Running Low</h3>
              <p className="text-gray-600 mb-4">
                You have {Math.floor(timeRemaining / 60)} minutes left in your demo session.
              </p>
              <div className="space-y-3">
                <Button 
                  asChild 
                  className="w-full bg-vendor-green-600 hover:bg-vendor-green-700"
                >
                  <a href="https://api.leadconnectorhq.com/widget/bookings/vendorhub" target="_blank" rel="noopener noreferrer">
                    <Phone className="w-4 h-4 mr-2" />
                    Schedule Extended Demo
                  </a>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/auth">Start Free Trial</Link>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowUpgradePrompt(false)}
                  className="w-full"
                >
                  Continue Demo
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {timeRemaining === 0 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-6 text-center">
              <Clock className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold mb-2">Demo Session Expired</h3>
              <p className="text-gray-600 mb-4">
                Your demo session has ended. Ready to continue with VendorHub?
              </p>
              <div className="space-y-3">
                <Button 
                  asChild 
                  className="w-full bg-vendor-green-600 hover:bg-vendor-green-700"
                >
                  <a href="https://api.leadconnectorhq.com/widget/bookings/vendorhub" target="_blank" rel="noopener noreferrer">
                    <Phone className="w-4 h-4 mr-2" />
                    Book Personalized Demo
                  </a>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/auth">Start Free Trial</Link>
                </Button>
                <Button asChild variant="ghost" size="sm" className="w-full">
                  <Link to="/">Back to Home</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};

export default DemoSessionManager;
