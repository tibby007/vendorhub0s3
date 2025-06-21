
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Building2, Clock, Users, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { DemoAnalytics, DEMO_EVENTS } from '@/utils/demoAnalytics';

interface DemoLeadCaptureFormProps {
  onSuccess: (credentials: { email: string; password: string; role: string }) => void;
}

const DemoLeadCaptureForm = ({ onSuccess }: DemoLeadCaptureFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    role: '',
    phone: '',
    employees: '',
    useCase: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log('Submitting demo lead registration:', formData);
      
      // Call the edge function for demo registration
      const { data, error } = await supabase.functions.invoke('demo-lead-registration', {
        body: formData
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      console.log('Demo registration response:', data);

      if (data.success && data.credentials) {
        // Start demo analytics session
        const sessionId = DemoAnalytics.startSession(formData, formData.role);
        console.log('Demo session started with ID:', sessionId);

        toast.success("Demo Access Granted!", {
          description: "Your credentials have been generated. Check your email for details.",
        });

        onSuccess(data.credentials);
      } else {
        throw new Error('Failed to generate demo credentials');
      }
    } catch (error: any) {
      console.error('Demo registration error:', error);
      toast.error("Registration Failed", {
        description: error.message || "Failed to generate demo access. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-vendor-green-50 via-white to-vendor-gold-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-vendor-green-500 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Experience VendorHub Live</CardTitle>
          <CardDescription className="text-lg">
            Get instant access to a personalized demo environment with real data and features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="text-center p-4 bg-vendor-green-50 rounded-lg">
              <Clock className="w-8 h-8 text-vendor-green-600 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900">30-Min Session</h3>
              <p className="text-sm text-gray-600">Full platform access</p>
            </div>
            <div className="text-center p-4 bg-vendor-green-50 rounded-lg">
              <Users className="w-8 h-8 text-vendor-green-600 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900">Real Data</h3>
              <p className="text-sm text-gray-600">Pre-loaded scenarios</p>
            </div>
            <div className="text-center p-4 bg-vendor-green-50 rounded-lg">
              <CheckCircle className="w-8 h-8 text-vendor-green-600 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900">No Commitment</h3>
              <p className="text-sm text-gray-600">Explore freely</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Business Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company">Company Name *</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">I want to explore as *</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Partner Admin">Partner Admin</SelectItem>
                    <SelectItem value="Vendor">Vendor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="employees">Company Size</Label>
                <Select value={formData.employees} onValueChange={(value) => setFormData(prev => ({ ...prev, employees: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Number of employees" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-10">1-10 employees</SelectItem>
                    <SelectItem value="11-50">11-50 employees</SelectItem>
                    <SelectItem value="51-200">51-200 employees</SelectItem>
                    <SelectItem value="201-500">201-500 employees</SelectItem>
                    <SelectItem value="500+">500+ employees</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="useCase">What's your primary use case? (Optional)</Label>
              <Textarea
                id="useCase"
                placeholder="e.g., Managing vendor partnerships, streamlining application processes..."
                value={formData.useCase}
                onChange={(e) => setFormData(prev => ({ ...prev, useCase: e.target.value }))}
                rows={3}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-vendor-green-600 hover:bg-vendor-green-700" 
              size="lg"
              disabled={isLoading || !formData.name || !formData.email || !formData.company || !formData.role}
            >
              {isLoading ? 'Generating Demo Access...' : 'Start My Demo Experience'}
            </Button>

            <p className="text-xs text-gray-500 text-center">
              By proceeding, you agree to our terms and privacy policy. We'll use this information to personalize your demo experience.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default DemoLeadCaptureForm;
