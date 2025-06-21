
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import DemoSetupPanel from '@/components/admin/DemoSetupPanel';

const DemoSetup = () => {
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
                <h1 className="text-2xl font-bold text-gray-900">Demo Setup</h1>
                <p className="text-gray-600">Initialize demo accounts and sample data</p>
              </div>
            </div>
            <Button asChild variant="outline">
              <Link to="/" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Set Up Demo Environment
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Create the demo accounts and sample data needed to showcase VendorHub's features.
            This is typically done once during initial setup.
          </p>
        </div>

        <DemoSetupPanel />

        <div className="mt-12">
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900">After Setup</CardTitle>
              <CardDescription className="text-blue-700">
                Once the demo accounts are created, you can:
              </CardDescription>
            </CardHeader>
            <CardContent className="text-blue-800">
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                  Visit the <Link to="/demo-credentials" className="underline font-medium">Demo Credentials</Link> page
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                  Use the provided login credentials to test both user roles
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                  Explore the full platform functionality with realistic sample data
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DemoSetup;
