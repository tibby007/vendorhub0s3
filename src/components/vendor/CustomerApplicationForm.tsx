
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { FileText, Upload, User, Building, DollarSign, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CustomerApplicationFormProps {
  preQualData?: any;
}

const CustomerApplicationForm = ({ preQualData }: CustomerApplicationFormProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    // Personal Information
    customerName: '',
    email: '',
    phone: '',
    address: '',
    dob: '',
    ssn: '',
    
    // Business Information
    businessName: '',
    businessAddress: '',
    businessPhone: '',
    businessEmail: '',
    ein: '',
    industry: '',
    monthsInBusiness: '',
    annualRevenue: '',
    
    // Loan Information
    loanAmount: '',
    loanPurpose: '',
    collateralDescription: '',
    personalGuarantee: false,
    
    // Additional Information
    creditPermission: false,
    notes: ''
  });

  // Pre-populate form with PreQual data if available
  useEffect(() => {
    if (preQualData?.preQualData) {
      const { preQualData: pqData } = preQualData;
      setFormData(prev => ({
        ...prev,
        industry: pqData.industry || '',
        monthsInBusiness: pqData.monthsInBusiness || '',
        annualRevenue: pqData.annualRevenue || '',
        loanAmount: pqData.loanAmount || '',
        personalGuarantee: pqData.personalGuarantee === 'yes',
        collateralDescription: pqData.collateral === 'yes' ? 'Collateral available (details to be provided)' : ''
      }));
    }
  }, [preQualData]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      console.log('Submitting application:', { 
        ...formData, 
        preQualResult: preQualData?.preQualResult 
      });

      toast({
        title: "Application Submitted Successfully!",
        description: "Your customer application has been submitted for review. You'll receive updates via email.",
      });

      // Reset form
      setFormData({
        customerName: '',
        email: '',
        phone: '',
        address: '',
        dob: '',
        ssn: '',
        businessName: '',
        businessAddress: '',
        businessPhone: '',
        businessEmail: '',
        ein: '',
        industry: '',
        monthsInBusiness: '',
        annualRevenue: '',
        loanAmount: '',
        loanPurpose: '',
        collateralDescription: '',
        personalGuarantee: false,
        creditPermission: false,
        notes: ''
      });

    } catch (error) {
      console.error('Error submitting application:', error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting the application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-6 h-6" />
            Customer Application Form
          </h2>
          <p className="text-gray-600">Submit a comprehensive financing application for your customer</p>
        </div>
        
        {preQualData?.preQualResult && (
          <Badge variant="secondary" className="bg-green-100 text-green-700 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Pre-Qualified
          </Badge>
        )}
      </div>

      {/* PreQual Summary */}
      {preQualData?.preQualResult && (
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-900 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Pre-Qualification Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-green-900">Status:</span>
                <p className="text-green-700">
                  {preQualData.preQualResult.approved ? 'Pre-Qualified' : 'Conditional'}
                </p>
              </div>
              <div>
                <span className="font-medium text-green-900">Confidence Score:</span>
                <p className="text-green-700">{preQualData.preQualResult.confidence}%</p>
              </div>
              <div>
                <span className="font-medium text-green-900">Recommended Amount:</span>
                <p className="text-green-700">
                  ${preQualData.preQualResult.recommendedAmount?.toLocaleString() || 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Personal Information
            </CardTitle>
            <CardDescription>Customer's personal details</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">Full Name *</Label>
              <Input
                id="customerName"
                value={formData.customerName}
                onChange={(e) => handleInputChange('customerName', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dob">Date of Birth</Label>
              <Input
                id="dob"
                type="date"
                value={formData.dob}
                onChange={(e) => handleInputChange('dob', e.target.value)}
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ssn">SSN *</Label>
              <Input
                id="ssn"
                value={formData.ssn}
                onChange={(e) => handleInputChange('ssn', e.target.value)}
                placeholder="123-45-6789"
                required
              />
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
            <CardDescription>Details about the customer's business</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name *</Label>
              <Input
                id="businessName"
                value={formData.businessName}
                onChange={(e) => handleInputChange('businessName', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ein">EIN</Label>
              <Input
                id="ein"
                value={formData.ein}
                onChange={(e) => handleInputChange('ein', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="industry">Industry *</Label>
              <Select value={formData.industry} onValueChange={(value) => handleInputChange('industry', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                  <SelectItem value="professional_services">Professional Services</SelectItem>
                  <SelectItem value="manufacturing">Manufacturing</SelectItem>
                  <SelectItem value="retail">Retail</SelectItem>
                  <SelectItem value="restaurant">Restaurant</SelectItem>
                  <SelectItem value="construction">Construction</SelectItem>
                  <SelectItem value="transportation">Transportation</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="monthsInBusiness">Months in Business *</Label>
              <Input
                id="monthsInBusiness"
                type="number"
                value={formData.monthsInBusiness}
                onChange={(e) => handleInputChange('monthsInBusiness', e.target.value)}
                required
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="businessAddress">Business Address *</Label>
              <Input
                id="businessAddress"
                value={formData.businessAddress}
                onChange={(e) => handleInputChange('businessAddress', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessPhone">Business Phone</Label>
              <Input
                id="businessPhone"
                value={formData.businessPhone}
                onChange={(e) => handleInputChange('businessPhone', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessEmail">Business Email</Label>
              <Input
                id="businessEmail"
                type="email"
                value={formData.businessEmail}
                onChange={(e) => handleInputChange('businessEmail', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Loan Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Loan Information
            </CardTitle>
            <CardDescription>Financing details and requirements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="loanAmount">Loan Amount Requested *</Label>
                <Input
                  id="loanAmount"
                  type="number"
                  value={formData.loanAmount}
                  onChange={(e) => handleInputChange('loanAmount', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="annualRevenue">Annual Revenue *</Label>
                <Input
                  id="annualRevenue"
                  type="number"
                  value={formData.annualRevenue}
                  onChange={(e) => handleInputChange('annualRevenue', e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="loanPurpose">Loan Purpose</Label>
              <Textarea
                id="loanPurpose"
                value={formData.loanPurpose}
                onChange={(e) => handleInputChange('loanPurpose', e.target.value)}
                placeholder="Describe how the loan will be used..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="collateralDescription">Collateral Description</Label>
              <Textarea
                id="collateralDescription"
                value={formData.collateralDescription}
                onChange={(e) => handleInputChange('collateralDescription', e.target.value)}
                placeholder="Describe any collateral being offered..."
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="personalGuarantee"
                checked={formData.personalGuarantee}
                onCheckedChange={(checked) => handleInputChange('personalGuarantee', checked)}
              />
              <Label htmlFor="personalGuarantee">Personal Guarantee Provided</Label>
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
            <CardDescription>Optional details and permissions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Any additional information about the customer or application..."
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="creditPermission"
                checked={formData.creditPermission}
                onCheckedChange={(checked) => handleInputChange('creditPermission', checked)}
                required
              />
              <Label htmlFor="creditPermission">
                Customer authorizes credit check and agrees to terms *
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button 
            type="submit" 
            size="lg" 
            disabled={isSubmitting}
            className="bg-vendor-green-600 hover:bg-vendor-green-700"
          >
            {isSubmitting ? (
              <>
                <Upload className="w-4 h-4 mr-2 animate-spin" />
                Submitting Application...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                Submit Application
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CustomerApplicationForm;
