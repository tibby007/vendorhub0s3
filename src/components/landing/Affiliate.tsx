
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Affiliate = () => {
  return (
    <section id="affiliate" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-vendor-green-600 to-vendor-green-700">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-bold text-white mb-4">
          Join Our Affiliate Program
        </h2>
        <p className="text-xl text-vendor-green-100 mb-8">
          Earn competitive commissions by referring new Partner Admins to VendorHub. 
          Get access to marketing materials, dedicated support, and monthly payouts.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" variant="secondary" className="bg-white text-vendor-green-600 hover:bg-gray-100" asChild>
            <Link to="/affiliate-apply">
              Apply for Affiliate Program
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="border-2 border-white text-white bg-transparent hover:bg-white hover:text-vendor-green-600 font-semibold"
            asChild
          >
            <a href="#pricing">
              View Pricing Plans
            </a>
          </Button>
        </div>
        <p className="text-white mt-4 text-sm">
          <span className="text-vendor-gold-200 font-medium">Up to 20% recurring commission</span> • Fast approval process
        </p>
      </div>
    </section>
  );
};

export default Affiliate;
