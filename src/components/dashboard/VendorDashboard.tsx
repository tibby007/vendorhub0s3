import React, { useState } from 'react';
import CustomerApplicationForm from '@/components/vendor/CustomerApplicationForm';
import PreQualTool from '@/components/vendor/PreQualTool';
import VendorResources from '@/components/vendor/VendorResources';
import VendorDashboardOverview from './vendor/VendorDashboardOverview';
import VendorSubmissionsView from './vendor/VendorSubmissionsView';
import { useVendorStats } from '@/hooks/useVendorStats';

const VendorDashboard = () => {
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [preQualData, setPreQualData] = useState<any>(null);
  const submissionStats = useVendorStats();

  const handleSubmitApplication = (customerData: any) => {
    console.log('PreQual data for application:', customerData);
    setPreQualData(customerData);
    setActiveSection('new-application');
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'new-application':
        return <CustomerApplicationForm preQualData={preQualData} />;
      case 'submissions':
        return <VendorSubmissionsView onSectionChange={setActiveSection} />;
      case 'prequal':
        return <PreQualTool onSubmitApplication={handleSubmitApplication} />;
      case 'resources':
        return <VendorResources />;
      default:
        return (
          <VendorDashboardOverview 
            submissionStats={submissionStats}
            onSectionChange={setActiveSection}
          />
        );
    }
  };

  return (
    <div className="p-6">
      {activeSection !== 'overview' && (
        <button
          onClick={() => {
            setActiveSection('overview');
            setPreQualData(null); // Clear preQual data when going back
          }}
          className="mb-6 text-blue-600 hover:text-blue-800 font-medium"
        >
          ← Back to Dashboard
        </button>
      )}
      {renderContent()}
    </div>
  );
};

export default VendorDashboard;