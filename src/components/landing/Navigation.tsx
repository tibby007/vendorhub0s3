
import React from 'react';
import { Button } from '@/components/ui/button';
import { Building2, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

const Navigation = () => {
  return (
    <nav className="border-b border-gray-200 bg-white/95 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-vendor-green-500 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">VendorHub</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link to="/auth">Login</Link>
            </Button>
            <Button 
              variant="outline" 
              className="hidden sm:flex border-vendor-gold-400 text-vendor-gold-700 hover:bg-vendor-gold-50"
              asChild
            >
              <Link to="/affiliate-apply">
                <Phone className="w-4 h-4 mr-2" />
                Apply for Affiliate Program
              </Link>
            </Button>
            <Button variant="ghost" asChild className="text-sm bg-vendor-green-50 text-vendor-green-700 hover:bg-vendor-green-100">
              <Link to="/demo-credentials">Try Interactive Demo</Link>
            </Button>
            <Button asChild className="bg-vendor-green-600 hover:bg-vendor-green-700">
              <Link to="/auth">Start Free Trial</Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
