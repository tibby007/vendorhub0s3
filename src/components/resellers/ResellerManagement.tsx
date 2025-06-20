
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Plus, 
  Search, 
  Eye, 
  Edit, 
  Trash2,
  ExternalLink
} from 'lucide-react';

interface Reseller {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: 'Active' | 'Inactive' | 'Pending';
  totalReferrals: number;
  activeSubscriptions: number;
  totalCommission: number;
  joinDate: string;
  lastActivity: string;
}

interface Commission {
  id: string;
  resellerId: string;
  partnerName: string;
  subscriptionTier: string;
  monthlyValue: number;
  commissionRate: number;
  commissionAmount: number;
  status: 'Pending' | 'Paid' | 'Due';
  period: string;
}

const ResellerManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Mock data
  const resellers: Reseller[] = [
    {
      id: '1',
      name: 'John Smith',
      email: 'john@salespartner.com',
      phone: '+1 (555) 123-4567',
      company: 'Sales Partner LLC',
      status: 'Active',
      totalReferrals: 12,
      activeSubscriptions: 8,
      totalCommission: 4750.00,
      joinDate: '2024-01-15',
      lastActivity: '2024-06-18'
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      email: 'sarah@bizgrowth.com',
      phone: '+1 (555) 987-6543',
      company: 'Business Growth Solutions',
      status: 'Active',
      totalReferrals: 8,
      activeSubscriptions: 6,
      totalCommission: 3200.00,
      joinDate: '2024-02-10',
      lastActivity: '2024-06-17'
    },
    {
      id: '3',
      name: 'Mike Chen',
      email: 'mike@techconnect.com',
      phone: '+1 (555) 456-7890',
      company: 'TechConnect Partners',
      status: 'Pending',
      totalReferrals: 2,
      activeSubscriptions: 1,
      totalCommission: 650.00,
      joinDate: '2024-06-01',
      lastActivity: '2024-06-15'
    }
  ];

  const commissions: Commission[] = [
    {
      id: '1',
      resellerId: '1',
      partnerName: 'ABC Solutions',
      subscriptionTier: 'Pro',
      monthlyValue: 197,
      commissionRate: 20,
      commissionAmount: 39.40,
      status: 'Due',
      period: 'June 2024'
    },
    {
      id: '2',
      resellerId: '1',
      partnerName: 'Tech Innovations',
      subscriptionTier: 'Premium',
      monthlyValue: 397,
      commissionRate: 20,
      commissionAmount: 79.40,
      status: 'Paid',
      period: 'June 2024'
    },
    {
      id: '3',
      resellerId: '2',
      partnerName: 'Growth Partners',
      subscriptionTier: 'Basic',
      monthlyValue: 97,
      commissionRate: 20,
      commissionAmount: 19.40,
      status: 'Due',
      period: 'June 2024'
    }
  ];

  const filteredResellers = resellers.filter(reseller => {
    const matchesSearch = reseller.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reseller.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reseller.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || reseller.status.toLowerCase() === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const totalStats = {
    totalResellers: resellers.length,
    activeResellers: resellers.filter(r => r.status === 'Active').length,
    totalCommissions: resellers.reduce((sum, r) => sum + r.totalCommission, 0),
    monthlyRecurring: commissions.reduce((sum, c) => sum + c.commissionAmount, 0)
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Reseller Management</h2>
        <p className="text-gray-600">Manage your affiliate partners and track commission payments</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Resellers</p>
                <p className="text-3xl font-bold text-gray-900">{totalStats.totalResellers}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Resellers</p>
                <p className="text-3xl font-bold text-green-600">{totalStats.activeResellers}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Commissions</p>
                <p className="text-3xl font-bold text-vendor-green-600">
                  ${totalStats.totalCommissions.toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-vendor-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monthly Recurring</p>
                <p className="text-3xl font-bold text-vendor-gold-600">
                  ${totalStats.monthlyRecurring.toFixed(2)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-vendor-gold-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="resellers" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="resellers">Resellers</TabsTrigger>
          <TabsTrigger value="commissions">Commissions</TabsTrigger>
        </TabsList>

        <TabsContent value="resellers" className="space-y-6">
          {/* Resellers Controls */}
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="flex gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search resellers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <Button className="bg-vendor-green-600 hover:bg-vendor-green-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Reseller
            </Button>
          </div>

          {/* Resellers Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Reseller</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Company</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Referrals</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Active Subs</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Total Commission</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResellers.map((reseller) => (
                      <tr key={reseller.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-900">{reseller.name}</p>
                            <p className="text-sm text-gray-600">{reseller.email}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-700">{reseller.company}</td>
                        <td className="py-3 px-4">
                          <Badge 
                            variant={reseller.status === 'Active' ? 'default' : 
                                   reseller.status === 'Pending' ? 'secondary' : 'outline'}
                          >
                            {reseller.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-gray-700">{reseller.totalReferrals}</td>
                        <td className="py-3 px-4 text-gray-700">{reseller.activeSubscriptions}</td>
                        <td className="py-3 px-4 font-medium text-gray-900">
                          ${reseller.totalCommission.toLocaleString()}
                        </td>
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
        </TabsContent>

        <TabsContent value="commissions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Commission Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Period</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Partner</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Tier</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Monthly Value</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Commission</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commissions.map((commission) => (
                      <tr key={commission.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-700">{commission.period}</td>
                        <td className="py-3 px-4 font-medium text-gray-900">{commission.partnerName}</td>
                        <td className="py-3 px-4">
                          <Badge variant="outline">{commission.subscriptionTier}</Badge>
                        </td>
                        <td className="py-3 px-4 text-gray-700">${commission.monthlyValue}</td>
                        <td className="py-3 px-4 font-medium text-gray-900">
                          ${commission.commissionAmount.toFixed(2)}
                          <span className="text-sm text-gray-500 ml-1">
                            ({commission.commissionRate}%)
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <Badge 
                            variant={commission.status === 'Paid' ? 'default' : 
                                   commission.status === 'Due' ? 'destructive' : 'secondary'}
                          >
                            {commission.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Button size="sm" variant="outline">
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ResellerManagement;
