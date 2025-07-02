import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, ArrowRight, Lock, Mail, Shield } from 'lucide-react';
import { DemoCredentials } from '@/types/demo';
import { DEMO_FEATURES } from '@/constants/demoFeatures';

interface DemoAccountCardProps {
  demoCredentials: DemoCredentials;
}

const DemoAccountCard = ({ demoCredentials }: DemoAccountCardProps) => {
  const roleFeatures = DEMO_FEATURES.find(f => f.role === demoCredentials.role);

  const handleStartDemo = () => {
    // Store credentials with demo flag for the login page
    sessionStorage.setItem('demoCredentials', JSON.stringify({
      email: demoCredentials.email,
      password: demoCredentials.password,
      role: demoCredentials.role,
      isDemoMode: true
    }));
    // Navigate to login with demo parameter
    window.location.href = '/auth?demo=true';
  };

  return (
    <div className="max-w-2xl mx-auto mb-12">
      <Card className="relative overflow-hidden hover:shadow-lg transition-shadow border-vendor-green-200">
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-vendor-green-100 to-vendor-gold-100 transform rotate-45 translate-x-8 -translate-y-8"></div>
        <CardHeader>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-vendor-green-100 rounded-lg flex items-center justify-center">
              {demoCredentials.role === 'Partner Admin' ? (
                <Building2 className="w-6 h-6 text-vendor-green-600" />
              ) : (
                <Users className="w-6 h-6 text-vendor-green-600" />
              )}
            </div>
            <div>
              <CardTitle className="text-xl">{demoCredentials.role} Demo</CardTitle>
              <Badge variant="secondary" className="bg-vendor-green-100 text-vendor-green-700">
                Limited Time Access
              </Badge>
            </div>
          </div>
          <CardDescription className="text-base">
            {roleFeatures?.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Login Credentials */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Your Demo Credentials
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-500" />
                <span className="font-mono bg-white px-2 py-1 rounded border">
                  {demoCredentials.email}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-gray-500" />
                <span className="font-mono bg-white px-2 py-1 rounded border">
                  {demoCredentials.password}
                </span>
              </div>
            </div>
          </div>

          {/* Features */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">What you can explore:</h4>
            <ul className="space-y-2">
              {roleFeatures?.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-1.5 h-1.5 bg-vendor-green-500 rounded-full"></div>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Limitations */}
          <div className="bg-yellow-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4 text-yellow-600" />
              Demo Limitations
            </h4>
            <ul className="space-y-1">
              {roleFeatures?.limitations.map((limitation, index) => (
                <li key={index} className="flex items-center gap-2 text-xs text-yellow-800">
                  <div className="w-1 h-1 bg-yellow-600 rounded-full"></div>
                  {limitation}
                </li>
              ))}
            </ul>
          </div>

          {/* Login Button */}
          <Button 
            className="w-full bg-vendor-green-600 hover:bg-vendor-green-700" 
            size="lg"
            onClick={handleStartDemo}
          >
            <div className="flex items-center justify-center gap-2">
              Start Demo as {demoCredentials.role}
              <ArrowRight className="w-4 h-4" />
            </div>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default DemoAccountCard;