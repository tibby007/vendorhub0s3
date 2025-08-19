import React, { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, FileText, BarChart3, Settings, Upload, Download, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const Demo = () => {
  const navigate = useNavigate();
  
  // Redirect to demo login for role selection
  useEffect(() => {
    navigate('/demo-login', { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-yellow-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-green-600">VendorHub</h1>
              </div>
              <Badge variant="secondary" className="ml-3">
                Demo Environment
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">demo-partner@vendorhub.com</span>
              <Button variant="outline" size="sm" asChild>
                <Link to="/landing">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome to VendorHub Demo
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl">
            Explore the full VendorHub platform with sample data. Experience how partners manage vendors, 
            track submissions, and maintain secure document workflows.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Vendors</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground">+2 from last month</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Documents</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">156</div>
              <p className="text-xs text-muted-foreground">+12 this week</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Submissions</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">89</div>
              <p className="text-xs text-muted-foreground">+5 pending review</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2.4GB</div>
              <p className="text-xs text-muted-foreground">of 10GB limit</p>
            </CardContent>
          </Card>
        </div>

        {/* Feature Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Vendor Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Vendor Management
              </CardTitle>
              <CardDescription>
                Manage your vendor network with comprehensive onboarding and monitoring
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <div className="font-medium">Acme Corp Solutions</div>
                    <div className="text-sm text-gray-500">Technology Partner</div>
                  </div>
                  <Badge variant="default">Active</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <div className="font-medium">Global Supply Co</div>
                    <div className="text-sm text-gray-500">Logistics Partner</div>
                  </div>
                  <Badge variant="secondary">Pending</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div>
                    <div className="font-medium">Premier Services Ltd</div>
                    <div className="text-sm text-gray-500">Service Provider</div>
                  </div>
                  <Badge variant="default">Active</Badge>
                </div>
              </div>
              <Button className="w-full">
                <Users className="h-4 w-4 mr-2" />
                Manage All Vendors
              </Button>
            </CardContent>
          </Card>

          {/* Document Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Document Management
              </CardTitle>
              <CardDescription>
                Secure document storage and sharing with advanced permissions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-blue-500" />
                    <div>
                      <div className="font-medium">Vendor Agreement Template</div>
                      <div className="text-sm text-gray-500">Updated 2 days ago</div>
                    </div>
                  </div>
                  <Download className="h-4 w-4 text-gray-400" />
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-green-500" />
                    <div>
                      <div className="font-medium">Compliance Checklist</div>
                      <div className="text-sm text-gray-500">Updated 1 week ago</div>
                    </div>
                  </div>
                  <Download className="h-4 w-4 text-gray-400" />
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-2 text-purple-500" />
                    <div>
                      <div className="font-medium">Security Audit Report</div>
                      <div className="text-sm text-gray-500">Updated 3 days ago</div>
                    </div>
                  </div>
                  <Download className="h-4 w-4 text-gray-400" />
                </div>
              </div>
              <Button variant="outline" className="w-full">
                <Upload className="h-4 w-4 mr-2" />
                Upload New Document
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="mt-12 text-center">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Ready to Get Started?</CardTitle>
              <CardDescription>
                Experience the full power of VendorHub with your own account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  onClick={() => {
                    // Store pro plan selection (most popular) for demo users
                    const planData = {
                      tierId: 'pro',
                      tierName: 'VendorHub Pro',
                      isAnnual: false,
                      price: 197
                    };
                    sessionStorage.setItem('selectedPlan', JSON.stringify(planData));
                    console.log('💾 [Demo] Stored pro plan selection for trial:', planData);
                    window.location.href = '/auth?intent=subscription';
                  }}
                >
                  Start 3-Day Free Trial
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <a href="https://api.leadconnectorhq.com/widget/bookings/vendorhub" target="_blank" rel="noopener noreferrer">
                    Book a Consultation
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Demo;