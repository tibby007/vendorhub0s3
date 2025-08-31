
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscriptionManager } from '@/hooks/useSubscriptionManager';
import { useDemoMode } from '@/hooks/useDemoMode';
import { mockVendors } from '@/data/mockPartnerData';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit2, Trash2, User, Shield, AlertCircle, ArrowLeft } from 'lucide-react';
import { useRoleCheck } from '@/hooks/useRoleCheck';
import { useNavigate } from 'react-router-dom';
import VendorLimitIndicator from './VendorLimitIndicator';
import VendorCSVUpload from './VendorCSVUpload';

interface Vendor {
  id: string;
  vendor_name?: string;
  name?: string;
  contact_email?: string;
  email?: string;
  contact_phone?: string;
  phone?: string;
  contact_address?: string;
  address?: string;
  created_at: string;
  user_id?: string;
  status?: string;
  business_type?: string;
}

const VendorManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { subscription } = useSubscriptionManager();
  const { isDemo } = useDemoMode();
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
    const canManage = canManageVendors();
    console.log('🔄 VendorManagement effect triggered', { 
      user: !!user, 
      userId: user?.id, 
      role: user?.role,
      canManage,
      isDemo 
    });
    
    if ((user && canManage) || isDemo) {
      console.log('✅ Fetching vendors for user:', user?.id || 'demo');
      fetchVendors();
    } else {
      console.log('❌ Cannot manage vendors or no user');
    }
  }, [user?.id, currentRole, isDemo]); // Fixed dependencies

  const fetchVendors = async () => {
    setIsLoading(true);
    
    try {
      // Check for demo mode using multiple methods
      const isDemoMode = isDemo || 
                        sessionStorage.getItem('demoCredentials') !== null ||
                        user?.email === 'partner@demo.com' ||
                        user?.id === 'demo-partner-123';
      
      if (isDemoMode) {
        console.log('🎭 Demo mode: Using mock vendor data');
        // Convert mock data to match our interface
        const demoVendors = mockVendors.map(vendor => ({
          id: vendor.id,
          vendor_name: vendor.name,
          contact_email: vendor.email,
          contact_phone: vendor.phone,
          contact_address: vendor.address,
          created_at: vendor.created_at,
          status: vendor.status,
          business_type: vendor.business_type
        }));
        setVendors(demoVendors);
        setIsLoading(false);
        return;
      }

      if (!user?.id) {
        console.log('❌ No user ID available for fetching vendors');
        return;
      }
      
      console.log('🔄 Starting to fetch vendors for user:', user.id);
      
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('partner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Supabase error fetching vendors:', error);
        throw error;
      }
      
      console.log('✅ Successfully fetched vendors:', data?.length || 0);
      setVendors(data || []);
    } catch (error: any) {
      console.error('❌ Error fetching vendors:', error);
      toast({
        title: "Error",
        description: `Failed to fetch vendors: ${error.message}`,
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

    // Password validation removed - vendors will register themselves

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

    setIsLoading(true);

    try {
      const isDemoMode = sessionStorage.getItem('demoCredentials') !== null || isDemo;
      if (isDemoMode) {
        // Demo mode - simulate success
        toast({
          title: "Demo Mode",
          description: "Vendor creation simulated successfully! In live mode, they would receive login credentials.",
        });
        resetForm();
        setIsCreateDialogOpen(false);
        // Add to demo vendors list
        const newDemoVendor = {
          id: `demo-vendor-${Date.now()}`,
          vendor_name: formData.vendor_name,
          contact_email: formData.contact_email,
          contact_phone: formData.contact_phone,
          contact_address: formData.contact_address,
          created_at: new Date().toISOString(),
          status: 'active'
        };
        setVendors(prev => [newDemoVendor, ...prev]);
        setIsLoading(false);
        return;
      }

      if (!user?.id) return;

      // Check subscription status first
      if (!subscription.subscribed && subscription.status !== 'trial') {
        toast({
          title: "Subscription Required",
          description: "You need an active subscription to add vendors.",
          variant: "destructive",
          action: (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/subscription')}
            >
              Choose Plan
            </Button>
          )
        });
        setIsLoading(false);
        return;
      }

      // Check vendor limits based on plan
      const { count: currentVendorCount } = await supabase
        .from('vendors')
        .select('*', { count: 'exact' })
        .eq('partner_id', user.id);

      const vendorLimits = {
        basic: 3,
        pro: 7,
        premium: 999999
      };

      const currentLimit = vendorLimits[subscription.tier?.toLowerCase() as keyof typeof vendorLimits] || 3;

      if ((currentVendorCount || 0) >= currentLimit) {
        toast({
          title: "Vendor Limit Reached",
          description: `You can only have ${currentLimit} vendors on your ${subscription.tier?.toLowerCase() || 'basic'} plan.`,
          variant: "destructive",
          action: (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/subscription')}
            >
              Upgrade Plan
            </Button>
          )
        });
        setIsLoading(false);
        return;
      }

      // Create vendor record
      const { error: vendorError } = await supabase
        .from('vendors')
        .insert({
          vendor_name: formData.vendor_name,
          contact_email: formData.contact_email,
          contact_phone: formData.contact_phone,
          contact_address: formData.contact_address,
          partner_id: user.id,
          user_id: null // Will be set when vendor registers
        });

      if (vendorError) throw vendorError;

      toast({
        title: "Success",
        description: "Vendor created successfully. They can now register at the login page using their email.",
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
      const isDemoMode = sessionStorage.getItem('demoCredentials') !== null || isDemo;
      if (isDemoMode) {
        // Demo mode - simulate success
        toast({
          title: "Demo Mode",
          description: "Vendor update simulated successfully!",
        });
        
        // Update the vendor in the demo vendors list
        setVendors(prev => prev.map(v => 
          v.id === editingVendor.id 
            ? {
                ...v,
                vendor_name: formData.vendor_name,
                contact_email: formData.contact_email,
                contact_phone: formData.contact_phone,
                contact_address: formData.contact_address,
              }
            : v
        ));
        
        setEditingVendor(null);
        resetForm();
        setIsLoading(false);
        return;
      }

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
      const isDemoMode = sessionStorage.getItem('demoCredentials') !== null || isDemo;
      if (isDemoMode) {
        // Demo mode - simulate success
        toast({
          title: "Demo Mode",
          description: "Vendor deletion simulated successfully!",
        });
        
        // Remove the vendor from the demo vendors list
        setVendors(prev => prev.filter(v => v.id !== vendorId));
        setIsLoading(false);
        return;
      }

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
      vendor_name: vendor.vendor_name || vendor.name || '',
      contact_email: vendor.contact_email || vendor.email || '',
      contact_phone: vendor.contact_phone || vendor.phone || '',
      contact_address: vendor.contact_address || vendor.address || '',
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
    console.log(`🔧 Input change: ${field} = "${value}" (length: ${value.length})`);
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      console.log('📝 New form data:', newData);
      return newData;
    });
    // Clear error when user starts typing - use setTimeout to avoid state update conflicts
    if (errors[field]) {
      setTimeout(() => {
        setErrors(prev => ({ ...prev, [field]: '' }));
      }, 0);
    }
  };

  const VendorForm = ({ onSubmit, title }: { onSubmit: (e: React.FormEvent) => void; title: string }) => {
    return (
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
          autoComplete="off"
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
          autoComplete="off"
        />
        {errors.contact_email && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.contact_email}
          </p>
        )}
      </div>
      
      {!editingVendor && (
        <div className="space-y-2 p-3 bg-blue-50 rounded-md border border-blue-200">
          <div className="text-sm text-blue-800">
            <strong>Note:</strong> The vendor will receive an email invitation to register their own account using this email address.
          </div>
        </div>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="contact_phone">Contact Phone</Label>
        <Input
          id="contact_phone"
          value={formData.contact_phone}
          onChange={(e) => handleInputChange('contact_phone', e.target.value)}
          placeholder="(555) 123-4567"
          autoComplete="off"
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
  };

  if (!canManageVendors()) {
    console.log('❌ Access denied for vendor management. Current role:', currentRole);
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
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Vendor Management</h2>
            <p className="text-gray-600">Manage your vendors and their access</p>
          </div>
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

      {/* Vendor Limit Indicator */}
      <VendorLimitIndicator vendorCount={vendors.length} />

      {/* CSV Upload for Pro/Premium users */}
      <VendorCSVUpload onUploadComplete={fetchVendors} />

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
                    <TableCell className="font-medium">
                      {vendor.vendor_name || vendor.name || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {vendor.contact_email || vendor.email || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {vendor.contact_phone || vendor.phone || 'N/A'}
                    </TableCell>
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
