
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface DemoContextType {
  isDemoMode: boolean;
  setDemoMode: (enabled: boolean) => void;
  showGuide: boolean;
  setShowGuide: (show: boolean) => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  demoData: DemoData;
}

interface DemoData {
  vendors: Array<{
    id: string;
    name: string;
    email: string;
    phone: string;
    status: 'Active' | 'Pending';
    joinDate: string;
    revenue: number;
  }>;
  submissions: Array<{
    id: string;
    customerName: string;
    vendorName: string;
    businessName: string;
    status: 'Approved' | 'Pending' | 'Rejected' | 'Manual Review';
    submittedDate: string;
    amount: number;
  }>;
  analytics: {
    totalRevenue: number;
    monthlyGrowth: number;
    totalVendors: number;
    pendingApplications: number;
    approvalRate: number;
  };
}

const demoData: DemoData = {
  vendors: [
    {
      id: '1',
      name: 'TechFlow Solutions',
      email: 'contact@techflow.com',
      phone: '(555) 123-4567',
      status: 'Active',
      joinDate: '2024-01-15',
      revenue: 125000
    },
    {
      id: '2',
      name: 'Digital Dynamics',
      email: 'hello@digitaldynamics.com',
      phone: '(555) 234-5678',
      status: 'Active',
      joinDate: '2024-02-20',
      revenue: 89000
    },
    {
      id: '3',
      name: 'InnovateCorp',
      email: 'sales@innovatecorp.com',
      phone: '(555) 345-6789',
      status: 'Active',
      joinDate: '2024-03-10',
      revenue: 156000
    },
    {
      id: '4',
      name: 'NextGen Systems',
      email: 'info@nextgensys.com',
      phone: '(555) 456-7890',
      status: 'Pending',
      joinDate: '2024-06-01',
      revenue: 0
    }
  ],
  submissions: [
    {
      id: '1',
      customerName: 'Acme Manufacturing',
      vendorName: 'TechFlow Solutions',
      businessName: 'Acme Corp',
      status: 'Approved',
      submittedDate: '2024-06-15',
      amount: 45000
    },
    {
      id: '2',
      customerName: 'Global Logistics Inc',
      vendorName: 'Digital Dynamics',
      businessName: 'GlobalLog',
      status: 'Pending',
      submittedDate: '2024-06-18',
      amount: 32000
    },
    {
      id: '3',
      customerName: 'Metro Restaurant Group',
      vendorName: 'InnovateCorp',
      businessName: 'Metro Dining',
      status: 'Approved',
      submittedDate: '2024-06-12',
      amount: 28000
    },
    {
      id: '4',
      customerName: 'Sunrise Healthcare',
      vendorName: 'TechFlow Solutions',
      businessName: 'Sunrise Medical',
      status: 'Manual Review',
      submittedDate: '2024-06-20',
      amount: 67000
    },
    {
      id: '5',
      customerName: 'EcoTech Solutions',
      vendorName: 'Digital Dynamics',
      businessName: 'EcoTech',
      status: 'Rejected',
      submittedDate: '2024-06-10',
      amount: 15000
    }
  ],
  analytics: {
    totalRevenue: 370000,
    monthlyGrowth: 18.5,
    totalVendors: 4,
    pendingApplications: 2,
    approvalRate: 78.2
  }
};

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export const DemoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isDemoMode, setDemoMode] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  return (
    <DemoContext.Provider
      value={{
        isDemoMode,
        setDemoMode,
        showGuide,
        setShowGuide,
        currentStep,
        setCurrentStep,
        demoData,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
};

export const useDemo = () => {
  const context = useContext(DemoContext);
  if (context === undefined) {
    throw new Error('useDemo must be used within a DemoProvider');
  }
  return context;
};
