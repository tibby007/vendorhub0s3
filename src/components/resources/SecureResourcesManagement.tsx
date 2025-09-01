import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/providers/AuthProvider';
import { resourcesService, ResourceFile } from '@/services/resourcesService';
import { updateStorageUsage } from '@/utils/storageUtils';
import { validateFileUpload, generateSecureFileName } from '@/utils/fileValidation';
import { supabase } from '@/integrations/supabase/client';
import ResourceCard from './ResourceCard';
import FileUploadDialog from './FileUploadDialog';
import NewsDialog from './NewsDialog';
import ResourceEditDialog from './ResourceEditDialog';
import { getCurrentPartner } from '@/lib/partners';

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
      const partner = await getCurrentPartner();
      const data = await resourcesService.getResources(partner.id);
      setResources(data);
    } catch (error: any) {
      console.error('Error fetching resources:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch resources',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (
    formData: { title: string; description: string; category: string },
    selectedFile: File | null
  ) => {
    if (!selectedFile) {
      toast({
        title: 'Error',
        description: 'Please select a file',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const partner = await getCurrentPartner();
      // 1. Client-side file validation
      const validatedFile = await validateFileUpload(selectedFile);

      // 2. Server-side storage validation
      const storageResponse = await supabase.functions.invoke('validate-storage', {
        body: {
          partnerId: partner.id,
          fileSize: validatedFile.size,
          fileName: validatedFile.name,
          mimeType: validatedFile.type,
        },
      });

      if (storageResponse.error) {
        console.error('Storage validation error:', storageResponse.error);
        toast({
          title: 'Storage Validation Failed',
          description: 'Unable to validate storage. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      if (!storageResponse.data?.allowed) {
        toast({
          title: 'Upload Not Allowed',
          description: storageResponse.data?.message || 'Upload validation failed',
          variant: 'destructive',
        });
        return;
      }

      // 3. Generate secure filename
      const secureFileName = generateSecureFileName(validatedFile.name);

      // 4. Upload with secure filename (store under partner folder)
      const fileUrl = await resourcesService.uploadFile(validatedFile, partner.id, secureFileName);

      // 5. Create resource record
      await resourcesService.createResource({
        title: formData.title,
        content: formData.description,
        type: 'document',
        category: formData.category,
        file_url: fileUrl,
        file_size: validatedFile.size,
        mime_type: validatedFile.type,
        is_published: true,
        publication_date: new Date().toISOString(),
        partner_id: partner.id,
      });

      // 6. Update storage usage
      await updateStorageUsage(partner.id, validatedFile.size);

      // 7. Audit log
      await supabase.from('storage_audit_log').insert({
        partner_id: partner.id,
        action: 'upload',
        file_name: secureFileName,
        file_size: validatedFile.size,
        ip_address: 'client',
        user_agent: navigator.userAgent,
      });

      toast({
        title: 'Success',
        description: 'File uploaded securely',
      });

      setIsUploadDialogOpen(false);
      fetchResources();
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload file',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewsPublish = async (formData: { title: string; content: string; category: string }) => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const partner = await getCurrentPartner();
      await resourcesService.createResource({
        title: formData.title,
        content: formData.content,
        type: 'news',
        category: formData.category,
        is_published: true,
        publication_date: new Date().toISOString(),
        partner_id: partner.id,
      });

      toast({
        title: 'Success',
        description: 'News published successfully',
      });

      setIsNewsDialogOpen(false);
      fetchResources();
    } catch (error: any) {
      console.error('Error publishing news:', error);
      toast({
        title: 'Error',
        description: 'Failed to publish news',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (resource: ResourceFile) => {
    setEditingResource(resource);
    setEditFormData({
      title: resource.title,
      content: resource.content,
    });
  };

  const handleUpdate = async () => {
    if (!editingResource) return;

    try {
      await resourcesService.updateResource(editingResource.id, {
        title: editFormData.title,
        content: editFormData.content,
      });

      toast({
        title: 'Success',
        description: 'Resource updated successfully',
      });

      setEditingResource(null);
      fetchResources();
    } catch (error: any) {
      console.error('Error updating resource:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update resource',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const partner = await getCurrentPartner();
      // Find the resource to delete for audit logging
      const resourceToDelete = resources.find((r) => r.id === id);

      await resourcesService.deleteResource(id);

      // Update storage usage if it was a file
      if (resourceToDelete?.file_size) {
        await updateStorageUsage(partner.id, resourceToDelete.file_size, true);

        // Audit log
        await supabase.from('storage_audit_log').insert({
          partner_id: partner.id,
          action: 'delete',
          file_name: resourceToDelete.title,
          file_size: resourceToDelete.file_size,
          ip_address: 'client',
          user_agent: navigator.userAgent,
        });
      }

      toast({
        title: 'Success',
        description: 'Resource deleted successfully',
      });
      fetchResources();
    } catch (error: any) {
      console.error('Error deleting resource:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete resource',
        variant: 'destructive',
      });
    }
  };

  const handlePreview = (resource: ResourceFile) => {
    if (resource.file_url) {
      window.open(resource.file_url, '_blank');
    } else {
      toast({ title: resource.title, description: resource.content || 'No preview available' });
    }
  };

  return (
    <Tabs defaultValue="files" className="w-full">
      <TabsList>
        <TabsTrigger value="files">Files</TabsTrigger>
        <TabsTrigger value="news">News</TabsTrigger>
      </TabsList>
      <TabsContent value="files">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Manage Files</h2>
          <FileUploadDialog
            isOpen={isUploadDialogOpen}
            onOpenChange={setIsUploadDialogOpen}
            onUpload={handleFileUpload}
            isLoading={isLoading}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources
            .filter((r) => r.type === 'document' || r.file_url)
            .map((resource) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                onEdit={handleEdit}
                onPreview={handlePreview}
                onDelete={() => handleDelete(resource.id)}
              />
            ))}
        </div>
      </TabsContent>
      <TabsContent value="news">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Partner News</h2>
          <NewsDialog
            isOpen={isNewsDialogOpen}
            onOpenChange={setIsNewsDialogOpen}
            onPublish={handleNewsPublish}
            isLoading={isLoading}
          />
        </div>
        <div className="space-y-4">
          {resources
            .filter((r) => r.type === 'news' && !r.file_url)
            .map((resource) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                onEdit={handleEdit}
                onPreview={handlePreview}
                onDelete={() => handleDelete(resource.id)}
              />
            ))}
        </div>
      </TabsContent>
      <ResourceEditDialog
        resource={editingResource}
        isOpen={!!editingResource}
        onOpenChange={(open) => !open && setEditingResource(null)}
        onUpdate={handleUpdate}
        isLoading={isLoading}
        formData={editFormData}
        onFormChange={(field, value) =>
          setEditFormData((prev) => ({ ...prev, [field]: value }))
        }
      />
    </Tabs>
  );
};

export default ResourcesManagement;
