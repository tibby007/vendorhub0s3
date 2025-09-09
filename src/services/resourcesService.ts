
import { supabase } from '@/integrations/supabase/client';

export interface ResourceFile {
  id: string;
  title: string;
  content: string;
  type: string;
  category: string | null;
  file_url?: string | null;
  file_size?: number | null;
  mime_type?: string | null;
  is_published: boolean | null;
  publication_date: string;
  partner_id: string;
  created_at: string;
  updated_at: string;
}

export const resourcesService = {
  async getResources(partnerId: string): Promise<ResourceFile[]> {
    // Check for demo mode - return mock data
    const isDemoMode = sessionStorage.getItem('demoCredentials') !== null;
    if (isDemoMode) {
      console.log('[resourcesService] Demo mode detected - returning mock resources');
      return [
        {
          id: '1',
          title: 'Welcome to VendorHub',
          content: 'Welcome to the VendorHub partner portal! This is a demo resource to show how you can share documents and updates with your vendor network.',
          type: 'news',
          category: 'announcement',
          file_url: null,
          file_size: null,
          mime_type: null,
          is_published: true,
          publication_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          partner_id: 'demo-partner-id',
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          title: 'Partner Agreement Template',
          content: 'Standard vendor partnership agreement template for your review.',
          type: 'document',
          category: 'templates',
          file_url: '/demo/partner-agreement.pdf',
          file_size: 245760,
          mime_type: 'application/pdf',
          is_published: true,
          publication_date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          partner_id: 'demo-partner-id',
          created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '3',
          title: 'Compliance Guidelines',
          content: 'Updated compliance guidelines for Q2 2024.',
          type: 'document',
          category: 'compliance',
          file_url: '/demo/compliance-guidelines.pdf',
          file_size: 512000,
          mime_type: 'application/pdf',
          is_published: true,
          publication_date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
          partner_id: 'demo-partner-id',
          created_at: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];
    }
    
    const { data, error } = await supabase
      .from('resources')
      .select('id, title, content, type, category, file_url, file_size, mime_type, is_published, publication_date, partner_id, created_at, updated_at')
      .eq('partner_id', partnerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Transform the data to ensure all required fields are present
    return (data || []).map(item => ({
      id: item.id,
      title: item.title,
      content: item.content || '',
      type: item.type || 'document',
      category: item.category,
      file_url: item.file_url,
      file_size: item.file_size,
      mime_type: item.mime_type,
      is_published: item.is_published !== null ? item.is_published : true,
      publication_date: item.publication_date || new Date().toISOString(),
      partner_id: item.partner_id,
      created_at: item.created_at,
      updated_at: item.updated_at
    }));
  },

  async createResource(resource: Omit<ResourceFile, 'id' | 'created_at' | 'updated_at'>): Promise<ResourceFile> {
    // Check for demo mode - return mock data
    const isDemoMode = sessionStorage.getItem('demoCredentials') !== null;
    if (isDemoMode) {
      console.log('[resourcesService] Demo mode - simulating resource creation');
      const now = new Date().toISOString();
      return {
        id: `demo-resource-${Date.now()}`,
        title: resource.title,
        content: resource.content,
        type: resource.type || 'document',
        category: resource.category,
        file_url: resource.file_url,
        file_size: resource.file_size,
        mime_type: resource.mime_type,
        is_published: resource.is_published,
        publication_date: resource.publication_date,
        partner_id: resource.partner_id,
        created_at: now,
        updated_at: now
      };
    }
    
    const resourceData = resource;
    
    const { data, error } = await supabase
      .from('resources')
      .insert(resourceData)
      .select('id, title, content, type, category, file_url, file_size, mime_type, is_published, publication_date, partner_id, created_at, updated_at')
      .single();

    if (error) throw error;
    
    return {
      id: data.id,
      title: data.title,
      content: data.content || '',
      type: data.type || 'document',
      category: data.category || 'general',
      file_url: data.file_url,
      file_size: data.file_size,
      mime_type: data.mime_type,
      is_published: data.is_published !== null ? data.is_published : true,
      publication_date: data.publication_date || new Date().toISOString(),
      partner_id: data.partner_id || '',
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  },

  async updateResource(id: string, updates: Partial<ResourceFile>): Promise<ResourceFile> {
    // Check for demo mode - return mock data
    const isDemoMode = sessionStorage.getItem('demoCredentials') !== null;
    if (isDemoMode) {
      console.log('[resourcesService] Demo mode - simulating resource update');
      return {
        id,
        title: updates.title || 'Demo Resource',
        content: updates.content || 'Demo content',
        type: updates.type || 'document',
        category: updates.category || 'general',
        file_url: updates.file_url,
        file_size: updates.file_size,
        mime_type: updates.mime_type,
        is_published: updates.is_published !== undefined ? updates.is_published : true,
        publication_date: updates.publication_date || new Date().toISOString(),
        partner_id: updates.partner_id || 'demo-partner-id',
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      };
    }
    
    const { data, error } = await supabase
      .from('resources')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id, title, content, type, category, file_url, file_size, mime_type, is_published, publication_date, partner_id, created_at, updated_at')
      .single();

    if (error) throw error;
    
    return {
      id: data.id,
      title: data.title,
      content: data.content || '',
      type: data.type || 'document',
      category: data.category || 'general',
      file_url: data.file_url,
      file_size: data.file_size,
      mime_type: data.mime_type,
      is_published: data.is_published !== null ? data.is_published : true,
      publication_date: data.publication_date || new Date().toISOString(),
      partner_id: data.partner_id || '',
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  },

  async deleteResource(id: string): Promise<void> {
    // Check for demo mode - simulate deletion
    const isDemoMode = sessionStorage.getItem('demoCredentials') !== null;
    if (isDemoMode) {
      console.log('[resourcesService] Demo mode - simulating resource deletion');
      return;
    }
    
    const { error } = await supabase
      .from('resources')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async uploadFile(file: File, partnerId: string, secureFileName?: string): Promise<string> {
    // Check for demo mode - return mock URL
    const isDemoMode = sessionStorage.getItem('demoCredentials') !== null;
    if (isDemoMode) {
      console.log('[resourcesService] Demo mode - simulating file upload');
      return `/demo/uploaded-${file.name}`;
    }
    
    // Generate secure path structure based on authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
    const fileName = secureFileName || `${crypto.randomUUID()}.${fileExtension}`;
    const fullPath = `${user.id}/${fileName}`;
    
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
    
    // Get a signed URL for private bucket access (expires in 1 hour)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('partner-documents')
      .createSignedUrl(fullPath, 3600); // 1 hour expiry

    if (signedUrlError) {
      console.error('Signed URL error:', signedUrlError);
      throw new Error(`Failed to create signed URL: ${signedUrlError.message}`);
    }

    return signedUrlData.signedUrl;
  },

  async deleteFile(fileUrl: string, partnerId: string): Promise<void> {
    // Check for demo mode - simulate deletion
    const isDemoMode = sessionStorage.getItem('demoCredentials') !== null;
    if (isDemoMode) {
      console.log('[resourcesService] Demo mode - simulating file deletion');
      return;
    }
    
    // Get authenticated user for path structure
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Extract the file path from the URL
    const urlParts = fileUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];
    const filePath = `${user.id}/${fileName}`;
    
    const { error } = await supabase.storage
      .from('partner-documents')
      .remove([filePath]);
    
    if (error) {
      console.error('Delete error:', error);
      throw new Error(`Delete failed: ${error.message}`);
    }
  }
};
