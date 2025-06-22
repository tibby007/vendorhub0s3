
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
      .select('*')
      .eq('partner_admin_id', partnerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createResource(resource: Omit<ResourceFile, 'id' | 'created_at' | 'updated_at'> & { partner_admin_id: string }): Promise<ResourceFile> {
    const { data, error } = await supabase
      .from('resources')
      .insert(resource)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateResource(id: string, updates: Partial<ResourceFile>): Promise<ResourceFile> {
    const { data, error } = await supabase
      .from('resources')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteResource(id: string): Promise<void> {
    const { error } = await supabase
      .from('resources')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async uploadFile(file: File, userId: string): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('submissions')
      .upload(fileName, file);

    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
      .from('submissions')
      .getPublicUrl(fileName);

    return publicUrl;
  }
};
