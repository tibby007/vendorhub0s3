
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, FileText, Shield, CheckCircle, Star, ArrowRight, Calendar, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

const Landing = () => {
  const features = [
    {
      icon: <Users className="w-6 h-6" />,
      title: "Multi-User Dashboard",
      description: "Separate dashboards for Super Admins, Partner Admins, and Vendors with role-based access control."
    },
    {
      icon: <FileText className="w-6 h-6" />,
      title: "Application Management",
      description: "Streamlined submission process with document uploads and real-time status tracking."
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Secure Document Storage",
      description: "Bank-level security for sensitive customer documents and business information."
    },
    {
      icon: <Building2 className="w-6 h-6" />,
      title: "Partner Network",
      description: "Manage multiple vendor relationships and track performance across your network."
    }
  ];

  const pricingTiers = [
    {
      name: "VendorHub Basic",
      price: "$97",
      period: "/month",
      description: "Perfect for small partner networks",
      features: [
        "Up to 3 vendors",
        "50 submissions/month",
        "Basic reporting",
        "Email support",
        "Standard document storage"
      ],
      popular: false,
      buttonText: "Start 3-Day Free Trial"
    },
    {
      name: "VendorHub Pro",
      price: "$197",
      period: "/month",
      description: "Ideal for growing businesses",
      features: [
        "Up to 7 vendors",
        "500 submissions/month",
        "Advanced analytics",
        "Priority support",
        "Unlimited document storage",
        "White-label branding",
        "PreQual tool"
      ],
      popular: true,
      buttonText: "Start 3-Day Free Trial"
    },
    {
      name: "VendorHub Premium",
      price: "$397",
      period: "/month",
      description: "For enterprise-scale operations",
      features: [
        "Unlimited vendors",
        "Unlimited submissions",
        "White-label solution",
        "Dedicated support",
        "Full API access",
        "Advanced security",
        "Training & onboarding"
      ],
      popular: false,
      buttonText: "Start 3-Day Free Trial"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
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
                <a href="https://api.leadconnectorhq.com/widget/bookings/vendorhub" target="_blank" rel="noopener noreferrer">
                  <Phone className="w-4 h-4 mr-2" />
                  Book a Demo
                </a>
              </Button>
              <Button asChild className="bg-vendor-green-600 hover:bg-vendor-green-700">
                <Link to="/auth">Start Free Trial</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
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

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything You Need to Manage Your Network
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              From vendor onboarding to application processing, VendorHub provides all the tools 
              you need to run a successful partner network.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow border-gray-200 hover:border-vendor-gold-200">
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-to-br from-vendor-green-100 to-vendor-gold-50 rounded-lg flex items-center justify-center mx-auto mb-4 border border-vendor-gold-100">
                    <div className="text-vendor-green-600">
                      {feature.icon}
                    </div>
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-vendor-gold-25">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-gray-600 mb-4">
              Choose the plan that fits your business size and growth goals
            </p>
            <div className="inline-flex items-center gap-2 bg-vendor-gold-100 text-vendor-gold-800 px-4 py-2 rounded-full text-sm font-medium border border-vendor-gold-200">
              <Calendar className="w-4 h-4" />
              All plans include a 3-day free trial
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 max-w-6xl mx-auto items-center lg:items-stretch">
            {pricingTiers.map((tier, index) => (
              <Card 
                key={index} 
                className={`relative flex-1 ${
                  tier.popular 
                    ? 'ring-2 ring-vendor-gold-400 shadow-2xl scale-105 bg-white border-vendor-gold-200' 
                    : 'shadow-lg border-gray-200 hover:border-vendor-gold-200'
                } transition-all duration-300 hover:shadow-xl`}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-vendor-gold-500 to-vendor-gold-600 text-white px-6 py-2 shadow-lg">
                      <Star className="w-4 h-4 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center">
                  <CardTitle className="text-xl">{tier.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-gray-900">{tier.price}</span>
                    <span className="text-gray-600">{tier.period}</span>
                  </div>
                  <CardDescription className="mt-2">{tier.description}</CardDescription>
                </CardHeader>
                
                <CardContent className="flex-1 flex flex-col">
                  <ul className="space-y-3 mb-6 flex-1">
                    {tier.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-vendor-green-500 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    className={`w-full ${
                      tier.popular 
                        ? 'bg-gradient-to-r from-vendor-gold-500 to-vendor-gold-600 hover:from-vendor-gold-600 hover:to-vendor-gold-700 text-white shadow-lg' 
                        : 'border-vendor-green-500 text-vendor-green-600 hover:bg-vendor-green-50'
                    }`}
                    variant={tier.popular ? 'default' : 'outline'}
                    asChild
                  >
                    <Link to="/auth">{tier.buttonText}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Annual Savings Callout */}
          <div className="text-center mt-12">
            <Card className="inline-block p-6 bg-gradient-to-r from-vendor-gold-50 to-vendor-gold-100 border-vendor-gold-200 shadow-lg">
              <div className="flex items-center gap-3">
                <Star className="w-6 h-6 text-vendor-gold-600" />
                <div>
                  <p className="font-medium text-vendor-gold-900">Save 17% with Annual Billing</p>
                  <p className="text-sm text-vendor-gold-700">Switch to yearly plans after your free trial</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Affiliate Program CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-vendor-green-600 to-vendor-green-700">
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
              <a href="mailto:affiliates@vendorhub.com">
                Apply for Affiliate Program
                <ArrowRight className="w-4 h-4 ml-2" />
              </a>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white text-white hover:bg-white hover:text-vendor-green-600"
              asChild
            >
              <a href="#pricing">
                Learn More
              </a>
            </Button>
          </div>
          <p className="text-white mt-4 text-sm">
            <span className="text-vendor-gold-200 font-medium">Up to 20% recurring commission</span> • Fast approval process
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-vendor-green-500 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">VendorHub</span>
              </div>
              <p className="text-gray-400">
                The complete platform for managing vendor partnerships and growing your business network.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Chat Support</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Service Status</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Affiliate Program</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 VendorHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
