import React, { useState } from 'react';
import { 
  XMarkIcon,
  BuildingOfficeIcon,
  UserIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  DocumentIcon,
  ChatBubbleLeftRightIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { Deal, DealStatus, DEAL_STATUS_CONFIG } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

interface DealDetailsModalProps {
  deal: Deal | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (dealId: string, newStatus: DealStatus) => void;
}

export const DealDetailsModal: React.FC<DealDetailsModalProps> = ({
  deal,
  isOpen,
  onClose,
  onStatusChange
}) => {
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('details');
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);

  if (!isOpen || !deal) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const statusConfig = DEAL_STATUS_CONFIG[deal.status];
  const nextStatuses = statusConfig.next_statuses;
  const canChangeStatus = userProfile?.role !== 'vendor' && nextStatuses.length > 0;

  const prequalColors = {
    green: 'bg-green-100 text-green-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    red: 'bg-red-100 text-red-800'
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
        
        <div className="bg-white rounded-lg shadow-xl transform transition-all max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{deal.customer_info.full_name}</h3>
                  <p className="text-sm text-gray-600">{deal.customer_info.company_name || 'Individual Customer'}</p>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div 
                      className="flex items-center px-3 py-1 rounded-full text-sm font-medium"
                      style={{ backgroundColor: `${statusConfig.color}15`, color: statusConfig.color }}
                    >
                      <div 
                        className="w-2 h-2 rounded-full mr-2"
                        style={{ backgroundColor: statusConfig.color }}
                      ></div>
                      {statusConfig.name}
                      {canChangeStatus && (
                        <ChevronDownIcon 
                          className="w-4 h-4 ml-1 cursor-pointer" 
                          onClick={() => setIsStatusMenuOpen(!isStatusMenuOpen)}
                        />
                      )}
                    </div>
                    
                    {isStatusMenuOpen && canChangeStatus && (
                      <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-48">
                        {nextStatuses.map(status => {
                          const nextConfig = DEAL_STATUS_CONFIG[status];
                          return (
                            <button
                              key={status}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center"
                              onClick={() => {
                                onStatusChange(deal.id, status);
                                setIsStatusMenuOpen(false);
                              }}
                            >
                              <div 
                                className="w-2 h-2 rounded-full mr-2"
                                style={{ backgroundColor: nextConfig.color }}
                              ></div>
                              Move to {nextConfig.name}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  
                  {deal.prequalification_result && (
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      prequalColors[deal.prequalification_result]
                    }`}>
                      {deal.prequalification_result.toUpperCase()} LIGHT
                    </span>
                  )}
                </div>
              </div>
              
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            {/* Tabs */}
            <div className="flex space-x-8 mt-4">
              {['details', 'documents', 'messages', 'timeline'].map((tab) => (
                <button
                  key={tab}
                  className={`pb-2 text-sm font-medium capitalize border-b-2 transition-colors ${
                    activeTab === tab
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {activeTab === 'details' && (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center text-gray-600 mb-2">
                      <CurrencyDollarIcon className="w-5 h-5 mr-2" />
                      <span className="text-sm font-medium">Equipment Price</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(deal.equipment_info.equipment_price)}
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center text-gray-600 mb-2">
                      <CurrencyDollarIcon className="w-5 h-5 mr-2" />
                      <span className="text-sm font-medium">Requested Amount</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {deal.financial_info.requested_amount 
                        ? formatCurrency(deal.financial_info.requested_amount) 
                        : '—'}
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center text-gray-600 mb-2">
                      <CalendarIcon className="w-5 h-5 mr-2" />
                      <span className="text-sm font-medium">Submitted</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">
                      {new Date(deal.submission_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Customer Information */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <UserIcon className="w-5 h-5 mr-2" />
                      Customer Information
                    </h4>
                    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Full Name</label>
                        <p className="text-gray-900">{deal.customer_info.full_name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Email</label>
                        <p className="text-gray-900">{deal.customer_info.email}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Phone</label>
                        <p className="text-gray-900">{deal.customer_info.phone}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Address</label>
                        <p className="text-gray-900">
                          {deal.customer_info.address.street}<br />
                          {deal.customer_info.address.city}, {deal.customer_info.address.state} {deal.customer_info.address.zip}
                        </p>
                      </div>
                      {deal.customer_info.company_name && (
                        <div>
                          <label className="text-sm font-medium text-gray-600">Company</label>
                          <p className="text-gray-900">{deal.customer_info.company_name}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Equipment Information */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <BuildingOfficeIcon className="w-5 h-5 mr-2" />
                      Equipment Information
                    </h4>
                    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Equipment Type</label>
                        <p className="text-gray-900">{deal.equipment_info.equipment_type}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Description</label>
                        <p className="text-gray-900">{deal.equipment_info.equipment_description}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Price</label>
                        <p className="text-gray-900">{formatCurrency(deal.equipment_info.equipment_price)}</p>
                      </div>
                      {deal.equipment_info.vendor_quote_number && (
                        <div>
                          <label className="text-sm font-medium text-gray-600">Quote Number</label>
                          <p className="text-gray-900">{deal.equipment_info.vendor_quote_number}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Financial Information */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <CurrencyDollarIcon className="w-5 h-5 mr-2" />
                    Financial Information
                  </h4>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Credit Score</label>
                        <p className="text-gray-900">
                          {deal.financial_info.estimated_credit_score || '—'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Time in Business</label>
                        <p className="text-gray-900">
                          {deal.financial_info.time_in_business ? `${deal.financial_info.time_in_business} years` : '—'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Down Payment %</label>
                        <p className="text-gray-900">
                          {deal.financial_info.down_payment_percentage ? `${deal.financial_info.down_payment_percentage}%` : '—'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Requested Amount</label>
                        <p className="text-gray-900">
                          {deal.financial_info.requested_amount ? formatCurrency(deal.financial_info.requested_amount) : '—'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="text-center py-12">
                <DocumentIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Documents</h3>
                <p className="text-gray-600 mb-4">Document management will be implemented here.</p>
                <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                  <DocumentIcon className="w-4 h-4 mr-2" />
                  Upload Document
                </button>
              </div>
            )}

            {activeTab === 'messages' && (
              <div className="text-center py-12">
                <ChatBubbleLeftRightIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Messages</h3>
                <p className="text-gray-600">Communication thread will be implemented here.</p>
              </div>
            )}

            {activeTab === 'timeline' && (
              <div>
                <div className="flow-root">
                  <ul className="-mb-8">
                    <li>
                      <div className="relative pb-8">
                        <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                        <div className="relative flex space-x-3">
                          <div>
                            <span className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center ring-8 ring-white">
                              <CalendarIcon className="w-4 h-4 text-white" />
                            </span>
                          </div>
                          <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-sm text-gray-500">Deal submitted by vendor</p>
                            </div>
                            <div className="text-right text-sm whitespace-nowrap text-gray-500">
                              {formatDate(deal.submission_date)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                    <li>
                      <div className="relative pb-8">
                        <div className="relative flex space-x-3">
                          <div>
                            <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                              <CalendarIcon className="w-4 h-4 text-white" />
                            </span>
                          </div>
                          <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-sm text-gray-500">Status updated to {statusConfig.name}</p>
                            </div>
                            <div className="text-right text-sm whitespace-nowrap text-gray-500">
                              {formatDate(deal.last_updated)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
            <div className="text-sm text-gray-600">
              Last updated: {formatDate(deal.last_updated)}
            </div>
            <div className="flex space-x-3">
              {userProfile?.role !== 'vendor' && (
                <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                  Assign to Loan Officer
                </button>
              )}
              <button 
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};