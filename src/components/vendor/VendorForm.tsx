import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertCircle } from 'lucide-react';
import type { VendorData } from '@/types/api';

interface VendorFormData {
  vendor_name: string;
  contact_email: string;
  contact_phone: string;
  contact_address: string;
  password: string;
}

interface VendorFormProps {
  formData: VendorFormData;
  errors: Record<string, string>;
  editingVendor: VendorData | null;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onInputChange: (field: string, value: string) => void;
  onCancel: () => void;
  title: string;
}

const VendorForm: React.FC<VendorFormProps> = React.memo(({
  formData,
  errors,
  editingVendor,
  isLoading,
  onSubmit,
  onInputChange,
  onCancel,
  title
}) => {
  console.log('🔄 VendorForm rendering with formData:', formData);
  
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Alert className="border-blue-200 bg-blue-50">
        <Shield className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Security Notice:</strong> All vendor data is validated and encrypted for security.
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <Label htmlFor="vendor_name">Vendor Name *</Label>
        <Input
          id="vendor_name"
          value={formData.vendor_name}
          onChange={(e) => {
            console.log('🎯 Raw onChange event:', e.target.value);
            onInputChange('vendor_name', e.target.value);
          }}
          className={errors.vendor_name ? 'border-red-500' : ''}
          placeholder="Enter vendor name"
          autoComplete="off"
        />
        {errors.vendor_name && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.vendor_name}
          </p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="contact_email">Contact Email *</Label>
        <Input
          id="contact_email"
          type="email"
          value={formData.contact_email}
          onChange={(e) => {
            console.log('🎯 Raw email onChange event:', e.target.value);
            onInputChange('contact_email', e.target.value);
          }}
          disabled={!!editingVendor}
          className={errors.contact_email ? 'border-red-500' : ''}
          placeholder="vendor@example.com"
          autoComplete="off"
        />
        {errors.contact_email && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.contact_email}
          </p>
        )}
      </div>
      
      {!editingVendor && (
        <div className="space-y-2 p-3 bg-blue-50 rounded-md border border-blue-200">
          <div className="text-sm text-blue-800">
            <strong>Note:</strong> The vendor will receive an email invitation to register their own account using this email address.
          </div>
        </div>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="contact_phone">Contact Phone</Label>
        <Input
          id="contact_phone"
          value={formData.contact_phone}
          onChange={(e) => onInputChange('contact_phone', e.target.value)}
          placeholder="(555) 123-4567"
          autoComplete="off"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="contact_address">Contact Address</Label>
        <Input
          id="contact_address"
          value={formData.contact_address}
          onChange={(e) => onInputChange('contact_address', e.target.value)}
          placeholder="123 Main St, City, State 12345"
        />
      </div>
      
      <div className="flex justify-end gap-2">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : title}
        </Button>
      </div>
    </form>
  );
});

VendorForm.displayName = 'VendorForm';

export default VendorForm;