
import { supabase } from '@/integrations/supabase/client';

export interface ResourceFile {
  id: string;
  title: string;
  content: string;
  type: 'file' | 'news';
  category: string;
  file_url?: string;
  file_size?: number;
  mime_type?: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export const resourcesService = {
  async getResources(partnerId: string): Promise<ResourceFile[]> {
    const { data, error } = await supabase
      .from('resources')
      .select('id, title, content, type, category, file_url, file_size, mime_type, is_published, created_at, updated_at')
      .eq('partner_admin_id', partnerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Transform the data to ensure all required fields are present
    return (data || []).map(item => ({
      id: item.id,
      title: item.title,
      content: item.content,
      type: item.type as 'file' | 'news',
      category: item.category || 'general',
      file_url: item.file_url,
      file_size: item.file_size,
      mime_type: item.mime_type,
      is_published: item.is_published !== null ? item.is_published : true,
      created_at: item.created_at,
      updated_at: item.updated_at
    }));
  },

  async createResource(resource: Omit<ResourceFile, 'id' | 'created_at' | 'updated_at'> & { partner_admin_id: string }): Promise<ResourceFile> {
    const { data, error } = await supabase
      .from('resources')
      .insert(resource)
      .select('id, title, content, type, category, file_url, file_size, mime_type, is_published, created_at, updated_at')
      .single();

    if (error) throw error;
    
    return {
      id: data.id,
      title: data.title,
      content: data.content,
      type: data.type as 'file' | 'news',
      category: data.category || 'general',
      file_url: data.file_url,
      file_size: data.file_size,
      mime_type: data.mime_type,
      is_published: data.is_published !== null ? data.is_published : true,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  },

  async updateResource(id: string, updates: Partial<ResourceFile>): Promise<ResourceFile> {
    const { data, error } = await supabase
      .from('resources')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id, title, content, type, category, file_url, file_size, mime_type, is_published, created_at, updated_at')
      .single();

    if (error) throw error;
    
    return {
      id: data.id,
      title: data.title,
      content: data.content,
      type: data.type as 'file' | 'news',
      category: data.category || 'general',
      file_url: data.file_url,
      file_size: data.file_size,
      mime_type: data.mime_type,
      is_published: data.is_published !== null ? data.is_published : true,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  },

  async deleteResource(id: string): Promise<void> {
    const { error } = await supabase
      .from('resources')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async uploadFile(file: File, userId: string, secureFileName?: string): Promise<string> {
    // Generate secure path structure
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
    const fileName = secureFileName || `${crypto.randomUUID()}.${fileExtension}`;
    const fullPath = `${userId}/${fileName}`;
    
    console.log('Uploading to path:', fullPath);
    console.log('Bucket: partner-documents');
    
    const { data, error } = await supabase.storage
      .from('partner-documents')  // Make sure this bucket exists!
      .upload(fullPath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }
    
    // Get the file URL (not public URL for security)
    const { data: { publicUrl } } = supabase.storage
      .from('partner-documents')
      .getPublicUrl(fullPath);

    return publicUrl;
  },

  async deleteFile(fileUrl: string, userId: string): Promise<void> {
    // Extract the file path from the URL
    const urlParts = fileUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];
    const filePath = `${userId}/${fileName}`;
    
    const { error } = await supabase.storage
      .from('partner-documents')
      .remove([filePath]);
    
    if (error) {
      console.error('Delete error:', error);
      throw new Error(`Delete failed: ${error.message}`);
    }
  }
};
