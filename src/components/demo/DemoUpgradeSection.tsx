import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const DemoUpgradeSection = () => {
  return (
    <Card className="bg-gradient-to-r from-vendor-green-50 to-vendor-gold-50 border-vendor-green-200">
      <CardContent className="pt-6">
        <div className="text-center space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Ready to Scale Your Vendor Network?
          </h3>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Experience the full power of VendorHub with unlimited access, custom setup, and dedicated support.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="bg-vendor-green-600 hover:bg-vendor-green-700">
              <Link to="/auth">
                Get Full Access
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DemoUpgradeSection;