
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useRoleCheck } from '@/hooks/useRoleCheck';
import { partnerAdminSchema } from '@/lib/validation';
import { AlertCircle, Shield } from 'lucide-react';

interface AddPartnerAdminFormProps {
  onSuccess: () => void;
}

const AddPartnerAdminForm = ({ onSuccess }: AddPartnerAdminFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const { canCreatePartnerAdmin, currentRole } = useRoleCheck();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    company: '',
    contactPhone: '',
    subscription: 'Basic'
  });

  // Security check - only Super Admins can create Partner Admins
  if (!canCreatePartnerAdmin()) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <Shield className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          <strong>Access Denied:</strong> Only Super Administrators can create Partner Admin accounts. 
          Your current role: {currentRole || 'Unknown'}
        </AlertDescription>
      </Alert>
    );
  }

  const validateForm = () => {
    const result = partnerAdminSchema.safeParse(formData);
    
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((error) => {
        if (error.path[0]) {
          errors[error.path[0].toString()] = error.message;
        }
      });
      setValidationErrors(errors);
      return false;
    }
    
    setValidationErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Additional server-side role check
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) {
        throw new Error('Not authenticated');
      }

      // Verify current user is Super Admin
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('role')
        .eq('id', currentUser.user.id)
        .single();

      if (profileError || userProfile?.role !== 'Super Admin') {
        throw new Error('Insufficient privileges to create Partner Admin');
      }

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: formData.email,
        password: formData.password,
        email_confirm: true,
        user_metadata: {
          name: formData.name,
          role: 'Partner Admin'
        }
      });

      if (authError) throw authError;

      // Create partner record
      const { data: partnerData, error: partnerError } = await supabase
        .from('partners')
        .insert({
          name: formData.company,
          contact_email: formData.email,
          contact_phone: formData.contactPhone
        })
        .select()
        .single();

      if (partnerError) throw partnerError;

      // Create user profile
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: formData.email,
          name: formData.name,
          role: 'Partner Admin',
          partner_id: partnerData.id
        });

      if (userError) throw userError;

      // Log security event
      console.log(`Security Event: Partner Admin created by ${currentUser.user.email} at ${new Date().toISOString()}`);

      toast({
        title: "Success",
        description: "Partner admin created successfully with secure validation",
      });

      // Reset form
      setFormData({
        name: '',
        email: '',
        password: '',
        company: '',
        contactPhone: '',
        subscription: 'Basic'
      });

      onSuccess();
    } catch (error: any) {
      console.error('Security Error - Partner admin creation failed:', error);
      toast({
        title: "Security Error",
        description: error.message || "Failed to create partner admin - access denied",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="space-y-4">
      <Alert className="border-blue-200 bg-blue-50">
        <Shield className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Security Notice:</strong> Creating Partner Admin accounts requires Super Admin privileges. 
          All actions are logged for security purposes.
        </AlertDescription>
      </Alert>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            required
            className={validationErrors.name ? 'border-red-500' : ''}
          />
          {validationErrors.name && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {validationErrors.name}
            </p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            required
            className={validationErrors.email ? 'border-red-500' : ''}
          />
          {validationErrors.email && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {validationErrors.email}
            </p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password">Password *</Label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            required
            placeholder="Min 8 chars, include uppercase, lowercase, number"
            className={validationErrors.password ? 'border-red-500' : ''}
          />
          {validationErrors.password && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {validationErrors.password}
            </p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="company">Company Name *</Label>
          <Input
            id="company"
            value={formData.company}
            onChange={(e) => handleInputChange('company', e.target.value)}
            required
            className={validationErrors.company ? 'border-red-500' : ''}
          />
          {validationErrors.company && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {validationErrors.company}
            </p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="contactPhone">Contact Phone</Label>
          <Input
            id="contactPhone"
            value={formData.contactPhone}
            onChange={(e) => handleInputChange('contactPhone', e.target.value)}
            placeholder="+1 (555) 123-4567"
            className={validationErrors.contactPhone ? 'border-red-500' : ''}
          />
          {validationErrors.contactPhone && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {validationErrors.contactPhone}
            </p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="subscription">Subscription Tier</Label>
          <Select value={formData.subscription} onValueChange={(value) => handleInputChange('subscription', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Basic">Basic - $97/month</SelectItem>
              <SelectItem value="Pro">Pro - $197/month</SelectItem>
              <SelectItem value="Premium">Premium - $397/month</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? 'Creating Secure Account...' : 'Create Partner Admin'}
        </Button>
      </form>
    </div>
  );
};

export default AddPartnerAdminForm;
