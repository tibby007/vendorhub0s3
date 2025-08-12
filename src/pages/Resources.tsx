import React, { useState } from 'react';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  DocumentTextIcon,
  LinkIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  CalendarIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import type { Resource } from '../types';

interface ResourceWithStats extends Resource {
  download_count: number;
  view_count: number;
  tags: string[];
}

// Mock resources data
const MOCK_RESOURCES: ResourceWithStats[] = [
  {
    id: 'res-1',
    organization_id: '3f977fec-56c6-4c47-9548-82e961b7a27e',
    title: 'Equipment Financing Guidelines 2024',
    content: 'Comprehensive guide covering all aspects of equipment financing, including credit requirements, documentation needs, and approval processes.',
    resource_type: 'guideline',
    file_url: '/docs/equipment-financing-guidelines-2024.pdf',
    is_published: true,
    created_by: 'admin',
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-08-01T00:00:00Z',
    download_count: 156,
    view_count: 432,
    tags: ['Guidelines', 'Financing', '2024']
  },
  {
    id: 'res-2',
    organization_id: '3f977fec-56c6-4c47-9548-82e961b7a27e',
    title: 'Required Documentation Checklist',
    content: 'Complete checklist of all required documents for equipment financing applications, organized by customer type and equipment category.',
    resource_type: 'document',
    file_url: '/docs/documentation-checklist.pdf',
    is_published: true,
    created_by: 'admin',
    created_at: '2024-02-01T00:00:00Z',
    updated_at: '2024-07-15T00:00:00Z',
    download_count: 298,
    view_count: 567,
    tags: ['Documentation', 'Checklist', 'Requirements']
  },
  {
    id: 'res-3',
    organization_id: '3f977fec-56c6-4c47-9548-82e961b7a27e',
    title: 'Best Practices for Vendor Partnerships',
    content: 'Learn how to build and maintain successful vendor partnerships that drive mutual growth and success in equipment financing.',
    resource_type: 'blog_post',
    file_url: undefined,
    is_published: true,
    created_by: 'admin',
    created_at: '2024-03-10T00:00:00Z',
    updated_at: '2024-08-05T00:00:00Z',
    download_count: 89,
    view_count: 234,
    tags: ['Best Practices', 'Vendors', 'Partnership']
  },
  {
    id: 'res-4',
    organization_id: '3f977fec-56c6-4c47-9548-82e961b7a27e',
    title: 'Credit Score Requirements by Equipment Type',
    content: 'Detailed breakdown of minimum credit score requirements for different types of equipment financing.',
    resource_type: 'guideline',
    file_url: '/docs/credit-requirements.pdf',
    is_published: true,
    created_by: 'admin',
    created_at: '2024-04-20T00:00:00Z',
    updated_at: '2024-08-10T00:00:00Z',
    download_count: 178,
    view_count: 445,
    tags: ['Credit Score', 'Requirements', 'Equipment Types']
  },
  {
    id: 'res-5',
    organization_id: '3f977fec-56c6-4c47-9548-82e961b7a27e',
    title: 'Q2 2024 Market Analysis Report',
    content: 'Analysis of equipment financing market trends, interest rates, and industry outlook for Q2 2024.',
    resource_type: 'document',
    file_url: '/docs/q2-2024-market-analysis.pdf',
    is_published: false,
    created_by: 'admin',
    created_at: '2024-07-01T00:00:00Z',
    updated_at: '2024-08-12T00:00:00Z',
    download_count: 23,
    view_count: 67,
    tags: ['Market Analysis', 'Q2 2024', 'Trends']
  }
];

type ResourceFilter = 'all' | 'guideline' | 'document' | 'blog_post';

