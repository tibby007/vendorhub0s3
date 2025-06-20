
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, FileText, BookOpen, Settings, Bell, TrendingUp, Clock } from 'lucide-react';

const PartnerAdminDashboard = () => {
  const pendingSubmissions = [
    { id: 1, customer: 'ABC Manufacturing', vendor: 'TechVendor Pro', submitted: '2 hours ago', status: 'Pending Review' },
    { id: 2, customer: 'XYZ Services', vendor: 'BusinessFlow LLC', submitted: '5 hours ago', status: 'Manual Review' },
    { id: 3, customer: 'Global Dynamics', vendor: 'VendorMax Inc', submitted: '1 day ago', status: 'Pending Review' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-7 h-7 text-vendor-green-500" />
              Partner Admin Dashboard
            </h1>
            <p className="text-gray-600 mt-1">Manage your vendor network and submissions</p>
          </div>
          <Button className="bg-vendor-green-500 hover:bg-vendor-green-600">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="card-hover cursor-pointer border-l-4 border-l-vendor-green-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">Vendor Management</h3>
                  <p className="text-sm text-gray-600 mt-1">Manage your vendor network</p>
                </div>
                <Users className="w-8 h-8 text-vendor-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover cursor-pointer border-l-4 border-l-vendor-gold-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">Deal Submissions</h3>
                  <p className="text-sm text-gray-600 mt-1">CRM & submission tracking</p>
                </div>
                <FileText className="w-8 h-8 text-vendor-gold-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover cursor-pointer border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">Resources</h3>
                  <p className="text-sm text-gray-600 mt-1">Guidelines & documentation</p>
                </div>
                <BookOpen className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover cursor-pointer border-l-4 border-l-gray-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">Account Settings</h3>
                  <p className="text-sm text-gray-600 mt-1">Profile & preferences</p>
                </div>
                <Settings className="w-8 h-8 text-gray-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Vendors</p>
                  <p className="text-3xl font-bold text-vendor-green-600">12</p>
                </div>
                <Users className="w-8 h-8 text-vendor-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Submissions</p>
                  <p className="text-3xl font-bold text-vendor-gold-600">3</p>
                </div>
                <Clock className="w-8 h-8 text-vendor-gold-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">This Month</p>
                  <p className="text-3xl font-bold text-blue-600">28</p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Approval Rate</p>
                  <p className="text-3xl font-bold text-green-600">87%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Submissions Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Pending Submissions Summary
            </CardTitle>
            <CardDescription>
              Recent submissions requiring your attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingSubmissions.map((submission) => (
                <div key={submission.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div>
                        <h4 className="font-medium text-gray-900">{submission.customer}</h4>
                        <p className="text-sm text-gray-600">Submitted by: {submission.vendor}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <Badge variant={submission.status === 'Manual Review' ? 'destructive' : 'secondary'}>
                        {submission.status}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">{submission.submitted}</p>
                    </div>
                    <Button size="sm" className="bg-vendor-green-500 hover:bg-vendor-green-600">
                      Review
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t">
              <Button variant="outline" className="w-full">
                View All Submissions
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PartnerAdminDashboard;
