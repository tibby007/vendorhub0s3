export const mockVendorUser = {
  id: 'demo-vendor-456',
  email: 'demo@vendor.com', 
  name: 'Michael Chen',
  role: 'Vendor',
  avatar_url: null,
  created_at: '2024-01-10T08:00:00Z'
};

export const mockVendorStats = {
  totalSubmissions: 12,
  approvedSubmissions: 8,
  pendingSubmissions: 3,
  totalRevenue: 28500,
  conversionRate: 67
};

export const mockVendorSubmissions = [
  {
    id: 'vsub-001',
    customer_name: 'Global Tech Solutions',
    customer_email: 'procurement@globaltech.com',
    amount: '$12,000',
    status: 'approved',
    submitted_at: '2024-01-18T14:20:00Z',
    prequal_score: 85
  },
  {
    id: 'vsub-002',
    customer_name: 'Innovation Startup',
    customer_email: 'ceo@innovationstartup.com', 
    amount: '$6,500',
    status: 'pending',
    submitted_at: '2024-01-20T11:45:00Z',
    prequal_score: 72
  },
  {
    id: 'vsub-003',
    customer_name: 'Enterprise Dynamics',
    customer_email: 'purchasing@entdynamics.com',
    amount: '$18,000',
    status: 'under_review',
    submitted_at: '2024-01-22T09:30:00Z',
    prequal_score: 91
  }
];

export const mockVendorResources = [
  {
    id: 'vres-001',
    title: 'Vendor Best Practices Guide',
    description: 'Essential practices for successful vendor partnerships',
    type: 'document',
    file_url: '#',
    created_at: '2024-01-15T10:00:00Z'
  },
  {
    id: 'vres-002',
    title: 'Customer Application Templates',
    description: 'Templates to help streamline customer applications',
    type: 'template',
    file_url: '#',
    created_at: '2024-01-12T14:00:00Z'
  },
  {
    id: 'vres-003',
    title: 'Pre-Qualification Tools',
    description: 'Tools to assess customer qualification efficiently',
    type: 'tool',
    file_url: '#',
    created_at: '2024-01-10T09:00:00Z'
  }
];

export const mockPrequalHistory = [
  {
    id: 'pq-001',
    customer_name: 'Global Tech Solutions',
    score: 85,
    result: 'qualified',
    created_at: '2024-01-18T14:15:00Z',
    submitted: true
  },
  {
    id: 'pq-002', 
    customer_name: 'Small Business Co',
    score: 45,
    result: 'not_qualified',
    created_at: '2024-01-17T16:30:00Z',
    submitted: false
  },
  {
    id: 'pq-003',
    customer_name: 'Innovation Startup',
    score: 72,
    result: 'qualified',
    created_at: '2024-01-20T11:40:00Z',
    submitted: true
  }
];

export const mockVendorRevenue = [
  { month: 'Jan', revenue: 18000, submissions: 8 },
  { month: 'Feb', revenue: 22000, submissions: 10 },
  { month: 'Mar', revenue: 25000, submissions: 11 },
  { month: 'Apr', revenue: 28500, submissions: 12 },
  { month: 'May', revenue: 31000, submissions: 14 },
  { month: 'Jun', revenue: 28500, submissions: 12 }
];