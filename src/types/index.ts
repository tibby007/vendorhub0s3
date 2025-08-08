// Enums matching database types
export type SubscriptionTier = 'solo' | 'pro' | 'enterprise';
export type UserRole = 'broker' | 'loan_officer' | 'vendor';
export type DealStatus = 'submitted' | 'credit_pulled' | 'submitted_for_approval' | 'approved' | 'term_sheet_issued' | 'declined' | 'funded';
export type PrequalificationResult = 'green' | 'yellow' | 'red';
export type DocumentType = 'customer_id' | 'equipment_quote' | 'spec_sheet' | 'term_sheet' | 'other';
export type ResourceType = 'guideline' | 'blog_post' | 'document';

// Database entities
export interface Organization {
  id: string;
  name: string;
  subscription_tier: SubscriptionTier;
  brand_colors: {
    primary: string;
    secondary: string;
  };
  logo_url?: string;
  contact_info: Record<string, any>;
  settings: Record<string, any>;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  organization_id: string;
  email: string;
  role: UserRole;
  first_name?: string;
  last_name?: string;
  phone?: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
  organization?: Organization;
}

export interface Deal {
  id: string;
  organization_id: string;
  vendor_id?: string;
  assigned_to?: string;
  status: DealStatus;
  customer_info: CustomerInfo;
  equipment_info: EquipmentInfo;
  financial_info: FinancialInfo;
  prequalification_result?: PrequalificationResult;
  submission_date: string;
  last_updated: string;
  created_at: string;
  vendor?: User;
  assigned_user?: User;
}

export interface CustomerInfo {
  full_name: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  ssn: string;
  date_of_birth: string;
  email: string;
  phone: string;
  company_name?: string;
  business_address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  business_start_date?: string;
  estimated_down_payment?: number;
}

export interface EquipmentInfo {
  equipment_type: string;
  equipment_description: string;
  equipment_price: number;
  vendor_quote_number?: string;
}

export interface FinancialInfo {
  estimated_credit_score?: number;
  time_in_business?: number;
  down_payment_percentage?: number;
  requested_amount?: number;
}

export interface Document {
  id: string;
  deal_id: string;
  uploaded_by?: string;
  document_type: DocumentType;
  file_name: string;
  file_size?: number;
  file_url: string;
  mime_type?: string;
  created_at: string;
  uploader?: User;
}

export interface Message {
  id: string;
  deal_id: string;
  sender_id?: string;
  recipient_id?: string;
  message_content: string;
  is_read: boolean;
  created_at: string;
  sender?: User;
  recipient?: User;
}

export interface Resource {
  id: string;
  organization_id: string;
  title: string;
  content?: string;
  resource_type: ResourceType;
  file_url?: string;
  is_published: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
  creator?: User;
}

// Form types
export interface PrequalificationForm {
  customer_name: string;
  estimated_credit_score: number;
  time_in_business: number;
  equipment_price: number;
  estimated_down_payment: number;
}

export interface ApplicationForm {
  customer_personal: {
    full_name: string;
    address: string;
    ssn: string;
    date_of_birth: string;
    email: string;
    phone: string;
  };
  business_info: {
    company_name: string;
    business_address: string;
    business_start_date: string;
    estimated_down_payment: number;
  };
  equipment_details: {
    equipment_type: string;
    equipment_description: string;
    equipment_price: number;
    vendor_quote_number?: string;
  };
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  limit: number;
  total_pages: number;
}

// Auth types
export interface AuthUser {
  id: string;
  email: string;
  user?: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  organization_name?: string;
  phone?: string;
}

// Subscription features
export interface SubscriptionFeatures {
  max_vendors: number | 'unlimited';
  max_loan_officers: number;
  storage_limit_gb: number | 'unlimited';
  api_access: boolean;
  priority_support: boolean;
  white_label_advanced: boolean;
  sso_integration: boolean;
  custom_integrations: boolean;
}

export const SUBSCRIPTION_FEATURES: Record<SubscriptionTier, SubscriptionFeatures> = {
  solo: {
    max_vendors: 3,
    max_loan_officers: 1,
    storage_limit_gb: 5,
    api_access: false,
    priority_support: false,
    white_label_advanced: false,
    sso_integration: false,
    custom_integrations: false,
  },
  pro: {
    max_vendors: 7,
    max_loan_officers: 3,
    storage_limit_gb: 25,
    api_access: true,
    priority_support: true,
    white_label_advanced: true,
    sso_integration: false,
    custom_integrations: false,
  },
  enterprise: {
    max_vendors: 'unlimited',
    max_loan_officers: 10,
    storage_limit_gb: 'unlimited',
    api_access: true,
    priority_support: true,
    white_label_advanced: true,
    sso_integration: true,
    custom_integrations: true,
  },
};

// Deal status colors and metadata
export const DEAL_STATUS_CONFIG: Record<DealStatus, {
  name: string;
  description: string;
  color: string;
  next_statuses: DealStatus[];
}> = {
  submitted: {
    name: 'Submitted',
    description: 'Application received from vendor',
    color: '#3B82F6',
    next_statuses: ['credit_pulled', 'declined'],
  },
  credit_pulled: {
    name: 'Credit Pulled',
    description: 'Credit report obtained and reviewed',
    color: '#8B5CF6',
    next_statuses: ['submitted_for_approval', 'declined'],
  },
  submitted_for_approval: {
    name: 'Submitted for Approval',
    description: 'Application sent to lender for review',
    color: '#F59E0B',
    next_statuses: ['approved', 'declined'],
  },
  approved: {
    name: 'Approved',
    description: 'Lender has approved the financing',
    color: '#10B981',
    next_statuses: ['term_sheet_issued', 'declined'],
  },
  term_sheet_issued: {
    name: 'Term Sheet Issued',
    description: 'Terms provided to customer',
    color: '#059669',
    next_statuses: ['funded', 'declined'],
  },
  declined: {
    name: 'Declined',
    description: 'Application was not approved',
    color: '#EF4444',
    next_statuses: [],
  },
  funded: {
    name: 'Funded',
    description: 'Deal completed and funded',
    color: '#22C55E',
    next_statuses: [],
  },
};