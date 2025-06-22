
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ResourceFile } from '@/services/resourcesService';

interface ResourceEditDialogProps {
  resource: ResourceFile | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
  isLoading: boolean;
  formData: {
    title: string;
    content: string;
  };
  onFormChange: (field: 'title' | 'content', value: string) => void;
}

const ResourceEditDialog = ({ 
  resource, 
  isOpen, 
  onOpenChange, 
  onUpdate, 
  isLoading, 
  formData, 
  onFormChange 
}: ResourceEditDialogProps) => {
  if (!resource) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Edit {resource.type === 'file' ? 'Resource' : 'News'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="edit-title">Title</Label>
            <Input 
              id="edit-title" 
              value={formData.title}
              onChange={(e) => onFormChange('title', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="edit-content">{resource.type === 'file' ? 'Description' : 'Content'}</Label>
            <Textarea 
              id="edit-content" 
              value={formData.content}
              onChange={(e) => onFormChange('content', e.target.value)}
              className="min-h-[120px]"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={onUpdate} disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Update'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ResourceEditDialog;
