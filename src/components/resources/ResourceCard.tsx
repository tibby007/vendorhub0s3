
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Calendar, Edit, Trash2, Eye } from 'lucide-react';
import { ResourceFile } from '@/services/resourcesService';

interface ResourceCardProps {
  resource: ResourceFile;
  onEdit: (resource: ResourceFile) => void;
  onDelete: (id: string) => void;
  onPreview: (resource: ResourceFile) => void;
}

const ResourceCard = ({ resource, onEdit, onDelete, onPreview }: ResourceCardProps) => {
  if (resource.type === 'file') {
    return (
      <Card>
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
              <Button size="sm" variant="outline" className="flex-1" onClick={() => onEdit(resource)}>
                <Edit className="w-3 h-3 mr-1" />
                Edit
              </Button>
              <Button size="sm" variant="outline" className="flex-1" onClick={() => onPreview(resource)}>
                <Eye className="w-3 h-3 mr-1" />
                Preview
              </Button>
              <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" onClick={() => onDelete(resource.id)}>
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // News card
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{resource.title}</CardTitle>
            <CardDescription className="mt-2">
              {resource.content.substring(0, 150)}...
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
              {new Date(resource.created_at).toLocaleDateString()}
            </span>
            <Badge variant="outline">{resource.category}</Badge>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => onEdit(resource)}>
              <Edit className="w-3 h-3 mr-1" />
              Edit
            </Button>
            <Button size="sm" variant="outline" onClick={() => onPreview(resource)}>
              <Eye className="w-3 h-3 mr-1" />
              View
            </Button>
            <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" onClick={() => onDelete(resource.id)}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResourceCard;