export const Resources: React.FC = () => {
  const { userProfile } = useAuth();
  const [resources] = useState<ResourceWithStats[]>(MOCK_RESOURCES);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<ResourceFilter>('all');

  const filteredResources = resources.filter(resource => {
    const matchesSearch = 
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesFilter = filter === 'all' || resource.resource_type === filter;
    const isVisible = userProfile?.role === 'broker' || resource.is_published;
    
    return matchesSearch && matchesFilter && isVisible;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'guideline': return DocumentTextIcon;
      case 'blog_post': return LinkIcon;
      case 'document': return DocumentTextIcon;
      default: return DocumentTextIcon;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'guideline': return 'bg-blue-100 text-blue-800';
      case 'blog_post': return 'bg-purple-100 text-purple-800';
      case 'document': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Stats calculation
  const stats = {
    total: resources.filter(r => userProfile?.role === 'broker' || r.is_published).length,
    guidelines: resources.filter(r => r.resource_type === 'guideline' && (userProfile?.role === 'broker' || r.is_published)).length,
    documents: resources.filter(r => r.resource_type === 'document' && (userProfile?.role === 'broker' || r.is_published)).length,
    blogPosts: resources.filter(r => r.resource_type === 'blog_post' && (userProfile?.role === 'broker' || r.is_published)).length
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Resources</h1>
            <p className="text-gray-600 mt-1">Access shared guidelines, documents, and knowledge base</p>
          </div>
          {userProfile?.role === 'broker' && (
            <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Resource
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DocumentTextIcon className="w-6 h-6 text-gray-400" />
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">Total Resources</div>
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DocumentTextIcon className="w-6 h-6 text-blue-400" />
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">Guidelines</div>
                <div className="text-2xl font-bold text-gray-900">{stats.guidelines}</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DocumentTextIcon className="w-6 h-6 text-green-400" />
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">Documents</div>
                <div className="text-2xl font-bold text-gray-900">{stats.documents}</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <LinkIcon className="w-6 h-6 text-purple-400" />
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-500">Blog Posts</div>
                <div className="text-2xl font-bold text-gray-900">{stats.blogPosts}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="px-6 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 sm:space-x-4">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search resources..."
                className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <FunnelIcon className="w-4 h-4 text-gray-400" />
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
              value={filter}
              onChange={(e) => setFilter(e.target.value as ResourceFilter)}
            >
              <option value="all">All Types</option>
              <option value="guideline">Guidelines</option>
              <option value="document">Documents</option>
              <option value="blog_post">Blog Posts</option>
            </select>
          </div>
        </div>
      </div>

      {/* Resources Grid */}
      <div className="flex-1 px-6 pb-6 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map((resource) => {
            const IconComponent = getResourceIcon(resource.resource_type);
            return (
              <div key={resource.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <IconComponent className="w-6 h-6 text-gray-400" />
                    </div>
                    <div className="ml-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(resource.resource_type)}`}>
                        {resource.resource_type.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  {!resource.is_published && userProfile?.role === 'broker' && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Draft
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2">{resource.title}</h3>
                
                {resource.content && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">{resource.content}</p>
                )}

                {/* Tags */}
                {resource.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {resource.tags.slice(0, 3).map((tag, index) => (
                      <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        <TagIcon className="w-3 h-3 mr-1" />
                        {tag}
                      </span>
                    ))}
                    {resource.tags.length > 3 && (
                      <span className="text-xs text-gray-500">+{resource.tags.length - 3} more</span>
                    )}
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center">
                      <EyeIcon className="w-3 h-3 mr-1" />
                      {resource.view_count} views
                    </span>
                    <span className="flex items-center">
                      <ArrowDownTrayIcon className="w-3 h-3 mr-1" />
                      {resource.download_count} downloads
                    </span>
                  </div>
                  <div className="flex items-center">
                    <CalendarIcon className="w-3 h-3 mr-1" />
                    {formatDate(resource.updated_at)}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <button className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                    <EyeIcon className="w-4 h-4 mr-2" />
                    View
                  </button>
                  {resource.file_url && (
                    <button className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700">
                      <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                      Download
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {filteredResources.length === 0 && (
          <div className="text-center py-12">
            <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No resources found</h3>
            <p className="text-gray-600">
              {searchQuery || filter !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'No resources have been added yet.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};