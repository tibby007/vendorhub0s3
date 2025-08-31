interface MockUser {
  id: string;
  email: string;
  name: string;
  role: 'Partner Admin' | 'Vendor' | 'Super Admin';
  avatar_url?: string;
  created_at: string;
  user_metadata?: Record<string, unknown>;
  partnerId?: string;
}

interface MockVendor {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  business_type: string;
  status: 'active' | 'pending' | 'inactive';
  created_at: string;
  contact_name?: string;
  website?: string;
  tax_id?: string;
  description?: string;
}

interface MockCustomer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  company?: string;
  status: 'active' | 'pending' | 'inactive';
  created_at: string;
  total_orders: number;
  lifetime_value: number;
}

interface MockSubmission {
  id: string;
  vendor_id: string;
  vendor_name: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'under_review';
  submitted_at: string;
  reviewed_at?: string;
  description: string;
  documents: string[];
  notes?: string;
  category: string;
}

interface MockTransaction {
  id: string;
  submission_id: string;
  amount: number;
  fee: number;
  net_amount: number;
  status: 'completed' | 'pending' | 'failed';
  processed_at: string;
  type: 'payment' | 'refund';
}

interface MockDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploaded_at: string;
  uploaded_by: string;
  folder: string;
}

interface MockAnalytics {
  totalRevenue: number;
  revenueGrowth: number;
  totalVendors: number;
  activeVendors: number;
  totalSubmissions: number;
  pendingSubmissions: number;
  monthlyData: Array<{
    month: string;
    revenue: number;
    vendors: number;
    submissions: number;
  }>;
  topVendors: Array<{
    name: string;
    revenue: number;
    submissions: number;
  }>;
}

interface MockDashboardStats {
  totalVendors: number;
  activeVendors: number;
  pendingApplications: number;
  totalSubmissions: number;
  pendingSubmissions: number;
  approvedSubmissions: number;
  totalRevenue: number;
  monthlyRevenue: number;
  recentActivity: Array<{
    type: string;
    message: string;
    time: string;
  }>;
}

class MockDataService {
  private static instance: MockDataService;
  private baseDelay = 200;
  private maxDelay = 800;

  private constructor() {}

  static getInstance(): MockDataService {
    if (!MockDataService.instance) {
      MockDataService.instance = new MockDataService();
    }
    return MockDataService.instance;
  }

