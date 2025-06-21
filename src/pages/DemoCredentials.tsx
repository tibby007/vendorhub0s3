
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, ArrowRight, Lock, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

const DemoCredentials = () => {
  const demoAccounts = [
    {
      role: 'Partner Admin',
      email: 'demo-partner@vendorhub.com',
      password: 'DemoPass123!',
      description: 'Full administrative access to manage vendors, review submissions, and access analytics',
      icon: Building2,
      features: [
        'Vendor Management',
        'Submission Reviews',
        'Revenue Analytics',
        'Resources Management',
        'User Administration'
      ]
    },
    {
      role: 'Vendor',
      email: 'demo-vendor@vendorhub.com', 
      password: 'DemoPass123!',
      description: 'Vendor portal access to submit applications, track status, and access resources',
      icon: Users,
      features: [
        'Submit Customer Applications',
        'Track Application Status',
        'Pre-Qualification Tool',
        'Access Resources & Updates',
        'View Performance Metrics'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-vendor-green-50 via-white to-vendor-gold-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-vendor-green-500 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">VendorHub Demo</h1>
                <p className="text-gray-600">Test drive the complete platform</p>
              </div>
            </div>
            <Button asChild>
              <Link to="/">← Back to Home</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Experience VendorHub from Every Angle
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Use these demo accounts to explore the full capabilities of our platform. 
            Each account is pre-loaded with realistic data to showcase real-world usage.
          </p>
        </div>

        {/* Demo Accounts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {demoAccounts.map((account, index) => {
            const Icon = account.icon;
            return (
              <Card key={index} className="relative overflow-hidden hover:shadow-lg transition-shadow">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-vendor-green-100 to-vendor-gold-100 transform rotate-45 translate-x-8 -translate-y-8"></div>
                <CardHeader>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-vendor-green-100 rounded-lg flex items-center justify-center">
                      <Icon className="w-6 h-6 text-vendor-green-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{account.role}</CardTitle>
                      <Badge variant="secondary" className="bg-vendor-green-100 text-vendor-green-700">
                        Demo Account
                      </Badge>
                    </div>
                  </div>
                  <CardDescription className="text-base">
                    {account.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Login Credentials */}
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Login Credentials
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <span className="font-mono bg-white px-2 py-1 rounded border">
                          {account.email}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-gray-500" />
                        <span className="font-mono bg-white px-2 py-1 rounded border">
                          {account.password}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Features */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">What you can test:</h4>
                    <ul className="space-y-2">
                      {account.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center gap-2 text-sm text-gray-600">
                          <div className="w-1.5 h-1.5 bg-vendor-green-500 rounded-full"></div>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Login Button */}
                  <Button asChild className="w-full bg-vendor-green-600 hover:bg-vendor-green-700">
                    <Link to="/auth" className="flex items-center justify-center gap-2">
                      Login as {account.role}
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Additional Info */}
        <Card className="bg-gradient-to-r from-vendor-green-50 to-vendor-gold-50 border-vendor-green-200">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Ready to Get Started?
              </h3>
              <p className="text-gray-600 max-w-2xl mx-auto">
                After exploring the demo, schedule a personalized walkthrough with our team to discuss 
                how VendorHub can be customized for your specific business needs.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild className="bg-vendor-green-600 hover:bg-vendor-green-700">
                  <a href="https://api.leadconnectorhq.com/widget/bookings/vendorhub" target="_blank" rel="noopener noreferrer">
                    Schedule a Demo
                  </a>
                </Button>
                <Button size="lg" variant="outline" asChild className="border-vendor-green-600 text-vendor-green-600 hover:bg-vendor-green-50">
                  <Link to="/auth">
                    Start Your Free Trial
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DemoCredentials;
