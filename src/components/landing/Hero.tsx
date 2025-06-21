
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

const Hero = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-vendor-green-50 via-white to-vendor-gold-50">
      <div className="max-w-7xl mx-auto text-center">
        <div className="mb-6">
          <Badge className="bg-vendor-gold-100 text-vendor-gold-800 px-4 py-2 text-sm font-medium border border-vendor-gold-200">
            <Calendar className="w-4 h-4 mr-2" />
            3-Day Free Trial • Start Today
          </Badge>
        </div>
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
          Streamline Your
          <span className="text-vendor-green-600"> Vendor Network</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          The complete platform for managing vendor partnerships, application submissions, and business growth. 
          Built for Partner Admins who need to scale their vendor networks efficiently.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" className="bg-vendor-green-600 hover:bg-vendor-green-700" asChild>
            <Link to="/auth">Start 3-Day Free Trial</Link>
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="flex items-center gap-2 border-vendor-gold-400 text-vendor-gold-700 hover:bg-vendor-gold-50"
            asChild
          >
            <a href="https://api.leadconnectorhq.com/widget/bookings/vendorhub" target="_blank" rel="noopener noreferrer">
              <Phone className="w-4 h-4" />
              Book a Demo
            </a>
          </Button>
        </div>
        <p className="text-sm text-gray-500 mt-4">
          Try all features free for 3 days • Cancel anytime
        </p>
      </div>
    </section>
  );
};

export default Hero;
