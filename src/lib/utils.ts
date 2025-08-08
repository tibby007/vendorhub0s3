import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(date));
}

export function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function getInitials(firstName?: string, lastName?: string): string {
  const first = firstName?.charAt(0) || '';
  const last = lastName?.charAt(0) || '';
  return (first + last).toUpperCase();
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePhone(phone: string): boolean {
  const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
  return phoneRegex.test(phone);
}

export function calculatePrequalificationScore(form: {
  estimated_credit_score: number;
  time_in_business: number;
  equipment_price: number;
  estimated_down_payment: number;
}): { score: number; result: 'green' | 'yellow' | 'red'; message: string } {
  let score = 0;

  // Credit Score
  if (form.estimated_credit_score >= 750) score += 2;
  else if (form.estimated_credit_score >= 650) score += 1;
  else if (form.estimated_credit_score >= 550) score += 0;
  else score -= 1;

  // Time in Business
  if (form.time_in_business >= 2) score += 1;
  else if (form.time_in_business >= 1) score += 0;
  else score -= 1;

  // Down Payment Percentage
  const downPaymentPercentage = (form.estimated_down_payment / form.equipment_price) * 100;
  if (downPaymentPercentage >= 20) score += 1;
  else if (downPaymentPercentage >= 10) score += 0;
  else score -= 1;

  // Equipment Price Range
  if (form.equipment_price >= 25000 && form.equipment_price <= 500000) score += 1;
  else if ((form.equipment_price >= 10000 && form.equipment_price < 25000) || 
           (form.equipment_price > 500000 && form.equipment_price <= 1000000)) score += 0;
  else score -= 1;

  // Determine result
  let result: 'green' | 'yellow' | 'red';
  let message: string;

  if (score >= 3) {
    result = 'green';
    message = "Excellent! This customer qualifies for financing. Please submit the complete application to your broker partner.";
  } else if (score >= 0) {
    result = 'yellow';
    message = "This customer may qualify but requires manual review. Please submit the application with a note about any specific concerns.";
  } else {
    result = 'red';
    message = "This application has a strong chance of decline. Please work with your broker partner to determine what improvements are needed for approval.";
  }

  return { score, result, message };
}