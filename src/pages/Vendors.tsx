import React from 'react';
import { Card } from '../components/ui/Card';

export const Vendors: React.FC = () => {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Vendors</h1>
        <p className="text-gray-600 mt-1">Manage your vendor network</p>
      </div>

      <Card>
        <div className="text-center py-12">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100">
            <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">Vendor Management Coming Soon</h3>
          <p className="mt-2 text-sm text-gray-600">
            Vendor invitation, management, and relationship tools will be implemented here.
          </p>
        </div>
      </Card>
    </div>
  );
};