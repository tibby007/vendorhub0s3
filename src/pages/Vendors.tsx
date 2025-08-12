import React, { useState } from 'react';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EllipsisVerticalIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import type { User } from '../types';
import { InviteVendorModal } from '../components/vendors/InviteVendorModal';

interface VendorWithStats extends User {
  deals_count: number;
  total_volume: number;
  last_activity: string;
  status: 'active' | 'inactive' | 'pending';
}

// Mock vendor data
const MOCK_VENDORS: VendorWithStats[] = [
  {
    id: 'vendor-1',
    organization_id: '3f977fec-56c6-4c47-9548-82e961b7a27e',
    email: 'mike.construction@example.com',
    role: 'vendor',
    first_name: 'Mike',
    last_name: 'Johnson',
    phone: '(555) 123-4567',
    is_active: true,
    last_login: '2024-08-12T09:30:00Z',
    created_at: '2024-06-01T00:00:00Z',
    updated_at: '2024-08-12T09:30:00Z',
    deals_count: 8,
    total_volume: 875000,
    last_activity: '2024-08-12T09:30:00Z',
    status: 'active'
  },
  {
    id: 'vendor-2',
    organization_id: '3f977fec-56c6-4c47-9548-82e961b7a27e',
    email: 'sarah.landscaping@example.com',
    role: 'vendor',
    first_name: 'Sarah',
    last_name: 'Williams',
    phone: '(555) 987-6543',
    is_active: true,
    last_login: '2024-08-11T14:15:00Z',
    created_at: '2024-05-15T00:00:00Z',
    updated_at: '2024-08-11T14:15:00Z',
    deals_count: 12,
    total_volume: 1250000,
    last_activity: '2024-08-11T14:15:00Z',
    status: 'active'
  },
  {
    id: 'vendor-3',
    organization_id: '3f977fec-56c6-4c47-9548-82e961b7a27e',
    email: 'tech.equipment@example.com',
    role: 'vendor',
    first_name: 'Robert',
    last_name: 'Chen',
    phone: '(555) 246-8135',
    is_active: true,
    last_login: '2024-08-10T16:45:00Z',
    created_at: '2024-07-01T00:00:00Z',
    updated_at: '2024-08-10T16:45:00Z',
    deals_count: 5,
    total_volume: 625000,
    last_activity: '2024-08-10T16:45:00Z',
    status: 'active'
  },
  {
    id: 'vendor-4',
    organization_id: '3f977fec-56c6-4c47-9548-82e961b7a27e',
    email: 'pending.vendor@example.com',
    role: 'vendor',
    first_name: 'Jennifer',
    last_name: 'Davis',
    phone: '(555) 369-2580',
    is_active: false,
    last_login: undefined,
    created_at: '2024-08-10T00:00:00Z',
    updated_at: '2024-08-10T00:00:00Z',
    deals_count: 0,
    total_volume: 0,
    last_activity: '2024-08-10T00:00:00Z',
    status: 'pending'
  }
];

type VendorFilter = 'all' | 'active' | 'inactive' | 'pending';

