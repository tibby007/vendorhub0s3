import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Users, Mail, Phone, Building, Calendar, Star, Eye, Edit, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface DemoLead {
  id: string;
  name: string;
  email: string;
  company: string;
  phone?: string;
  role: string;
  employees?: string;
  use_case?: string;
  session_id?: string;
  demo_credentials: any;
  created_at: string;
  demo_started_at?: string;
  demo_completed_at?: string;
  last_activity_at?: string;
  engagement_score: number;
  follow_up_status: string;
  notes?: string;
}

const DemoLeadsManagement = () => {
  const [leads, setLeads] = useState<DemoLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedLead, setSelectedLead] = useState<DemoLead | null>(null);
  const [notes, setNotes] = useState('');
  const [followUpStatus, setFollowUpStatus] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('demo_leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error('Error fetching demo leads:', error);
      toast({
        title: "Error",
        description: "Failed to fetch demo leads",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateLead = async (leadId: string, updates: Partial<DemoLead>) => {
    try {
      const { error } = await supabase
        .from('demo_leads')
        .update(updates)
        .eq('id', leadId);

      if (error) throw error;
      
      await fetchLeads();
      toast({
        title: "Success",
        description: "Lead updated successfully",
      });
    } catch (error) {
      console.error('Error updating lead:', error);
      toast({
        title: "Error",
        description: "Failed to update lead",
        variant: "destructive",
      });
    }
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.company.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || lead.follow_up_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'contacted': return 'bg-blue-100 text-blue-800';
      case 'qualified': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEngagementLevel = (score: number) => {
    if (score >= 80) return { label: 'High', color: 'text-green-600' };
    if (score >= 50) return { label: 'Medium', color: 'text-yellow-600' };
    return { label: 'Low', color: 'text-red-600' };
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Demo Leads Management</h2>
        <p className="text-gray-600">Track and manage demo registrations and follow-ups</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Leads</p>
                <p className="text-2xl font-bold">{leads.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Follow-up</p>
                <p className="text-2xl font-bold">{leads.filter(l => l.follow_up_status === 'pending').length}</p>
              </div>
              <Calendar className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">High Engagement</p>
                <p className="text-2xl font-bold">{leads.filter(l => l.engagement_score >= 80).length}</p>
              </div>
              <Star className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Qualified Leads</p>
                <p className="text-2xl font-bold">{leads.filter(l => l.follow_up_status === 'qualified').length}</p>
              </div>
              <Building className="w-8 h-8 text-vendor-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search leads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="qualified">Qualified</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle>Demo Leads ({filteredLeads.length})</CardTitle>
          <CardDescription>
            All demo registrations with contact information and engagement tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredLeads.map((lead) => {
              const engagement = getEngagementLevel(lead.engagement_score);
              
              return (
                <div key={lead.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{lead.name}</h3>
                        <Badge className={getStatusColor(lead.follow_up_status)}>
                          {lead.follow_up_status}
                        </Badge>
                        <Badge variant="outline" className={engagement.color}>
                          {engagement.label} Engagement
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          {lead.email}
                        </div>
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4" />
                          {lead.company}
                        </div>
                        {lead.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            {lead.phone}
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Role Interest:</span> {lead.role}
                        </div>
                        <div>
                          <span className="font-medium">Registered:</span> {format(new Date(lead.created_at), 'MMM dd, yyyy HH:mm')}
                        </div>
                        {lead.employees && (
                          <div>
                            <span className="font-medium">Company Size:</span> {lead.employees}
                          </div>
                        )}
                        {lead.demo_started_at && (
                          <div>
                            <span className="font-medium">Demo Started:</span> {format(new Date(lead.demo_started_at), 'MMM dd, yyyy HH:mm')}
                          </div>
                        )}
                      </div>

                      {lead.use_case && (
                        <div className="mt-2 text-sm">
                          <span className="font-medium">Use Case:</span>
                          <p className="text-gray-600 italic">{lead.use_case}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedLead(lead);
                              setNotes(lead.notes || '');
                              setFollowUpStatus(lead.follow_up_status);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                          <DialogHeader>
                            <DialogTitle>Update Lead: {selectedLead?.name}</DialogTitle>
                            <DialogDescription>
                              Update follow-up status and add notes for this lead.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="status">Follow-up Status</Label>
                              <Select value={followUpStatus} onValueChange={setFollowUpStatus}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="contacted">Contacted</SelectItem>
                                  <SelectItem value="qualified">Qualified</SelectItem>
                                  <SelectItem value="closed">Closed</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="notes">Notes</Label>
                              <Textarea
                                id="notes"
                                placeholder="Add follow-up notes..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={4}
                              />
                            </div>
                            <div className="flex justify-end gap-2">
                              <DialogTrigger asChild>
                                <Button variant="outline">Cancel</Button>
                              </DialogTrigger>
                              <Button 
                                onClick={() => {
                                  if (selectedLead) {
                                    updateLead(selectedLead.id, {
                                      follow_up_status: followUpStatus,
                                      notes: notes
                                    });
                                  }
                                }}
                              >
                                Update Lead
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px]">
                          <DialogHeader>
                            <DialogTitle>Lead Details: {lead.name}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Contact Information</Label>
                                <div className="text-sm space-y-1 mt-1">
                                  <p><strong>Email:</strong> {lead.email}</p>
                                  <p><strong>Phone:</strong> {lead.phone || 'Not provided'}</p>
                                  <p><strong>Company:</strong> {lead.company}</p>
                                </div>
                              </div>
                              <div>
                                <Label>Demo Details</Label>
                                <div className="text-sm space-y-1 mt-1">
                                  <p><strong>Role:</strong> {lead.role}</p>
                                  <p><strong>Session ID:</strong> {lead.session_id}</p>
                                  <p><strong>Engagement Score:</strong> {lead.engagement_score}/100</p>
                                </div>
                              </div>
                            </div>
                            
                            {lead.demo_credentials && (
                              <div>
                                <Label>Demo Credentials</Label>
                                <div className="bg-gray-50 p-3 rounded mt-1 text-sm font-mono">
                                  <p><strong>Email:</strong> {lead.demo_credentials.email}</p>
                                  <p><strong>Password:</strong> {lead.demo_credentials.password}</p>
                                </div>
                              </div>
                            )}
                            
                            {lead.notes && (
                              <div>
                                <Label>Notes</Label>
                                <p className="text-sm text-gray-600 mt-1">{lead.notes}</p>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {filteredLeads.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No demo leads found matching your criteria.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DemoLeadsManagement;
