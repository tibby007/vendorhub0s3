
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, Settings, TrendingUp, Plus, Eye } from 'lucide-react';
import VendorManagement from '@/components/vendor/VendorManagement';

const PartnerAdminDashboard = () => {
  const [activeSection, setActiveSection] = useState<string>('overview');

  const dashboardCards = [
    {
      title: "Total Vendors",
      value: "12",
      description: "Active vendor accounts",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      section: "vendors"
    },
    {
      title: "Pending Applications",
      value: "8",
      description: "Awaiting review",
      icon: FileText,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      section: "submissions"
    },
    {
      title: "This Month's Revenue",
      value: "$24,500",
      description: "+12% from last month",
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50",
      section: "analytics"
    },
    {
      title: "Settings",
      value: "Configure",
      description: "Platform settings",
      icon: Settings,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      section: "settings"
    }
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'vendors':
        return <VendorManagement />;
      case 'submissions':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Deal Submissions</h2>
            <Card>
              <CardContent className="pt-6">
                <p className="text-gray-600">Submissions management coming soon...</p>
              </CardContent>
            </Card>
          </div>
        );
      case 'analytics':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>
            <Card>
              <CardContent className="pt-6">
                <p className="text-gray-600">Analytics dashboard coming soon...</p>
              </CardContent>
            </Card>
          </div>
        );
      case 'settings':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
            <Card>
              <CardContent className="pt-6">
                <p className="text-gray-600">Settings panel coming soon...</p>
              </CardContent>
            </Card>
          </div>
        );
      default:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Partner Admin Dashboard</h2>
              <p className="text-gray-600">Manage your vendor network and monitor performance</p>
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
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest vendor and submission activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">New vendor registered</p>
                        <p className="text-xs text-gray-600">ABC Solutions joined your network</p>
                        <p className="text-xs text-gray-500">2 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Application submitted</p>
                        <p className="text-xs text-gray-600">New customer application from Tech Corp</p>
                        <p className="text-xs text-gray-500">4 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Application approved</p>
                        <p className="text-xs text-gray-600">FastTrack Logistics application approved</p>
                        <p className="text-xs text-gray-500">1 day ago</p>
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
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      className="flex items-center gap-2 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                      onClick={() => setActiveSection('vendors')}
                    >
                      <Plus className="w-4 h-4 text-blue-600" />
                      <span className="text-sm">Add Vendor</span>
                    </button>
                    <button 
                      className="flex items-center gap-2 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                      onClick={() => setActiveSection('submissions')}
                    >
                      <Eye className="w-4 h-4 text-green-600" />
                      <span className="text-sm">View Submissions</span>
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

export default PartnerAdminDashboard;
