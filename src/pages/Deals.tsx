import React, { useState, useEffect } from 'react';
import { PlusIcon, EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import type { Deal, DealStatus } from '../types';
import { DEAL_STATUS_CONFIG } from '../types';
import { CreateDealModal } from '../components/deals/CreateDealModal';
import { DealCard } from '../components/deals/DealCard';
import { DealDetailsModal } from '../components/deals/DealDetailsModal';

const COLUMN_ORDER: DealStatus[] = [
  'submitted',
  'credit_pulled', 
  'submitted_for_approval',
  'approved',
  'term_sheet_issued',
  'funded',
  'declined'
];

// Mock deals data - In production, this would come from Supabase
const MOCK_DEALS: Deal[] = [
  {
    id: '1',
    organization_id: '3f977fec-56c6-4c47-9548-82e961b7a27e',
    vendor_id: 'vendor-1',
    assigned_to: undefined,
    status: 'submitted',
    customer_info: {
      full_name: 'John Smith',
      address: {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zip: '10001'
      },
      ssn: '***-**-1234',
      date_of_birth: '1980-01-15',
      email: 'john.smith@email.com',
      phone: '(555) 123-4567',
      company_name: 'Smith Construction',
      business_address: {
        street: '456 Business Ave',
        city: 'New York',
        state: 'NY',
        zip: '10002'
      },
      business_start_date: '2018-03-01',
      estimated_down_payment: 25000
    },
    equipment_info: {
      equipment_type: 'Excavator',
      equipment_description: 'CAT 320 Excavator - 2023 Model',
      equipment_price: 125000,
      vendor_quote_number: 'Q-2024-001'
    },
    financial_info: {
      estimated_credit_score: 720,
      time_in_business: 6,
      down_payment_percentage: 20,
      requested_amount: 100000
    },
    prequalification_result: 'green',
    submission_date: '2024-08-10T10:00:00Z',
    last_updated: '2024-08-10T10:00:00Z',
    created_at: '2024-08-10T10:00:00Z'
  },
  {
    id: '2',
    organization_id: '3f977fec-56c6-4c47-9548-82e961b7a27e',
    vendor_id: 'vendor-2',
    assigned_to: undefined,
    status: 'credit_pulled',
    customer_info: {
      full_name: 'Sarah Johnson',
      address: {
        street: '789 Oak St',
        city: 'Chicago',
        state: 'IL',
        zip: '60601'
      },
      ssn: '***-**-5678',
      date_of_birth: '1975-05-20',
      email: 'sarah.johnson@email.com',
      phone: '(555) 987-6543',
      company_name: 'Johnson Landscaping',
      business_address: {
        street: '321 Garden Ln',
        city: 'Chicago',
        state: 'IL',
        zip: '60602'
      },
      business_start_date: '2015-06-15',
      estimated_down_payment: 15000
    },
    equipment_info: {
      equipment_type: 'Truck',
      equipment_description: 'Ford F-550 Dump Truck - 2024',
      equipment_price: 75000,
      vendor_quote_number: 'Q-2024-002'
    },
    financial_info: {
      estimated_credit_score: 680,
      time_in_business: 9,
      down_payment_percentage: 20,
      requested_amount: 60000
    },
    prequalification_result: 'yellow',
    submission_date: '2024-08-08T14:30:00Z',
    last_updated: '2024-08-11T09:15:00Z',
    created_at: '2024-08-08T14:30:00Z'
  },
  {
    id: '3',
    organization_id: '3f977fec-56c6-4c47-9548-82e961b7a27e',
    vendor_id: 'vendor-3',
    assigned_to: 'loan-officer-1',
    status: 'approved',
    customer_info: {
      full_name: 'Michael Brown',
      address: {
        street: '456 Pine St',
        city: 'Los Angeles',
        state: 'CA',
        zip: '90210'
      },
      ssn: '***-**-9012',
      date_of_birth: '1982-12-03',
      email: 'michael.brown@email.com',
      phone: '(555) 246-8135',
      company_name: 'Brown Manufacturing',
      business_address: {
        street: '789 Industrial Way',
        city: 'Los Angeles',
        state: 'CA',
        zip: '90211'
      },
      business_start_date: '2019-01-01',
      estimated_down_payment: 50000
    },
    equipment_info: {
      equipment_type: 'CNC Machine',
      equipment_description: 'Haas VF-4SS CNC Vertical Mill',
      equipment_price: 250000,
      vendor_quote_number: 'Q-2024-003'
    },
    financial_info: {
      estimated_credit_score: 780,
      time_in_business: 5,
      down_payment_percentage: 20,
      requested_amount: 200000
    },
    prequalification_result: 'green',
    submission_date: '2024-08-05T11:00:00Z',
    last_updated: '2024-08-12T08:00:00Z',
    created_at: '2024-08-05T11:00:00Z'
  }
];

export const Deals: React.FC = () => {
  const { userProfile } = useAuth();
  const [deals, setDeals] = useState<Deal[]>(MOCK_DEALS);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Group deals by status
  const dealsByStatus = COLUMN_ORDER.reduce((acc, status) => {
    acc[status] = deals.filter(deal => deal.status === status);
    return acc;
  }, {} as Record<DealStatus, Deal[]>);

  const handleCreateDeal = (newDeal: Omit<Deal, 'id' | 'created_at' | 'last_updated' | 'submission_date'>) => {
    const deal: Deal = {
      ...newDeal,
      id: `deal-${Date.now()}`,
      submission_date: new Date().toISOString(),
      last_updated: new Date().toISOString(),
      created_at: new Date().toISOString()
    };
    setDeals([...deals, deal]);
    setIsCreateModalOpen(false);
  };

  const handleStatusChange = (dealId: string, newStatus: DealStatus) => {
    setDeals(deals.map(deal => 
      deal.id === dealId 
        ? { ...deal, status: newStatus, last_updated: new Date().toISOString() }
        : deal
    ));
  };

  const handleViewDeal = (deal: Deal) => {
    setSelectedDeal(deal);
    setIsDetailsModalOpen(true);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Deals</h1>
            <p className="text-gray-600 mt-1">Manage your equipment financing deals</p>
          </div>
          {userProfile?.role !== 'vendor' && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              New Deal
            </button>
          )}
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 flex overflow-x-auto p-6 space-x-6">
        {COLUMN_ORDER.map((status) => {
          const statusConfig = DEAL_STATUS_CONFIG[status];
          const columnDeals = dealsByStatus[status] || [];
          
          return (
            <div key={status} className="flex-shrink-0 w-80">
              {/* Column Header */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div 
                  className="px-4 py-3 border-b border-gray-200"
                  style={{ backgroundColor: `${statusConfig.color}15` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: statusConfig.color }}
                      ></div>
                      <h3 className="text-sm font-semibold text-gray-900">
                        {statusConfig.name}
                      </h3>
                      <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                        {columnDeals.length}
                      </span>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600">
                      <EllipsisVerticalIcon className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {statusConfig.description}
                  </p>
                </div>

                {/* Column Content */}
                <div className="p-3 space-y-3 min-h-[600px]">
                  {columnDeals.map((deal) => (
                    <DealCard
                      key={deal.id}
                      deal={deal}
                      onStatusChange={handleStatusChange}
                      onView={handleViewDeal}
                    />
                  ))}
                  
                  {columnDeals.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-sm text-gray-500">No deals</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modals */}
      <CreateDealModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateDeal}
      />
      
      <DealDetailsModal
        deal={selectedDeal}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
};