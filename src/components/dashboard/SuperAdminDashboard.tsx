
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ResellerManagement from '@/components/resellers/ResellerManagement';
import DemoLeadsManagement from '@/components/demo/DemoLeadsManagement';
import SuperAdminHeader from './SuperAdminHeader';
import SuperAdminStats from './SuperAdminStats';
import PartnersTable from './PartnersTable';
import RevenueOverview from './RevenueOverview';

const SuperAdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('partners');
  const [isAddPartnerDialogOpen, setIsAddPartnerDialogOpen] = useState(false);
  const [isAddResellerDialogOpen, setIsAddResellerDialogOpen] = useState(false);

  // Mock data
  const partnerAdmins = [
    { id: 1, name: 'Sarah Johnson', email: 'sarah@partner1.com', company: 'TechFlow Partners', status: 'Active', vendors: 12, subscription: 'Pro' },
    { id: 2, name: 'Michael Chen', email: 'michael@partner2.com', company: 'GlobalVend Solutions', status: 'Active', vendors: 8, subscription: 'Premium' },
    { id: 3, name: 'Lisa Rodriguez', email: 'lisa@partner3.com', company: 'Prime Business Hub', status: 'Pending', vendors: 0, subscription: 'Basic' }
  ];

  const platformStats = {
    totalPartners: partnerAdmins.length,
    totalVendors: partnerAdmins.reduce((sum, p) => sum + p.vendors, 0),
    monthlyRevenue: 1485, // Based on subscription tiers
    totalResellers: 3
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SuperAdminHeader
        isAddPartnerDialogOpen={isAddPartnerDialogOpen}
        setIsAddPartnerDialogOpen={setIsAddPartnerDialogOpen}
        isAddResellerDialogOpen={isAddResellerDialogOpen}
        setIsAddResellerDialogOpen={setIsAddResellerDialogOpen}
      />

      <div className="p-6 space-y-6">
        <SuperAdminStats
          totalPartners={platformStats.totalPartners}
          totalVendors={platformStats.totalVendors}
          monthlyRevenue={platformStats.monthlyRevenue}
          totalResellers={platformStats.totalResellers}
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="partners">Partner Management</TabsTrigger>
            <TabsTrigger value="demo-leads">Demo Leads</TabsTrigger>
            <TabsTrigger value="resellers">Reseller Program</TabsTrigger>
          </TabsList>

          <TabsContent value="partners" className="space-y-6">
            <PartnersTable partnerAdmins={partnerAdmins} />
            <RevenueOverview />
          </TabsContent>

          <TabsContent value="demo-leads" className="space-y-6">
            <DemoLeadsManagement />
          </TabsContent>

          <TabsContent value="resellers" className="space-y-6">
            <ResellerManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
