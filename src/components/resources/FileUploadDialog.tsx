
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import SecureFileUpload from '@/components/security/SecureFileUpload';

interface FileUploadDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (formData: { title: string; description: string; category: string }, file: File | null) => void;
  isLoading: boolean;
}

const categories = [
  { value: 'guidelines', label: 'Guidelines' },
  { value: 'forms', label: 'Forms' },
  { value: 'training', label: 'Training Materials' },
  { value: 'policies', label: 'Policies' },
  { value: 'other', label: 'Other' }
];

const FileUploadDialog = ({ isOpen, onOpenChange, onUpload, isLoading }: FileUploadDialogProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [resourceForm, setResourceForm] = useState({
    title: '',
    description: '',
    category: 'guidelines'
  });

  const handleUpload = () => {
    onUpload(resourceForm, selectedFile);
    setResourceForm({ title: '', description: '', category: 'guidelines' });
    setSelectedFile(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button 
              onClick={handleUpload} 
              disabled={isLoading}
              className="bg-vendor-green-600 hover:bg-vendor-green-700"
            >
              {isLoading ? 'Uploading...' : 'Upload Resource'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FileUploadDialog;
