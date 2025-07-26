
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, FileText, TrendingUp, Settings, Plus, Eye } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import DashboardSubscriptionStatus from '@/components/dashboard/DashboardSubscriptionStatus';
import SubscriptionWidget from '@/components/dashboard/SubscriptionWidget';

const PartnerAdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const stats = [
    {
      title: "Total Vendors",
      value: "12",
      description: "Active vendor partners",
      icon: Users,
      color: "text-blue-600"
    },
    {
      title: "Pending Submissions",
      value: "8",
      description: "Awaiting review",
      icon: FileText,
      color: "text-yellow-600"
    },
    {
      title: "Monthly Revenue",
      value: "$24,500",
      description: "+12% from last month",
      icon: TrendingUp,
      color: "text-green-600"
    }
  ];

  const quickActions = [
    {
      title: "Add New Vendor",
      description: "Create a new vendor account",
      icon: Plus,
      action: () => navigate('/vendors'),
      color: "bg-vendor-green-600 hover:bg-vendor-green-700"
    },
    {
      title: "Manage Submissions",
      description: "Review pending applications",
      icon: Eye,
      action: () => navigate('/submissions'),
      color: "bg-blue-600 hover:bg-blue-700"
    },
    {
      title: "Partner Settings",
      description: "Configure your account",
      icon: Settings,
      action: () => navigate('/settings'),
      color: "bg-gray-600 hover:bg-gray-700"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Subscription Status */}
      <DashboardSubscriptionStatus user={user} />
      
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-vendor-green-600 to-vendor-green-700 rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name || 'Partner Admin'}!</h1>
        <p className="text-vendor-green-100">
          Manage your vendor network and track submissions from your dashboard.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
        <SubscriptionWidget />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action, index) => (
            <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-lg ${action.color} text-white`}>
                    <action.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{action.title}</h3>
                    <p className="text-sm text-gray-600">{action.description}</p>
                  </div>
                </div>
                <Button 
                  className="w-full mt-4" 
                  variant="outline"
                  onClick={action.action}
                >
                  Get Started
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest updates from your vendor network</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">New submission from TechVendor Inc.</p>
                <p className="text-xs text-gray-600">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Vendor "DataSolutions LLC" updated their profile</p>
                <p className="text-xs text-gray-600">4 hours ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">3 submissions pending review</p>
                <p className="text-xs text-gray-600">6 hours ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PartnerAdminDashboard;
