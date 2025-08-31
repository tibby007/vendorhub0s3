// Form data interfaces for VendorHub OS components

export interface PartnerAdminFormData {
  name: string;
  email: string;
  password: string;
  company: string;
  contactPhone: string;
  subscription: string;
}

export interface ResellerFormData {
  name: string;
  email: string;
  company: string;
  phone: string;
  website: string;
  description: string;
}

export interface VendorFormData {
  name: string;
  email: string;
  company: string;
  contactPhone: string;
  businessType: string;
  yearsInBusiness: string;
  annualRevenue: string;
}

export interface CustomerApplicationFormData {
  // Customer Information
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  businessAddress: string;
  city: string;
  state: string;
  zipCode: string;
  
  // Business Details
  businessType: string;
  yearsInBusiness: string;
  annualRevenue: string;
  employeeCount: string;
  
  // Equipment Information
  equipmentType: string;
  equipmentDescription: string;
  equipmentCost: string;
  downPayment: string;
  
  // Financial Information
  creditScore: string;
  bankName: string;
  accountYears: string;
  
  // Additional Information
  intendedUse: string;
  additionalNotes?: string;
}

export interface DetailedCustomerApplicationFormData {
  // Personal Information
  customerName: string;
  email: string;
  phone: string;
  address: string;
  dob: string;
  ssn: string;
  
  // Business Information
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  businessEmail: string;
  ein: string;
  industry: string;
  monthsInBusiness: string;
  annualRevenue: string;
  
  // Loan Information
  loanAmount: string;
  loanPurpose: string;
  collateralDescription: string;
  personalGuarantee: boolean;
  
  // Document URLs
  salesInvoiceUrl: string;
  driversLicenseUrl: string;
  additionalDocuments: string[];
  
  // Additional Information
  creditPermission: boolean;
  notes: string;
}

export interface PasswordResetFormData {
  email: string;
}

export interface LoginFormData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface ResourceFormData {
  title: string;
  description: string;
  category: string;
  url?: string;
  fileData?: File;
  isPublished: boolean;
}

export interface DealFormData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  businessName: string;
  equipmentType: string;
  equipmentCost: string;
  loanAmount: string;
  status: string;
  notes?: string;
}

// CSV Upload Data
export interface CSVRowData {
  [key: string]: string | number | boolean;
}

export interface CSVUploadData {
  fileName: string;
  rowCount: number;
  headers: string[];
  rows: CSVRowData[];
}

// Validation Error Types
export interface ValidationError {
  field: string;
  message: string;
}

export interface FormValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}