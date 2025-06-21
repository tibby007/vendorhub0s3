
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Download, Search, Calendar, FileText, AlertCircle, Bell } from 'lucide-react';

const VendorResources = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Mock data for resources
  const resources = [
    {
      id: 1,
      title: "Updated Application Guidelines 2024",
      description: "New requirements for customer applications effective June 2024",
      category: "guidelines",
      type: "PDF",
      date: "2024-06-15",
      isNew: true,
      downloadUrl: "#"
    },
    {
      id: 2,
      title: "Q2 Program Updates",
      description: "Important changes to commission structure and bonus programs",
      category: "news",
      type: "Document",
      date: "2024-06-10",
      isNew: true,
      downloadUrl: "#"
    },
    {
      id: 3,
      title: "Customer Application Form V3.2",
      description: "Latest version of the standard customer application form",
      category: "forms",
      type: "PDF",
      date: "2024-06-01",
      isNew: false,
      downloadUrl: "#"
    },
    {
      id: 4,
      title: "Best Practices for Lead Qualification",
      description: "Guidelines for identifying and qualifying high-value prospects",
      category: "guidelines",
      type: "PDF",
      date: "2024-05-20",
      isNew: false,
      downloadUrl: "#"
    },
    {
      id: 5,
      title: "Partner Training Webinar Recording",
      description: "May 2024 training session covering new features and processes",
      category: "training",
      type: "Video",
      date: "2024-05-15",
      isNew: false,
      downloadUrl: "#"
    }
  ];

  const announcements = [
    {
      id: 1,
      title: "System Maintenance Scheduled",
      message: "Planned maintenance window on June 25th from 2-4 AM EST",
      type: "info",
      date: "2024-06-20"
    },
    {
      id: 2,
      title: "New Feature: Enhanced Pre-Qualification Tool",
      message: "We've updated the pre-qualification tool with improved scoring algorithms",
      type: "feature",
      date: "2024-06-18"
    }
  ];

  const categories = [
    { value: 'all', label: 'All Resources' },
    { value: 'guidelines', label: 'Guidelines' },
    { value: 'forms', label: 'Forms' },
    { value: 'news', label: 'News & Updates' },
    { value: 'training', label: 'Training' }
  ];

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || resource.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'PDF':
        return <FileText className="w-4 h-4" />;
      case 'Video':
        return <Calendar className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getAnnouncementIcon = (type: string) => {
    switch (type) {
      case 'info':
        return <AlertCircle className="w-4 h-4 text-blue-600" />;
      case 'feature':
        return <Bell className="w-4 h-4 text-green-600" />;
      default:
        return <Bell className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Resources & Updates</h2>
        <p className="text-gray-600">Access the latest guidelines, forms, and program updates</p>
      </div>

      {/* Announcements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Latest Announcements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {announcements.map((announcement) => (
              <div key={announcement.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                {getAnnouncementIcon(announcement.type)}
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{announcement.title}</h4>
                  <p className="text-sm text-gray-600">{announcement.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{announcement.date}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredResources.map((resource) => (
          <Card key={resource.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {resource.title}
                    {resource.isNew && <Badge variant="secondary" className="bg-green-100 text-green-700">New</Badge>}
                  </CardTitle>
                  <CardDescription className="mt-2">{resource.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  {getTypeIcon(resource.type)}
                  <span>{resource.type}</span>
                  <span>•</span>
                  <span>{resource.date}</span>
                </div>
                <Button size="sm" variant="outline" className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Download
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredResources.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-gray-600">No resources found matching your criteria.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VendorResources;
