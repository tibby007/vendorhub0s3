
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface DemoContextType {
  isDemoMode: boolean;
  setDemoMode: (enabled: boolean) => void;
  showGuide: boolean;
  setShowGuide: (show: boolean) => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  currentDemoRole: 'Partner Admin' | 'Vendor';
  setCurrentDemoRole: (role: 'Partner Admin' | 'Vendor') => void;
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
  vendorSubmissions: Array<{
    id: string;
    customerName: string;
    businessName: string;
    status: 'Approved' | 'Pending' | 'Rejected' | 'Manual Review';
    submittedDate: string;
    amount: number;
    notes?: string;
  }>;
  analytics: {
    totalRevenue: number;
    monthlyGrowth: number;
    totalVendors: number;
    pendingApplications: number;
    approvalRate: number;
  };
  vendorAnalytics: {
    totalSubmissions: number;
    approvedSubmissions: number;
    pendingSubmissions: number;
    totalCommission: number;
    monthlyCommission: number;
    conversionRate: number;
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
  vendorSubmissions: [
    {
      id: '1',
      customerName: 'Acme Manufacturing',
      businessName: 'Acme Corp',
      status: 'Approved',
      submittedDate: '2024-06-15',
      amount: 45000,
      notes: 'Excellent credit profile, quick approval'
    },
    {
      id: '2',
      customerName: 'Sunrise Healthcare',
      businessName: 'Sunrise Medical',
      status: 'Manual Review',
      submittedDate: '2024-06-20',
      amount: 67000,
      notes: 'Requires additional documentation'
    },
    {
      id: '3',
      customerName: 'City Retail Chain',
      businessName: 'City Markets',
      status: 'Pending',
      submittedDate: '2024-06-21',
      amount: 35000
    },
    {
      id: '4',
      customerName: 'Mountain Coffee Co',
      businessName: 'Mountain Brew',
      status: 'Approved',
      submittedDate: '2024-06-18',
      amount: 22000,
      notes: 'Fast track approval - existing relationship'
    },
    {
      id: '5',
      customerName: 'Tech Startup Hub',
      businessName: 'StartupSpace',
      status: 'Rejected',
      submittedDate: '2024-06-16',
      amount: 18000,
      notes: 'Insufficient business history'
    }
  ],
  analytics: {
    totalRevenue: 370000,
    monthlyGrowth: 18.5,
    totalVendors: 4,
    pendingApplications: 2,
    approvalRate: 78.2
  },
  vendorAnalytics: {
    totalSubmissions: 5,
    approvedSubmissions: 2,
    pendingSubmissions: 1,
    totalCommission: 8400,
    monthlyCommission: 3200,
    conversionRate: 40
  }
};

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export const DemoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isDemoMode, setDemoMode] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [currentDemoRole, setCurrentDemoRole] = useState<'Partner Admin' | 'Vendor'>('Partner Admin');

  return (
    <DemoContext.Provider
      value={{
        isDemoMode,
        setDemoMode,
        showGuide,
        setShowGuide,
        currentStep,
        setCurrentStep,
        currentDemoRole,
        setCurrentDemoRole,
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
