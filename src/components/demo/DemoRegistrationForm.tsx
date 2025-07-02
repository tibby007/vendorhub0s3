import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { DemoAnalytics, DEMO_EVENTS } from '@/utils/demoAnalytics';
import { SecurityUtils, RateLimiter } from '@/utils/securityUtils';
import DemoCredentialsModal from './DemoCredentialsModal';

interface DemoRegistrationFormProps {
  onSuccess: (credentials: { email: string; password: string; role: string }) => void;
}

const DemoRegistrationForm = ({ onSuccess }: DemoRegistrationFormProps) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [demoCredentials, setDemoCredentials] = useState<{ email: string; password: string; role: string } | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
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

    if (!formData.name.trim() || formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!SecurityUtils.validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid business email';
    }

    if (!formData.company.trim() || formData.company.length < 2) {
      newErrors.company = 'Company name must be at least 2 characters';
    }

    if (!formData.role) {
      newErrors.role = 'Please select a role';
    }

    if (formData.phone && !SecurityUtils.validatePhone(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinueToDemo = () => {
    if (!demoCredentials) return;
    
    setShowCredentialsModal(false);
    
    // Store demo credentials in session storage for auto-population
    sessionStorage.setItem('demoCredentials', JSON.stringify(demoCredentials));
    sessionStorage.setItem('demoSessionActive', 'true');
    
    // Navigate to auth page with demo mode indicator
    navigate('/auth?demo=true');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
      
      const sanitizedData = {
        name: SecurityUtils.sanitizeText(formData.name.trim()),
        email: formData.email.toLowerCase().trim(),
        company: SecurityUtils.sanitizeText(formData.company.trim()),
        phone: formData.phone && formData.phone.trim() ? SecurityUtils.sanitizeText(formData.phone.trim()) : undefined,
        role: formData.role,
        employees: formData.employees && formData.employees.trim() ? SecurityUtils.sanitizeText(formData.employees) : undefined,
        useCase: formData.useCase && formData.useCase.trim() ? SecurityUtils.sanitizeText(formData.useCase.trim()) : undefined,
        csrfToken
      };

      // Validate payload before sending
      console.log('Sanitized data before sending:', JSON.stringify(sanitizedData, null, 2));

      console.log('Invoking demo-lead-registration with data:', sanitizedData);
      
      const { data, error } = await supabase.functions.invoke('demo-lead-registration', {
        body: sanitizedData
      });

      console.log('Raw edge function response:', { data, error });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      console.log('Demo registration response:', data);

      if (data.success && data.credentials) {
        // Set credentials and session info for modal
        setDemoCredentials(data.credentials);
        setSessionId(data.sessionId);
        setShowCredentialsModal(true);

        // Start analytics session
        const analyticsSessionId = DemoAnalytics.startSession({
          ...sanitizedData,
          sessionId: data.sessionId
        }, formData.role);
        
        console.log('Demo session started with ID:', analyticsSessionId);

        DemoAnalytics.trackEvent(DEMO_EVENTS.REGISTRATION_SUCCESS, {
          role: formData.role,
          company: sanitizedData.company,
          sessionId: data.sessionId,
          demoUserCreated: data.demoUserCreated
        });

        toast.success("Demo Access Granted!", {
          description: "Your secure credentials have been generated. Please save them before proceeding.",
        });

        // Also call the onSuccess callback for backward compatibility
        onSuccess(data.credentials);
      } else {
        throw new Error(data.error || 'Failed to generate demo credentials');
      }
    } catch (error: any) {
      console.error('Demo registration error:', error);
      
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
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <>
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
      </form>

      {/* Enhanced Credentials Modal */}
      {demoCredentials && (
        <DemoCredentialsModal
          isOpen={showCredentialsModal}
          onOpenChange={setShowCredentialsModal}
          credentials={demoCredentials}
          sessionId={sessionId}
          onContinue={handleContinueToDemo}
        />
      )}
    </>
  );
};

export default DemoRegistrationForm;
