import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import SecureFileUpload from '@/components/security/SecureFileUpload';
import { supabase } from '@/integrations/supabase/client';

interface DocumentUploadProps {
  onSalesInvoiceUpload: (url: string) => void;
  onDriversLicenseUpload: (url: string) => void;
  onAdditionalDocsUpload: (urls: string[]) => void;
}

const DocumentUpload = ({
  onSalesInvoiceUpload,
  onDriversLicenseUpload,
  onAdditionalDocsUpload
}: DocumentUploadProps) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState<{ [key: string]: boolean }>({});
  const [additionalDocs, setAdditionalDocs] = useState<string[]>([]);

  const uploadFile = async (file: File, folder: string): Promise<string> => {
    const fileName = `${folder}/${Date.now()}-${file.name}`;
    
    const { data, error } = await supabase.storage
      .from('submissions')
      .upload(fileName, file);

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    const { data: urlData } = supabase.storage
      .from('submissions')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  };

  const handleSalesInvoiceUpload = async (files: File[] | File | null) => {
    if (!files || (Array.isArray(files) && files.length === 0)) return;
    
    const file = Array.isArray(files) ? files[0] : files;
    setUploading(prev => ({ ...prev, salesInvoice: true }));

    try {
      const url = await uploadFile(file, 'sales-invoices');
      onSalesInvoiceUpload(url);
      toast({
        title: "Sales Invoice Uploaded",
        description: "File uploaded successfully",
      });
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(prev => ({ ...prev, salesInvoice: false }));
    }
  };

  const handleDriversLicenseUpload = async (files: File[] | File | null) => {
    if (!files || (Array.isArray(files) && files.length === 0)) return;
    
    const file = Array.isArray(files) ? files[0] : files;
    setUploading(prev => ({ ...prev, driversLicense: true }));

    try {
      const url = await uploadFile(file, 'drivers-licenses');
      onDriversLicenseUpload(url);
      toast({
        title: "Driver's License Uploaded",
        description: "File uploaded successfully",
      });
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(prev => ({ ...prev, driversLicense: false }));
    }
  };

  const handleAdditionalDocsUpload = async (files: File[] | File | null) => {
    if (!files || (Array.isArray(files) && files.length === 0)) return;
    
    const fileArray = Array.isArray(files) ? files : [files];
    setUploading(prev => ({ ...prev, additionalDocs: true }));

    try {
      const uploadPromises = fileArray.map(file => uploadFile(file, 'additional-documents'));
      const urls = await Promise.all(uploadPromises);
      
      const newDocs = [...additionalDocs, ...urls];
      setAdditionalDocs(newDocs);
      onAdditionalDocsUpload(newDocs);
      
      toast({
        title: "Additional Documents Uploaded",
        description: `${urls.length} file(s) uploaded successfully`,
      });
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(prev => ({ ...prev, additionalDocs: false }));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Required Documents
        </CardTitle>
        <CardDescription>Upload required customer documents for submission</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Sales Invoice *</Label>
          <SecureFileUpload
            id="sales-invoice"
            label="Upload Sales Invoice"
            accept=".pdf,.jpg,.jpeg,.png"
            onFileChange={handleSalesInvoiceUpload}
          />
          {uploading.salesInvoice && (
            <p className="text-sm text-blue-600">Uploading...</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Driver's License / ID *</Label>
          <SecureFileUpload
            id="drivers-license"
            label="Upload Driver's License or ID"
            accept=".pdf,.jpg,.jpeg,.png"
            onFileChange={handleDriversLicenseUpload}
          />
          {uploading.driversLicense && (
            <p className="text-sm text-blue-600">Uploading...</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Additional Documents</Label>
          <SecureFileUpload
            id="additional-docs"
            label="Upload Additional Documents"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            multiple={true}
            onFileChange={handleAdditionalDocsUpload}
            maxFiles={5}
          />
          {uploading.additionalDocs && (
            <p className="text-sm text-blue-600">Uploading...</p>
          )}
          {additionalDocs.length > 0 && (
            <div className="text-sm text-green-700 bg-green-50 p-2 rounded border border-green-200">
              <strong>{additionalDocs.length} additional document(s) uploaded</strong>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentUpload;