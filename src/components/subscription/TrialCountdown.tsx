import React, { useEffect, useState } from 'react';

interface TrialCountdownProps {
  trialEnd: string;
}

const TrialCountdown: React.FC<TrialCountdownProps> = ({ trialEnd }) => {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime();
      const end = new Date(trialEnd).getTime();
      const diff = end - now;
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ days, hours, minutes, seconds });
    };
    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [trialEnd]);

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center mb-4">
      <div className="text-lg font-semibold text-yellow-800 mb-2">Trial Active</div>
      <div className="text-yellow-700">Time remaining in your free trial:</div>
      <div className="flex justify-center gap-4 mt-2 text-2xl font-bold">
        <span>{timeLeft.days}d</span>
        <span>{timeLeft.hours}h</span>
        <span>{timeLeft.minutes}m</span>
        <span>{timeLeft.seconds}s</span>
      </div>
    </div>
  );
};

export default TrialCountdown; 