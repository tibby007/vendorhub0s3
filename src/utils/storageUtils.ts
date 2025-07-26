import { supabase } from '@/integrations/supabase/client';
import { validateFileUpload } from './fileValidation';

export interface StorageData {
  storage_used: number;
  storage_limit: number;
}

export interface StorageCheckResult {
  allowed: boolean;
  reason?: string;
  message?: string;
  vendor_remaining?: number;
  broker_remaining?: number;
}

export const checkStorageLimit = async (partnerId: string, fileSize: number): Promise<boolean> => {
  const { data: partner } = await supabase
    .from('partners')
    .select('storage_used, storage_limit')
    .eq('id', partnerId)
    .single();

  if (!partner) return false;
  
  return (partner.storage_used + fileSize) <= partner.storage_limit;
};

export const updateStorageUsage = async (partnerId: string, fileSize: number, isDelete = false): Promise<void> => {
  const increment = isDelete ? -fileSize : fileSize;
  
  const { error } = await supabase.rpc('update_partner_storage', {
    partner_id: partnerId,
    size_change: increment
  });

  if (error) {
    console.error('Error updating storage usage:', error);
    throw error;
  }
};

export const formatStorageSize = (bytes: number): string => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 Bytes';
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)).toString());
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

export const getStorageUsagePercentage = (used: number, limit: number): number => {
  if (limit === 0) return 0;
  return Math.min((used / limit) * 100, 100);
};

// New security functions for hybrid storage model
export const getSecureFilePath = (brokerId: string, vendorId: string, filename: string): string => {
  // Generate secure UUID-based filename
  const extension = filename.split('.').pop()?.toLowerCase() || '';
  const secureFilename = `${crypto.randomUUID()}.${extension}`;
  
  // Return path: broker-id/vendor-vendor-id/secure-filename
  return `${brokerId}/vendor-${vendorId}/${secureFilename}`;
};

export const uploadFileSecurely = async (
  file: File, 
  brokerId: string, 
  vendorId: string
): Promise<string> => {
  const secureFilePath = getSecureFilePath(brokerId, vendorId, file.name);
  
  const { data, error } = await supabase.storage
    .from('partner-documents')
    .upload(secureFilePath, file, {
      cacheControl: '3600',
      upsert: false, // Prevent overwriting
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  return data.path;
};

// Hybrid storage functions - now enabled after successful migration
export const uploadFileWithHybridLimits = async (
  file: File,
  vendorId: string,
  brokerId: string
): Promise<string> => {
  // 1. Validate file first
  const validatedFile = await validateFileUpload(file);
  
  // 2. Check hybrid storage limits
  const { data: storageCheck, error: storageError } = await supabase.rpc('check_hybrid_storage_limit', {
    vendor_id: vendorId,
    file_size: validatedFile.size
  });
  
  if (storageError) {
    throw new Error(`Storage validation failed: ${storageError.message}`);
  }
  
  const result = storageCheck as unknown as StorageCheckResult;
  if (!result?.allowed) {
    throw new Error(result?.message || 'Storage limit exceeded');
  }
  
  // 3. Generate secure file path
  const secureFilePath = getSecureFilePath(brokerId, vendorId, validatedFile.name);
  
  // 4. Upload file
  const { data, error } = await supabase.storage
    .from('partner-documents')
    .upload(secureFilePath, validatedFile);
    
  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }
  
  // 5. Update storage usage for both vendor and broker
  await supabase.rpc('update_hybrid_storage_usage', {
    vendor_id: vendorId,
    file_size: validatedFile.size,
    is_delete: false
  });
  
  return data.path;
};

export const getStorageStatus = async (vendorId: string) => {
  const { data, error } = await supabase
    .from('vendors')
    .select(`
      storage_used,
      storage_limit,
      partner_admin_id
    `)
    .eq('id', vendorId)
    .single();
    
  if (error || !data) return null;
  
  // Get partner data separately
  const { data: partnerData } = await supabase
    .from('partners')
    .select('storage_used, storage_limit')
    .eq('id', data.partner_admin_id)
    .single();
  if (!partnerData) return null;
  
  return {
    vendor: {
      used: data.storage_used || 0,
      limit: data.storage_limit || 2147483648, // 2GB default
      percentage: ((data.storage_used || 0) / (data.storage_limit || 2147483648)) * 100
    },
    broker: {
      used: partnerData.storage_used || 0,
      limit: partnerData.storage_limit || 5368709120, // 5GB default
      percentage: ((partnerData.storage_used || 0) / (partnerData.storage_limit || 5368709120)) * 100
    }
  };
};