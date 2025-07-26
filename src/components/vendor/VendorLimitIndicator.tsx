import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscriptionManager } from '@/hooks/useSubscriptionManager';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import { Users, Crown, Zap } from 'lucide-react';

interface VendorLimitIndicatorProps {
  vendorCount?: number;
  onVendorCountChange?: (count: number) => void;
}

const VendorLimitIndicator: React.FC<VendorLimitIndicatorProps> = ({ 
  vendorCount: externalVendorCount,
  onVendorCountChange 
}) => {
  const { user } = useAuth();
  const { subscription } = useSubscriptionManager();
  const navigate = useNavigate();
  const [vendorCount, setVendorCount] = useState(externalVendorCount || 0);

  const vendorLimits = {
    basic: 3,
    pro: 7,
    premium: 999999
  };

  const limit = vendorLimits[subscription.tier?.toLowerCase() as keyof typeof vendorLimits] || 3;
  const percentage = Math.min((vendorCount / limit) * 100, 100);
  const isNearLimit = vendorCount >= limit * 0.8;
  const isAtLimit = vendorCount >= limit;

  useEffect(() => {
    if (!externalVendorCount && user?.id) {
      const fetchVendorCount = async () => {
        const { count } = await supabase
          .from('vendors')
          .select('*', { count: 'exact' })
          .eq('partner_admin_id', user.id);
        
        const newCount = count || 0;
        setVendorCount(newCount);
        onVendorCountChange?.(newCount);
      };
      fetchVendorCount();
    } else if (externalVendorCount !== undefined) {
      setVendorCount(externalVendorCount);
    }
  }, [externalVendorCount, user?.id, onVendorCountChange]);

  const getPlanIcon = () => {
    switch (subscription.tier?.toLowerCase()) {
      case 'premium':
        return <Crown className="w-4 h-4 text-gold-600" />;
      case 'pro':
        return <Zap className="w-4 h-4 text-purple-600" />;
      default:
        return <Users className="w-4 h-4 text-blue-600" />;
    }
  };

  const getCardStyle = () => {
    if (isAtLimit) return 'border-red-200 bg-red-50';
    if (isNearLimit) return 'border-yellow-200 bg-yellow-50';
    return 'border-green-200 bg-green-50';
  };

  const getProgressColor = () => {
    if (isAtLimit) return 'bg-red-500';
    if (isNearLimit) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <Card className={getCardStyle()}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {getPlanIcon()}
            <div>
              <p className="text-sm font-medium">
                Vendors: {vendorCount} / {limit === 999999 ? '∞' : limit}
              </p>
              <p className="text-xs text-muted-foreground capitalize">
                {subscription.tier?.toLowerCase() || 'basic'} Plan
              </p>
            </div>
          </div>
          {isAtLimit && (
            <Button 
              size="sm" 
              onClick={() => navigate('/subscription')}
              className="text-xs"
            >
              Upgrade
            </Button>
          )}
        </div>
        
        {limit !== 999999 && (
          <div className="space-y-2">
            <Progress 
              value={percentage} 
              className="h-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{limit - vendorCount} remaining</span>
              <span>{percentage.toFixed(0)}% used</span>
            </div>
          </div>
        )}

        {isNearLimit && !isAtLimit && (
          <div className="mt-2 text-xs text-yellow-700">
            You're approaching your vendor limit. Consider upgrading soon.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VendorLimitIndicator;