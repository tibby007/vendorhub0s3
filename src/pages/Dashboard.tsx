import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ui/Card';
import {
  FolderIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

export const Dashboard: React.FC = () => {
  const { userProfile } = useAuth();

  // Mock data for now - would be replaced with real API calls
  const stats = {
    total_deals: 45,
    pending_deals: 12,
    approved_deals: 28,
    declined_deals: 5,
  };

  const recentDeals = [
    {
      id: '1',
      customer_name: 'John Smith',
      equipment_type: 'Construction',
      amount: 85000,
      status: 'submitted',
      created_at: '2024-08-08T10:00:00Z',
    },
    {
      id: '2',
      customer_name: 'ABC Manufacturing',
      equipment_type: 'Manufacturing',
      amount: 150000,
      status: 'approved',
      created_at: '2024-08-07T15:30:00Z',
    },
    {
      id: '3',
      customer_name: 'Quick Delivery LLC',
      equipment_type: 'Transportation',
      amount: 65000,
      status: 'credit_pulled',
      created_at: '2024-08-07T09:15:00Z',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
      case 'funded':
        return 'text-green-600 bg-green-100';
      case 'declined':
        return 'text-red-600 bg-red-100';
      case 'submitted':
      case 'credit_pulled':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {userProfile?.first_name}!
        </h1>
        <p className="text-gray-600 mt-1">
          Here's what's happening with your {userProfile?.role === 'vendor' ? 'applications' : 'deals'} today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FolderIcon className="h-8 w-8 text-primary" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-semibold text-gray-900">{stats.total_deals}</p>
              <p className="text-sm text-gray-600">Total Deals</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClockIcon className="h-8 w-8 text-warning" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-semibold text-gray-900">{stats.pending_deals}</p>
              <p className="text-sm text-gray-600">Pending</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-8 w-8 text-success" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-semibold text-gray-900">{stats.approved_deals}</p>
              <p className="text-sm text-gray-600">Approved</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <XCircleIcon className="h-8 w-8 text-error" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-semibold text-gray-900">{stats.declined_deals}</p>
              <p className="text-sm text-gray-600">Declined</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Deals */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium text-gray-900">Recent Deals</h2>
          <a href="/deals" className="text-sm text-primary hover:text-primary/80">
            View all
          </a>
        </div>

        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Equipment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentDeals.map((deal) => (
                <tr key={deal.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {deal.customer_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {deal.equipment_type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${deal.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(deal.status)}`}>
                      {deal.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(deal.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};