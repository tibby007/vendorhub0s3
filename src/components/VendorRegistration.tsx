import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface FormData {
  token: string;
  full_name: string;
  business_name: string;
  contact_email: string;
  phone_number: string;
  password: string;
}

const VendorRegistration: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [formData, setFormData] = useState<FormData>({
    token: token || '',
    full_name: '',
    business_name: '',
    contact_email: '',
    phone_number: '',
    password: ''
  });
  
  const [validatingToken, setValidatingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError('Invalid or missing invitation token');
        setValidatingToken(false);
        return;
      }

      try {
        // Use direct API call to avoid Supabase type issues
        const response = await fetch(`/api/vendor-management/validate-token?token=${encodeURIComponent(token)}`);
        
        if (!response.ok) {
          setError('Invalid or expired invitation token');
          setValidatingToken(false);
          return;
        }

        const vendorInfo = await response.json();
        
        // Pre-fill form with vendor data
        setFormData({
          token: token,
          full_name: '',
          business_name: vendorInfo.vendor_name || '',
          contact_email: vendorInfo.contact_email || '',
          phone_number: vendorInfo.contact_phone || '',
          password: ''
        });
        setTokenValid(true);
        setValidatingToken(false);
      } catch (err) {
        console.error('Token validation error:', err);
        setError('Failed to validate invitation token');
        setValidatingToken(false);
      }
    };

    validateToken();
  }, [token]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      // Validate required fields
      if (!formData.full_name || !formData.business_name || !formData.contact_email || !formData.phone_number || !formData.password) {
        throw new Error('All fields are required');
      }

      if (formData.password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      // Call the registration API
      const response = await fetch('/api/vendor-management/register-vendor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Registration failed');
      }

      setRegistrationComplete(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/auth');
      }, 3000);
      
    } catch (err) {
      console.error('Registration error:', err);
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (validatingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-6">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Validating invitation...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center">
              <XCircle className="h-5 w-5 mr-2" />
              Invalid Invitation
            </CardTitle>
            <CardDescription>
              The invitation link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button 
              onClick={() => navigate('/auth')} 
              className="w-full mt-4"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (registrationComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-green-600 flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              Registration Successful!
            </CardTitle>
            <CardDescription>
              Your account has been created successfully. You will receive a login link via email shortly.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Redirecting to login page in a few seconds...
            </p>
            <Button 
              onClick={() => navigate('/auth')} 
              className="w-full"
            >
              Go to Login Now
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Complete Your Registration</CardTitle>
          <CardDescription>
            Please fill in your details to complete your vendor registration.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                name="full_name"
                type="text"
                value={formData.full_name}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="business_name">Business Name</Label>
              <Input
                id="business_name"
                name="business_name"
                type="text"
                value={formData.business_name}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="contact_email">Email Address</Label>
              <Input
                id="contact_email"
                name="contact_email"
                type="email"
                value={formData.contact_email}
                onChange={handleInputChange}
                required
                disabled
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone_number">Phone Number</Label>
              <Input
                id="phone_number"
                name="phone_number"
                type="tel"
                value={formData.phone_number}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                minLength={6}
              />
            </div>
            
            {error && (
              <Alert>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating Account...
                </>
              ) : (
                'Complete Registration'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default VendorRegistration;