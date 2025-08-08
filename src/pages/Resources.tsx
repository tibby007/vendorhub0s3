import React from 'react';
import { Card } from '../components/ui/Card';

export const Resources: React.FC = () => {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Resources</h1>
        <p className="text-gray-600 mt-1">Access shared guidelines and documents</p>
      </div>

      <Card>
        <div className="text-center py-12">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100">
            <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">Resource Library Coming Soon</h3>
          <p className="mt-2 text-sm text-gray-600">
            Shared documents, guidelines, and resources will be available here.
          </p>
        </div>
      </Card>
    </div>
  );
};