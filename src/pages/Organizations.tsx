import React, { useState } from 'react';
import {
  BuildingOfficeIcon,
  UsersIcon,
  CreditCardIcon,
  ChartBarIcon,
  EllipsisVerticalIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

interface Organization {
  id: string;
  name: string;
  subscription_tier: 'solo' | 'pro' | 'enterprise';
  user_count: number;
  deal_count: number;
  status: 'active' | 'suspended' | 'trial';
  created_at: string;
  last_activity: string;
}

// Mock data for organizations
const MOCK_ORGANIZATIONS: Organization[] = [
  {
    id: '1',
    name: 'VendorHub Finance',
    subscription_tier: 'pro',
    user_count: 12,
    deal_count: 45,
    status: 'active',
    created_at: '2024-01-15',
    last_activity: '2024-01-20'
  },
  {
    id: '2',
    name: 'Premier Equipment Lending',
    subscription_tier: 'enterprise',
    user_count: 28,
    deal_count: 156,
    status: 'active',
    created_at: '2023-11-08',
    last_activity: '2024-01-19'
  },
  {
    id: '3',
    name: 'Capital Solutions Group',
    subscription_tier: 'solo',
    user_count: 3,
    deal_count: 12,
    status: 'trial',
    created_at: '2024-01-18',
    last_activity: '2024-01-20'
  },
  {
    id: '4',
    name: 'Equipment Finance Pro',
    subscription_tier: 'pro',
    user_count: 8,
    deal_count: 23,
    status: 'suspended',
    created_at: '2023-09-22',
    last_activity: '2024-01-10'
  }
];

export const Organizations: React.FC = () => {
  const [organizations, setOrganizations] = useState<Organization[]>(MOCK_ORGANIZATIONS);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'suspended' | 'trial'>('all');

  const getTierInfo = (tier: string) => {
    switch (tier) {
      case 'solo':
        return { name: 'Solo', price: '$49.99', color: 'bg-blue-100 text-blue-800' };
      case 'pro':
        return { name: 'Pro', price: '$97.99', color: 'bg-green-100 text-green-800' };
      case 'enterprise':
        return { name: 'Enterprise', price: '$397', color: 'bg-purple-100 text-purple-800' };
      default:
        return { name: 'Solo', price: '$49.99', color: 'bg-blue-100 text-blue-800' };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'suspended':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      case 'trial':
        return <ExclamationCircleIcon className="w-5 h-5 text-yellow-500" />;
      default:
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
    }
  };

  const filteredOrganizations = organizations.filter(org => {
    const matchesSearch = org.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || org.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Organizations</h1>
            <p className="text-gray-600 mt-1">Manage all organizations in the system</p>
          </div>
          <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700">
            <PlusIcon className="w-4 h-4 mr-2" />
            Add Organization
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search organizations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="trial">Trial</option>
            </select>
          </div>
          <div className="text-sm text-gray-600">
            {filteredOrganizations.length} of {organizations.length} organizations
          </div>
        </div>
      </div>

      {/* Organizations List */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 gap-6">
          {filteredOrganizations.map((org) => {
            const tierInfo = getTierInfo(org.subscription_tier);
            return (
              <div key={org.id} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <BuildingOfficeIcon className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h3 className="text-lg font-medium text-gray-900">{org.name}</h3>
                        <div className="ml-2 flex items-center">
                          {getStatusIcon(org.status)}
                        </div>
                      </div>
                      <div className="mt-1 flex items-center space-x-4">
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tierInfo.color}`}>
                          {tierInfo.name}
                        </div>
                        <span className="text-sm text-gray-500">ID: {org.id}</span>
                      </div>
                      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <div className="flex items-center">
                            <UsersIcon className="w-4 h-4 text-gray-400 mr-1" />
                            <span className="text-sm text-gray-600">Users</span>
                          </div>
                          <div className="text-lg font-medium text-gray-900">{org.user_count}</div>
                        </div>
                        <div>
                          <div className="flex items-center">
                            <ChartBarIcon className="w-4 h-4 text-gray-400 mr-1" />
                            <span className="text-sm text-gray-600">Deals</span>
                          </div>
                          <div className="text-lg font-medium text-gray-900">{org.deal_count}</div>
                        </div>
                        <div>
                          <div className="flex items-center">
                            <CreditCardIcon className="w-4 h-4 text-gray-400 mr-1" />
                            <span className="text-sm text-gray-600">Plan</span>
                          </div>
                          <div className="text-lg font-medium text-gray-900">{tierInfo.price}/mo</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Last Activity</div>
                          <div className="text-lg font-medium text-gray-900">
                            {new Date(org.last_activity).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-gray-400 hover:text-gray-600">
                      <EllipsisVerticalIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                {/* Quick Actions */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        org.status === 'active' ? 'bg-green-100 text-green-800' :
                        org.status === 'suspended' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {org.status.charAt(0).toUpperCase() + org.status.slice(1)}
                      </span>
                      <span className="text-xs text-gray-500">
                        Created {new Date(org.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="text-sm text-green-600 hover:text-green-800 font-medium">
                        View Details
                      </button>
                      <button className="text-sm text-gray-600 hover:text-gray-800 font-medium">
                        Manage Users
                      </button>
                      {org.status === 'active' ? (
                        <button className="text-sm text-red-600 hover:text-red-800 font-medium">
                          Suspend
                        </button>
                      ) : (
                        <button className="text-sm text-green-600 hover:text-green-800 font-medium">
                          Activate
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredOrganizations.length === 0 && (
          <div className="text-center py-12">
            <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No organizations found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery || filterStatus !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by creating a new organization.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};