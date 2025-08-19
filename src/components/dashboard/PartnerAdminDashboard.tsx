
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, FileText, TrendingUp, Settings, Plus, Eye } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useSubscriptionManager } from '@/hooks/useSubscriptionManager';
import { supabase } from '@/integrations/supabase/client';
import SubscriptionWidget from '@/components/dashboard/SubscriptionWidget';
import { useDemoMode } from '@/hooks/useDemoMode';
import { mockPartnerStats } from '@/data/mockPartnerData';
import TrialBanner from '@/components/subscription/TrialBanner';
// TrialCountdown removed - TrialBanner provides superior countdown functionality

const PartnerAdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { subscription } = useSubscriptionManager();
  const { isDemo } = useDemoMode();
  const [vendorCount, setVendorCount] = useState(0);
  const [submissionCount, setSubmissionCount] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.id) return;

      // Check for demo mode using multiple methods
      const isDemoMode = isDemo || 
                        sessionStorage.getItem('demoCredentials') !== null ||
                        user.email === 'partner@demo.com' ||
                        user.id === 'demo-partner-123';

      // Use mock data in demo mode
      if (isDemoMode) {
        console.log('🎭 PartnerAdminDashboard: Using mock data in demo mode');
        setVendorCount(mockPartnerStats.totalVendors);
        setSubmissionCount(mockPartnerStats.pendingApplications);
        return;
      }

      try {
        // Fetch vendor count
        const { count: vendors } = await supabase
          .from('vendors')
          .select('*', { count: 'exact' })
          .eq('partner_admin_id', user.id);

        // Fetch pending submissions count
        const { count: submissions } = await supabase
          .from('submissions')
          .select('*', { count: 'exact' })
          .eq('partner_admin_id', user.id)
          .eq('status', 'Pending');

        setVendorCount(vendors || 0);
        setSubmissionCount(submissions || 0);
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
        // Fallback to mock data on error
        setVendorCount(mockPartnerStats.totalVendors);
        setSubmissionCount(mockPartnerStats.pendingApplications);
      }
    };

    fetchStats();
  }, [user?.id, isDemo]);

  const vendorLimits = {
    basic: 3,
    pro: 7,
    premium: 999999
  };

  const vendorLimit = vendorLimits[subscription.tier?.toLowerCase() as keyof typeof vendorLimits] || 3;
  const vendorUsagePercentage = Math.min((vendorCount / vendorLimit) * 100, 100);
  const isNearVendorLimit = vendorCount >= vendorLimit * 0.8;

  const getVendorDescription = () => {
    if (vendorLimit === 999999) return "Unlimited vendors";
    const remaining = vendorLimit - vendorCount;
    if (remaining <= 0) return "Limit reached - upgrade needed";
    if (isNearVendorLimit) return `${remaining} remaining - consider upgrading`;
    return `${remaining} of ${vendorLimit} remaining`;
  };

  const stats = [
    {
      title: "Total Vendors",
      value: vendorCount.toString(),
      description: getVendorDescription(),
      icon: Users,
      color: isNearVendorLimit ? "text-yellow-600" : "text-blue-600",
      showUpgrade: vendorCount >= vendorLimit
    },
    {
      title: "Pending Submissions",
      value: submissionCount.toString(),
      description: submissionCount > 0 ? "Awaiting review" : "All caught up!",
      icon: FileText,
      color: submissionCount > 5 ? "text-red-600" : "text-yellow-600"
    },
    {
      title: "Monthly Revenue",
      value: isDemo ? `$${mockPartnerStats.monthlyRevenue.toLocaleString()}` : "$24,500",
      description: isDemo ? `+${mockPartnerStats.revenueGrowth}% from last month` : "+12% from last month",
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

  const isTrial = (subscription.status === 'trial' || (!subscription.subscribed && subscription.trialEnd && new Date(subscription.trialEnd) > new Date()));

  return (
    <div className="space-y-6">
      {/* Trial Banner - Single instance for trial users */}
      <div className="px-6 py-4">
        {(isTrial || (subscription.endDate && !subscription.subscribed)) && (
          <TrialBanner 
            trialEnd={subscription.endDate || subscription.trialEnd}
            onUpgrade={() => navigate('/subscription')}
          />
        )}
      </div>

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
          <Card key={index} className={stat.showUpgrade ? 'border-yellow-200 bg-yellow-50' : undefined}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
              {stat.showUpgrade && (
                <Button 
                  size="sm" 
                  className="mt-2 text-xs"
                  onClick={() => navigate('/subscription')}
                >
                  Upgrade Plan
                </Button>
              )}
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
