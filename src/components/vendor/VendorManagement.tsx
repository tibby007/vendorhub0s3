
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit2, Trash2, User } from 'lucide-react';

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
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);

  const [formData, setFormData] = useState({
    vendor_name: '',
    contact_email: '',
    contact_phone: '',
    contact_address: '',
    password: ''
  });

  useEffect(() => {
    if (user) {
      fetchVendors();
    }
  }, [user]);

  const fetchVendors = async () => {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('partner_admin_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVendors(data || []);
    } catch (error) {
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

  const createVendor = async (e: React.FormEvent) => {
    e.preventDefault();
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
          partner_id: user?.partnerId
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
          partner_admin_id: user?.id,
          user_id: authData.user.id
        });

      if (vendorError) throw vendorError;

      toast({
        title: "Success",
        description: "Vendor created successfully",
      });

      setFormData({
        vendor_name: '',
        contact_email: '',
        contact_phone: '',
        contact_address: '',
        password: ''
      });
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
    if (!editingVendor) return;

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
      setFormData({
        vendor_name: '',
        contact_email: '',
        contact_phone: '',
        contact_address: '',
        password: ''
      });
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
  };

  const VendorForm = ({ onSubmit, title }: { onSubmit: (e: React.FormEvent) => void; title: string }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="vendor_name">Vendor Name</Label>
        <Input
          id="vendor_name"
          value={formData.vendor_name}
          onChange={(e) => setFormData(prev => ({ ...prev, vendor_name: e.target.value }))}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact_email">Contact Email</Label>
        <Input
          id="contact_email"
          type="email"
          value={formData.contact_email}
          onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
          required
          disabled={!!editingVendor}
        />
      </div>
      {!editingVendor && (
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
            required
            placeholder="Enter vendor login password"
          />
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="contact_phone">Contact Phone</Label>
        <Input
          id="contact_phone"
          value={formData.contact_phone}
          onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact_address">Contact Address</Label>
        <Input
          id="contact_address"
          value={formData.contact_address}
          onChange={(e) => setFormData(prev => ({ ...prev, contact_address: e.target.value }))}
        />
      </div>
      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Saving...' : title}
      </Button>
    </form>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Vendor Management</h2>
          <p className="text-gray-600">Manage your vendors and their access</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Vendor
            </Button>
          </DialogTrigger>
          <DialogContent>
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
            <div className="text-center py-4">Loading vendors...</div>
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

      {editingVendor && (
        <Dialog open={!!editingVendor} onOpenChange={() => setEditingVendor(null)}>
          <DialogContent>
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
