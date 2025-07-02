import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, CreditCard, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';

const TrialBanner = () => {
  const { subscriptionData } = useAuth();
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number } | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  console.log('🔍 TrialBanner render:', { 
    subscriptionData, 
    isTrialUser: !subscriptionData?.subscribed && subscriptionData?.subscription_end,
    isVisible 
  });

  useEffect(() => {
    if (!subscriptionData?.subscription_end || subscriptionData.subscribed) {
      console.log('❌ TrialBanner: Not showing banner', { 
        hasEnd: !!subscriptionData?.subscription_end, 
        subscribed: subscriptionData?.subscribed 
      });
      return;
    }

    const calculateTimeLeft = () => {
      const endTime = new Date(subscriptionData.subscription_end!);
      const now = new Date();
      const difference = endTime.getTime() - now.getTime();

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        
        setTimeLeft({ days, hours, minutes });
      } else {
        setTimeLeft(null);
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 60000); // Update every minute

    return () => clearInterval(timer);
  }, [subscriptionData]);

  // Show banner for trial users (not subscribed but has subscription_end)
  if (!subscriptionData?.subscription_end || subscriptionData.subscribed || !timeLeft || !isVisible) {
    return null;
  }

  const isExpiringSoon = timeLeft.days <= 1;

  return (
    <Card className={`mb-6 border-l-4 ${isExpiringSoon ? 'border-l-red-500 bg-red-50' : 'border-l-yellow-500 bg-yellow-50'}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Clock className={`w-5 h-5 ${isExpiringSoon ? 'text-red-600' : 'text-yellow-600'}`} />
            <div>
              <h3 className={`font-semibold ${isExpiringSoon ? 'text-red-800' : 'text-yellow-800'}`}>
                {isExpiringSoon ? 'Trial Ending Soon!' : 'Free Trial Active'}
              </h3>
              <p className={`text-sm ${isExpiringSoon ? 'text-red-700' : 'text-yellow-700'}`}>
                Your trial expires in {timeLeft.days} day{timeLeft.days !== 1 ? 's' : ''}, {timeLeft.hours} hour{timeLeft.hours !== 1 ? 's' : ''}, and {timeLeft.minutes} minute{timeLeft.minutes !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button asChild size="sm" className={isExpiringSoon ? 'bg-red-600 hover:bg-red-700' : 'bg-yellow-600 hover:bg-yellow-700'}>
              <Link to="/subscription">
                <CreditCard className="w-4 h-4 mr-2" />
                Upgrade Now
              </Link>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsVisible(false)}
              className={isExpiringSoon ? 'text-red-600 hover:text-red-700' : 'text-yellow-600 hover:text-yellow-700'}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrialBanner;