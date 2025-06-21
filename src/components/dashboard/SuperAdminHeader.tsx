
import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { UserPlus, Building, Shield } from 'lucide-react';
import AddPartnerAdminForm from '@/components/admin/AddPartnerAdminForm';
import AddResellerForm from '@/components/admin/AddResellerForm';

interface SuperAdminHeaderProps {
  isAddPartnerDialogOpen: boolean;
  setIsAddPartnerDialogOpen: (open: boolean) => void;
  isAddResellerDialogOpen: boolean;
  setIsAddResellerDialogOpen: (open: boolean) => void;
}

const SuperAdminHeader = ({
  isAddPartnerDialogOpen,
  setIsAddPartnerDialogOpen,
  isAddResellerDialogOpen,
  setIsAddResellerDialogOpen
}: SuperAdminHeaderProps) => {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-7 h-7 text-vendor-green-500" />
            Super Admin Dashboard
          </h1>
          <p className="text-gray-600 mt-1">Manage the entire VendorHub platform</p>
        </div>
        <div className="flex gap-3">
          <Dialog open={isAddPartnerDialogOpen} onOpenChange={setIsAddPartnerDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-vendor-green-500 hover:bg-vendor-green-600">
                <UserPlus className="w-4 h-4 mr-2" />
                Add Partner Admin
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Partner Admin</DialogTitle>
                <DialogDescription>
                  Create a new partner administrator account
                </DialogDescription>
              </DialogHeader>
              <AddPartnerAdminForm onSuccess={() => setIsAddPartnerDialogOpen(false)} />
            </DialogContent>
          </Dialog>
          
          <Dialog open={isAddResellerDialogOpen} onOpenChange={setIsAddResellerDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-vendor-gold-300 text-vendor-gold-700 hover:bg-vendor-gold-50">
                <Building className="w-4 h-4 mr-2" />
                Add Reseller
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Reseller</DialogTitle>
                <DialogDescription>
                  Add a new reseller to the platform
                </DialogDescription>
              </DialogHeader>
              <AddResellerForm onSuccess={() => setIsAddResellerDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminHeader;
