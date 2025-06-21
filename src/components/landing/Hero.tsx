import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const Hero = () => {
  return (
    <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-vendor-green-50 via-white to-vendor-gold-50">
      <div className="max-w-7xl mx-auto text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Scale Your Business with
            <span className="text-vendor-green-600"> Smart Vendor</span>
            <span className="text-vendor-gold-600"> Partnerships</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            VendorHub empowers Partner Admins to build and manage thriving vendor networks. 
            Streamline applications, track performance, and grow revenue through strategic partnerships.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" asChild className="bg-vendor-green-600 hover:bg-vendor-green-700">
              <Link to="/auth">Start Free Trial</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="border-vendor-green-600 text-vendor-green-600 hover:bg-vendor-green-50">
              <Link to="/demo">
                View Live Demo
              </Link>
            </Button>
          </div>
        </div>

        {/* Hero Image Section */}
        <div className="relative max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-1">
            <img 
              src="/placeholder.svg" 
              alt="VendorHub Dashboard Preview" 
              className="w-full rounded-xl"
            />
          </div>
          {/* Floating elements for visual appeal */}
          <div className="absolute -top-4 -left-4 w-8 h-8 bg-vendor-green-500 rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-vendor-gold-500 rounded-full opacity-20 animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-1/2 -left-8 w-6 h-6 bg-vendor-green-400 rounded-full opacity-30 animate-pulse" style={{animationDelay: '2s'}}></div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
