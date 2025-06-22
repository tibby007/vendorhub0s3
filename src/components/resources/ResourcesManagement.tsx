
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Upload, FileText, Calendar, Edit, Trash2, Plus, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { resourcesService, ResourceFile } from '@/services/resourcesService';
import SecureFileUpload from '@/components/security/SecureFileUpload';

const ResourcesManagement = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [resources, setResources] = useState<ResourceFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isNewsDialogOpen, setIsNewsDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<ResourceFile | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [resourceForm, setResourceForm] = useState({
    title: '',
    description: '',
    category: 'guidelines'
  });

  const [newsForm, setNewsForm] = useState({
    title: '',
    content: '',
    category: 'general'
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

  const handleFileUpload = async () => {
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
      const fileUrl = await resourcesService.uploadFile(selectedFile, user.id);
      
      await resourcesService.createResource({
        title: resourceForm.title,
        content: resourceForm.description,
        type: 'file',
        category: resourceForm.category,
        file_url: fileUrl,
        file_size: selectedFile.size,
        mime_type: selectedFile.type,
        is_published: true,
        partner_admin_id: user.id
      });

      toast({
        title: "Success",
        description: "File uploaded successfully",
      });

      setIsUploadDialogOpen(false);
      setResourceForm({ title: '', description: '', category: 'guidelines' });
      setSelectedFile(null);
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

  const handleNewsPublish = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      await resourcesService.createResource({
        title: newsForm.title,
        content: newsForm.content,
        type: 'news',
        category: newsForm.category,
        is_published: true,
        partner_admin_id: user.id
      });

      toast({
        title: "Success",
        description: "News published successfully",
      });

      setIsNewsDialogOpen(false);
      setNewsForm({ title: '', content: '', category: 'general' });
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
    if (resource.type === 'file') {
      setResourceForm({
        title: resource.title,
        description: resource.content,
        category: resource.category
      });
    } else {
      setNewsForm({
        title: resource.title,
        content: resource.content,
        category: resource.category
      });
    }
  };

  const handleUpdate = async () => {
    if (!editingResource) return;

    setIsLoading(true);
    try {
      const updates = editingResource.type === 'file' ? {
        title: resourceForm.title,
        content: resourceForm.description,
        category: resourceForm.category
      } : {
        title: newsForm.title,
        content: newsForm.content,
        category: newsForm.category
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

    setIsLoading(true);
    try {
      await resourcesService.deleteResource(id);
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

  const categories = [
    { value: 'guidelines', label: 'Guidelines' },
    { value: 'forms', label: 'Forms' },
    { value: 'training', label: 'Training Materials' },
    { value: 'policies', label: 'Policies' },
    { value: 'other', label: 'Other' }
  ];

  const newsCategories = [
    { value: 'program-updates', label: 'Program Updates' },
    { value: 'features', label: 'New Features' },
    { value: 'maintenance', label: 'System Maintenance' },
    { value: 'training', label: 'Training' },
    { value: 'general', label: 'General News' }
  ];

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
            <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-vendor-green-600 hover:bg-vendor-green-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Upload Resource
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                  <DialogTitle>Upload New Resource</DialogTitle>
                  <DialogDescription>
                    Upload files and documents for your vendors to access
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Resource Title</Label>
                    <Input 
                      id="title" 
                      value={resourceForm.title}
                      onChange={(e) => setResourceForm({...resourceForm, title: e.target.value})}
                      placeholder="Enter resource title" 
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea 
                      id="description" 
                      value={resourceForm.description}
                      onChange={(e) => setResourceForm({...resourceForm, description: e.target.value})}
                      placeholder="Brief description of the resource" 
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select value={resourceForm.category} onValueChange={(value) => setResourceForm({...resourceForm, category: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <SecureFileUpload
                    id="file-upload"
                    label="File Upload"
                    onFileChange={(file) => setSelectedFile(file as File)}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>Cancel</Button>
                    <Button 
                      onClick={handleFileUpload} 
                      disabled={isLoading}
                      className="bg-vendor-green-600 hover:bg-vendor-green-700"
                    >
                      {isLoading ? 'Uploading...' : 'Upload Resource'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {isLoading ? (
            <div className="text-center py-4">Loading resources...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {fileResources.map((resource) => (
                <Card key={resource.id}>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      {resource.title}
                    </CardTitle>
                    <CardDescription>{resource.content}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Category:</span>
                        <Badge variant="secondary">{resource.category}</Badge>
                      </div>
                      {resource.file_size && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">File Size:</span>
                          <span>{(resource.file_size / 1024 / 1024).toFixed(2)} MB</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Upload Date:</span>
                        <span>{new Date(resource.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => handleEdit(resource)}>
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => handlePreview(resource)}>
                          <Eye className="w-3 h-3 mr-1" />
                          Preview
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" onClick={() => handleDelete(resource.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="news" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">News & Announcements</h3>
            <Dialog open={isNewsDialogOpen} onOpenChange={setIsNewsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-vendor-green-600 hover:bg-vendor-green-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create News Post
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                  <DialogTitle>Create News Post</DialogTitle>
                  <DialogDescription>
                    Create announcements and updates for your vendor network
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="news-title">Title</Label>
                    <Input 
                      id="news-title" 
                      value={newsForm.title}
                      onChange={(e) => setNewsForm({...newsForm, title: e.target.value})}
                      placeholder="Enter news title" 
                    />
                  </div>
                  <div>
                    <Label htmlFor="news-category">Category</Label>
                    <Select value={newsForm.category} onValueChange={(value) => setNewsForm({...newsForm, category: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {newsCategories.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="news-content">Content</Label>
                    <Textarea 
                      id="news-content" 
                      value={newsForm.content}
                      onChange={(e) => setNewsForm({...newsForm, content: e.target.value})}
                      placeholder="Write your news content here..." 
                      className="min-h-[120px]"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsNewsDialogOpen(false)}>Cancel</Button>
                    <Button 
                      onClick={handleNewsPublish} 
                      disabled={isLoading}
                      className="bg-vendor-green-600 hover:bg-vendor-green-700"
                    >
                      {isLoading ? 'Publishing...' : 'Publish Now'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {newsResources.map((news) => (
              <Card key={news.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{news.title}</CardTitle>
                      <CardDescription className="mt-2">
                        {news.content.substring(0, 150)}...
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-100 text-green-700">Published</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(news.created_at).toLocaleDateString()}
                      </span>
                      <Badge variant="outline">{news.category}</Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(news)}>
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handlePreview(news)}>
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" onClick={() => handleDelete(news.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      {editingResource && (
        <Dialog open={!!editingResource} onOpenChange={() => setEditingResource(null)}>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Edit {editingResource.type === 'file' ? 'Resource' : 'News'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Title</Label>
                <Input 
                  id="edit-title" 
                  value={editingResource.type === 'file' ? resourceForm.title : newsForm.title}
                  onChange={(e) => {
                    if (editingResource.type === 'file') {
                      setResourceForm({...resourceForm, title: e.target.value});
                    } else {
                      setNewsForm({...newsForm, title: e.target.value});
                    }
                  }}
                />
              </div>
              <div>
                <Label htmlFor="edit-content">{editingResource.type === 'file' ? 'Description' : 'Content'}</Label>
                <Textarea 
                  id="edit-content" 
                  value={editingResource.type === 'file' ? resourceForm.description : newsForm.content}
                  onChange={(e) => {
                    if (editingResource.type === 'file') {
                      setResourceForm({...resourceForm, description: e.target.value});
                    } else {
                      setNewsForm({...newsForm, content: e.target.value});
                    }
                  }}
                  className="min-h-[120px]"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingResource(null)}>Cancel</Button>
                <Button onClick={handleUpdate} disabled={isLoading}>
                  {isLoading ? 'Updating...' : 'Update'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ResourcesManagement;
