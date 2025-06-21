
import React, { useState } from 'react';
import { useDemo } from '@/contexts/DemoContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, FileText, Settings, TrendingUp, Plus, Eye, Palette, CreditCard, Play, DollarSign, Target, Award } from 'lucide-react';
import DemoGuide from './DemoGuide';

const DemoPartnerDashboard = () => {
  const { demoData, showGuide, setShowGuide, setCurrentStep } = useDemo();
  const [activeSection, setActiveSection] = useState<string>('overview');

  const startDemo = () => {
    setCurrentStep(0);
    setShowGuide(true);
  };

  const dashboardCards = [
    {
      title: "Total Vendors",
      value: demoData.analytics.totalVendors.toString(),
      description: `+2 this month`,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      section: "vendors",
      trend: "+25%"
    },
    {
      title: "Pending Applications",
      value: demoData.analytics.pendingApplications.toString(),
      description: "Awaiting review",
      icon: FileText,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      section: "submissions"
    },
    {
      title: "Monthly Revenue",
      value: `$${(demoData.analytics.totalRevenue / 1000).toFixed(0)}k`,
      description: `+${demoData.analytics.monthlyGrowth}% from last month`,
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50",
      section: "analytics"
    },
    {
      title: "Approval Rate",
      value: `${demoData.analytics.approvalRate}%`,
      description: "Industry leading",
      icon: Award,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      section: "analytics"
    }
  ];

  const recentSubmissions = demoData.submissions.slice(0, 3);
  const topVendors = demoData.vendors.filter(v => v.status === 'Active').slice(0, 3);

  const renderContent = () => {
    switch (activeSection) {
      case 'vendors':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Vendor Management</h2>
                <p className="text-gray-600">Manage your vendor network and track performance</p>
              </div>
              <Button className="bg-vendor-green-600 hover:bg-vendor-green-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Vendor
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {demoData.vendors.map((vendor) => (
                <Card key={vendor.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{vendor.name}</CardTitle>
                        <CardDescription>{vendor.email}</CardDescription>
                      </div>
                      <Badge variant={vendor.status === 'Active' ? 'default' : 'secondary'}>
                        {vendor.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">📞 {vendor.phone}</p>
                      <p className="text-sm text-gray-600">📅 Joined {new Date(vendor.joinDate).toLocaleDateString()}</p>
                      {vendor.revenue > 0 && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          <span className="font-semibold text-green-600">
                            ${vendor.revenue.toLocaleString()} revenue
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      
      case 'submissions':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Deal Submissions</h2>
              <p className="text-gray-600">Review and manage customer applications from your vendors</p>
            </div>
            
            <div className="space-y-4">
              {demoData.submissions.map((submission) => (
                <Card key={submission.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold">{submission.customerName}</h3>
                          <Badge 
                            variant={
                              submission.status === 'Approved' ? 'default' :
                              submission.status === 'Rejected' ? 'destructive' : 'secondary'
                            }
                          >
                            {submission.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          Vendor: {submission.vendorName} • Business: {submission.businessName}
                        </p>
                        <p className="text-sm text-gray-500">
                          Submitted {new Date(submission.submittedDate).toLocaleDateString()}
                        </p>
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-vendor-green-600" />
                          <span className="font-medium text-vendor-green-600">
                            ${submission.amount.toLocaleString()} deal value
                          </span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-1" />
                        Review
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      
      default:
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Partner Admin Dashboard</h2>
                <p className="text-gray-600">Manage your vendor network and monitor performance</p>
              </div>
              <Button 
                onClick={startDemo}
                className="bg-vendor-green-600 hover:bg-vendor-green-700"
              >
                <Play className="w-4 h-4 mr-2" />
                Start Demo Tour
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {dashboardCards.map((card, index) => {
                const Icon = card.icon;
                return (
                  <Card 
                    key={index} 
                    className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
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
                      {card.trend && (
                        <div className="mt-2">
                          <span className="text-xs text-green-600 font-medium">{card.trend}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Submissions</CardTitle>
                  <CardDescription>Latest customer applications from your vendors</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentSubmissions.map((submission) => (
                      <div key={submission.id} className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          submission.status === 'Approved' ? 'bg-green-500' :
                          submission.status === 'Pending' ? 'bg-orange-500' :
                          submission.status === 'Rejected' ? 'bg-red-500' : 'bg-blue-500'
                        }`}></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{submission.customerName}</p>
                          <p className="text-xs text-gray-600">
                            {submission.vendorName} • ${submission.amount.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(submission.submittedDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Vendors</CardTitle>
                  <CardDescription>Your highest revenue generating partners</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topVendors.map((vendor, index) => (
                      <div key={vendor.id} className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-vendor-green-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-vendor-green-600">#{index + 1}</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{vendor.name}</p>
                          <p className="text-xs text-gray-600">${vendor.revenue.toLocaleString()} revenue</p>
                        </div>
                        <Badge variant="outline" className="text-green-600">Active</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-gradient-to-r from-vendor-green-50 to-vendor-gold-50 border-vendor-green-200">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <h3 className="text-xl font-bold text-gray-900">
                    💡 Demo Tip: Click on any metric card above to explore that section
                  </h3>
                  <p className="text-gray-600">
                    This demo showcases real functionality with sample data. In production, this would connect to your actual vendor network and submission data.
                  </p>
                  <div className="flex justify-center gap-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setActiveSection('vendors')}
                      className="border-vendor-green-200 text-vendor-green-700"
                    >
                      Explore Vendors
                    </Button>
                    <Button 
                      onClick={() => setActiveSection('submissions')}
                      className="bg-vendor-green-600 hover:bg-vendor-green-700"
                    >
                      View Submissions
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  return (
    <div className="p-6">
      {activeSection !== 'overview' && (
        <button
          onClick={() => setActiveSection('overview')}
          className="mb-6 text-blue-600 hover:text-blue-800 font-medium transition-colors"
        >
          ← Back to Dashboard
        </button>
      )}
      {renderContent()}
      <DemoGuide />
    </div>
  );
};

export default DemoPartnerDashboard;
