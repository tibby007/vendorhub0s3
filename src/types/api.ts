// API response and error interfaces for VendorHub OS

// Generic API Response
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: ApiError;
  success: boolean;
  message?: string;
}

// Error Types
export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

export interface DatabaseError extends Error {
  code?: string;
  details?: string;
  hint?: string;
}

// Supabase specific error types
export interface SupabaseError {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
}

// User and Authentication Types
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'Super Admin' | 'Partner Admin' | 'Loan Officer' | 'Vendor' | 'Reseller';
  partner_id?: string;
  created_at: string;
  updated_at: string;
}

export interface PartnerData {
  id: string;
  name: string;
  contact_email: string;
  contact_phone?: string;
  subscription_tier?: string;
  created_at: string;
  updated_at: string;
}

// Deal Management Types
export interface DealData {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  business_name: string;
  equipment_type: string;
  equipment_cost: number;
  loan_amount: number;
  status: 'submitted' | 'credit_pulled' | 'submitted_for_approval' | 'approved' | 'term_sheet_issued' | 'declined' | 'funded';
  assigned_to?: string;
  partner_id: string;
  vendor_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Document Types
export interface DocumentData {
  id: string;
  deal_id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  document_type: 'customer_id' | 'equipment_quote' | 'spec_sheet' | 'term_sheet' | 'other';
  uploaded_by: string;
  storage_path: string;
  created_at: string;
}

// Resource Types
export interface ResourceData {
  id: string;
  title: string;
  description: string;
  category: string;
  resource_type: 'guideline' | 'blog_post' | 'document';
  url?: string;
  file_path?: string;
  is_published: boolean;
  partner_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Submission Types
export interface SubmissionData {
  id: string;
  customer_data: CustomerApplicationFormData;
  equipment_data: EquipmentData;
  financial_data: FinancialData;
  status: string;
  submitted_by: string;
  partner_id: string;
  created_at: string;
  updated_at: string;
}

export interface EquipmentData {
  type: string;
  description: string;
  cost: number;
  manufacturer?: string;
  model?: string;
  year?: number;
}

export interface FinancialData {
  requested_amount: number;
  down_payment: number;
  credit_score?: number;
  annual_revenue: number;
  years_in_business: number;
}

// Analytics and Dashboard Types
export interface DashboardMetrics {
  totalDeals: number;
  activeDeals: number;
  approvedDeals: number;
  declinedDeals: number;
  totalRevenue: number;
  monthlyGrowth: number;
}

export interface AnalyticsData {
  period: string;
  metrics: DashboardMetrics;
  trends: TrendData[];
}

export interface TrendData {
  date: string;
  value: number;
  category: string;
}

// Subscription and Billing Types
export interface SubscriptionData {
  id: string;
  partner_id: string;
  tier: 'solo' | 'pro' | 'enterprise';
  status: 'active' | 'cancelled' | 'past_due' | 'trialing';
  current_period_start: string;
  current_period_end: string;
  billing_amount: number;
}

// File Upload Types
export interface FileUploadResponse {
  success: boolean;
  file_path?: string;
  file_url?: string;
  error?: string;
}

export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
  fileSize: number;
  fileType: string;
}

// Vendor Types
export interface VendorData {
  id: string;
  vendor_name: string;
  contact_email: string;
  contact_phone: string;
  contact_address: string;
  partner_id: string;
  status: 'active' | 'inactive' | 'pending';
  created_at: string;
  updated_at: string;
}

// Utility Types
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Event Handler Types
export type FormEvent = React.FormEvent<HTMLFormElement>;
export type ChangeEvent = React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;
export type ClickEvent = React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>;

// Import the CustomerApplicationFormData from forms.ts
import type { CustomerApplicationFormData } from './forms';