
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Eye, Download, CheckCircle, XCircle, Clock, Filter, Search } from 'lucide-react';

interface Submission {
  id: string;
  status: string;
  submission_date: string;
  customer_id: string;
  vendor_id: string;
  sales_invoice_url: string | null;
  drivers_license_url: string | null;
  misc_documents_url: string[] | null;
  approval_terms: string | null;
  customer: {
    customer_name: string;
    email: string;
    phone: string;
    biz_name: string | null;
  };
  vendor: {
    vendor_name: string;
  };
}

const SubmissionsManager = () => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [approvalTerms, setApprovalTerms] = useState('');

  useEffect(() => {
    if (user) {
      fetchSubmissions();
      setupRealtimeSubscription();
    }
  }, [user]);

  useEffect(() => {
    filterSubmissions();
  }, [submissions, statusFilter, searchTerm]);

  const fetchSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select(`
          *,
          customer:customers(*),
          vendor:vendors(vendor_name)
        `)
        .eq('partner_admin_id', user?.id)
        .order('submission_date', { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error: any) {
      console.error('Error fetching submissions:', error);
      toast({
        title: "Error",
        description: "Failed to load submissions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('submissions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'submissions',
          filter: `partner_admin_id=eq.${user?.id}`
        },
        () => {
          fetchSubmissions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const filterSubmissions = () => {
    let filtered = submissions;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(sub => sub.status.toLowerCase() === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(sub => 
        sub.customer.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.vendor.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sub.customer.biz_name && sub.customer.biz_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredSubmissions(filtered);
  };

  const updateSubmissionStatus = async (submissionId: string, newStatus: string, terms?: string) => {
    try {
      const updateData: any = { status: newStatus };
      if (terms) {
        updateData.approval_terms = terms;
      }

      const { error } = await supabase
        .from('submissions')
        .update(updateData)
        .eq('id', submissionId);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Submission ${newStatus.toLowerCase()} successfully`,
      });

      setApprovalTerms('');
      setSelectedSubmission(null);
      fetchSubmissions();
    } catch (error: any) {
      console.error('Error updating submission:', error);
      toast({
        title: "Error",
        description: "Failed to update submission status",
        variant: "destructive",
      });
    }
  };

  const downloadDocument = async (url: string, filename: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('submissions')
        .download(url);

      if (error) throw error;

      const blob = new Blob([data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error: any) {
      console.error('Error downloading document:', error);
      toast({
        title: "Error",
        description: "Failed to download document",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      'Pending': 'secondary',
      'Approved': 'default',
      'Rejected': 'destructive',
      'Manual Review': 'secondary'
    };

    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status}
      </Badge>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'Rejected':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Deal Submissions</h2>
        <p className="text-gray-600">Review and manage vendor customer applications</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status-filter">Status Filter</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="manual review">Manual Review</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by customer or vendor name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setStatusFilter('all');
                  setSearchTerm('');
                }}
                className="w-full"
              >
                <Filter className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submissions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Submissions ({filteredSubmissions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Business</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubmissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{submission.customer.customer_name}</div>
                      <div className="text-sm text-gray-600">{submission.customer.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>{submission.vendor.vendor_name}</TableCell>
                  <TableCell>{submission.customer.biz_name || 'Individual'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(submission.status)}
                      {getStatusBadge(submission.status)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(submission.submission_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedSubmission(submission)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Review
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Review Submission</DialogTitle>
                          <DialogDescription>
                            Customer: {submission.customer.customer_name} | Vendor: {submission.vendor.vendor_name}
                          </DialogDescription>
                        </DialogHeader>
                        
                        {selectedSubmission && (
                          <Tabs defaultValue="details" className="w-full">
                            <TabsList>
                              <TabsTrigger value="details">Customer Details</TabsTrigger>
                              <TabsTrigger value="documents">Documents</TabsTrigger>
                              <TabsTrigger value="actions">Actions</TabsTrigger>
                            </TabsList>
                            
                            <TabsContent value="details" className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label>Customer Name</Label>
                                  <p className="text-sm">{selectedSubmission.customer.customer_name}</p>
                                </div>
                                <div>
                                  <Label>Email</Label>
                                  <p className="text-sm">{selectedSubmission.customer.email}</p>
                                </div>
                                <div>
                                  <Label>Phone</Label>
                                  <p className="text-sm">{selectedSubmission.customer.phone}</p>
                                </div>
                                <div>
                                  <Label>Business Name</Label>
                                  <p className="text-sm">{selectedSubmission.customer.biz_name || 'N/A'}</p>
                                </div>
                              </div>
                            </TabsContent>
                            
                            <TabsContent value="documents" className="space-y-4">
                              <div className="space-y-3">
                                {selectedSubmission.sales_invoice_url && (
                                  <div className="flex items-center justify-between p-3 border rounded">
                                    <span>Sales Invoice</span>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => downloadDocument(selectedSubmission.sales_invoice_url!, 'sales_invoice.pdf')}
                                    >
                                      <Download className="w-4 h-4 mr-1" />
                                      Download
                                    </Button>
                                  </div>
                                )}
                                {selectedSubmission.drivers_license_url && (
                                  <div className="flex items-center justify-between p-3 border rounded">
                                    <span>Driver's License</span>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => downloadDocument(selectedSubmission.drivers_license_url!, 'drivers_license.pdf')}
                                    >
                                      <Download className="w-4 h-4 mr-1" />
                                      Download
                                    </Button>
                                  </div>
                                )}
                                {selectedSubmission.misc_documents_url?.map((url, index) => (
                                  <div key={index} className="flex items-center justify-between p-3 border rounded">
                                    <span>Document {index + 1}</span>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => downloadDocument(url, `document_${index + 1}.pdf`)}
                                    >
                                      <Download className="w-4 h-4 mr-1" />
                                      Download
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </TabsContent>
                            
                            <TabsContent value="actions" className="space-y-4">
                              <div className="space-y-4">
                                <div>
                                  <Label>Current Status</Label>
                                  <div className="mt-1">
                                    {getStatusBadge(selectedSubmission.status)}
                                  </div>
                                </div>
                                
                                {selectedSubmission.status === 'Pending' && (
                                  <>
                                    <div className="space-y-2">
                                      <Label htmlFor="approval-terms">Approval Terms (Optional)</Label>
                                      <Textarea
                                        id="approval-terms"
                                        value={approvalTerms}
                                        onChange={(e) => setApprovalTerms(e.target.value)}
                                        placeholder="Enter any specific terms or conditions for approval..."
                                      />
                                    </div>
                                    
                                    <div className="flex gap-2">
                                      <Button
                                        onClick={() => updateSubmissionStatus(selectedSubmission.id, 'Approved', approvalTerms)}
                                        className="bg-green-600 hover:bg-green-700"
                                      >
                                        <CheckCircle className="w-4 h-4 mr-1" />
                                        Approve
                                      </Button>
                                      <Button
                                        variant="destructive"
                                        onClick={() => updateSubmissionStatus(selectedSubmission.id, 'Rejected')}
                                      >
                                        <XCircle className="w-4 h-4 mr-1" />
                                        Reject
                                      </Button>
                                      <Button
                                        variant="outline"
                                        onClick={() => updateSubmissionStatus(selectedSubmission.id, 'Manual Review')}
                                      >
                                        <Clock className="w-4 h-4 mr-1" />
                                        Manual Review
                                      </Button>
                                    </div>
                                  </>
                                )}
                                
                                {selectedSubmission.approval_terms && (
                                  <div>
                                    <Label>Approval Terms</Label>
                                    <p className="text-sm mt-1 p-3 bg-gray-50 rounded">{selectedSubmission.approval_terms}</p>
                                  </div>
                                )}
                              </div>
                            </TabsContent>
                          </Tabs>
                        )}
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredSubmissions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No submissions found matching your criteria.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SubmissionsManager;
