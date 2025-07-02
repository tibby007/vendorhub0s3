import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Clock, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const SubscriptionWidget = () => {
  const { subscriptionData } = useAuth();
  const navigate = useNavigate();

  console.log('🔍 SubscriptionWidget render:', { subscriptionData });

  if (!subscriptionData) return null;

  const isTrialUser = !subscriptionData.subscribed && subscriptionData.subscription_end;
  const isSubscribed = subscriptionData.subscribed;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Subscription Status</CardTitle>
        <CreditCard className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Status:</span>
            <Badge variant={isSubscribed ? "default" : isTrialUser ? "secondary" : "destructive"}>
              {isSubscribed ? "Active" : isTrialUser ? "Trial" : "No Plan"}
            </Badge>
          </div>
          
          {subscriptionData.subscription_tier && (
            <div className="flex items-center justify-between">
              <span className="text-sm">Plan:</span>
              <span className="text-sm font-medium">{subscriptionData.subscription_tier}</span>
            </div>
          )}
          
          {isTrialUser && subscriptionData.subscription_end && (
            <div className="flex items-center justify-between">
              <span className="text-sm">Trial ends:</span>
              <span className="text-sm text-orange-600 font-medium">
                {new Date(subscriptionData.subscription_end).toLocaleDateString()}
              </span>
            </div>
          )}
          
          {isSubscribed && subscriptionData.subscription_end && (
            <div className="flex items-center justify-between">
              <span className="text-sm">Next billing:</span>
              <span className="text-sm text-green-600">
                {new Date(subscriptionData.subscription_end).toLocaleDateString()}
              </span>
            </div>
          )}
          
          <Button 
            size="sm" 
            className="w-full mt-3" 
            onClick={() => navigate('/settings')}
            variant={isTrialUser ? "default" : "outline"}
          >
            <Settings className="w-4 h-4 mr-2" />
            {isTrialUser ? "Upgrade Now" : "Manage Subscription"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SubscriptionWidget;