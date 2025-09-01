
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Eye, Edit, FileText, Download, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useDemoMode } from '@/hooks/useDemoMode';
import { mockPartnerSubmissions } from '@/data/mockPartnerData';

interface Submission {
  id: string;
  customer_id?: string;
  vendor_id?: string;
  status: string;
  submission_date?: string;
  submitted_at?: string;
  approval_terms?: string;
  sales_invoice_url?: string;
  drivers_license_url?: string;
  misc_documents_url?: string[];
  // Database fields
  customers?: {
    customer_name: string;
    email?: string;
  };
  vendors?: {
    vendor_name: string;
  };
  // Mock data fields
  customer_name?: string;
  customer_email?: string;
  vendor_name?: string;
  amount?: number;
  description?: string;
}

const SubmissionsManager = () => {
  const { user } = useAuth();
  const { isDemo } = useDemoMode();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchSubmissions = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    
    // Check for demo mode using multiple methods
    const isDemoMode = isDemo || 
                      sessionStorage.getItem('demoCredentials') !== null ||
                      user.email === 'partner@demo.com' ||
                      user.id === 'demo-partner-123';
    
    // Use mock data in demo mode
    if (isDemoMode) {
      console.log('🎭 SubmissionsManager: Using mock data in demo mode');
      setSubmissions(mockPartnerSubmissions as any);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error }: { data: any[] | null, error: any } = await supabase
        .from('submissions')
        .select('*')
        .eq('partner_id', user.id)
        .order('submission_date', { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error: any) {
      console.error('Error fetching submissions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch submissions",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchSubmissions();
    }
  }, [user?.id, isDemo]);

  const updateSubmissionStatus = async (submissionId: string, status: string, approvalTerms?: string) => {
    // Check for demo mode using multiple methods
    const isDemoMode = isDemo || 
                      sessionStorage.getItem('demoCredentials') !== null ||
                      user?.email === 'partner@demo.com' ||
                      user?.id === 'demo-partner-123';

    // Handle demo mode
    if (isDemoMode) {
      console.log('🎭 SubmissionsManager: Updating status in demo mode');
      setSubmissions(prev => 
        prev.map(sub => 
          sub.id === submissionId 
            ? { ...sub, status: status.toLowerCase() }
            : sub
        )
      );
      toast({
        title: "Demo: Status Updated",
        description: `Submission ${status.toLowerCase()} successfully (demo mode)`,
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('submissions')
        .update({
          status,
          approval_terms: approvalTerms || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', submissionId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Submission ${status.toLowerCase()} successfully`,
      });

      fetchSubmissions();
      setSelectedSubmission(null);
    } catch (error: any) {
      console.error('Error updating submission:', error);
      toast({
        title: "Error",
        description: "Failed to update submission status",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-700"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      case 'pending':
      default:
        return <Badge className="bg-yellow-100 text-yellow-700"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    }
  };

  const filteredSubmissions = submissions.filter(submission => 
    statusFilter === 'all' || submission.status.toLowerCase() === statusFilter
  );

  const StatusUpdateDialog = ({ submission }: { submission: Submission }) => {
    const [newStatus, setNewStatus] = useState(submission.status);
    const [approvalTerms, setApprovalTerms] = useState(submission.approval_terms || '');

    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline">
            <Edit className="w-3 h-3 mr-1" />
            Update
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Submission Status</DialogTitle>
            <DialogDescription>
              Update the status for {submission.customer_name || submission.customers?.customer_name}'s submission
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newStatus === 'Approved' && (
              <div>
                <Label htmlFor="approval-terms">Approval Terms (Optional)</Label>
                <Input
                  id="approval-terms"
                  value={approvalTerms}
                  onChange={(e) => setApprovalTerms(e.target.value)}
                  placeholder="Enter approval terms or conditions"
                />
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => updateSubmissionStatus(submission.id, newStatus, approvalTerms)}
              >
                Update Status
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => navigate('/')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Submissions Management</h2>
          <p className="text-gray-600">Review and manage customer applications from your vendors</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Label htmlFor="status-filter">Filter by Status:</Label>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Submissions</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Submissions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Submissions</CardTitle>
          <CardDescription>
            {filteredSubmissions.length} submission{filteredSubmissions.length !== 1 ? 's' : ''} 
            {statusFilter !== 'all' && ` with status: ${statusFilter}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-vendor-green-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading submissions...</p>
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {statusFilter === 'all' 
                  ? 'No submissions yet. Submissions will appear here when vendors submit customer applications.'
                  : `No ${statusFilter} submissions found.`
                }
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Vendor</TableHead>
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
                         <div className="font-medium">{submission.customer_name || submission.customers?.customer_name}</div>
                         <div className="text-sm text-gray-600">{submission.customer_email || submission.customers?.email}</div>
                       </div>
                     </TableCell>
                     <TableCell>{submission.vendor_name || submission.vendors?.vendor_name}</TableCell>
                     <TableCell>{getStatusBadge(submission.status)}</TableCell>
                     <TableCell>{new Date(submission.submitted_at || submission.submission_date || '').toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              <Eye className="w-3 h-3 mr-1" />
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Submission Details</DialogTitle>
                              <DialogDescription>
                               Customer: {submission.customer_name || submission.customers?.customer_name} | 
                               Vendor: {submission.vendor_name || submission.vendors?.vendor_name}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label>Status</Label>
                                  <div className="mt-1">{getStatusBadge(submission.status)}</div>
                                </div>
                                 <div>
                                   <Label>Submission Date</Label>
                                   <div className="mt-1">{new Date(submission.submitted_at || submission.submission_date || '').toLocaleDateString()}</div>
                                 </div>
                              </div>
                              
                              {submission.approval_terms && (
                                <div>
                                  <Label>Approval Terms</Label>
                                  <div className="mt-1 p-2 bg-gray-50 rounded">{submission.approval_terms}</div>
                                </div>
                              )}

                              <div className="space-y-2">
                                <Label>Documents</Label>
                                <div className="space-y-1">
                                  {submission.sales_invoice_url && (
                                    <Button variant="outline" size="sm" className="w-full justify-start">
                                      <Download className="w-3 h-3 mr-2" />
                                      Sales Invoice
                                    </Button>
                                  )}
                                  {submission.drivers_license_url && (
                                    <Button variant="outline" size="sm" className="w-full justify-start">
                                      <Download className="w-3 h-3 mr-2" />
                                      Driver's License
                                    </Button>
                                  )}
                                  {submission.misc_documents_url && submission.misc_documents_url.length > 0 && (
                                    submission.misc_documents_url.map((doc, index) => (
                                      <Button key={index} variant="outline" size="sm" className="w-full justify-start">
                                        <Download className="w-3 h-3 mr-2" />
                                        Additional Document {index + 1}
                                      </Button>
                                    ))
                                  )}
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <StatusUpdateDialog submission={submission} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SubmissionsManager;
