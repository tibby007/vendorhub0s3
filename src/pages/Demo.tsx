
import React from 'react';
import { DemoProvider, useDemo } from '@/contexts/DemoContext';
import DemoPartnerDashboard from '@/components/demo/DemoPartnerDashboard';
import DemoVendorDashboard from '@/components/demo/DemoVendorDashboard';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Building } from 'lucide-react';

const DemoContent = () => {
  const { currentDemoRole, setCurrentDemoRole } = useDemo();

  const demoLogout = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Demo-specific navigation */}
      <nav className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-vendor-green-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4z"></path>
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">VendorHub</h1>
              <span className="text-xs bg-vendor-green-100 text-vendor-green-700 px-2 py-1 rounded-full font-medium">
                DEMO MODE
              </span>
            </div>
          </div>
          
          {/* Role Selector */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">View as:</span>
              <Select value={currentDemoRole} onValueChange={(value: 'Partner Admin' | 'Vendor') => setCurrentDemoRole(value)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Partner Admin">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      Partner Admin
                    </div>
                  </SelectItem>
                  <SelectItem value="Vendor">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Vendor
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  Demo {currentDemoRole}
                </p>
                <p className="text-xs text-gray-600">{currentDemoRole}</p>
              </div>
              <Button
                onClick={demoLogout}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Exit Demo
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Demo Content */}
      <main>
        {currentDemoRole === 'Partner Admin' ? (
          <DemoPartnerDashboard />
        ) : (
          <DemoVendorDashboard />
        )}
      </main>

      {/* Demo Watermark */}
      <div className="fixed bottom-4 left-4 bg-vendor-green-600 text-white px-3 py-2 rounded-lg shadow-lg">
        <p className="text-sm font-medium">🚀 Live Demo - {currentDemoRole} View</p>
      </div>
    </div>
  );
};

const Demo = () => {
  return (
    <DemoProvider>
      <DemoContent />
    </DemoProvider>
  );
};

export default Demo;
