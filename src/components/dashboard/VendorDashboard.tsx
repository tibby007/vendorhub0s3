
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Clock, CheckCircle, Plus, Eye, Calculator } from 'lucide-react';
import CustomerApplicationForm from '@/components/vendor/CustomerApplicationForm';

const VendorDashboard = () => {
  const [activeSection, setActiveSection] = useState<string>('overview');

  const dashboardCards = [
    {
      title: "Total Submissions",
      value: "15",
      description: "All time submissions",
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      section: "submissions"
    },
    {
      title: "Pending Review",
      value: "3",
      description: "Awaiting partner review",
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      section: "submissions"
    },
    {
      title: "Approved",
      value: "11",
      description: "Successfully approved",
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
      section: "submissions"
    },
    {
      title: "PreQual Tool",
      value: "Check",
      description: "Pre-qualify customers",
      icon: Calculator,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      section: "prequal"
    }
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'new-application':
        return <CustomerApplicationForm />;
      case 'submissions':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">My Submissions</h2>
            <Card>
              <CardContent className="pt-6">
                <p className="text-gray-600">Submissions list coming soon...</p>
              </CardContent>
            </Card>
          </div>
        );
      case 'prequal':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">PreQual Tool</h2>
            <Card>
              <CardContent className="pt-6">
                <p className="text-gray-600">Pre-qualification tool coming soon...</p>
              </CardContent>
            </Card>
          </div>
        );
      case 'resources':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Resources</h2>
            <Card>
              <CardContent className="pt-6">
                <p className="text-gray-600">Resources section coming soon...</p>
              </CardContent>
            </Card>
          </div>
        );
      default:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Vendor Dashboard</h2>
              <p className="text-gray-600">Submit applications and track your submissions</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {dashboardCards.map((card, index) => {
                const Icon = card.icon;
                return (
                  <Card 
                    key={index} 
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => setActiveSection(card.section)}
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">
                        {card.title}
                      </CardTitle>
                      <div className={`w-8 h-8 ${card.bgColor} rounded-lg flex items-center justify-center`}>
                        <Icon className={`w-4 h-4 ${card.color}`} />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-gray-900">{card.value}</div>
                      <p className="text-xs text-gray-600 mt-1">{card.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Submissions</CardTitle>
                  <CardDescription>Your latest customer applications</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Tech Solutions Inc.</p>
                        <p className="text-xs text-gray-600">Status: Approved</p>
                        <p className="text-xs text-gray-500">2 days ago</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">ABC Manufacturing</p>
                        <p className="text-xs text-gray-600">Status: Pending Review</p>
                        <p className="text-xs text-gray-500">1 week ago</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">FastTrack Logistics</p>
                        <p className="text-xs text-gray-600">Status: Manual Review</p>
                        <p className="text-xs text-gray-500">2 weeks ago</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common tasks and shortcuts</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-3">
                    <button 
                      className="flex items-center gap-2 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                      onClick={() => setActiveSection('new-application')}
                    >
                      <Plus className="w-4 h-4 text-blue-600" />
                      <span className="text-sm">Submit New Application</span>
                    </button>
                    <button 
                      className="flex items-center gap-2 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                      onClick={() => setActiveSection('submissions')}
                    >
                      <Eye className="w-4 h-4 text-green-600" />
                      <span className="text-sm">View My Submissions</span>
                    </button>
                    <button 
                      className="flex items-center gap-2 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                      onClick={() => setActiveSection('prequal')}
                    >
                      <Calculator className="w-4 h-4 text-purple-600" />
                      <span className="text-sm">Pre-Qualify Customer</span>
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="p-6">
      {activeSection !== 'overview' && (
        <button
          onClick={() => setActiveSection('overview')}
          className="mb-6 text-blue-600 hover:text-blue-800 font-medium"
        >
          ← Back to Dashboard
        </button>
      )}
      {renderContent()}
    </div>
  );
};

export default VendorDashboard;
