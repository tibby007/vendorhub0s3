import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  HomeIcon,
  FolderIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  CogIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  ArrowRightOnRectangleIcon,
  PlusCircleIcon,
} from '@heroicons/react/24/outline';

export const DashboardLayout: React.FC = () => {
  const { userProfile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const brokerNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Deals', href: '/dashboard/deals', icon: FolderIcon },
    { name: 'Vendors', href: '/dashboard/vendors', icon: UserGroupIcon },
    { name: 'Messages', href: '/dashboard/messages', icon: ChatBubbleLeftRightIcon },
    { name: 'Resources', href: '/dashboard/resources', icon: DocumentTextIcon },
    { name: 'Settings', href: '/dashboard/settings', icon: CogIcon },
  ];

  const vendorNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Pre-Qualify', href: '/dashboard/pre-qualify', icon: ChartBarIcon },
    { name: 'New Application', href: '/dashboard/application', icon: PlusCircleIcon },
    { name: 'My Deals', href: '/dashboard/deals', icon: FolderIcon },
    { name: 'Messages', href: '/dashboard/messages', icon: ChatBubbleLeftRightIcon },
    { name: 'Resources', href: '/dashboard/resources', icon: DocumentTextIcon },
  ];

  const superadminNavigation = [
    { name: 'System Overview', href: '/dashboard', icon: HomeIcon },
    { name: 'All Deals', href: '/dashboard/deals', icon: FolderIcon },
    { name: 'All Organizations', href: '/dashboard/organizations', icon: BuildingOfficeIcon },
    { name: 'User Management', href: '/dashboard/users', icon: UserGroupIcon },
    { name: 'System Messages', href: '/dashboard/messages', icon: ChatBubbleLeftRightIcon },
    { name: 'All Resources', href: '/dashboard/resources', icon: DocumentTextIcon },
    { name: 'System Settings', href: '/dashboard/settings', icon: CogIcon },
  ];

  const getNavigation = () => {
    if (userProfile?.role === 'superadmin') return superadminNavigation;
    if (userProfile?.role === 'vendor') return vendorNavigation;
    return brokerNavigation;
  };

  const navigation = getNavigation();

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="flex flex-col w-64 bg-white border-r border-gray-200">
        <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-primary">VendorHub OS</h1>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* User info and sign out */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className={`w-8 h-8 ${userProfile?.role === 'superadmin' ? 'bg-red-600' : 'bg-primary'} rounded-full flex items-center justify-center`}>
                <span className="text-sm font-medium text-white">
                  {userProfile?.first_name?.charAt(0)}{userProfile?.last_name?.charAt(0)}
                </span>
              </div>
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {userProfile?.first_name} {userProfile?.last_name}
                {userProfile?.role === 'superadmin' && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                    ADMIN
                  </span>
                )}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {userProfile?.role === 'superadmin' ? 'System Administrator' : userProfile?.role}
              </p>
            </div>
          </div>
          
          <button
            onClick={handleSignOut}
            className="mt-3 w-full flex items-center px-4 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3" />
            Sign out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
          <Outlet />
        </main>
      </div>
    </div>
  );
};