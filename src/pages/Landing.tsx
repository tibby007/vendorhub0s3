
import React, { useEffect } from 'react';
import Navigation from '@/components/landing/Navigation';
import Hero from '@/components/landing/Hero';
import Features from '@/components/landing/Features';
import Pricing from '@/components/landing/Pricing';

import Footer from '@/components/landing/Footer';

const Landing = () => {
  // Removed aibotsworld script injection - security issue

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <Hero />
      <Features />
      <Pricing />
      
      <Footer />
    </div>
  );
};

export default Landing;
