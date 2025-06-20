
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { Upload, FileText, CreditCard } from 'lucide-react';

const CustomerApplicationForm = () => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    credit_permission: false
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setCustomerData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (type: 'salesInvoice' | 'driversLicense' | 'miscDocuments', file: File | FileList | null) => {
    if (type === 'miscDocuments' && file instanceof FileList) {
      setFiles(prev => ({ ...prev, [type]: Array.from(file) }));
    } else if (file instanceof File) {
      setFiles(prev => ({ ...prev, [type]: file }));
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

      // Upload files
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

      toast({
        title: "Application Submitted",
        description: "Customer application has been submitted successfully",
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
        credit_permission: false
      });
      setFiles({
        salesInvoice: null,
        driversLicense: null,
        miscDocuments: []
      });

    } catch (error: any) {
      console.error('Error submitting application:', error);
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
        <h2 className="text-2xl font-bold text-gray-900">Submit New Application</h2>
        <p className="text-gray-600">Complete customer information and upload required documents</p>
      </div>

      <form onSubmit={submitApplication} className="space-y-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customer_name">Full Name *</Label>
              <Input
                id="customer_name"
                value={customerData.customer_name}
                onChange={(e) => handleInputChange('customer_name', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={customerData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                value={customerData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                required
              />
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
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Address *</Label>
              <Textarea
                id="address"
                value={customerData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ssn">SSN</Label>
              <Input
                id="ssn"
                value={customerData.ssn}
                onChange={(e) => handleInputChange('ssn', e.target.value)}
                placeholder="XXX-XX-XXXX"
              />
            </div>
          </CardContent>
        </Card>

        {/* Business Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Business Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="biz_name">Business Name</Label>
              <Input
                id="biz_name"
                value={customerData.biz_name}
                onChange={(e) => handleInputChange('biz_name', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ein">EIN</Label>
              <Input
                id="ein"
                value={customerData.ein}
                onChange={(e) => handleInputChange('ein', e.target.value)}
                placeholder="XX-XXXXXXX"
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
              />
            </div>
            <div className="flex items-center space-x-2 md:col-span-2">
              <Checkbox
                id="credit_permission"
                checked={customerData.credit_permission}
                onCheckedChange={(checked) => handleInputChange('credit_permission', checked === true)}
              />
              <Label htmlFor="credit_permission">
                I authorize credit check and verification
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Document Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Document Upload
            </CardTitle>
            <CardDescription>
              Upload required documents for this application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sales_invoice">Sales Invoice</Label>
              <Input
                id="sales_invoice"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => handleFileChange('salesInvoice', e.target.files?.[0] || null)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="drivers_license">Driver's License</Label>
              <Input
                id="drivers_license"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => handleFileChange('driversLicense', e.target.files?.[0] || null)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="misc_documents">Miscellaneous Documents</Label>
              <Input
                id="misc_documents"
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => handleFileChange('miscDocuments', e.target.files)}
              />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting Application...' : 'Submit Application'}
        </Button>
      </form>
    </div>
  );
};

export default CustomerApplicationForm;