  private async simulateNetworkDelay(): Promise<void> {
    const delay = this.baseDelay + Math.random() * (this.maxDelay - this.baseDelay);
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  // Mock Users
  private mockUsers: MockUser[] = [
    {
      id: 'demo-partner-1',
      email: 'demo-partner@vendorhub.com',
      name: 'Sarah Johnson',
      role: 'Partner Admin',
      created_at: '2024-01-15T10:00:00Z',
      user_metadata: { has_completed_setup: true, partnerId: 'partner-001' },
      partnerId: 'partner-001'
    },
    {
      id: 'demo-vendor-1',
      email: 'demo-vendor@vendorhub.com',
      name: 'Mike Chen',
      role: 'Vendor',
      created_at: '2024-01-20T14:30:00Z',
      user_metadata: { has_completed_setup: true, vendorId: 'vendor-001' }
    }
  ];

  // Mock Vendors
  private mockVendors: MockVendor[] = [
    {
      id: 'vendor-001',
      name: 'TechFlow Solutions',
      email: 'contact@techflow-demo.com',
      phone: '+1 (555) 123-4567',
      address: '123 Tech Street, San Francisco, CA 94105',
      business_type: 'Software Development',
      status: 'active',
      created_at: '2024-01-15T10:00:00Z',
      contact_name: 'John Smith',
      website: 'https://techflow-demo.com',
      tax_id: '12-3456789',
      description: 'Full-stack software development and cloud solutions'
    },
    {
      id: 'vendor-002',
      name: 'Digital Marketing Pro',
      email: 'hello@digitalmarketing-demo.com',
      phone: '+1 (555) 234-5678',
      address: '456 Marketing Ave, New York, NY 10001',
      business_type: 'Marketing Services',
      status: 'active',
      created_at: '2024-01-18T09:15:00Z',
      contact_name: 'Emma Wilson',
      website: 'https://digitalmarketing-demo.com',
      tax_id: '98-7654321',
      description: 'Digital marketing campaigns, SEO, and social media management'
    },
    {
      id: 'vendor-003',
      name: 'Cloud Infrastructure LLC',
      email: 'sales@cloudinfra-demo.com',
      phone: '+1 (555) 345-6789',
      address: '789 Cloud Blvd, Austin, TX 78701',
      business_type: 'Cloud Services',
      status: 'pending',
      created_at: '2024-01-22T16:45:00Z',
      contact_name: 'David Rodriguez',
      website: 'https://cloudinfra-demo.com',
      tax_id: '55-1234567',
      description: 'Enterprise cloud infrastructure and DevOps solutions'
    },
    {
      id: 'vendor-004',
      name: 'Design Studio Plus',
      email: 'creative@designstudio-demo.com',
      phone: '+1 (555) 456-7890',
      address: '321 Creative Lane, Portland, OR 97201',
      business_type: 'Design & Creative',
      status: 'active',
      created_at: '2024-02-01T11:20:00Z',
      contact_name: 'Lisa Park',
      website: 'https://designstudio-demo.com',
      tax_id: '77-9876543',
      description: 'UI/UX design, branding, and graphic design services'
    },
    {
      id: 'vendor-005',
      name: 'Security Solutions Inc',
      email: 'info@security-demo.com',
      phone: '+1 (555) 567-8901',
      address: '654 Security Blvd, Washington, DC 20001',
      business_type: 'Cybersecurity',
      status: 'inactive',
      created_at: '2024-02-05T08:30:00Z',
      contact_name: 'Alex Thompson',
      website: 'https://security-demo.com',
      tax_id: '33-5555555',
      description: 'Cybersecurity consulting and penetration testing'
    }
  ];

  // Mock Customers
  private mockCustomers: MockCustomer[] = [
    {
      id: 'customer-001',
      name: 'Acme Corporation',
      email: 'procurement@acme-demo.com',
      phone: '+1 (555) 111-2222',
      address: '100 Business Plaza, Chicago, IL 60601',
      company: 'Acme Corporation',
      status: 'active',
      created_at: '2024-01-10T09:00:00Z',
      total_orders: 12,
      lifetime_value: 285000
    },
    {
      id: 'customer-002',
      name: 'StartupXYZ',
      email: 'ceo@startupxyz-demo.com',
      phone: '+1 (555) 333-4444',
      address: '200 Innovation Drive, Boulder, CO 80301',
      company: 'StartupXYZ Inc.',
      status: 'active',
      created_at: '2024-01-12T14:15:00Z',
      total_orders: 8,
      lifetime_value: 156000
    },
    {
      id: 'customer-003',
      name: 'Enterprise Corp',
      email: 'purchasing@enterprise-demo.com',
      phone: '+1 (555) 555-6666',
      address: '300 Corporate Center, Atlanta, GA 30309',
      company: 'Enterprise Corp',
      status: 'active',
      created_at: '2024-01-15T16:30:00Z',
      total_orders: 18,
      lifetime_value: 445000
    },
    {
      id: 'customer-004',
      name: 'TechStart Solutions',
      email: 'ops@techstart-demo.com',
      phone: '+1 (555) 777-8888',
      address: '400 Tech Park, Seattle, WA 98101',
      company: 'TechStart Solutions',
      status: 'pending',
      created_at: '2024-02-01T10:45:00Z',
      total_orders: 3,
      lifetime_value: 67000
    }
  ];

  // Mock Submissions
  private mockSubmissions: MockSubmission[] = [
    {
      id: 'sub-001',
      vendor_id: 'vendor-001',
      vendor_name: 'TechFlow Solutions',
      customer_id: 'customer-001',
      customer_name: 'Acme Corporation',
      customer_email: 'procurement@acme-demo.com',
      amount: 45000,
      status: 'approved',
      submitted_at: '2024-02-15T10:00:00Z',
      reviewed_at: '2024-02-16T14:30:00Z',
      description: 'Custom ERP system development with cloud integration',
      documents: ['contract.pdf', 'technical_specs.pdf', 'timeline.pdf'],
      notes: 'High-priority project for Q2 delivery',
      category: 'Software Development'
    },
    {
      id: 'sub-002',
      vendor_id: 'vendor-002',
      vendor_name: 'Digital Marketing Pro',
      customer_id: 'customer-002',
      customer_name: 'StartupXYZ',
      customer_email: 'ceo@startupxyz-demo.com',
      amount: 18500,
      status: 'under_review',
      submitted_at: '2024-02-14T15:30:00Z',
      description: 'Complete digital marketing campaign for product launch',
      documents: ['campaign_proposal.pdf', 'budget_breakdown.xlsx'],
      category: 'Marketing'
    },
    {
      id: 'sub-003',
      vendor_id: 'vendor-001',
      vendor_name: 'TechFlow Solutions',
      customer_id: 'customer-003',
      customer_name: 'Enterprise Corp',
      customer_email: 'purchasing@enterprise-demo.com',
      amount: 75000,
      status: 'pending',
      submitted_at: '2024-02-16T11:15:00Z',
      description: 'Enterprise cloud migration and modernization services',
      documents: ['migration_plan.pdf', 'cost_estimate.xlsx', 'sow.pdf'],
      category: 'Cloud Services'
    },
    {
      id: 'sub-004',
      vendor_id: 'vendor-004',
      vendor_name: 'Design Studio Plus',
      customer_id: 'customer-004',
      customer_name: 'TechStart Solutions',
      customer_email: 'ops@techstart-demo.com',
      amount: 12000,
      status: 'approved',
      submitted_at: '2024-02-10T09:20:00Z',
      reviewed_at: '2024-02-12T16:00:00Z',
      description: 'Brand redesign and new website development',
      documents: ['design_mockups.pdf', 'brand_guidelines.pdf'],
      notes: 'Fast turnaround required',
      category: 'Design'
    },
    {
      id: 'sub-005',
      vendor_id: 'vendor-003',
      vendor_name: 'Cloud Infrastructure LLC',
      customer_id: 'customer-001',
      customer_name: 'Acme Corporation',
      customer_email: 'procurement@acme-demo.com',
      amount: 32000,
      status: 'rejected',
      submitted_at: '2024-02-08T13:45:00Z',
      reviewed_at: '2024-02-10T10:15:00Z',
      description: 'Infrastructure monitoring and alerting setup',
      documents: ['infrastructure_audit.pdf'],
      notes: 'Budget constraints for this quarter',
      category: 'Infrastructure'
    }
  ];

  // Mock Transactions
  private mockTransactions: MockTransaction[] = [
    {
      id: 'txn-001',
      submission_id: 'sub-001',
      amount: 45000,
      fee: 1350, // 3%
      net_amount: 43650,
      status: 'completed',
      processed_at: '2024-02-17T10:00:00Z',
      type: 'payment'
    },
    {
      id: 'txn-002',
      submission_id: 'sub-004',
      amount: 12000,
      fee: 360, // 3%
      net_amount: 11640,
      status: 'completed',
      processed_at: '2024-02-13T11:30:00Z',
      type: 'payment'
    },
    {
      id: 'txn-003',
      submission_id: 'sub-003',
      amount: 75000,
      fee: 2250, // 3%
      net_amount: 72750,
      status: 'pending',
      processed_at: '2024-02-16T12:00:00Z',
      type: 'payment'
    }
  ];

  // Mock Documents
  private mockDocuments: MockDocument[] = [
    {
      id: 'doc-001',
      name: 'Partner Agreement Template.pdf',
      type: 'application/pdf',
      size: 245760,
      url: '#demo-document-1',
      uploaded_at: '2024-01-15T10:00:00Z',
      uploaded_by: 'Sarah Johnson',
      folder: 'Legal Documents'
    },
    {
      id: 'doc-002',
      name: 'Vendor Onboarding Checklist.xlsx',
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      size: 123456,
      url: '#demo-document-2',
      uploaded_at: '2024-01-20T14:30:00Z',
      uploaded_by: 'Mike Chen',
      folder: 'Onboarding'
    },
    {
      id: 'doc-003',
      name: 'Q1 Revenue Report.pdf',
      type: 'application/pdf',
      size: 567890,
      url: '#demo-document-3',
      uploaded_at: '2024-02-01T09:15:00Z',
      uploaded_by: 'Sarah Johnson',
      folder: 'Financial Reports'
    },
    {
      id: 'doc-004',
      name: 'Security Compliance Guide.pdf',
      type: 'application/pdf',
      size: 891234,
      url: '#demo-document-4',
      uploaded_at: '2024-02-05T16:20:00Z',
      uploaded_by: 'Alex Thompson',
      folder: 'Compliance'
    }
  ];

  // API Methods
  async getUser(email: string): Promise<MockUser | null> {
    await this.simulateNetworkDelay();
    return this.mockUsers.find(user => user.email === email) || null;
  }

  async getVendors(): Promise<MockVendor[]> {
    await this.simulateNetworkDelay();
    return [...this.mockVendors];
  }

  async getVendor(id: string): Promise<MockVendor | null> {
    await this.simulateNetworkDelay();
    return this.mockVendors.find(vendor => vendor.id === id) || null;
  }

  async getCustomers(): Promise<MockCustomer[]> {
    await this.simulateNetworkDelay();
    return [...this.mockCustomers];
  }

  async getSubmissions(): Promise<MockSubmission[]> {
    await this.simulateNetworkDelay();
    return [...this.mockSubmissions];
  }

  async getSubmissionsByVendor(vendorId: string): Promise<MockSubmission[]> {
    await this.simulateNetworkDelay();
    return this.mockSubmissions.filter(sub => sub.vendor_id === vendorId);
  }

  async getTransactions(): Promise<MockTransaction[]> {
    await this.simulateNetworkDelay();
    return [...this.mockTransactions];
  }

  async getDocuments(): Promise<MockDocument[]> {
    await this.simulateNetworkDelay();
    return [...this.mockDocuments];
  }

  async getAnalytics(): Promise<MockAnalytics> {
    await this.simulateNetworkDelay();
    return {
      totalRevenue: 542150,
      revenueGrowth: 23.5,
      totalVendors: this.mockVendors.length,
      activeVendors: this.mockVendors.filter(v => v.status === 'active').length,
      totalSubmissions: this.mockSubmissions.length,
      pendingSubmissions: this.mockSubmissions.filter(s => s.status === 'pending').length,
      monthlyData: [
        { month: 'Jan', revenue: 142000, vendors: 3, submissions: 8 },
        { month: 'Feb', revenue: 186500, vendors: 4, submissions: 12 },
        { month: 'Mar', revenue: 213650, vendors: 5, submissions: 15 }
      ],
      topVendors: [
        { name: 'TechFlow Solutions', revenue: 120000, submissions: 7 },
        { name: 'Digital Marketing Pro', revenue: 45500, submissions: 4 },
        { name: 'Design Studio Plus', revenue: 28000, submissions: 3 }
      ]
    };
  }

  // CRUD Operations for demo
  async createVendor(vendorData: Partial<MockVendor>): Promise<MockVendor> {
    await this.simulateNetworkDelay();
    const newVendor: MockVendor = {
      id: `vendor-${Date.now()}`,
      name: vendorData.name || 'New Vendor',
      email: vendorData.email || 'new@vendor.com',
      business_type: vendorData.business_type || 'General',
      status: 'pending',
      created_at: new Date().toISOString(),
      ...vendorData
    };
    this.mockVendors.push(newVendor);
    return newVendor;
  }

  async updateSubmissionStatus(submissionId: string, status: MockSubmission['status'], notes?: string): Promise<MockSubmission | null> {
    await this.simulateNetworkDelay();
    const submission = this.mockSubmissions.find(s => s.id === submissionId);
    if (submission) {
      submission.status = status;
      submission.reviewed_at = new Date().toISOString();
      if (notes) submission.notes = notes;
    }
    return submission || null;
  }

  async getDashboardStats(): Promise<MockDashboardStats> {
    await this.simulateNetworkDelay();
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    
    return {
      totalVendors: this.mockVendors.length,
      activeVendors: this.mockVendors.filter(v => v.status === 'active').length,
      pendingApplications: this.mockVendors.filter(v => v.status === 'pending').length,
      totalSubmissions: this.mockSubmissions.length,
      pendingSubmissions: this.mockSubmissions.filter(s => s.status === 'pending').length,
      approvedSubmissions: this.mockSubmissions.filter(s => s.status === 'approved').length,
      totalRevenue: this.mockTransactions.reduce((sum, t) => sum + t.amount, 0),
      monthlyRevenue: this.mockTransactions
        .filter(t => new Date(t.processed_at).getMonth() === thisMonth)
        .reduce((sum, t) => sum + t.amount, 0),
      recentActivity: [
        { type: 'submission', message: 'New submission from TechFlow Solutions', time: '2 hours ago' },
        { type: 'approval', message: 'Approved submission from Design Studio Plus', time: '4 hours ago' },
        { type: 'vendor', message: 'New vendor application received', time: '1 day ago' }
      ]
    };
  }
}

export const mockDataService = MockDataService.getInstance();