
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Building2, Clock, Users, CheckCircle, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { DemoAnalytics, DEMO_EVENTS } from '@/utils/demoAnalytics';
import { SecurityUtils, RateLimiter } from '@/utils/securityUtils';

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

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [csrfToken] = useState(() => SecurityUtils.generateSecureToken());

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Name validation
    if (!formData.name.trim() || formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    // Email validation
    if (!SecurityUtils.validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid business email';
    }

    // Company validation
    if (!formData.company.trim() || formData.company.length < 2) {
      newErrors.company = 'Company name must be at least 2 characters';
    }

    // Role validation
    if (!formData.role) {
      newErrors.role = 'Please select a role';
    }

    // Phone validation (if provided)
    if (formData.phone && !SecurityUtils.validatePhone(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Rate limiting check
    if (!RateLimiter.checkRateLimit('demo-registration', 3, 900000)) {
      toast.error("Too Many Attempts", {
        description: "Please wait 15 minutes before trying again.",
      });
      return;
    }

    if (!validateForm()) {
      toast.error("Please correct the errors in the form");
      return;
    }

    setIsLoading(true);

    try {
      console.log('Submitting demo lead registration:', formData);
      
      // Sanitize form data before submission
      const sanitizedData = {
        name: SecurityUtils.sanitizeText(formData.name.trim()),
        email: formData.email.toLowerCase().trim(),
        company: SecurityUtils.sanitizeText(formData.company.trim()),
        phone: formData.phone ? SecurityUtils.sanitizeText(formData.phone.trim()) : undefined,
        role: formData.role,
        employees: formData.employees ? SecurityUtils.sanitizeText(formData.employees) : undefined,
        useCase: formData.useCase ? SecurityUtils.sanitizeText(formData.useCase.trim()) : undefined,
        csrfToken
      };

      // Call the edge function for demo registration
      const { data, error } = await supabase.functions.invoke('demo-lead-registration', {
        body: sanitizedData
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      console.log('Demo registration response:', data);

      if (data.success && data.credentials) {
        // Start demo analytics session with enhanced security
        const sessionId = DemoAnalytics.startSession({
          ...sanitizedData,
          sessionId: data.sessionId
        }, formData.role);
        
        console.log('Demo session started with ID:', sessionId);

        // Track successful registration
        DemoAnalytics.trackEvent(DEMO_EVENTS.REGISTRATION_SUCCESS, {
          role: formData.role,
          company: sanitizedData.company,
          sessionId: data.sessionId
        });

        toast.success("Demo Access Granted!", {
          description: "Your secure credentials have been generated. Check your email for details.",
        });

        onSuccess(data.credentials);
      } else {
        throw new Error(data.error || 'Failed to generate demo credentials');
      }
    } catch (error: any) {
      console.error('Demo registration error:', error);
      
      // Track failed registration for security monitoring
      DemoAnalytics.trackEvent(DEMO_EVENTS.REGISTRATION_FAILED, {
        error: error.message,
        email: formData.email
      });

      toast.error("Registration Failed", {
        description: error.message || "Failed to generate demo access. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
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
            Get instant access to a secure, personalized demo environment with real data and features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
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
              <Shield className="w-8 h-8 text-vendor-green-600 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900">Secure Access</h3>
              <p className="text-sm text-gray-600">Encrypted credentials</p>
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
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={errors.name ? 'border-red-500' : ''}
                  required
                  maxLength={100}
                />
                {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Business Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={errors.email ? 'border-red-500' : ''}
                  required
                  maxLength={254}
                />
                {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company">Company Name *</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => handleInputChange('company', e.target.value)}
                  className={errors.company ? 'border-red-500' : ''}
                  required
                  maxLength={100}
                />
                {errors.company && <p className="text-sm text-red-600">{errors.company}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className={errors.phone ? 'border-red-500' : ''}
                  maxLength={20}
                />
                {errors.phone && <p className="text-sm text-red-600">{errors.phone}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">I want to explore as *</Label>
                <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
                  <SelectTrigger className={errors.role ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Partner Admin">Partner Admin</SelectItem>
                    <SelectItem value="Vendor">Vendor</SelectItem>
                  </SelectContent>
                </Select>
                {errors.role && <p className="text-sm text-red-600">{errors.role}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="employees">Company Size</Label>
                <Select value={formData.employees} onValueChange={(value) => handleInputChange('employees', value)}>
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
                onChange={(e) => handleInputChange('useCase', e.target.value)}
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-gray-500">
                {formData.useCase.length}/500 characters
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-vendor-green-600 hover:bg-vendor-green-700" 
              size="lg"
              disabled={isLoading || !formData.name || !formData.email || !formData.company || !formData.role}
            >
              {isLoading ? 'Generating Secure Demo Access...' : 'Start My Secure Demo Experience'}
            </Button>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Security & Privacy</span>
              </div>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• All data is encrypted in transit and at rest</li>
                <li>• Demo credentials are securely generated and time-limited</li>
                <li>• No production data access - isolated demo environment</li>
                <li>• Your information is protected per our privacy policy</li>
              </ul>
            </div>

            <p className="text-xs text-gray-500 text-center">
              By proceeding, you agree to our terms and privacy policy. We'll use this information to personalize your secure demo experience.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default DemoLeadCaptureForm;
