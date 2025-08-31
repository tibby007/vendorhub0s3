
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { resourcesService, ResourceFile } from '@/services/resourcesService';
import { checkStorageLimit, updateStorageUsage } from '@/utils/storageUtils';
import { listResourcesForPartner, createResourceForPartner, createNewsForPartner } from '@/lib/resources';
import { logDebug } from '@/lib/log';
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
      logDebug("RESOURCES_FETCH", { user_id: user.id });
      const data = await listResourcesForPartner();
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
      // Check storage limit before upload
      const canUpload = await checkStorageLimit(user.id, selectedFile.size);
      
      if (!canUpload) {
        toast({
          title: "Storage Limit Exceeded",
          description: "Please upgrade your plan or delete some files to make space",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const fileUrl = await resourcesService.uploadFile(selectedFile, user.id);
      
      await createResourceForPartner({
        title: formData.title,
        category: formData.category,
        file_url: fileUrl,
        file_size: selectedFile.size,
        mime_type: selectedFile.type,
        is_published: true
      });

      // Update storage usage after successful upload
      await updateStorageUsage(user.id, selectedFile.size);

      toast({
        title: "Success",
        description: "File uploaded successfully",
      });

      setIsUploadDialogOpen(false);
      fetchResources();
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast({
        title: "Error",
        description: "Failed to upload file",
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
      logDebug("NEWS_CREATE", { title: formData.title, category: formData.category });
      await createNewsForPartner({
        title: formData.title,
        content: formData.content,
        category: formData.category,
        is_published: true
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

    setIsLoading(true);
    try {
      const updates = {
        title: editFormData.title,
        content: editFormData.content
      };

      await resourcesService.updateResource(editingResource.id, updates);

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
        description: "Failed to update resource",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this resource?')) return;

    const resourceToDelete = resources.find(r => r.id === id);
    
    setIsLoading(true);
    try {
      await resourcesService.deleteResource(id);
      
      // Update storage usage if file had a size
      if (resourceToDelete?.file_size && user?.id) {
        await updateStorageUsage(user.id, resourceToDelete.file_size, true);
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
        description: "Failed to delete resource",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreview = (resource: ResourceFile) => {
    if (resource.file_url) {
      window.open(resource.file_url, '_blank');
    } else {
      toast({
        title: "Preview",
        description: resource.content,
      });
    }
  };

  const handleEditFormChange = (field: 'title' | 'content', value: string) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const fileResources = resources.filter(r => r.type === 'file');
  const newsResources = resources.filter(r => r.type === 'news');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Resources Management</h2>
          <p className="text-gray-600">Manage files, documents, and news updates for your vendor network</p>
        </div>
      </div>

      <Tabs defaultValue="resources" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="resources">File Resources</TabsTrigger>
          <TabsTrigger value="news">News & Updates</TabsTrigger>
        </TabsList>

        <TabsContent value="resources" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">File Resources</h3>
            <FileUploadDialog
              isOpen={isUploadDialogOpen}
              onOpenChange={setIsUploadDialogOpen}
              onUpload={handleFileUpload}
              isLoading={isLoading}
            />
          </div>

          {isLoading ? (
            <div className="text-center py-4">Loading resources...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {fileResources.map((resource) => (
                <ResourceCard
                  key={resource.id}
                  resource={resource}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onPreview={handlePreview}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="news" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">News & Announcements</h3>
            <NewsDialog
              isOpen={isNewsDialogOpen}
              onOpenChange={setIsNewsDialogOpen}
              onPublish={handleNewsPublish}
              isLoading={isLoading}
            />
          </div>

          <div className="space-y-4">
            {newsResources.map((news) => (
              <ResourceCard
                key={news.id}
                resource={news}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onPreview={handlePreview}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <ResourceEditDialog
        resource={editingResource}
        isOpen={!!editingResource}
        onOpenChange={() => setEditingResource(null)}
        onUpdate={handleUpdate}
        isLoading={isLoading}
        formData={editFormData}
        onFormChange={handleEditFormChange}
      />
    </div>
  );
};

export default ResourcesManagement;
