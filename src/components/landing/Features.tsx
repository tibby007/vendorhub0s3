
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, FileText, Shield } from 'lucide-react';

const Features = () => {
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

  return (
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
  );
};

export default Features;
