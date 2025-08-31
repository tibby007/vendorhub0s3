import React, { useEffect, useState } from 'react';
import { Clock, Crown, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface TrialCountdownProps {
  trialEnd: string;
  onUpgrade?: () => void;
}

const TrialCountdown: React.FC<TrialCountdownProps> = ({ trialEnd, onUpgrade }) => {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isExpired, setIsExpired] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime();
      const end = new Date(trialEnd).getTime();
      const diff = end - now;
      
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        setIsExpired(true);
        return;
      }
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ days, hours, minutes, seconds });
      setIsExpired(false);
    };
    
    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
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
      <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
            <div>
              <p className="text-red-800 font-semibold">Trial Expired</p>
              <p className="text-red-600 text-sm">Your 3-day trial has ended. Upgrade now to continue using VendorHub.</p>
            </div>
          </div>
          <Button 
            onClick={handleUpgrade}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <Crown className="h-4 w-4 mr-2" />
            Upgrade Now
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-vendor-green-50 to-vendor-gold-50 border-l-4 border-vendor-green-500 p-4 mb-6 rounded-r-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Clock className="h-5 w-5 text-vendor-green-600 mr-3" />
          <div>
            <p className="text-vendor-green-800 font-semibold">Free Trial Active</p>
            <div className="flex items-center gap-4 mt-1">
              <span className="text-vendor-green-700 text-sm">Time remaining:</span>
              <div className="flex gap-2 text-lg font-bold text-vendor-green-800">
                <span>{timeLeft.days}d</span>
                <span>{timeLeft.hours}h</span>
                <span>{timeLeft.minutes}m</span>
              </div>
            </div>
          </div>
        </div>
        <Button 
          onClick={handleUpgrade}
          variant="outline"
          className="border-vendor-green-600 text-vendor-green-700 hover:bg-vendor-green-100"
        >
          <Crown className="h-4 w-4 mr-2" />
          Upgrade
        </Button>
      </div>
    </div>
  );
};

export default TrialCountdown; 