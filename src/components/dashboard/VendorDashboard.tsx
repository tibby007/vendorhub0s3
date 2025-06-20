
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, CheckCircle, Clock, XCircle, BookOpen, Search } from 'lucide-react';

const VendorDashboard = () => {
  const applications = [
    { id: 1, customer: 'ABC Manufacturing', status: 'Approved', submittedDate: '2024-01-15', amount: '$50,000' },
    { id: 2, customer: 'XYZ Services', status: 'Pending', submittedDate: '2024-01-18', amount: '$25,000' },
    { id: 3, customer: 'Global Dynamics', status: 'Manual Review', submittedDate: '2024-01-20', amount: '$75,000' },
    { id: 4, customer: 'Tech Solutions Inc', status: 'Declined', submittedDate: '2024-01-12', amount: '$30,000' }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'Pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'Manual Review':
        return <Search className="w-4 h-4 text-blue-500" />;
      case 'Declined':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'default';
      case 'Pending':
        return 'secondary';
      case 'Manual Review':
        return 'outline';
      case 'Declined':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-7 h-7 text-vendor-green-500" />
              Vendor Dashboard
            </h1>
            <p className="text-gray-600 mt-1">Manage your applications and submissions</p>
          </div>
          <Button className="bg-vendor-green-500 hover:bg-vendor-green-600">
            <Plus className="w-4 h-4 mr-2" />
            New Application
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="card-hover cursor-pointer border-l-4 border-l-vendor-green-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">Submit New Application</h3>
                  <p className="text-sm text-gray-600 mt-1">Start a new customer application</p>
                </div>
                <Plus className="w-8 h-8 text-vendor-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover cursor-pointer border-l-4 border-l-vendor-gold-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">My Submissions</h3>
                  <p className="text-sm text-gray-600 mt-1">View all your applications</p>
                </div>
                <FileText className="w-8 h-8 text-vendor-gold-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover cursor-pointer border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">PreQual Tool</h3>
                  <p className="text-sm text-gray-600 mt-1">Pre-qualification assessment</p>
                </div>
                <Search className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover cursor-pointer border-l-4 border-l-purple-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">Resources</h3>
                  <p className="text-sm text-gray-600 mt-1">Guidelines & training</p>
                </div>
                <BookOpen className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Application Status Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Applications</p>
                  <p className="text-3xl font-bold text-gray-900">4</p>
                </div>
                <FileText className="w-8 h-8 text-gray-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Approved</p>
                  <p className="text-3xl font-bold text-green-600">1</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-3xl font-bold text-yellow-600">2</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Success Rate</p>
                  <p className="text-3xl font-bold text-vendor-green-600">75%</p>
                </div>
                <CheckCircle className="w-8 h-8 text-vendor-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Applications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Recent Applications
            </CardTitle>
            <CardDescription>
              Track the status of your submitted applications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Customer</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Amount</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Submitted</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr key={app.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{app.customer}</td>
                      <td className="py-3 px-4">{app.amount}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(app.status)}
                          <Badge variant={getStatusVariant(app.status)}>
                            {app.status}
                          </Badge>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{app.submittedDate}</td>
                      <td className="py-3 px-4">
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 pt-4 border-t">
              <Button variant="outline" className="w-full">
                View All Applications
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VendorDashboard;
