
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { FileText, CreditCard, AlertCircle, User, Building } from 'lucide-react';
import { customerSchema } from '@/lib/validation';
import SecureFileUpload from '@/components/security/SecureFileUpload';

const CustomerApplicationForm = () => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [files, setFiles] = useState({
    salesInvoice: null as File | null,
    driversLicense: null as File | null,
    miscDocuments: [] as File[]
  });

  const [customerData, setCustomerData] = useState({
    customer_name: '',
    email: '',
    phone: '',
    address: '',
    ssn: '',
    dob: '',
    biz_name: '',
    ein: '',
    biz_start_date: '',
    biz_address: '',
    biz_phone: '',
    credit_permission: false
  });

  const validateForm = () => {
    const result = customerSchema.safeParse(customerData);
    
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

  const handleInputChange = (field: string, value: string | boolean) => {
    setCustomerData(prev => ({ ...prev, [field]: value }));
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const uploadFile = async (file: File, path: string) => {
    const { data, error } = await supabase.storage
      .from('submissions')
      .upload(path, file);

    if (error) throw error;
    return data.path;
  };

  const submitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Get vendor data
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .select('id, partner_admin_id')
        .eq('user_id', user.id)
        .single();

      if (vendorError || !vendorData) {
        throw new Error('Vendor not found');
      }

      // Create customer record
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .insert(customerData)
        .select()
        .single();

      if (customerError) throw customerError;

      // Upload files with security validation
      const submissionId = crypto.randomUUID();
      let salesInvoiceUrl = null;
      let driversLicenseUrl = null;
      let miscDocumentsUrls: string[] = [];

      if (files.salesInvoice) {
        salesInvoiceUrl = await uploadFile(
          files.salesInvoice,
          `${user.id}/${submissionId}/sales_invoice_${files.salesInvoice.name}`
        );
      }

      if (files.driversLicense) {
        driversLicenseUrl = await uploadFile(
          files.driversLicense,
          `${user.id}/${submissionId}/drivers_license_${files.driversLicense.name}`
        );
      }

      if (files.miscDocuments.length > 0) {
        for (const file of files.miscDocuments) {
          const path = await uploadFile(
            file,
            `${user.id}/${submissionId}/misc_${file.name}`
          );
          miscDocumentsUrls.push(path);
        }
      }

      // Create submission record with proper partner_admin_id
      const { error: submissionError } = await supabase
        .from('submissions')
        .insert({
          id: submissionId,
          vendor_id: vendorData.id,
          customer_id: customer.id,
          partner_admin_id: vendorData.partner_admin_id,
          sales_invoice_url: salesInvoiceUrl,
          drivers_license_url: driversLicenseUrl,
          misc_documents_url: miscDocumentsUrls.length > 0 ? miscDocumentsUrls : null,
          status: 'Pending'
        });

      if (submissionError) throw submissionError;

      // Log security event
      console.log(`Security Event: Customer application submitted by ${user.email} at ${new Date().toISOString()}`);

      toast({
        title: "Application Submitted",
        description: "Customer application has been submitted successfully with secure validation",
      });

      // Reset form
      setCustomerData({
        customer_name: '',
        email: '',
        phone: '',
        address: '',
        ssn: '',
        dob: '',
        biz_name: '',
        ein: '',
        biz_start_date: '',
        biz_address: '',
        biz_phone: '',
        credit_permission: false
      });
      setFiles({
        salesInvoice: null,
        driversLicense: null,
        miscDocuments: []
      });

    } catch (error: any) {
      console.error('Security Error - Application submission failed:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit application",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Submit New Customer Application</h2>
        <p className="text-gray-600">Complete all customer information and upload required documents</p>
      </div>

      <Alert className="border-blue-200 bg-blue-50">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Security Notice:</strong> All form data is validated and encrypted. 
          Files are scanned for security before upload (max 10MB per file).
        </AlertDescription>
      </Alert>

      <form onSubmit={submitApplication} className="space-y-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Personal Information
            </CardTitle>
            <CardDescription>Customer's personal details and contact information</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customer_name">Full Name *</Label>
              <Input
                id="customer_name"
                value={customerData.customer_name}
                onChange={(e) => handleInputChange('customer_name', e.target.value)}
                required
                className={validationErrors.customer_name ? 'border-red-500' : ''}
              />
              {validationErrors.customer_name && (
                <p className="text-sm text-red-600">{validationErrors.customer_name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={customerData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={validationErrors.email ? 'border-red-500' : ''}
              />
              {validationErrors.email && (
                <p className="text-sm text-red-600">{validationErrors.email}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Personal Phone Number *</Label>
              <Input
                id="phone"
                value={customerData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                required
                placeholder="+1 (555) 123-4567"
                className={validationErrors.phone ? 'border-red-500' : ''}
              />
              {validationErrors.phone && (
                <p className="text-sm text-red-600">{validationErrors.phone}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="dob">Date of Birth</Label>
              <Input
                id="dob"
                type="date"
                value={customerData.dob}
                onChange={(e) => handleInputChange('dob', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ssn">SSN (Social Security Number)</Label>
              <Input
                id="ssn"
                value={customerData.ssn}
                onChange={(e) => handleInputChange('ssn', e.target.value)}
                placeholder="XXX-XX-XXXX"
                className={validationErrors.ssn ? 'border-red-500' : ''}
              />
              {validationErrors.ssn && (
                <p className="text-sm text-red-600">{validationErrors.ssn}</p>
              )}
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Personal Address *</Label>
              <Textarea
                id="address"
                value={customerData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                required
                placeholder="Street address, City, State, ZIP code"
                className={validationErrors.address ? 'border-red-500' : ''}
              />
              {validationErrors.address && (
                <p className="text-sm text-red-600">{validationErrors.address}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Business Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5" />
              Business Information
            </CardTitle>
            <CardDescription>Business details and operating information</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="biz_name">Business Name</Label>
              <Input
                id="biz_name"
                value={customerData.biz_name}
                onChange={(e) => handleInputChange('biz_name', e.target.value)}
                placeholder="Company or DBA name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ein">EIN (Employer Identification Number)</Label>
              <Input
                id="ein"
                value={customerData.ein}
                onChange={(e) => handleInputChange('ein', e.target.value)}
                placeholder="XX-XXXXXXX"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="biz_phone">Business Phone Number</Label>
              <Input
                id="biz_phone"
                value={customerData.biz_phone}
                onChange={(e) => handleInputChange('biz_phone', e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="biz_start_date">Business Start Date</Label>
              <Input
                id="biz_start_date"
                type="date"
                value={customerData.biz_start_date}
                onChange={(e) => handleInputChange('biz_start_date', e.target.value)}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="biz_address">Business Address</Label>
              <Textarea
                id="biz_address"
                value={customerData.biz_address}
                onChange={(e) => handleInputChange('biz_address', e.target.value)}
                placeholder="Business street address, City, State, ZIP code"
              />
            </div>
            <div className="flex items-center space-x-2 md:col-span-2">
              <Checkbox
                id="credit_permission"
                checked={customerData.credit_permission}
                onCheckedChange={(checked) => handleInputChange('credit_permission', checked === true)}
              />
              <Label htmlFor="credit_permission">
                I authorize credit check and verification for this customer
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Secure Document Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Required Document Upload
            </CardTitle>
            <CardDescription>
              Upload customer documents with enhanced security validation (PDF, JPEG, PNG - Max 10MB per file)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Required Documents:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Sales Invoice (showing purchase/transaction details)</li>
                <li>• Driver's License (for identity verification)</li>
                <li>• Additional supporting documents (optional, up to 5 files)</li>
              </ul>
            </div>
            
            <SecureFileUpload
              id="sales_invoice"
              label="Sales Invoice *"
              onFileChange={(file) => setFiles(prev => ({ ...prev, salesInvoice: file as File }))}
            />
            
            <SecureFileUpload
              id="drivers_license"
              label="Driver's License *"
              onFileChange={(file) => setFiles(prev => ({ ...prev, driversLicense: file as File }))}
            />
            
            <SecureFileUpload
              id="misc_documents"
              label="Additional Supporting Documents"
              multiple={true}
              maxFiles={5}
              onFileChange={(files) => setFiles(prev => ({ ...prev, miscDocuments: files as File[] }))}
            />
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting Secure Application...' : 'Submit Customer Application'}
        </Button>
      </form>
    </div>
  );
};

export default CustomerApplicationForm;
