import React from 'react';
import { 
  BuildingOfficeIcon,
  UserIcon, 
  CurrencyDollarIcon,
  CalendarIcon,
  ChevronRightIcon,
  EllipsisVerticalIcon
} from '@heroicons/react/24/outline';
import { Deal, DealStatus, DEAL_STATUS_CONFIG } from '../../types';

interface DealCardProps {
  deal: Deal;
  onStatusChange: (dealId: string, newStatus: DealStatus) => void;
  onView: (deal: Deal) => void;
}

export const DealCard: React.FC<DealCardProps> = ({ deal, onStatusChange, onView }) => {
  const prequalColors = {
    green: 'bg-green-100 text-green-800',
    yellow: 'bg-yellow-100 text-yellow-800',  
    red: 'bg-red-100 text-red-800'
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const nextStatuses = DEAL_STATUS_CONFIG[deal.status].next_statuses;

  return (
    <div 
      className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onView(deal)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 text-sm">
            {deal.customer_info.full_name}
          </h4>
          <p className="text-xs text-gray-600">
            {deal.customer_info.company_name || 'Individual'}
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          {deal.prequalification_result && (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              prequalColors[deal.prequalification_result]
            }`}>
              {deal.prequalification_result.toUpperCase()}
            </span>
          )}
          
          <div className="relative group">
            <button 
              className="text-gray-400 hover:text-gray-600 p-1 rounded"
              onClick={(e) => {
                e.stopPropagation();
                // In a real app, this would show a dropdown menu
              }}
            >
              <EllipsisVerticalIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Equipment Info */}
      <div className="mb-3">
        <div className="flex items-center text-xs text-gray-600 mb-1">
          <BuildingOfficeIcon className="w-3 h-3 mr-1" />
          <span className="truncate">{deal.equipment_info.equipment_type}</span>
        </div>
        <p className="text-xs text-gray-500 line-clamp-2">
          {deal.equipment_info.equipment_description}
        </p>
      </div>

      {/* Financial Info */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-gray-50 rounded p-2">
          <div className="flex items-center text-xs text-gray-600 mb-1">
            <CurrencyDollarIcon className="w-3 h-3 mr-1" />
            <span>Equipment</span>
          </div>
          <p className="text-sm font-semibold text-gray-900">
            {formatCurrency(deal.equipment_info.equipment_price)}
          </p>
        </div>
        
        <div className="bg-gray-50 rounded p-2">
          <div className="flex items-center text-xs text-gray-600 mb-1">
            <CurrencyDollarIcon className="w-3 h-3 mr-1" />
            <span>Requested</span>
          </div>
          <p className="text-sm font-semibold text-gray-900">
            {deal.financial_info.requested_amount 
              ? formatCurrency(deal.financial_info.requested_amount)
              : '—'}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <div className="flex items-center text-xs text-gray-500">
          <CalendarIcon className="w-3 h-3 mr-1" />
          <span>{formatDate(deal.submission_date)}</span>
        </div>
        
        {deal.assigned_to && (
          <div className="flex items-center text-xs text-gray-500">
            <UserIcon className="w-3 h-3 mr-1" />
            <span>Assigned</span>
          </div>
        )}
        
        {nextStatuses.length > 0 && (
          <div className="flex items-center">
            <select
              className="text-xs border-0 bg-transparent text-green-600 hover:text-green-700 focus:ring-0 focus:outline-none cursor-pointer pr-6"
              value=""
              onChange={(e) => {
                e.stopPropagation();
                if (e.target.value) {
                  onStatusChange(deal.id, e.target.value as DealStatus);
                }
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <option value="" disabled>Move to...</option>
              {nextStatuses.map(status => (
                <option key={status} value={status}>
                  {DEAL_STATUS_CONFIG[status].name}
                </option>
              ))}
            </select>
            <ChevronRightIcon className="w-3 h-3 text-gray-400 pointer-events-none -ml-5" />
          </div>
        )}
      </div>
    </div>
  );
};