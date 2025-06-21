
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Building, DollarSign } from 'lucide-react';

interface SuperAdminStatsProps {
  totalPartners: number;
  totalVendors: number;
  monthlyRevenue: number;
  totalResellers: number;
}

const SuperAdminStats = ({ totalPartners, totalVendors, monthlyRevenue, totalResellers }: SuperAdminStatsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card className="card-hover">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Partners</p>
              <p className="text-3xl font-bold text-vendor-green-600">{totalPartners}</p>
            </div>
            <Users className="w-8 h-8 text-vendor-green-500" />
          </div>
        </CardContent>
      </Card>
      
      <Card className="card-hover">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Vendors</p>
              <p className="text-3xl font-bold text-blue-600">{totalVendors}</p>
            </div>
            <Building className="w-8 h-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>
      
      <Card className="card-hover">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
              <p className="text-3xl font-bold text-vendor-gold-600">${monthlyRevenue}</p>
            </div>
            <DollarSign className="w-8 h-8 text-vendor-gold-500" />
          </div>
        </CardContent>
      </Card>
      
      <Card className="card-hover">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Resellers</p>
              <p className="text-3xl font-bold text-purple-600">{totalResellers}</p>
            </div>
            <Users className="w-8 h-8 text-purple-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SuperAdminStats;
