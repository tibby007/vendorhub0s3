import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, UserPlus, Building, Eye, Edit, Trash2, Shield, DollarSign } from 'lucide-react';
import ResellerManagement from '@/components/resellers/ResellerManagement';
import AddPartnerAdminForm from '@/components/admin/AddPartnerAdminForm';
import AddResellerForm from '@/components/admin/AddResellerForm';

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
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Shield className="w-7 h-7 text-vendor-green-500" />
              Super Admin Dashboard
            </h1>
            <p className="text-gray-600 mt-1">Manage the entire VendorHub platform</p>
          </div>
          <div className="flex gap-3">
            <Dialog open={isAddPartnerDialogOpen} onOpenChange={setIsAddPartnerDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-vendor-green-500 hover:bg-vendor-green-600">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Partner Admin
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Partner Admin</DialogTitle>
                  <DialogDescription>
                    Create a new partner administrator account
                  </DialogDescription>
                </DialogHeader>
                <AddPartnerAdminForm onSuccess={() => setIsAddPartnerDialogOpen(false)} />
              </DialogContent>
            </Dialog>
            
            <Dialog open={isAddResellerDialogOpen} onOpenChange={setIsAddResellerDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-vendor-gold-300 text-vendor-gold-700 hover:bg-vendor-gold-50">
                  <Building className="w-4 h-4 mr-2" />
                  Add Reseller
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Reseller</DialogTitle>
                  <DialogDescription>
                    Add a new reseller to the platform
                  </DialogDescription>
                </DialogHeader>
                <AddResellerForm onSuccess={() => setIsAddResellerDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="card-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Partners</p>
                  <p className="text-3xl font-bold text-vendor-green-600">{platformStats.totalPartners}</p>
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
                  <p className="text-3xl font-bold text-blue-600">{platformStats.totalVendors}</p>
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
                  <p className="text-3xl font-bold text-vendor-gold-600">${platformStats.monthlyRevenue}</p>
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
                  <p className="text-3xl font-bold text-purple-600">{platformStats.totalResellers}</p>
                </div>
                <Users className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="partners">Partner Management</TabsTrigger>
            <TabsTrigger value="resellers">Reseller Program</TabsTrigger>
          </TabsList>

          <TabsContent value="partners" className="space-y-6">
            {/* Partner Admin Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Partner Admin Accounts
                </CardTitle>
                <CardDescription>
                  Manage partner administrator accounts and their vendor networks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Name</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Company</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Email</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Subscription</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Vendors</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {partnerAdmins.map((admin) => (
                        <tr key={admin.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{admin.name}</td>
                          <td className="py-3 px-4">{admin.company}</td>
                          <td className="py-3 px-4 text-gray-600">{admin.email}</td>
                          <td className="py-3 px-4">
                            <Badge 
                              variant={admin.subscription === 'Premium' ? 'default' : 
                                     admin.subscription === 'Pro' ? 'secondary' : 'outline'}
                            >
                              {admin.subscription}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant={admin.status === 'Active' ? 'default' : 'secondary'}>
                              {admin.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">{admin.vendors}</td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Revenue Analytics */}
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
