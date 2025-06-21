
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, ArrowRight, Lock, Mail, Star, Clock, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import DemoLeadCaptureForm from '@/components/demo/DemoLeadCaptureForm';

const DemoCredentials = () => {
  const [showCredentials, setShowCredentials] = useState(false);
  const [demoCredentials, setDemoCredentials] = useState<{ email: string; password: string; role: string } | null>(null);

  const demoFeatures = [
    {
      role: 'Partner Admin',
      description: 'Experience the full administrative dashboard with vendor management, analytics, and more',
      features: [
        'Vendor Management Dashboard',
        'Revenue Analytics & Reports',
        'Application Review System',
        'Resource Distribution',
        'User Administration'
      ],
      limitations: [
        'Read-only data access',
        '30-minute session limit',
        'Limited to sample data'
      ]
    },
    {
      role: 'Vendor',
      description: 'Explore the vendor portal with application submission, tracking, and resources',
      features: [
        'Customer Application Portal',
        'Application Status Tracking',
        'Pre-Qualification Tools',
        'Resource Library Access',
        'Performance Metrics'
      ],
      limitations: [
        'Cannot submit real applications',
        '30-minute session limit',
        'Sample data environment'
      ]
    }
  ];

  const handleLeadCaptureSuccess = (credentials: { email: string; password: string; role: string }) => {
    setDemoCredentials(credentials);
    setShowCredentials(true);
  };

  if (!showCredentials) {
    return <DemoLeadCaptureForm onSuccess={handleLeadCaptureSuccess} />;
  }

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
                <h1 className="text-2xl font-bold text-gray-900">VendorHub Demo Access</h1>
                <p className="text-gray-600">Your personalized demo environment is ready</p>
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
        {/* Session Info */}
        <div className="mb-8">
          <Card className="bg-gradient-to-r from-vendor-green-50 to-vendor-gold-50 border-vendor-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-vendor-green-500 rounded-lg flex items-center justify-center">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Demo Session Active</h3>
                    <p className="text-gray-600">30-minute full access • Sample data environment</p>
                  </div>
                </div>
                <Badge className="bg-vendor-green-100 text-vendor-green-700">
                  <Star className="w-3 h-3 mr-1" />
                  Premium Access
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Your Demo Environment is Ready
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Access your personalized VendorHub demo as a <strong>{demoCredentials?.role}</strong>. 
            Explore real features with sample data in a secure environment.
          </p>
        </div>

        {/* Demo Account Card */}
        <div className="max-w-2xl mx-auto mb-12">
          <Card className="relative overflow-hidden hover:shadow-lg transition-shadow border-vendor-green-200">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-vendor-green-100 to-vendor-gold-100 transform rotate-45 translate-x-8 -translate-y-8"></div>
            <CardHeader>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-vendor-green-100 rounded-lg flex items-center justify-center">
                  {demoCredentials?.role === 'Partner Admin' ? (
                    <Building2 className="w-6 h-6 text-vendor-green-600" />
                  ) : (
                    <Users className="w-6 h-6 text-vendor-green-600" />
                  )}
                </div>
                <div>
                  <CardTitle className="text-xl">{demoCredentials?.role} Demo</CardTitle>
                  <Badge variant="secondary" className="bg-vendor-green-100 text-vendor-green-700">
                    Limited Time Access
                  </Badge>
                </div>
              </div>
              <CardDescription className="text-base">
                {demoFeatures.find(f => f.role === demoCredentials?.role)?.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Login Credentials */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Your Demo Credentials
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span className="font-mono bg-white px-2 py-1 rounded border">
                      {demoCredentials?.email}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-gray-500" />
                    <span className="font-mono bg-white px-2 py-1 rounded border">
                      {demoCredentials?.password}
                    </span>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">What you can explore:</h4>
                <ul className="space-y-2">
                  {demoFeatures.find(f => f.role === demoCredentials?.role)?.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-1.5 h-1.5 bg-vendor-green-500 rounded-full"></div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Limitations */}
              <div className="bg-yellow-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-yellow-600" />
                  Demo Limitations
                </h4>
                <ul className="space-y-1">
                  {demoFeatures.find(f => f.role === demoCredentials?.role)?.limitations.map((limitation, index) => (
                    <li key={index} className="flex items-center gap-2 text-xs text-yellow-800">
                      <div className="w-1 h-1 bg-yellow-600 rounded-full"></div>
                      {limitation}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Login Button */}
              <Button asChild className="w-full bg-vendor-green-600 hover:bg-vendor-green-700" size="lg">
                <Link to="/auth" className="flex items-center justify-center gap-2">
                  Start Demo as {demoCredentials?.role}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Progressive Upgrade Option */}
        <Card className="bg-gradient-to-r from-vendor-green-50 to-vendor-gold-50 border-vendor-green-200">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Ready to Scale Your Vendor Network?
              </h3>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Experience the full power of VendorHub with unlimited access, custom setup, and dedicated support.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild className="bg-vendor-green-600 hover:bg-vendor-green-700">
                  <Link to="/auth">
                    Get Full Access
                    <ArrowRight className="w-4 h-4 ml-2" />
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
