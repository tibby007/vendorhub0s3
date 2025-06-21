
import React, { useState } from 'react';
import { useDemo } from '@/contexts/DemoContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, FileText, TrendingUp, Plus, Eye, DollarSign, Target, Award, CheckCircle, Clock, AlertCircle } from 'lucide-react';

const DemoVendorDashboard = () => {
  const { demoData } = useDemo();
  const [activeSection, setActiveSection] = useState<string>('overview');

  const dashboardCards = [
    {
      title: "Total Submissions",
      value: demoData.vendorAnalytics.totalSubmissions.toString(),
      description: "Applications submitted",
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      section: "submissions"
    },
    {
      title: "Approved",
      value: demoData.vendorAnalytics.approvedSubmissions.toString(),
      description: `${demoData.vendorAnalytics.conversionRate}% conversion rate`,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
      section: "submissions"
    },
    {
      title: "Monthly Commission",
      value: `$${demoData.vendorAnalytics.monthlyCommission.toLocaleString()}`,
      description: "This month's earnings",
      icon: DollarSign,
      color: "text-vendor-green-600",
      bgColor: "bg-vendor-green-50",
      section: "analytics"
    },
    {
      title: "Pending Review",
      value: demoData.vendorAnalytics.pendingSubmissions.toString(),
      description: "Awaiting approval",
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      section: "submissions"
    }
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'submit':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Submit New Application</h2>
              <p className="text-gray-600">Add a new customer application for funding</p>
            </div>
            
            <Card className="max-w-2xl">
              <CardHeader>
                <CardTitle>Customer Application Form</CardTitle>
                <CardDescription>Fill out customer details for credit application</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                    <input 
                      type="text" 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Enter customer name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                    <input 
                      type="text" 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Enter business name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input 
                      type="email" 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="customer@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input 
                      type="tel" 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Requested Amount</label>
                    <input 
                      type="number" 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="50000"
                    />
                  </div>
                </div>
                
                <div className="pt-4">
                  <Button className="bg-vendor-green-600 hover:bg-vendor-green-700">
                    Submit Application
                  </Button>
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">💡 Demo Note</h4>
                  <p className="text-sm text-blue-700">
                    This is a demo form. In the live system, submitted applications would be sent to your Partner Admin for review and processing.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      
      case 'submissions':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">My Submissions</h2>
              <p className="text-gray-600">Track the status of your customer applications</p>
            </div>
            
            <div className="space-y-4">
              {demoData.vendorSubmissions.map((submission) => (
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
                          Business: {submission.businessName}
                        </p>
                        <p className="text-sm text-gray-500">
                          Submitted {new Date(submission.submittedDate).toLocaleDateString()}
                        </p>
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-vendor-green-600" />
                          <span className="font-medium text-vendor-green-600">
                            ${submission.amount.toLocaleString()} requested
                          </span>
                        </div>
                        {submission.notes && (
                          <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-600">
                            <strong>Notes:</strong> {submission.notes}
                          </div>
                        )}
                      </div>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-1" />
                        View Details
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
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Vendor Dashboard</h2>
              <p className="text-gray-600">Manage your customer applications and track commissions</p>
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
                    {demoData.vendorSubmissions.slice(0, 3).map((submission) => (
                      <div key={submission.id} className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          submission.status === 'Approved' ? 'bg-green-500' :
                          submission.status === 'Pending' ? 'bg-orange-500' :
                          submission.status === 'Rejected' ? 'bg-red-500' : 'bg-blue-500'
                        }`}></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{submission.customerName}</p>
                          <p className="text-xs text-gray-600">
                            ${submission.amount.toLocaleString()} • {submission.status}
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
                  <CardTitle>Commission Tracker</CardTitle>
                  <CardDescription>Your earnings breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Lifetime Commission</span>
                      <span className="font-semibold">${demoData.vendorAnalytics.totalCommission.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">This Month</span>
                      <span className="font-semibold text-green-600">${demoData.vendorAnalytics.monthlyCommission.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Conversion Rate</span>
                      <span className="font-semibold">{demoData.vendorAnalytics.conversionRate}%</span>
                    </div>
                    <div className="pt-2 border-t">
                      <Button className="w-full bg-vendor-green-600 hover:bg-vendor-green-700" onClick={() => setActiveSection('submit')}>
                        <Plus className="w-4 h-4 mr-2" />
                        Submit New Application
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-gradient-to-r from-vendor-green-50 to-vendor-gold-50 border-vendor-green-200">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <h3 className="text-xl font-bold text-gray-900">
                    🎯 Vendor Demo Experience
                  </h3>
                  <p className="text-gray-600">
                    This demonstrates the vendor portal where you can submit customer applications, track status, and monitor your commission earnings.
                  </p>
                  <div className="flex justify-center gap-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setActiveSection('submissions')}
                      className="border-vendor-green-200 text-vendor-green-700"
                    >
                      View All Submissions
                    </Button>
                    <Button 
                      onClick={() => setActiveSection('submit')}
                      className="bg-vendor-green-600 hover:bg-vendor-green-700"
                    >
                      Submit Application
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
    </div>
  );
};

export default DemoVendorDashboard;