export const Vendors: React.FC = () => {
  const { userProfile } = useAuth();
  const [vendors, setVendors] = useState<VendorWithStats[]>(MOCK_VENDORS);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<VendorFilter>('all');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = 
      vendor.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filter === 'all' || vendor.status === filter;
    
    return matchesSearch && matchesFilter;
  });

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
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: string, isActive: boolean) => {
    if (status === 'pending') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <ClockIcon className="w-3 h-3 mr-1" />
          Pending
        </span>
      );
    }
    
    if (isActive) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircleIcon className="w-3 h-3 mr-1" />
          Active
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        <XCircleIcon className="w-3 h-3 mr-1" />
        Inactive
      </span>
    );
  };

  const handleInviteVendor = (vendorData: { email: string; firstName: string; lastName: string; phone?: string; message?: string }) => {
    // In a real app, this would send an API request
    const newVendor: VendorWithStats = {
      id: `vendor-${Date.now()}`,
      organization_id: userProfile!.organization_id,
      email: vendorData.email,
      role: 'vendor',
      first_name: vendorData.firstName,
      last_name: vendorData.lastName,
      phone: vendorData.phone || undefined,
      is_active: false,
      last_login: undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deals_count: 0,
      total_volume: 0,
      last_activity: new Date().toISOString(),
      status: 'pending'
    };
    
    setVendors([...vendors, newVendor]);
    setIsInviteModalOpen(false);
  };

  const handleToggleVendorStatus = (vendorId: string) => {
    setVendors(vendors.map(vendor => 
      vendor.id === vendorId 
        ? { 
            ...vendor, 
            is_active: !vendor.is_active,
            status: !vendor.is_active ? 'active' : 'inactive',
            updated_at: new Date().toISOString()
          }
        : vendor
    ));
  };

  // Stats calculation
  const stats = {
    total: vendors.length,
    active: vendors.filter(v => v.status === 'active').length,
    pending: vendors.filter(v => v.status === 'pending').length,
    totalVolume: vendors.reduce((sum, v) => sum + v.total_volume, 0)
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Vendors</h1>
            <p className="text-gray-600 mt-1">Manage your vendor network and partnerships</p>
          </div>
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Invite Vendor
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserIcon className="w-6 h-6 text-gray-400" />
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">Total Vendors</div>
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="w-6 h-6 text-green-400" />
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">Active</div>
                <div className="text-2xl font-bold text-gray-900">{stats.active}</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="w-6 h-6 text-yellow-400" />
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">Pending</div>
                <div className="text-2xl font-bold text-gray-900">{stats.pending}</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">Total Volume</div>
                <div className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalVolume)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="px-6 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 sm:space-x-4">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search vendors..."
                className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <FunnelIcon className="w-4 h-4 text-gray-400" />
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
              value={filter}
              onChange={(e) => setFilter(e.target.value as VendorFilter)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Vendors List */}
      <div className="flex-1 px-6 pb-6">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deals
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Volume
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Activity
                  </th>
                  <th className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredVendors.map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center">
                            <span className="text-sm font-medium text-white">
                              {vendor.first_name?.charAt(0) || '?'}{vendor.last_name?.charAt(0) || '?'}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {vendor.first_name} {vendor.last_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            Member since {formatDate(vendor.created_at)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center mb-1">
                        <EnvelopeIcon className="w-4 h-4 mr-1 text-gray-400" />
                        {vendor.email}
                      </div>
                      {vendor.phone && (
                        <div className="text-sm text-gray-500 flex items-center">
                          <PhoneIcon className="w-4 h-4 mr-1 text-gray-400" />
                          {vendor.phone}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(vendor.status, vendor.is_active)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {vendor.deals_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(vendor.total_volume)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <CalendarIcon className="w-4 h-4 mr-1" />
                        {formatDate(vendor.last_activity)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleToggleVendorStatus(vendor.id)}
                          className={`px-3 py-1 rounded-md text-xs font-medium ${
                            vendor.is_active
                              ? 'bg-red-100 text-red-800 hover:bg-red-200'
                              : 'bg-green-100 text-green-800 hover:bg-green-200'
                          }`}
                        >
                          {vendor.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button className="text-gray-400 hover:text-gray-600">
                          <EllipsisVerticalIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredVendors.length === 0 && (
              <div className="text-center py-12">
                <UserIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No vendors found</h3>
                <p className="text-gray-600">
                  {searchQuery || filter !== 'all' 
                    ? 'Try adjusting your search or filter criteria.'
                    : 'Get started by inviting your first vendor.'}
                </p>
                {!searchQuery && filter === 'all' && (
                  <button
                    onClick={() => setIsInviteModalOpen(true)}
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                  >
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Invite Vendor
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      <InviteVendorModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onSubmit={handleInviteVendor}
      />
    </div>
  );
};