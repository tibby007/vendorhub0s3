
import React from 'react';
import { DemoProvider } from '@/contexts/DemoContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DemoPartnerDashboard from '@/components/demo/DemoPartnerDashboard';

const Demo = () => {
  // Mock demo user for the dashboard layout
  const demoUser = {
    id: 'demo-user',
    name: 'Demo Partner Admin',
    email: 'demo@vendorhub.com',
    role: 'Partner Admin' as const,
    partnerId: 'demo-partner',
    createdAt: new Date().toISOString()
  };

  const demoLogout = () => {
    window.location.href = '/';
  };

  return (
    <DemoProvider>
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
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{demoUser.name}</p>
                <p className="text-xs text-gray-600">{demoUser.role}</p>
              </div>
              <button
                onClick={demoLogout}
                className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Exit Demo
              </button>
            </div>
          </div>
        </nav>

        {/* Demo Content */}
        <main>
          <DemoPartnerDashboard />
        </main>

        {/* Demo Watermark */}
        <div className="fixed bottom-4 left-4 bg-vendor-green-600 text-white px-3 py-2 rounded-lg shadow-lg">
          <p className="text-sm font-medium">🚀 Live Demo - Experience VendorHub</p>
        </div>
      </div>
    </DemoProvider>
  );
};

export default Demo;
