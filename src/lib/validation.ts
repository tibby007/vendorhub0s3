
import { z } from 'zod';

// Partner Admin Form Validation
export const partnerAdminSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),
  company: z.string().min(2, 'Company name must be at least 2 characters').max(200, 'Company name too long'),
  contactPhone: z.string().regex(/^\+?[\d\s\-\(\)]{10,15}$/, 'Invalid phone number format').optional(),
  subscription: z.enum(['Basic', 'Pro', 'Premium'])
});

// Customer Application Form Validation
export const customerSchema = z.object({
  customer_name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().regex(/^\+?[\d\s\-\(\)]{10,15}$/, 'Invalid phone number format'),
  address: z.string().min(10, 'Address must be at least 10 characters').max(500, 'Address too long'),
  ssn: z.string().regex(/^\d{3}-\d{2}-\d{4}$/, 'SSN must be in format XXX-XX-XXXX').optional(),
  dob: z.string().optional(),
  biz_name: z.string().max(200, 'Business name too long').optional(),
  ein: z.string().regex(/^\d{2}-\d{7}$/, 'EIN must be in format XX-XXXXXXX').optional(),
  biz_start_date: z.string().optional(),
  biz_address: z.string().max(500, 'Business address too long').optional(),
  credit_permission: z.boolean()
});

// Vendor Management Form Validation
export const vendorSchema = z.object({
  vendor_name: z.string().min(2, 'Vendor name must be at least 2 characters').max(100, 'Vendor name too long'),
  contact_email: z.string().email('Invalid email address'),
  contact_phone: z.string().regex(/^\+?[\d\s\-\(\)]{10,15}$/, 'Invalid phone number format').optional(),
  contact_address: z.string().max(500, 'Address too long').optional(),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number').optional()
});

// File Upload Validation
export const fileValidationSchema = z.object({
  size: z.number().max(10 * 1024 * 1024, 'File size must be less than 10MB'),
  type: z.string().refine(
    (type) => ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'].includes(type),
    'Only PDF, JPEG, and PNG files are allowed'
  )
});

export const validateFile = (file: File) => {
  return fileValidationSchema.safeParse({
    size: file.size,
    type: file.type
  });
};

// Sanitize filename for security
export const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase();
};
