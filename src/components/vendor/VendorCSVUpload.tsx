import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, Download, AlertCircle, CheckCircle, FileText, Users } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { useSubscriptionManager } from '@/providers/SubscriptionProvider';

interface CSVVendor {
  vendor_name: string;
  contact_email: string;
  contact_phone?: string;
  contact_address?: string;
  business_type?: string;
}

interface UploadResult {
  successful: CSVVendor[];
  failed: Array<{ row: number; data: any; errors: string[] }>;
}

interface VendorCSVUploadProps {
  onUploadComplete?: () => void;
}

const VendorCSVUpload: React.FC<VendorCSVUploadProps> = ({ onUploadComplete }) => {
  const { user } = useAuth();
  const { subscription } = useSubscriptionManager();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);

  // Check if user has Pro or Premium tier access
  const hasCSVAccess = subscription.tier === 'Pro' || subscription.tier === 'Premium';

  const downloadTemplate = () => {
    const templateData = [
      ['vendor_name', 'contact_email', 'contact_phone', 'contact_address', 'business_type'],
      ['ABC Corporation', 'contact@abc-corp.com', '(555) 123-4567', '123 Main St, City, State 12345', 'Corporation'],
      ['Smith Services LLC', 'john@smithservices.com', '(555) 987-6543', '456 Oak Ave, Town, State 67890', 'LLC'],
      ['Quality Contractors Inc', 'info@qualitycontractors.com', '(555) 555-0123', '789 Pine Rd, Village, State 54321', 'Corporation']
    ];

    const csvContent = templateData.map(row => 
      row.map(field => `"${field}"`).join(',')
    ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'vendor_upload_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseCSV = (csvText: string): CSVVendor[] => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) throw new Error('CSV must have at least a header row and one data row');

    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase());
    const vendors: CSVVendor[] = [];

    // Map CSV headers to our expected fields
    const headerMap: Record<string, string> = {
      'vendor_name': 'vendor_name',
      'name': 'vendor_name',
      'vendor name': 'vendor_name',
      'company_name': 'vendor_name',
      'company name': 'vendor_name',
      'contact_email': 'contact_email',
      'email': 'contact_email',
      'contact email': 'contact_email',
      'contact_phone': 'contact_phone',
      'phone': 'contact_phone',
      'contact phone': 'contact_phone',
      'telephone': 'contact_phone',
      'contact_address': 'contact_address',
      'address': 'contact_address',
      'contact address': 'contact_address',
      'business_type': 'business_type',
      'business type': 'business_type',
      'type': 'business_type'
    };

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
      const vendor: any = {};

      headers.forEach((header, index) => {
        const mappedField = headerMap[header];
        if (mappedField && values[index]) {
          vendor[mappedField] = values[index];
        }
      });

      if (vendor.vendor_name && vendor.contact_email) {
        vendors.push(vendor as CSVVendor);
      }
    }

    return vendors;
  };

  const validateVendor = (vendor: CSVVendor): string[] => {
    const errors: string[] = [];

    if (!vendor.vendor_name || vendor.vendor_name.trim().length < 2) {
      errors.push('Vendor name must be at least 2 characters');
    }

    if (!vendor.contact_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(vendor.contact_email)) {
      errors.push('Valid contact email is required');
    }

    if (vendor.contact_phone && !/^[\d\s\-\(\)\+\.]+$/.test(vendor.contact_phone)) {
      errors.push('Phone number contains invalid characters');
    }

    return errors;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast({
        title: "Invalid File Type",
        description: "Please select a CSV file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: "File Too Large",
        description: "CSV file must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    setCsvFile(file);
    setUploadResult(null);
  };

  const processCSVUpload = async () => {
    if (!csvFile || !user?.id) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Read file content
      const csvText = await csvFile.text();
      const vendors = parseCSV(csvText);

      if (vendors.length === 0) {
        throw new Error('No valid vendor data found in CSV');
      }

      // Check vendor limit
      const { data: currentVendors } = await supabase
        .from('vendors')
        .select('id')
        .eq('partner_admin_id', user.id);

      const currentCount = currentVendors?.length || 0;
      const maxVendors = subscription.tier === 'Premium' ? 999999 : 
                        subscription.tier === 'Pro' ? 7 : 3;

      if (currentCount + vendors.length > maxVendors) {
        throw new Error(`Adding ${vendors.length} vendors would exceed your limit of ${maxVendors} vendors`);
      }

      const result: UploadResult = { successful: [], failed: [] };
      
      // Process vendors in batches
      for (let i = 0; i < vendors.length; i++) {
        const vendor = vendors[i];
        const errors = validateVendor(vendor);

        setUploadProgress(((i + 1) / vendors.length) * 100);

        if (errors.length > 0) {
          result.failed.push({ row: i + 2, data: vendor, errors });
          continue;
        }

        try {
          // Check if vendor already exists
          const { data: existingVendor } = await supabase
            .from('vendors')
            .select('id')
            .eq('contact_email', vendor.contact_email)
            .eq('partner_admin_id', user.id)
            .maybeSingle();

          if (existingVendor) {
            result.failed.push({ 
              row: i + 2, 
              data: vendor, 
              errors: ['Vendor with this email already exists'] 
            });
            continue;
          }

          // Create vendor record
          const { error: insertError } = await supabase
            .from('vendors')
            .insert({
              vendor_name: vendor.vendor_name,
              contact_email: vendor.contact_email,
              contact_phone: vendor.contact_phone || null,
              contact_address: vendor.contact_address || null,
              business_type: vendor.business_type || null,
              partner_admin_id: user.id,
              status: 'active',
              storage_used: 0,
              storage_limit: 2147483648, // 2GB default
            });

          if (insertError) {
            result.failed.push({ 
              row: i + 2, 
              data: vendor, 
              errors: [insertError.message] 
            });
          } else {
            result.successful.push(vendor);
          }

        } catch (error: any) {
          result.failed.push({ 
            row: i + 2, 
            data: vendor, 
            errors: [error.message || 'Unknown error'] 
          });
        }

        // Small delay to prevent overwhelming the database
        if (i % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      setUploadResult(result);
      
      const successCount = result.successful.length;
      const failCount = result.failed.length;

      toast({
        title: "CSV Upload Complete",
        description: `${successCount} vendors added successfully${failCount > 0 ? `, ${failCount} failed` : ''}`,
        variant: successCount > 0 ? "default" : "destructive",
      });

      // Call the callback to refresh the vendor list
      if (successCount > 0 && onUploadComplete) {
        onUploadComplete();
      }

    } catch (error: any) {
      console.error('CSV upload error:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to process CSV file",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const resetUpload = () => {
    setCsvFile(null);
    setUploadResult(null);
    setUploadProgress(0);
  };

  if (!hasCSVAccess) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-800">
            <Upload className="w-5 h-5" />
            CSV Vendor Upload
          </CardTitle>
          <CardDescription className="text-amber-700">
            Bulk upload vendors from CSV spreadsheet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="border-amber-200 bg-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              CSV vendor upload is available for Pro and Premium plans only. 
              <strong> Upgrade your plan</strong> to unlock this feature.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          CSV Vendor Upload
        </CardTitle>
        <CardDescription>
          Bulk upload vendors from CSV spreadsheet (Pro/Premium feature)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={downloadTemplate}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download Template
            </Button>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Upload CSV
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Upload Vendors from CSV</DialogTitle>
                  <DialogDescription>
                    Select a CSV file to bulk upload vendor information. 
                    Download the template first to ensure proper formatting.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6">
                  {!uploadResult && (
                    <div className="space-y-4">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <input
                          type="file"
                          accept=".csv"
                          onChange={handleFileSelect}
                          className="hidden"
                          id="csv-upload"
                        />
                        <label htmlFor="csv-upload" className="cursor-pointer">
                          <span className="text-sm text-gray-600">
                            Click to select CSV file or drag and drop
                          </span>
                        </label>
                      </div>
                      
                      {csvFile && (
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <span className="text-sm font-medium">{csvFile.name}</span>
                          <span className="text-xs text-gray-500">
                            {(csvFile.size / 1024).toFixed(1)} KB
                          </span>
                        </div>
                      )}
                      
                      {isUploading && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Processing CSV...</span>
                            <span>{Math.round(uploadProgress)}%</span>
                          </div>
                          <Progress value={uploadProgress} className="w-full" />
                        </div>
                      )}
                      
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          onClick={() => setIsDialogOpen(false)}
                          disabled={isUploading}
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={processCSVUpload}
                          disabled={!csvFile || isUploading}
                        >
                          {isUploading ? 'Uploading...' : 'Upload Vendors'}
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {uploadResult && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <Card className="border-green-200 bg-green-50">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-5 h-5 text-green-600" />
                              <div>
                                <p className="font-semibold text-green-800">Successful</p>
                                <p className="text-sm text-green-700">
                                  {uploadResult.successful.length} vendors added
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        
                        {uploadResult.failed.length > 0 && (
                          <Card className="border-red-200 bg-red-50">
                            <CardContent className="p-4">
                              <div className="flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 text-red-600" />
                                <div>
                                  <p className="font-semibold text-red-800">Failed</p>
                                  <p className="text-sm text-red-700">
                                    {uploadResult.failed.length} vendors failed
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                      
                      {uploadResult.failed.length > 0 && (
                        <div className="max-h-40 overflow-y-auto border rounded p-2 bg-gray-50">
                          <h4 className="font-medium mb-2 text-red-800">Failed Rows:</h4>
                          {uploadResult.failed.map((failure, index) => (
                            <div key={index} className="text-xs mb-2">
                              <span className="font-medium">Row {failure.row}:</span>
                              <span className="ml-2">{failure.errors.join(', ')}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={resetUpload}>
                          Upload Another File
                        </Button>
                        <Button onClick={() => setIsDialogOpen(false)}>
                          Done
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          <Alert>
            <Users className="h-4 w-4" />
            <AlertDescription>
              CSV should include columns: vendor_name, contact_email, contact_phone, contact_address, business_type. 
              Only vendor_name and contact_email are required.
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>
    </Card>
  );
};

export default VendorCSVUpload;