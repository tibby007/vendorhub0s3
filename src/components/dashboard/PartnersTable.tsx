
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Eye, Edit, Trash2 } from 'lucide-react';

interface PartnerAdmin {
  id: number;
  name: string;
  email: string;
  company: string;
  status: string;
  vendors: number;
  subscription: string;
}

interface PartnersTableProps {
  partnerAdmins: PartnerAdmin[];
}

const PartnersTable = ({ partnerAdmins }: PartnersTableProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Partner Admin Accounts
        </CardTitle>
        <CardDescription>
          Manage partner administrator accounts and their vendor networks
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Name</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Company</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Email</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Subscription</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Vendors</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {partnerAdmins.map((admin) => (
                <tr key={admin.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{admin.name}</td>
                  <td className="py-3 px-4">{admin.company}</td>
                  <td className="py-3 px-4 text-gray-600">{admin.email}</td>
                  <td className="py-3 px-4">
                    <Badge 
                      variant={admin.subscription === 'Premium' ? 'default' : 
                             admin.subscription === 'Pro' ? 'secondary' : 'outline'}
                    >
                      {admin.subscription}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={admin.status === 'Active' ? 'default' : 'secondary'}>
                      {admin.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">{admin.vendors}</td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default PartnersTable;
