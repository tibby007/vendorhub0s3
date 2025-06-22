
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit2, Trash2, User, Shield, AlertCircle } from 'lucide-react';
import { useRoleCheck } from '@/hooks/useRoleCheck';

interface Vendor {
  id: string;
  vendor_name: string;
  contact_email: string;
  contact_phone: string;
  contact_address: string;
  created_at: string;
  user_id?: string;
}

const VendorManagement = () => {
  const { user } = useAuth();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { canManageVendors, currentRole } = useRoleCheck();

  const [formData, setFormData] = useState({
    vendor_name: '',
    contact_email: '',
    contact_phone: '',
    contact_address: '',
    password: ''
  });

  useEffect(() => {
    if (user && canManageVendors()) {
      fetchVendors();
    }
  }, [user, canManageVendors]);

  const fetchVendors = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('partner_admin_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVendors(data || []);
    } catch (error: any) {
      console.error('Error fetching vendors:', error);
      toast({
        title: "Error",
        description: "Failed to fetch vendors",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.vendor_name.trim()) {
      newErrors.vendor_name = 'Vendor name is required';
    }

    if (!formData.contact_email.trim()) {
      newErrors.contact_email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.contact_email)) {
      newErrors.contact_email = 'Email is invalid';
    }

    if (!editingVendor && !formData.password) {
      newErrors.password = 'Password is required for new vendors';
    } else if (!editingVendor && formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const createVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive",
      });
      return;
    }

    if (!user?.id) return;

    setIsLoading(true);

    try {
      // Create auth user for vendor
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: formData.contact_email,
        password: formData.password,
        email_confirm: true,
        user_metadata: {
          name: formData.vendor_name,
          role: 'Vendor'
        }
      });

      if (authError) throw authError;

      // Create user profile
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: formData.contact_email,
          name: formData.vendor_name,
          role: 'Vendor',
          partner_id: user.partnerId
        });

      if (userError) throw userError;

      // Create vendor record
      const { error: vendorError } = await supabase
        .from('vendors')
        .insert({
          vendor_name: formData.vendor_name,
          contact_email: formData.contact_email,
          contact_phone: formData.contact_phone,
          contact_address: formData.contact_address,
          partner_admin_id: user.id,
          user_id: authData.user.id
        });

      if (vendorError) throw vendorError;

      toast({
        title: "Success",
        description: "Vendor created successfully",
      });

      resetForm();
      setIsCreateDialogOpen(false);
      fetchVendors();
    } catch (error: any) {
      console.error('Error creating vendor:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create vendor",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVendor || !validateForm()) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('vendors')
        .update({
          vendor_name: formData.vendor_name,
          contact_email: formData.contact_email,
          contact_phone: formData.contact_phone,
          contact_address: formData.contact_address,
        })
        .eq('id', editingVendor.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Vendor updated successfully",
      });

      setEditingVendor(null);
      resetForm();
      fetchVendors();
    } catch (error: any) {
      console.error('Error updating vendor:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update vendor",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteVendor = async (vendorId: string) => {
    if (!confirm('Are you sure you want to delete this vendor?')) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('vendors')
        .delete()
        .eq('id', vendorId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Vendor deleted successfully",
      });

      fetchVendors();
    } catch (error: any) {
      console.error('Error deleting vendor:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete vendor",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setFormData({
      vendor_name: vendor.vendor_name,
      contact_email: vendor.contact_email,
      contact_phone: vendor.contact_phone || '',
      contact_address: vendor.contact_address || '',
      password: ''
    });
    setErrors({});
  };

  const resetForm = () => {
    setFormData({
      vendor_name: '',
      contact_email: '',
      contact_phone: '',
      contact_address: '',
      password: ''
    });
    setErrors({});
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const VendorForm = ({ onSubmit, title }: { onSubmit: (e: React.FormEvent) => void; title: string }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <Alert className="border-blue-200 bg-blue-50">
        <Shield className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Security Notice:</strong> All vendor data is validated and encrypted for security.
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <Label htmlFor="vendor_name">Vendor Name *</Label>
        <Input
          id="vendor_name"
          value={formData.vendor_name}
          onChange={(e) => handleInputChange('vendor_name', e.target.value)}
          className={errors.vendor_name ? 'border-red-500' : ''}
          placeholder="Enter vendor name"
        />
        {errors.vendor_name && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.vendor_name}
          </p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="contact_email">Contact Email *</Label>
        <Input
          id="contact_email"
          type="email"
          value={formData.contact_email}
          onChange={(e) => handleInputChange('contact_email', e.target.value)}
          disabled={!!editingVendor}
          className={errors.contact_email ? 'border-red-500' : ''}
          placeholder="vendor@example.com"
        />
        {errors.contact_email && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.contact_email}
          </p>
        )}
      </div>
      
      {!editingVendor && (
        <div className="space-y-2">
          <Label htmlFor="password">Password *</Label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            className={errors.password ? 'border-red-500' : ''}
            placeholder="Minimum 8 characters"
          />
          {errors.password && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {errors.password}
            </p>
          )}
        </div>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="contact_phone">Contact Phone</Label>
        <Input
          id="contact_phone"
          value={formData.contact_phone}
          onChange={(e) => handleInputChange('contact_phone', e.target.value)}
          placeholder="(555) 123-4567"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="contact_address">Contact Address</Label>
        <Input
          id="contact_address"
          value={formData.contact_address}
          onChange={(e) => handleInputChange('contact_address', e.target.value)}
          placeholder="123 Main St, City, State 12345"
        />
      </div>
      
      <div className="flex justify-end gap-2">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => {
            if (editingVendor) {
              setEditingVendor(null);
            } else {
              setIsCreateDialogOpen(false);
            }
            resetForm();
          }}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : title}
        </Button>
      </div>
    </form>
  );

  if (!canManageVendors()) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <Shield className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          <strong>Access Denied:</strong> Only Super Administrators and Partner Administrators can manage vendors. 
          Your current role: {currentRole || 'Unknown'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Vendor Management</h2>
          <p className="text-gray-600">Manage your vendors and their access</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-vendor-green-600 hover:bg-vendor-green-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Vendor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Vendor</DialogTitle>
              <DialogDescription>
                Add a new vendor to your network. They will receive login credentials.
              </DialogDescription>
            </DialogHeader>
            <VendorForm onSubmit={createVendor} title="Create Vendor" />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Vendors</CardTitle>
          <CardDescription>
            {vendors.length} vendor{vendors.length !== 1 ? 's' : ''} in your network
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-vendor-green-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading vendors...</p>
            </div>
          ) : vendors.length === 0 ? (
            <div className="text-center py-8">
              <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No vendors yet. Create your first vendor to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor Name</TableHead>
                  <TableHead>Contact Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendors.map((vendor) => (
                  <TableRow key={vendor.id}>
                    <TableCell className="font-medium">{vendor.vendor_name}</TableCell>
                    <TableCell>{vendor.contact_email}</TableCell>
                    <TableCell>{vendor.contact_phone || 'N/A'}</TableCell>
                    <TableCell>{new Date(vendor.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(vendor)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteVendor(vendor.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {editingVendor && (
        <Dialog open={!!editingVendor} onOpenChange={(open) => {
          if (!open) {
            setEditingVendor(null);
            resetForm();
          }
        }}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Vendor</DialogTitle>
              <DialogDescription>
                Update vendor information
              </DialogDescription>
            </DialogHeader>
            <VendorForm onSubmit={updateVendor} title="Update Vendor" />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default VendorManagement;
