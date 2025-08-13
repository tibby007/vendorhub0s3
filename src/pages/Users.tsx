import React, { useState } from 'react';
import {
  UserIcon,
  BuildingOfficeIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  EllipsisVerticalIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'broker' | 'loan_officer' | 'vendor' | 'superadmin';
  organization_name: string;
  organization_id: string;
  status: 'active' | 'inactive' | 'pending';
  created_at: string;
  last_login: string;
  phone?: string;
}

// Mock data for users
const MOCK_USERS: User[] = [
  {
    id: '1',
    email: 'john.doe@vendorhub.com',
    first_name: 'John',
    last_name: 'Doe',
    role: 'broker',
    organization_name: 'VendorHub Finance',
    organization_id: '1',
    status: 'active',
    created_at: '2024-01-15',
    last_login: '2024-01-20',
    phone: '+1 (555) 123-4567'
  },
  {
    id: '2',
    email: 'support@emergestack.dev',
    first_name: 'System',
    last_name: 'Admin',
    role: 'superadmin',
    organization_name: 'System',
    organization_id: 'system',
    status: 'active',
    created_at: '2023-01-01',
    last_login: '2024-01-20',
    phone: '+1 (555) 999-0000'
  },
  {
    id: '3',
    email: 'jane.smith@premier.com',
    first_name: 'Jane',
    last_name: 'Smith',
    role: 'loan_officer',
    organization_name: 'Premier Equipment Lending',
    organization_id: '2',
    status: 'active',
    created_at: '2023-11-08',
    last_login: '2024-01-19',
    phone: '+1 (555) 234-5678'
  },
  {
    id: '4',
    email: 'vendor@test.com',
    first_name: 'Test',
    last_name: 'Vendor',
    role: 'vendor',
    organization_name: 'Capital Solutions Group',
    organization_id: '3',
    status: 'pending',
    created_at: '2024-01-18',
    last_login: '2024-01-18',
    phone: '+1 (555) 345-6789'
  },
  {
    id: '5',
    email: 'mike.johnson@equipment.com',
    first_name: 'Mike',
    last_name: 'Johnson',
    role: 'broker',
    organization_name: 'Equipment Finance Pro',
    organization_id: '4',
    status: 'inactive',
    created_at: '2023-09-22',
    last_login: '2024-01-10'
  }
];

export const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'broker' | 'loan_officer' | 'vendor' | 'superadmin'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'pending'>('all');

  const getRoleInfo = (role: string) => {
    switch (role) {
      case 'superadmin':
        return { name: 'Super Admin', color: 'bg-red-100 text-red-800', icon: ShieldCheckIcon };
      case 'broker':
        return { name: 'Broker', color: 'bg-blue-100 text-blue-800', icon: UserIcon };
      case 'loan_officer':
        return { name: 'Loan Officer', color: 'bg-green-100 text-green-800', icon: UserIcon };
      case 'vendor':
        return { name: 'Vendor', color: 'bg-purple-100 text-purple-800', icon: BuildingOfficeIcon };
      default:
        return { name: 'User', color: 'bg-gray-100 text-gray-800', icon: UserIcon };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'inactive':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      case 'pending':
        return <ClockIcon className="w-5 h-5 text-yellow-500" />;
      default:
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.organization_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600 mt-1">Manage all users across all organizations</p>
          </div>
          <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700">
            <PlusIcon className="w-4 h-4 mr-2" />
            Add User
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
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="all">All Roles</option>
              <option value="broker">Broker</option>
              <option value="loan_officer">Loan Officer</option>
              <option value="vendor">Vendor</option>
              <option value="superadmin">Super Admin</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          <div className="text-sm text-gray-600">
            {filteredUsers.length} of {users.length} users
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="divide-y divide-gray-200">
            {filteredUsers.map((user) => {
              const roleInfo = getRoleInfo(user.role);
              const RoleIcon = roleInfo.icon;
              return (
                <div key={user.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className={`w-12 h-12 ${user.role === 'superadmin' ? 'bg-red-600' : 'bg-green-600'} rounded-full flex items-center justify-center`}>
                          <span className="text-sm font-medium text-white">
                            {user.first_name.charAt(0)}{user.last_name.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center">
                          <h3 className="text-lg font-medium text-gray-900">
                            {user.first_name} {user.last_name}
                          </h3>
                          <div className="ml-2 flex items-center">
                            {getStatusIcon(user.status)}
                          </div>
                          {user.role === 'superadmin' && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                              ADMIN
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex items-center space-x-4">
                          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleInfo.color}`}>
                            <RoleIcon className="w-3 h-3 mr-1" />
                            {roleInfo.name}
                          </div>
                          <span className="text-sm text-gray-500">ID: {user.id}</span>
                        </div>
                        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <div className="flex items-center">
                              <EnvelopeIcon className="w-4 h-4 text-gray-400 mr-1" />
                              <span className="text-sm text-gray-600">Email</span>
                            </div>
                            <div className="text-sm font-medium text-gray-900 truncate">{user.email}</div>
                          </div>
                          {user.phone && (
                            <div>
                              <div className="flex items-center">
                                <PhoneIcon className="w-4 h-4 text-gray-400 mr-1" />
                                <span className="text-sm text-gray-600">Phone</span>
                              </div>
                              <div className="text-sm font-medium text-gray-900">{user.phone}</div>
                            </div>
                          )}
                          <div>
                            <div className="flex items-center">
                              <BuildingOfficeIcon className="w-4 h-4 text-gray-400 mr-1" />
                              <span className="text-sm text-gray-600">Organization</span>
                            </div>
                            <div className="text-sm font-medium text-gray-900 truncate">{user.organization_name}</div>
                          </div>
                          <div>
                            <div className="flex items-center">
                              <CalendarIcon className="w-4 h-4 text-gray-400 mr-1" />
                              <span className="text-sm text-gray-600">Last Login</span>
                            </div>
                            <div className="text-sm font-medium text-gray-900">
                              {new Date(user.last_login).toLocaleDateString()}
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
                          user.status === 'active' ? 'bg-green-100 text-green-800' :
                          user.status === 'inactive' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                        </span>
                        <span className="text-xs text-gray-500">
                          Joined {new Date(user.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="text-sm text-green-600 hover:text-green-800 font-medium">
                          View Profile
                        </button>
                        <button className="text-sm text-gray-600 hover:text-gray-800 font-medium">
                          Send Message
                        </button>
                        {user.status === 'active' ? (
                          <button className="text-sm text-red-600 hover:text-red-800 font-medium">
                            Deactivate
                          </button>
                        ) : (
                          <button className="text-sm text-green-600 hover:text-green-800 font-medium">
                            Activate
                          </button>
                        )}
                        {user.role !== 'superadmin' && (
                          <button className="text-sm text-orange-600 hover:text-orange-800 font-medium">
                            Change Role
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery || filterRole !== 'all' || filterStatus !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by adding a new user.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};