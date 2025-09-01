import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Download, Search, Calendar, FileText, Bell } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Resource {
  id: string;
  title: string;
  content: string;
  type: 'file' | 'news';
  category: string;
  file_url?: string;
  file_size?: number;
  mime_type?: string;
  created_at: string;
  is_published: boolean;
}

const VendorResources = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchResources();
    }
  }, [user]);

  const fetchResources = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      // Get partner admin ID from vendor relationship
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .select('partner_admin_id')
        .eq('user_id', user.id)
        .single();

      if (vendorError) {
        console.error('Error fetching vendor data:', vendorError);
        return;
      }

      // Fetch resources from partner admin
      const { data, error } = await supabase
        .from('resources')
        .select('id, title, content, type, category, file_url, file_size, mime_type, created_at, is_published')
        .eq('partner_admin_id', vendorData.partner_admin_id)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform data to ensure proper typing
      const transformedData: Resource[] = (data || []).map(item => ({
        id: item.id,
        title: item.title,
        content: item.content,
        type: item.type as 'file' | 'news',
        category: item.category || 'general',
        file_url: item.file_url,
        file_size: item.file_size,
        mime_type: item.mime_type,
        created_at: item.created_at,
        is_published: item.is_published !== null ? item.is_published : true
      }));
      
      setResources(transformedData);
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

  const categories = [
    { value: 'all', label: 'All Resources' },
    { value: 'guidelines', label: 'Guidelines' },
    { value: 'forms', label: 'Forms' },
    { value: 'training', label: 'Training' },
    { value: 'policies', label: 'Policies' }
  ];

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || resource.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const fileResources = filteredResources.filter(r => r.type === 'file');
  const newsResources = filteredResources.filter(r => r.type === 'news');

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'file':
        return <FileText className="w-4 h-4" />;
      case 'news':
        return <Bell className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const handleDownload = (resource: Resource) => {
    if (resource.file_url) {
      window.open(resource.file_url, '_blank');
    } else {
      toast({
        title: "Download",
        description: "File URL not available",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Resources & Updates</h2>
        <p className="text-gray-600">Access the latest guidelines, forms, and program updates</p>
      </div>

      {/* News Section */}
      {newsResources.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Latest Announcements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {newsResources.slice(0, 3).map((announcement) => (
                <div key={announcement.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <Bell className="w-4 h-4 text-blue-600 mt-1" />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{announcement.title}</h4>
                    <p className="text-sm text-gray-600">{announcement.content.substring(0, 150)}...</p>
                    <p className="text-xs text-gray-500 mt-1">{new Date(announcement.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search resources..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map((category) => (
            <Button
              key={category.value}
              variant={selectedCategory === category.value ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category.value)}
              className={selectedCategory === category.value ? "bg-vendor-green-600 hover:bg-vendor-green-700" : ""}
            >
              {category.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Resources Grid */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-vendor-green-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading resources...</p>
        </div>
      ) : fileResources.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              {searchTerm || selectedCategory !== 'all' 
                ? 'No resources found matching your criteria.' 
                : 'No resources available yet. Your partner administrator will upload resources for you to access.'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {fileResources.map((resource) => (
            <Card key={resource.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {getTypeIcon(resource.type)}
                      {resource.title}
                      <Badge variant="secondary" className="ml-2">{resource.category}</Badge>
                    </CardTitle>
                    <CardDescription className="mt-2">{resource.content}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(resource.created_at).toLocaleDateString()}</span>
                    {resource.file_size && (
                      <>
                        <span>•</span>
                        <span>{(resource.file_size / 1024 / 1024).toFixed(2)} MB</span>
                      </>
                    )}
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex items-center gap-2"
                    onClick={() => handleDownload(resource)}
                    disabled={!resource.file_url}
                  >
                    <Download className="w-4 h-4" />
                    {resource.file_url ? 'Download' : 'N/A'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default VendorResources;
