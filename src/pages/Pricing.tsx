import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import PricingComponent from '@/components/landing/Pricing';

const Pricing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-vendor-gold-25">
      {/* Header with back button */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link to="/" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </Button>
        </div>
      </div>

      {/* Pricing content */}
      <div className="pt-0">
        <PricingComponent />
      </div>
    </div>
  );
};

export default Pricing;