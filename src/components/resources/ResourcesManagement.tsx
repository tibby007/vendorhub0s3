
import React, { useState } from 'react';
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

const ResourcesManagement = () => {
  const { toast } = useToast();
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isNewsDialogOpen, setIsNewsDialogOpen] = useState(false);

  // Mock data for existing resources and news
  const resources = [
    {
      id: 1,
      title: "Updated Application Guidelines 2024",
      description: "New requirements for customer applications effective June 2024",
      category: "guidelines",
      type: "PDF",
      uploadDate: "2024-06-15",
      fileName: "application-guidelines-2024.pdf",
      fileSize: "2.3 MB"
    },
    {
      id: 2,
      title: "Customer Application Form V3.2",
      description: "Latest version of the standard customer application form",
      category: "forms",
      type: "PDF",
      uploadDate: "2024-06-01",
      fileName: "customer-application-form-v3.2.pdf",
      fileSize: "1.8 MB"
    }
  ];

  const newsItems = [
    {
      id: 1,
      title: "Q2 Program Updates",
      content: "Important changes to commission structure and bonus programs. Effective July 1st, 2024...",
      category: "Program Updates",
      publishDate: "2024-06-10",
      isPublished: true
    },
    {
      id: 2,
      title: "New Feature: Enhanced Pre-Qualification Tool",
      content: "We've updated the pre-qualification tool with improved scoring algorithms...",
      category: "Features",
      publishDate: "2024-06-18",
      isPublished: true
    }
  ];

  const handleFileUpload = () => {
    toast({
      title: "File uploaded successfully",
      description: "The resource has been added and is now available to all vendors.",
    });
    setIsUploadDialogOpen(false);
  };

  const handleNewsPublish = () => {
    toast({
      title: "News published successfully",
      description: "The announcement is now visible to all vendors.",
    });
    setIsNewsDialogOpen(false);
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
                    <Input id="title" placeholder="Enter resource title" />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" placeholder="Brief description of the resource" />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select>
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
                  <div>
                    <Label htmlFor="file">File Upload</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                      <p className="text-xs text-gray-500">PDF, DOC, DOCX up to 10MB</p>
                      <Input type="file" className="hidden" id="file" />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleFileUpload} className="bg-vendor-green-600 hover:bg-vendor-green-700">
                      Upload Resource
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map((resource) => (
              <Card key={resource.id}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    {resource.title}
                  </CardTitle>
                  <CardDescription>{resource.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Category:</span>
                      <Badge variant="secondary">{resource.category}</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">File Size:</span>
                      <span>{resource.fileSize}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Upload Date:</span>
                      <span>{resource.uploadDate}</span>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <Eye className="w-3 h-3 mr-1" />
                        Preview
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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
                    <Input id="news-title" placeholder="Enter news title" />
                  </div>
                  <div>
                    <Label htmlFor="news-category">Category</Label>
                    <Select>
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
                      placeholder="Write your news content here..." 
                      className="min-h-[120px]"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsNewsDialogOpen(false)}>Cancel</Button>
                    <Button variant="outline">Save Draft</Button>
                    <Button onClick={handleNewsPublish} className="bg-vendor-green-600 hover:bg-vendor-green-700">
                      Publish Now
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {newsItems.map((news) => (
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
                      {news.isPublished ? (
                        <Badge className="bg-green-100 text-green-700">Published</Badge>
                      ) : (
                        <Badge variant="secondary">Draft</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {news.publishDate}
                      </span>
                      <Badge variant="outline">{news.category}</Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button size="sm" variant="outline">
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
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
    </div>
  );
};

export default ResourcesManagement;
