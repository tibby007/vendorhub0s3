
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { Play } from 'lucide-react';

const Hero = () => {
  return (
    <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-vendor-green-50 via-white to-vendor-gold-50">
      <div className="max-w-7xl mx-auto text-center">
        <div className="max-w-3xl mx-auto">
          <Badge className="mb-4 bg-vendor-green-100 text-vendor-green-700 border-vendor-green-200">
            <Play className="w-3 h-3 mr-1" />
            Try Interactive Demo - No Signup Required
          </Badge>
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
              <Link to="/demo" className="flex items-center gap-2">
                <Play className="w-4 h-4" />
                Try Interactive Demo
              </Link>
            </Button>
          </div>
          <div className="text-sm text-gray-500 mb-8">
            ✓ Full feature access  ✓ Real data scenarios  ✓ 30-minute session  ✓ No commitment required
          </div>
        </div>

        {/* Hero Image Section */}
        <div className="relative max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-1">
            <img 
              src="/lovable-uploads/49c8cae3-9c77-45a1-b941-46dc54270815.png" 
              alt="VendorHub Partner Admin Dashboard showing real-time vendor management interface with revenue analytics, pending applications, and recent submissions" 
              className="w-full rounded-xl"
            />
          </div>
          
          {/* Interactive Demo Overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300 bg-black/20 rounded-2xl">
            <Button size="lg" asChild className="bg-white text-gray-900 hover:bg-gray-100 shadow-xl">
              <Link to="/demo" className="flex items-center gap-2">
                <Play className="w-5 h-5" />
                Experience This Live
              </Link>
            </Button>
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
