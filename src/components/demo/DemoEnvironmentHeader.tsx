import React from 'react';
import { DemoCredentials } from '@/types/demo';

interface DemoEnvironmentHeaderProps {
  demoCredentials: DemoCredentials;
}

const DemoEnvironmentHeader = ({ demoCredentials }: DemoEnvironmentHeaderProps) => {
  return (
    <div className="text-center mb-12">
      <h2 className="text-3xl font-bold text-gray-900 mb-4">
        Your Demo Environment is Ready
      </h2>
      <p className="text-xl text-gray-600 max-w-3xl mx-auto">
        Access your personalized VendorHub demo as a <strong>{demoCredentials.role}</strong>. 
        Explore real features with sample data in a secure environment.
      </p>
    </div>
  );
};

export default DemoEnvironmentHeader;