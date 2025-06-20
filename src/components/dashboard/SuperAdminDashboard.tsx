
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, UserPlus, Building, Eye, Edit, Trash2, Shield } from 'lucide-react';

const SuperAdminDashboard = () => {
  // Mock data
  const partnerAdmins = [
    { id: 1, name: 'Sarah Johnson', email: 'sarah@partner1.com', company: 'TechFlow Partners', status: 'Active', vendors: 12 },
    { id: 2, name: 'Michael Chen', email: 'michael@partner2.com', company: 'GlobalVend Solutions', status: 'Active', vendors: 8 },
    { id: 3, name: 'Lisa Rodriguez', email: 'lisa@partner3.com', company: 'Prime Business Hub', status: 'Pending', vendors: 0 }
  ];

  const resellers = [
    { id: 1, name: 'QuickFinance Corp', contact: 'David Wilson', email: 'david@quickfinance.com', status: 'Active', deals: 45 },
    { id: 2, name: 'BusinessBoost LLC', contact: 'Emma Thompson', email: 'emma@businessboost.com', status: 'Active', deals: 32 },
    { id: 3, name: 'VendorConnect Pro', contact: 'James Brown', email: 'james@vendorconnect.com', status: 'Inactive', deals: 15 }
  ];

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
            <p className="text-gray-600 mt-1">Manage partner admins and reseller accounts</p>
          </div>
          <div className="flex gap-3">
            <Button className="bg-vendor-green-500 hover:bg-vendor-green-600">
              <UserPlus className="w-4 h-4 mr-2" />
              Add Partner Admin
            </Button>
            <Button variant="outline" className="border-vendor-gold-300 text-vendor-gold-700 hover:bg-vendor-gold-50">
              <Building className="w-4 h-4 mr-2" />
              Add Reseller
            </Button>
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
                  <p className="text-3xl font-bold text-vendor-green-600">3</p>
                </div>
                <Users className="w-8 h-8 text-vendor-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="card-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Resellers</p>
                  <p className="text-3xl font-bold text-vendor-gold-600">2</p>
                </div>
                <Building className="w-8 h-8 text-vendor-gold-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="card-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Vendors</p>
                  <p className="text-3xl font-bold text-gray-700">20</p>
                </div>
                <Users className="w-8 h-8 text-gray-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="card-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Reviews</p>
                  <p className="text-3xl font-bold text-red-600">1</p>
                </div>
                <Shield className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

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

        {/* Reseller Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5" />
              Reseller Accounts
            </CardTitle>
            <CardDescription>
              Manage reseller partnerships and deal flow
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Company</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Contact</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Email</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Deals</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {resellers.map((reseller) => (
                    <tr key={reseller.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{reseller.name}</td>
                      <td className="py-3 px-4">{reseller.contact}</td>
                      <td className="py-3 px-4 text-gray-600">{reseller.email}</td>
                      <td className="py-3 px-4">
                        <Badge variant={reseller.status === 'Active' ? 'default' : 'secondary'}>
                          {reseller.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">{reseller.deals}</td>
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
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
