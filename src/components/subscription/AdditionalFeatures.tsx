
import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, Headphones, Code, Users } from 'lucide-react';

const AdditionalFeatures = () => {
  return (
    <>
      {/* Additional Features */}
      <div className="bg-gray-50 rounded-lg p-8 mt-12">
        <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">
          All Plans Include
        </h3>
        <div className="grid md:grid-cols-4 gap-6">
          <div className="text-center">
            <Calendar className="w-8 h-8 text-vendor-green-600 mx-auto mb-3" />
            <h4 className="font-medium text-gray-900">3-Day Free Trial</h4>
            <p className="text-sm text-gray-600">No commitment, cancel anytime</p>
          </div>
          <div className="text-center">
            <Headphones className="w-8 h-8 text-vendor-green-600 mx-auto mb-3" />
            <h4 className="font-medium text-gray-900">Expert Support</h4>
            <p className="text-sm text-gray-600">Get help when you need it</p>
          </div>
          <div className="text-center">
            <Code className="w-8 h-8 text-vendor-green-600 mx-auto mb-3" />
            <h4 className="font-medium text-gray-900">Regular Updates</h4>
            <p className="text-sm text-gray-600">New features monthly</p>
          </div>
          <div className="text-center">
            <Users className="w-8 h-8 text-vendor-green-600 mx-auto mb-3" />
            <h4 className="font-medium text-gray-900">User Training</h4>
            <p className="text-sm text-gray-600">Onboarding and tutorials</p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="text-center bg-vendor-green-600 rounded-lg p-8 text-white">
        <h3 className="text-2xl font-bold mb-4">
          Ready to Scale Your Vendor Network?
        </h3>
        <p className="text-vendor-green-100 mb-6 max-w-2xl mx-auto">
          Join hundreds of Partner Admins who trust VendorHub to manage their vendor relationships and grow their business.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" variant="secondary" className="bg-white text-vendor-green-600 hover:bg-gray-100">
            Start Free Trial
          </Button>
          <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-vendor-green-600">
            Book a Demo
          </Button>
        </div>
      </div>
    </>
  );
};

export default AdditionalFeatures;
