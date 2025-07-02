import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Eye, Calculator, BookOpen } from 'lucide-react';
import VendorDashboardStats from './VendorDashboardStats';

interface VendorDashboardOverviewProps {
  submissionStats: {
    total: number;
    pending: number;
    approved: number;
  };
  onSectionChange: (section: string) => void;
}

const VendorDashboardOverview = ({ submissionStats, onSectionChange }: VendorDashboardOverviewProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Vendor Dashboard</h2>
        <p className="text-gray-600">Submit applications and track your submissions</p>
      </div>

      <VendorDashboardStats 
        submissionStats={submissionStats} 
        onSectionChange={onSectionChange} 
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Submissions</CardTitle>
            <CardDescription>Your latest customer applications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Tech Solutions Inc.</p>
                  <p className="text-xs text-gray-600">Status: Approved</p>
                  <p className="text-xs text-gray-500">2 days ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">ABC Manufacturing</p>
                  <p className="text-xs text-gray-600">Status: Pending Review</p>
                  <p className="text-xs text-gray-500">1 week ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">FastTrack Logistics</p>
                  <p className="text-xs text-gray-600">Status: Manual Review</p>
                  <p className="text-xs text-gray-500">2 weeks ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3">
              <button 
                className="flex items-center gap-2 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                onClick={() => onSectionChange('new-application')}
              >
                <Plus className="w-4 h-4 text-blue-600" />
                <span className="text-sm">Submit New Application</span>
              </button>
              <button 
                className="flex items-center gap-2 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                onClick={() => onSectionChange('submissions')}
              >
                <Eye className="w-4 h-4 text-green-600" />
                <span className="text-sm">View My Submissions</span>
              </button>
              <button 
                className="flex items-center gap-2 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                onClick={() => onSectionChange('prequal')}
              >
                <Calculator className="w-4 h-4 text-purple-600" />
                <span className="text-sm">Pre-Qualify Customer</span>
              </button>
              <button 
                className="flex items-center gap-2 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                onClick={() => onSectionChange('resources')}
              >
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <span className="text-sm">View Resources</span>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VendorDashboardOverview;