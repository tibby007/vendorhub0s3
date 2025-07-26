import { supabase } from '@/integrations/supabase/client';

export interface StorageData {
  storage_used: number;
  storage_limit: number;
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