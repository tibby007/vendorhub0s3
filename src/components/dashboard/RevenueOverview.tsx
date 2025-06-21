
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const RevenueOverview = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Overview</CardTitle>
        <CardDescription>Monthly recurring revenue by subscription tier</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-600 font-medium">Basic Plan</p>
            <p className="text-2xl font-bold text-blue-900">$97</p>
            <p className="text-xs text-blue-600">1 subscriber</p>
          </div>
          <div className="text-center p-4 bg-vendor-green-50 rounded-lg">
            <p className="text-sm text-vendor-green-600 font-medium">Pro Plan</p>
            <p className="text-2xl font-bold text-vendor-green-900">$591</p>
            <p className="text-xs text-vendor-green-600">3 subscribers</p>
          </div>
          <div className="text-center p-4 bg-vendor-gold-50 rounded-lg">
            <p className="text-sm text-vendor-gold-600 font-medium">Premium Plan</p>
            <p className="text-2xl font-bold text-vendor-gold-900">$797</p>
            <p className="text-xs text-vendor-gold-600">2 subscribers</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RevenueOverview;
