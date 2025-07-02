import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FileText } from 'lucide-react';

interface VendorSubmissionsViewProps {
  onSectionChange: (section: string) => void;
}

const VendorSubmissionsView = ({ onSectionChange }: VendorSubmissionsViewProps) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">My Submissions</h2>
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Submissions Yet</h3>
            <p className="text-gray-600 mb-4">
              You haven't submitted any customer applications yet. Use the Pre-Qual tool to get started.
            </p>
            <button 
              className="text-blue-600 hover:text-blue-800 font-medium"
              onClick={() => onSectionChange('prequal')}
            >
              → Start with Pre-Qualification
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VendorSubmissionsView;