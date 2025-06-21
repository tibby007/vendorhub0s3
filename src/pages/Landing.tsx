
import React, { useEffect } from 'react';
import Navigation from '@/components/landing/Navigation';
import Hero from '@/components/landing/Hero';
import Features from '@/components/landing/Features';
import Pricing from '@/components/landing/Pricing';
import Affiliate from '@/components/landing/Affiliate';
import Footer from '@/components/landing/Footer';

const Landing = () => {
  useEffect(() => {
    // Load chat support bot
    const script = document.createElement('script');
    script.src = 'https://app.aibotsworld.com/js/chat_plugin.js';
    script.setAttribute('data-bot-id', '52054');
    script.async = true;
    document.head.appendChild(script);

    return () => {
      // Cleanup script on unmount
      const existingScript = document.querySelector('script[data-bot-id="52054"]');
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <Hero />
      <Features />
      <Pricing />
      <Affiliate />
      <Footer />
    </div>
  );
};

export default Landing;
