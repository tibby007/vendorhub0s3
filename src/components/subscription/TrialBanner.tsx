import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, AlertTriangle, CheckCircle, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TrialBannerProps {
  trialEnd: string;
  planType?: string;
  onUpgrade?: () => void;
}

const TrialBanner: React.FC<TrialBannerProps> = ({ 
  trialEnd, 
  planType = 'basic',
  onUpgrade 
}) => {
  const [timeRemaining, setTimeRemaining] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  
  const [trialProgress, setTrialProgress] = useState(0);
  const [isExpired, setIsExpired] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const end = new Date(trialEnd).getTime();
      const difference = end - now;

      if (difference <= 0) {
        setIsExpired(true);
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeRemaining({ days, hours, minutes, seconds });

      // Calculate trial progress (3 days = 100%)
      const totalTrialDuration = 3 * 24 * 60 * 60 * 1000; // 3 days in milliseconds
      const elapsed = totalTrialDuration - difference;
      const progress = Math.min(100, Math.max(0, (elapsed / totalTrialDuration) * 100));
      setTrialProgress(progress);
    };

    calculateTimeRemaining();
    const timer = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(timer);
  }, [trialEnd]);

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      navigate('/subscription');
    }
  };

  if (isExpired) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="w-5 h-5" />
            Trial Expired
          </CardTitle>
          <CardDescription className="text-red-600">
            Your 3-day trial has ended. Upgrade to continue using VendorHub.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleUpgrade} className="w-full">
            <Zap className="w-4 h-4 mr-2" />
            Upgrade Now
          </Button>
        </CardContent>
      </Card>
    );
  }

  const isWarning = timeRemaining.days === 0 && timeRemaining.hours < 24;
  const isCritical = timeRemaining.days === 0 && timeRemaining.hours < 6;

  return (
    <Card className={`border-2 ${
      isCritical 
        ? 'border-red-300 bg-red-50' 
        : isWarning 
        ? 'border-yellow-300 bg-yellow-50' 
        : 'border-green-300 bg-green-50'
    }`}>
      <CardHeader className="pb-3">
        <CardTitle className={`flex items-center gap-2 ${
          isCritical ? 'text-red-700' : isWarning ? 'text-yellow-700' : 'text-green-700'
        }`}>
          {isCritical ? (
            <AlertTriangle className="w-5 h-5" />
          ) : isWarning ? (
            <Clock className="w-5 h-5" />
          ) : (
            <CheckCircle className="w-5 h-5" />
          )}
          {isCritical ? 'Trial Ending Soon!' : isWarning ? 'Trial Ending Today' : 'Trial Active'}
        </CardTitle>
        <CardDescription className={
          isCritical ? 'text-red-600' : isWarning ? 'text-yellow-600' : 'text-green-600'
        }>
          {isCritical 
            ? 'Your trial ends in less than 6 hours. Upgrade now to avoid losing access.'
            : isWarning 
            ? 'Your trial ends today. Consider upgrading to continue using all features.'
            : 'You have a 3-day trial to explore VendorHub features.'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Trial Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Trial Progress</span>
            <span className="font-medium">{Math.round(trialProgress)}%</span>
          </div>
          <Progress value={trialProgress} className="h-2" />
        </div>

        {/* Time Remaining */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="bg-white rounded-lg p-2 border">
            <div className="text-lg font-bold text-gray-900">{timeRemaining.days}</div>
            <div className="text-xs text-gray-500">Days</div>
          </div>
          <div className="bg-white rounded-lg p-2 border">
            <div className="text-lg font-bold text-gray-900">{timeRemaining.hours}</div>
            <div className="text-xs text-gray-500">Hours</div>
          </div>
          <div className="bg-white rounded-lg p-2 border">
            <div className="text-lg font-bold text-gray-900">{timeRemaining.minutes}</div>
            <div className="text-xs text-gray-500">Minutes</div>
          </div>
          <div className="bg-white rounded-lg p-2 border">
            <div className="text-lg font-bold text-gray-900">{timeRemaining.seconds}</div>
            <div className="text-xs text-gray-500">Seconds</div>
          </div>
        </div>

        {/* Plan Info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="capitalize">
              {planType} Plan
            </Badge>
            <span className="text-sm text-gray-600">3-day trial</span>
          </div>
          <Button 
            onClick={handleUpgrade} 
            size="sm"
            className={isCritical ? 'bg-red-600 hover:bg-red-700' : ''}
          >
            <Zap className="w-4 h-4 mr-2" />
            Upgrade
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrialBanner;