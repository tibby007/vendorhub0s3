export const mockPartnerUser = {
  id: 'demo-partner-123',
  email: 'partner@demo.com', // Fixed: Match AuthContext expectation
  name: 'Sarah Johnson',
  role: 'Partner Admin',
  avatar_url: null,
  created_at: '2024-01-15T10:00:00Z'
};

export const mockPartnerStats = {
  totalVendors: 3,
  activeVendors: 2,
  pendingApplications: 12, // Match the dashboard count you mentioned
  totalSubmissions: 12, // Add total submissions count
  monthlyRevenue: 47500,
  revenueGrowth: 12.5
};

export const mockVendors = [
  {
    id: 'vendor-001',
    name: 'TechFlow Solutions',
    email: 'contact@techflow.com',
    business_type: 'Software Development',
    status: 'active',
    created_at: '2024-01-15T10:00:00Z',
    phone: '+1 (555) 123-4567',
    address: '123 Tech Street, San Francisco, CA 94105'
  },
  {
    id: 'vendor-002', 
    name: 'Digital Marketing Pro',
    email: 'hello@digitalmarketing.com',
    business_type: 'Marketing Services',
    status: 'active',
    created_at: '2024-01-18T09:15:00Z',
    phone: '+1 (555) 234-5678',
    address: '456 Marketing Ave, New York, NY 10001'
  },
  {
    id: 'vendor-003',
    name: 'Cloud Infrastructure LLC',
    email: 'sales@cloudinfra.com', 
    business_type: 'Cloud Services',
    status: 'pending',
    created_at: '2024-01-22T16:45:00Z',
    phone: '+1 (555) 345-6789',
    address: '789 Cloud Blvd, Austin, TX 78701'
  }
];

export const mockPartnerSubmissions = [
  {
    id: 'sub-001',
    vendor_id: 'vendor-001',
    vendor_name: 'TechFlow Solutions',
    customer_name: 'Acme Corporation',
    customer_email: 'procurement@acme.com',
    amount: 15000,
    status: 'approved',
    submitted_at: '2024-01-20T10:00:00Z',
    description: 'Custom software development project'
  },
  {
    id: 'sub-002',
    vendor_id: 'vendor-002', 
    vendor_name: 'Digital Marketing Pro',
    customer_name: 'StartupXYZ',
    customer_email: 'ceo@startupxyz.com',
    amount: 8500,
    status: 'pending',
    submitted_at: '2024-01-19T15:30:00Z',
    description: 'Digital marketing campaign setup'
  },
  {
    id: 'sub-003',
    vendor_id: 'vendor-001',
    vendor_name: 'TechFlow Solutions',
    customer_name: 'Enterprise Corp',
    customer_email: 'purchasing@enterprise.com',
    amount: 25000,
    status: 'under_review',
    submitted_at: '2024-01-21T11:15:00Z',
    description: 'Enterprise cloud migration services'
  },
  {
    id: 'sub-004',
    vendor_id: 'vendor-003',
    vendor_name: 'Cloud Infrastructure LLC',
    customer_name: 'Tech Startup Inc',
    customer_email: 'ops@techstartup.com',
    amount: 18500,
    status: 'pending',
    submitted_at: '2024-01-22T09:00:00Z',
    description: 'Cloud infrastructure setup'
  },
  {
    id: 'sub-005',
    vendor_id: 'vendor-001',
    vendor_name: 'TechFlow Solutions',
    customer_name: 'Manufacturing Co',
    customer_email: 'it@manufacturing.com',
    amount: 32000,
    status: 'approved',
    submitted_at: '2024-01-18T14:20:00Z',
    description: 'ERP system customization'
  },
  {
    id: 'sub-006',
    vendor_id: 'vendor-002',
    vendor_name: 'Digital Marketing Pro',
    customer_name: 'Retail Chain Ltd',
    customer_email: 'marketing@retailchain.com',
    amount: 12000,
    status: 'pending',
    submitted_at: '2024-01-23T11:45:00Z',
    description: 'Multi-channel marketing campaign'
  },
  {
    id: 'sub-007',
    vendor_id: 'vendor-003',
    vendor_name: 'Cloud Infrastructure LLC',
    customer_name: 'Financial Services Corp',
    customer_email: 'infrastructure@finservices.com',
    amount: 45000,
    status: 'under_review',
    submitted_at: '2024-01-17T16:30:00Z',
    description: 'Secure cloud migration for financial data'
  },
  {
    id: 'sub-008',
    vendor_id: 'vendor-001',
    vendor_name: 'TechFlow Solutions',
    customer_name: 'Healthcare Systems',
    customer_email: 'procurement@healthsys.com',
    amount: 28500,
    status: 'pending',
    submitted_at: '2024-01-24T08:15:00Z',
    description: 'Patient management system upgrade'
  },
  {
    id: 'sub-009',
    vendor_id: 'vendor-002',
    vendor_name: 'Digital Marketing Pro',
    customer_name: 'E-commerce Platform',
    customer_email: 'growth@ecommerce.com',
    amount: 9800,
    status: 'approved',
    submitted_at: '2024-01-16T13:00:00Z',
    description: 'Customer acquisition campaign'
  },
  {
    id: 'sub-010',
    vendor_id: 'vendor-003',
    vendor_name: 'Cloud Infrastructure LLC',
    customer_name: 'Government Agency',
    customer_email: 'tech@gov.agency',
    amount: 55000,
    status: 'pending',
    submitted_at: '2024-01-25T10:30:00Z',
    description: 'Secure government cloud infrastructure'
  },
  {
    id: 'sub-011',
    vendor_id: 'vendor-001',
    vendor_name: 'TechFlow Solutions',
    customer_name: 'Education District',
    customer_email: 'it@education.org',
    amount: 22000,
    status: 'under_review',
    submitted_at: '2024-01-15T12:45:00Z',
    description: 'Student information system development'
  },
  {
    id: 'sub-012',
    vendor_id: 'vendor-002',
    vendor_name: 'Digital Marketing Pro',
    customer_name: 'Non-Profit Organization',
    customer_email: 'outreach@nonprofit.org',
    amount: 6500,
    status: 'pending',
    submitted_at: '2024-01-26T14:00:00Z',
    description: 'Donor engagement campaign'
  }
];

export const mockVendorApplications = [
  {
    id: 'app-001',
    vendor_name: 'TechFlow Solutions',
    contact_email: 'contact@techflow.com',
    business_type: 'Software Development',
    status: 'pending',
    submitted_at: '2024-01-20T14:30:00Z',
    expected_volume: '$50,000/month'
  },
  {
    id: 'app-002', 
    vendor_name: 'Digital Marketing Pro',
    contact_email: 'hello@digitalmarketing.com',
    business_type: 'Marketing Services',
    status: 'approved',
    submitted_at: '2024-01-18T09:15:00Z',
    expected_volume: '$25,000/month'
  },
  {
    id: 'app-003',
    vendor_name: 'Cloud Infrastructure LLC',
    contact_email: 'sales@cloudinfra.com', 
    business_type: 'Cloud Services',
    status: 'under_review',
    submitted_at: '2024-01-22T16:45:00Z',
    expected_volume: '$75,000/month'
  }
];

export const mockRevenueData = [
  { month: 'Jan', revenue: 42000, vendors: 20 },
  { month: 'Feb', revenue: 38000, vendors: 19 },
  { month: 'Mar', revenue: 45000, vendors: 22 },
  { month: 'Apr', revenue: 47500, vendors: 24 },
  { month: 'May', revenue: 52000, vendors: 26 },
  { month: 'Jun', revenue: 48000, vendors: 25 }
];


export const mockResources = [
  {
    id: 'res-001',
    title: 'Partner Onboarding Guide',
    description: 'Complete guide for new partner onboarding process',
    type: 'document',
    file_url: '#',
    created_at: '2024-01-15T10:00:00Z'
  },
  {
    id: 'res-002',
    title: 'Sales Training Materials',
    description: 'Comprehensive sales training for partner teams',
    type: 'presentation',
    file_url: '#', 
    created_at: '2024-01-12T14:00:00Z'
  },
  {
    id: 'res-003',
    title: 'Product Demo Videos',
    description: 'Video demonstrations of key product features',
    type: 'video',
    file_url: '#',
    created_at: '2024-01-10T09:00:00Z'
  }
];
