
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import SubscriptionPlans from '@/components/subscription/SubscriptionPlans';
import SubscriptionManager from '@/components/subscription/SubscriptionManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Subscription = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth');
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-vendor-green-50 via-white to-vendor-gold-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-vendor-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-vendor-green-50 via-white to-vendor-gold-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Subscription Management</h1>
            <p className="text-lg text-gray-600">
              Manage your VendorHub subscription and explore our plans
            </p>
          </div>

          <Tabs defaultValue="status" className="space-y-8">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="status">Current Subscription</TabsTrigger>
              <TabsTrigger value="plans">Available Plans</TabsTrigger>
            </TabsList>
            
            <TabsContent value="status" className="space-y-6">
              <SubscriptionManager />
            </TabsContent>
            
            <TabsContent value="plans" className="space-y-6">
              <SubscriptionPlans />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Subscription;
