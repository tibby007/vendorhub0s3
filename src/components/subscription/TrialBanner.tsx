import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, AlertTriangle, CheckCircle, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSubscriptionManager } from '@/contexts/SubscriptionContext';

interface TrialBannerProps {
  trialEnd?: string;
  planType?: string;
  onUpgrade?: () => void;
}

const TrialBanner: React.FC<TrialBannerProps> = ({ 
  trialEnd: propTrialEnd, 
  planType,
  onUpgrade 
}) => {
  const { subscription, isTrialUser, daysRemaining } = useSubscriptionManager();
  const [timeRemaining, setTimeRemaining] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  
  const [trialProgress, setTrialProgress] = useState(0);
  const [isExpired, setIsExpired] = useState(false);
  const [isValidDate, setIsValidDate] = useState(false);
  const navigate = useNavigate();

  // Use prop trialEnd if provided, otherwise use from subscription context
  const trialEnd = propTrialEnd || subscription.trialEnd || subscription.endDate;
  
  // Use subscription tier if available, otherwise use prop, with fallback to 'basic'
  const currentPlanType = subscription.tier || planType || 'basic';

  useEffect(() => {
    const calculateTimeRemaining = () => {
      if (!trialEnd) {
        console.warn('No trial end date provided to TrialBanner');
        setIsValidDate(false);
        return;
      }

      const endDate = new Date(trialEnd);
      
      // Check if the date is valid
      if (isNaN(endDate.getTime())) {
        console.error('Invalid trial end date:', trialEnd);
        setIsValidDate(false);
        return;
      }

      setIsValidDate(true);
      const now = new Date().getTime();
      const end = endDate.getTime();
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

  // Don't show banner if not a trial user, if date is invalid, or if already subscribed
  if (!isTrialUser || !isValidDate || subscription.subscribed) {
    return null;
  }
  
  // Additional safety check - don't render if essential data is missing
  if (!trialEnd) {
    console.warn('[TrialBanner] No trial end date available, not rendering');
    return null;
  }
  
  // Don't render until subscription context has loaded to avoid showing wrong tier
  if (subscription.isLoading) {
    return null;
  }

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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className={`w-5 h-5 ${
              isCritical ? 'text-red-600' : isWarning ? 'text-yellow-600' : 'text-green-600'
            }`} />
            <CardTitle className={`text-lg ${
              isCritical ? 'text-red-700' : isWarning ? 'text-yellow-700' : 'text-green-700'
            }`}>
              Trial Active
            </CardTitle>
            <Badge variant="outline" className={
              isCritical ? 'border-red-300 text-red-700' : 
              isWarning ? 'border-yellow-300 text-yellow-700' : 
              'border-green-300 text-green-700'
            }>
              {currentPlanType.charAt(0).toUpperCase() + currentPlanType.slice(1)} Plan
            </Badge>
          </div>
          <Button 
            size="sm" 
            onClick={handleUpgrade}
            className={
              isCritical ? 'bg-red-600 hover:bg-red-700' : 
              isWarning ? 'bg-yellow-600 hover:bg-yellow-700' : 
              'bg-green-600 hover:bg-green-700'
            }
          >
            <Zap className="w-4 h-4 mr-2" />
            Upgrade
          </Button>
        </div>
        <CardDescription className={
          isCritical ? 'text-red-600' : isWarning ? 'text-yellow-600' : 'text-green-600'
        }>
          3-day trial to explore VendorHub features
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Trial Progress</span>
            <span className="text-gray-600">{Math.round(trialProgress)}%</span>
          </div>
          <Progress 
            value={trialProgress} 
            className={`h-2 ${
              isCritical ? 'bg-red-100' : isWarning ? 'bg-yellow-100' : 'bg-green-100'
            }`}
          />
        </div>

        {/* Countdown Timer */}
        <div className="bg-white rounded-lg p-4 border">
          <div className="flex items-center gap-2 mb-3">
            <Clock className={`w-4 h-4 ${
              isCritical ? 'text-red-600' : isWarning ? 'text-yellow-600' : 'text-green-600'
            }`} />
            <span className="text-sm font-medium text-gray-700">Time Remaining</span>
          </div>
          
          <div className="grid grid-cols-4 gap-3">
            <div className="text-center">
              <div className={`text-2xl font-bold ${
                isCritical ? 'text-red-600' : isWarning ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {timeRemaining.days}
              </div>
              <div className="text-xs text-gray-500">Days</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${
                isCritical ? 'text-red-600' : isWarning ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {timeRemaining.hours.toString().padStart(2, '0')}
              </div>
              <div className="text-xs text-gray-500">Hours</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${
                isCritical ? 'text-red-600' : isWarning ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {timeRemaining.minutes.toString().padStart(2, '0')}
              </div>
              <div className="text-xs text-gray-500">Minutes</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${
                isCritical ? 'text-red-600' : isWarning ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {timeRemaining.seconds.toString().padStart(2, '0')}
              </div>
              <div className="text-xs text-gray-500">Seconds</div>
            </div>
          </div>
        </div>

        {/* Trial Features */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Trial Includes:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Up to 3 vendor submissions</li>
            <li>• Basic vendor management tools</li>
            <li>• Standard support</li>
            <li>• 5GB storage space</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrialBanner;