import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, DollarSign, TrendingUp, UserPlus, Eye, Settings, FolderOpen } from 'lucide-react';
import VendorManagement from '@/components/vendor/VendorManagement';
import SubmissionsManager from '@/components/submissions/SubmissionsManager';
import ResourcesManagement from '@/components/resources/ResourcesManagement';

const PartnerAdminDashboard = () => {
  const [activeSection, setActiveSection] = useState<string>('overview');

  const dashboardCards = [
    {
      title: "Total Vendors",
      value: "24",
      description: "Active vendor network",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      section: "vendors"
    },
    {
      title: "Monthly Submissions",
      value: "127",
      description: "This month's applications",
      icon: FileText,
      color: "text-green-600",
      bgColor: "bg-green-50",
      section: "submissions"
    },
    {
      title: "Revenue",
      value: "$45,890",
      description: "Monthly commissions",
      icon: DollarSign,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      section: "overview"
    },
    {
      title: "Resources",
      value: "12",
      description: "Manage vendor resources",
      icon: FolderOpen,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      section: "resources"
    }
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'vendors':
        return <VendorManagement />;
      case 'submissions':
        return <SubmissionsManager />;
      case 'resources':
        return <ResourcesManagement />;
      default:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Partner Admin Dashboard</h2>
              <p className="text-gray-600">Manage your vendor network and track performance</p>
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
                  <CardDescription>Latest vendor submissions and updates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">New submission from TechVendor Inc.</p>
                        <p className="text-xs text-gray-600">Customer: ABC Corp - $50,000 loan</p>
                        <p className="text-xs text-gray-500">2 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Vendor approved: FastFinance LLC</p>
                        <p className="text-xs text-gray-600">New vendor onboarded</p>
                        <p className="text-xs text-gray-500">1 day ago</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Commission processed</p>
                        <p className="text-xs text-gray-600">$2,450 for Q1 submissions</p>
                        <p className="text-xs text-gray-500">3 days ago</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common partner management tasks</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-3">
                    <button 
                      className="flex items-center gap-2 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                      onClick={() => setActiveSection('vendors')}
                    >
                      <UserPlus className="w-4 h-4 text-blue-600" />
                      <span className="text-sm">Add New Vendor</span>
                    </button>
                    <button 
                      className="flex items-center gap-2 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                      onClick={() => setActiveSection('submissions')}
                    >
                      <Eye className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Review Submissions</span>
                    </button>
                    <button 
                      className="flex items-center gap-2 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                      onClick={() => setActiveSection('resources')}
                    >
                      <FolderOpen className="w-4 h-4 text-orange-600" />
                      <span className="text-sm">Manage Resources</span>
                    </button>
                    <button className="flex items-center gap-2 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                      <Settings className="w-4 h-4 text-gray-600" />
                      <span className="text-sm">Partner Settings</span>
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Approval Rate</span>
                      <span className="text-sm font-medium">73%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Avg. Processing Time</span>
                      <span className="text-sm font-medium">2.3 days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Active Vendors</span>
                      <span className="text-sm font-medium">24/27</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Vendors</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">TechVendor Inc.</span>
                      <span className="text-sm font-medium">$12,450</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">FastFinance LLC</span>
                      <span className="text-sm font-medium">$8,200</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Growth Capital</span>
                      <span className="text-sm font-medium">$6,890</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Monthly Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-8 h-8 text-green-500" />
                    <div>
                      <p className="text-2xl font-bold text-green-600">+15%</p>
                      <p className="text-xs text-gray-600">vs last month</p>
                    </div>
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
