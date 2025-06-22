
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';

interface NewsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onPublish: (formData: { title: string; content: string; category: string }) => void;
  isLoading: boolean;
}

const newsCategories = [
  { value: 'program-updates', label: 'Program Updates' },
  { value: 'features', label: 'New Features' },
  { value: 'maintenance', label: 'System Maintenance' },
  { value: 'training', label: 'Training' },
  { value: 'general', label: 'General News' }
];

const NewsDialog = ({ isOpen, onOpenChange, onPublish, isLoading }: NewsDialogProps) => {
  const [newsForm, setNewsForm] = useState({
    title: '',
    content: '',
    category: 'general'
  });

  const handlePublish = () => {
    onPublish(newsForm);
    setNewsForm({ title: '', content: '', category: 'general' });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button 
              onClick={handlePublish} 
              disabled={isLoading}
              className="bg-vendor-green-600 hover:bg-vendor-green-700"
            >
              {isLoading ? 'Publishing...' : 'Publish Now'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewsDialog;
