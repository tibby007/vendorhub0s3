import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { resourcesService, ResourceFile } from '@/services/resourcesService';
import { checkStorageLimit, updateStorageUsage } from '@/utils/storageUtils';
import { validateFileUpload, generateSecureFileName } from '@/utils/fileValidation';
import { supabase } from '@/integrations/supabase/client';
import ResourceCard from './ResourceCard';
import FileUploadDialog from './FileUploadDialog';
import NewsDialog from './NewsDialog';
import ResourceEditDialog from './ResourceEditDialog';

const ResourcesManagement = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [resources, setResources] = useState<ResourceFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isNewsDialogOpen, setIsNewsDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<ResourceFile | null>(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    content: ''
  });

  useEffect(() => {
    if (user?.id) {
      fetchResources();
    }
  }, [user]);

  const fetchResources = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const data = await resourcesService.getResources(user.id);
      setResources(data);
    } catch (error: any) {
      console.error('Error fetching resources:', error);
      toast({
        title: "Error",
        description: "Failed to fetch resources",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (formData: { title: string; description: string; category: string }, selectedFile: File | null) => {
    if (!selectedFile || !user?.id) {
      toast({
        title: "Error",
        description: "Please select a file",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // 1. Client-side file validation
      const validatedFile = await validateFileUpload(selectedFile);
      
      // 2. Server-side storage validation
      const storageResponse = await supabase.functions.invoke('validate-storage', {
        body: { 
          partnerId: user.id, 
          fileSize: validatedFile.size,
          fileName: validatedFile.name,
          mimeType: validatedFile.type
        }
      });

      if (storageResponse.error) {
        console.error('Storage validation error:', storageResponse.error);
        toast({
          title: "Storage Validation Failed",
          description: "Unable to validate storage. Please try again.",
          variant: "destructive",
        });
        return;
      }

      if (!storageResponse.data?.allowed) {
        toast({
          title: "Upload Not Allowed",
          description: storageResponse.data?.message || "Upload validation failed",
          variant: "destructive",
        });
        return;
      }

      // 3. Generate secure filename
      const secureFileName = generateSecureFileName(validatedFile.name);
      
      // 4. Upload with secure filename
      const fileUrl = await resourcesService.uploadFile(validatedFile, user.id, secureFileName);
      
      // 5. Create resource record
      await resourcesService.createResource({
        title: formData.title,
        content: formData.description,
        type: 'file',
        category: formData.category,
        file_url: fileUrl,
        file_size: validatedFile.size,
        mime_type: validatedFile.type,
        is_published: true,
        partner_admin_id: user.id
      });

      // 6. Update storage usage
      await updateStorageUsage(user.id, validatedFile.size);

      // 7. Audit log
      await supabase.from('storage_audit_log').insert({
        partner_id: user.id,
        action: 'upload',
        file_name: secureFileName,
        file_size: validatedFile.size,
        ip_address: 'client',
        user_agent: navigator.userAgent
      });

      toast({
        title: "Success",
        description: "File uploaded securely",
      });

      setIsUploadDialogOpen(false);
      fetchResources();
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewsPublish = async (formData: { title: string; content: string; category: string }) => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      await resourcesService.createResource({
        title: formData.title,
        content: formData.content,
        type: 'news',
        category: formData.category,
        is_published: true,
        partner_admin_id: user.id
      });

      toast({
        title: "Success",
        description: "News published successfully",
      });

      setIsNewsDialogOpen(false);
      fetchResources();
    } catch (error: any) {
      console.error('Error publishing news:', error);
      toast({
        title: "Error",
        description: "Failed to publish news",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (resource: ResourceFile) => {
    setEditingResource(resource);
    setEditFormData({
      title: resource.title,
      content: resource.content
    });
  };

  const handleUpdate = async () => {
    if (!editingResource) return;

    try {
      await resourcesService.updateResource(editingResource.id, {
        title: editFormData.title,
        content: editFormData.content
      });

      toast({
        title: "Success",
        description: "Resource updated successfully",
      });

      setEditingResource(null);
      fetchResources();
    } catch (error: any) {
      console.error('Error updating resource:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update resource",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      // Find the resource to delete for audit logging
      const resourceToDelete = resources.find(r => r.id === id);
      
      await resourcesService.deleteResource(id);
      
      // Update storage usage if it was a file
      if (resourceToDelete?.file_size && user?.id) {
        await updateStorageUsage(user.id, resourceToDelete.file_size, true);
        
        // Audit log
        await supabase.from('storage_audit_log').insert({
          partner_id: user.id,
          action: 'delete',
          file_name: resourceToDelete.title,
          file_size: resourceToDelete.file_size,
          ip_address: 'client',
          user_agent: navigator.userAgent
        });
      }
      
      toast({
        title: "Success",
        description: "Resource deleted successfully",
      });
      fetchResources();
    } catch (error: any) {
      console.error('Error deleting resource:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete resource",
        variant: "destructive",
      });
    }
  };

  const handlePreview = (resource: ResourceFile) => {
    if (resource.file_url) {
      window.open(resource.file_url, '_blank');
    } else {
      // Show content modal for news items
      alert(resource.content);
    }
  };

  return (
    // ... keep existing code (UI components and rendering logic)
    <div>
      {/* The existing rendering code would go here */}
      <p>Resources Management with enhanced security</p>
    </div>
  );
};

export default ResourcesManagement;
