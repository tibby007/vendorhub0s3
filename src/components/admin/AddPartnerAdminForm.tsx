
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface AddPartnerAdminFormProps {
  onSuccess: () => void;
}

const AddPartnerAdminForm = ({ onSuccess }: AddPartnerAdminFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    company: '',
    contactPhone: '',
    subscription: 'Basic'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: formData.email,
        password: formData.password,
        email_confirm: true,
        user_metadata: {
          name: formData.name,
          role: 'Partner Admin'
        }
      });

      if (authError) throw authError;

      // Create partner record
      const { data: partnerData, error: partnerError } = await supabase
        .from('partners')
        .insert({
          name: formData.company,
          contact_email: formData.email,
          contact_phone: formData.contactPhone
        })
        .select()
        .single();

      if (partnerError) throw partnerError;

      // Create user profile
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: formData.email,
          name: formData.name,
          role: 'Partner Admin',
          partner_id: partnerData.id
        });

      if (userError) throw userError;

      toast({
        title: "Success",
        description: "Partner admin created successfully",
      });

      onSuccess();
    } catch (error: any) {
      console.error('Error creating partner admin:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create partner admin",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={formData.password}
          onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
          required
          placeholder="Enter login password"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="company">Company Name</Label>
        <Input
          id="company"
          value={formData.company}
          onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="contactPhone">Contact Phone</Label>
        <Input
          id="contactPhone"
          value={formData.contactPhone}
          onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="subscription">Subscription Tier</Label>
        <Select value={formData.subscription} onValueChange={(value) => setFormData(prev => ({ ...prev, subscription: value }))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Basic">Basic - $97/month</SelectItem>
            <SelectItem value="Pro">Pro - $197/month</SelectItem>
            <SelectItem value="Premium">Premium - $397/month</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Creating...' : 'Create Partner Admin'}
      </Button>
    </form>
  );
};

export default AddPartnerAdminForm;
