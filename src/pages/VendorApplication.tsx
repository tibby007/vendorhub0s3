import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import {
  UserIcon,
  BuildingOfficeIcon,
  DocumentArrowUpIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';

interface ApplicationForm {
  // Customer Information (Required)
  customer_name: string;
  customer_address: string;
  customer_city: string;
  customer_state: string;
  customer_zip: string;
  customer_email: string;
  customer_phone: string;
  customer_ssn: string;
  customer_dob: string;

  // Business Information (Required)
  business_name: string;
  business_start_date: string;
  years_experience: number;

  // Sales Person Information (Required)
  sales_person_name: string;
  sales_person_phone: string;
  sales_person_email: string;

  // Equipment Information
  equipment_description: string;
  equipment_price: number;
  down_payment: number;
}

interface FileUpload {
  id: string;
  name: string;
  file: File | null;
  required: boolean;
  uploaded: boolean;
}

export const VendorApplication: React.FC = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    trigger,
  } = useForm<ApplicationForm>();

  // File upload states
  const [fileUploads, setFileUploads] = useState<FileUpload[]>([
    { id: 'quote', name: 'Quote/Invoice', file: null, required: true, uploaded: false },
    { id: 'customer_id', name: 'Customer ID', file: null, required: false, uploaded: false },
    { id: 'bank_statements', name: 'Bank Statements', file: null, required: false, uploaded: false },
    { id: 'spec_sheet', name: 'Spec Sheet', file: null, required: false, uploaded: false },
  ]);

  const steps = [
    { id: 1, name: 'Customer Info', icon: UserIcon },
    { id: 2, name: 'Business Info', icon: BuildingOfficeIcon },
    { id: 3, name: 'Documents', icon: DocumentArrowUpIcon },
  ];

  const handleFileUpload = (uploadId: string, file: File) => {
    setFileUploads(prev => prev.map(upload => 
      upload.id === uploadId 
        ? { ...upload, file, uploaded: true }
        : upload
    ));
  };

  const removeFile = (uploadId: string) => {
    setFileUploads(prev => prev.map(upload => 
      upload.id === uploadId 
        ? { ...upload, file: null, uploaded: false }
        : upload
    ));
  };

  const validateStep = async (step: number): Promise<boolean> => {
    switch (step) {
      case 1:
        return await trigger([
          'customer_name', 'customer_address', 'customer_city', 'customer_state',
          'customer_zip', 'customer_email', 'customer_phone', 'customer_ssn', 'customer_dob'
        ]);
      case 2:
        return await trigger([
          'business_name', 'business_start_date', 'years_experience',
          'sales_person_name', 'sales_person_phone', 'sales_person_email',
          'equipment_description', 'equipment_price', 'down_payment'
        ]);
      case 3:
        // Check required file uploads
        const requiredFiles = fileUploads.filter(f => f.required);
        const hasAllRequired = requiredFiles.every(f => f.uploaded);
        return hasAllRequired;
      default:
        return true;
    }
  };

  const nextStep = async () => {
    const isValid = await validateStep(currentStep);
    if (isValid && currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data: ApplicationForm) => {
    const isStep3Valid = await validateStep(3);
    if (!isStep3Valid) return;

    setIsSubmitting(true);

    try {
      // Create deal object
      const dealData = {
        customer_info: {
          name: data.customer_name,
          email: data.customer_email,
          phone: data.customer_phone,
          address: `${data.customer_address}, ${data.customer_city}, ${data.customer_state} ${data.customer_zip}`,
          ssn: data.customer_ssn,
          dob: data.customer_dob,
        },
        business_info: {
          name: data.business_name,
          start_date: data.business_start_date,
          years_experience: data.years_experience,
        },
        equipment_info: {
          description: data.equipment_description,
          price: data.equipment_price,
        },
        financial_info: {
          down_payment: data.down_payment,
        },
        sales_person: {
          name: data.sales_person_name,
          phone: data.sales_person_phone,
          email: data.sales_person_email,
        },
        vendor_id: userProfile?.id,
        organization_id: userProfile?.organization_id,
        status: 'submitted',
        documents: fileUploads.filter(f => f.uploaded).map(f => ({
          type: f.id,
          name: f.name,
          file: f.file,
        })),
      };

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Deal submitted:', dealData);
      setSubmitSuccess(true);

    } catch (error) {
      console.error('Error submitting application:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatSSN = (value: string) => {
    const nums = value.replace(/\D/g, '');
    if (nums.length <= 3) return nums;
    if (nums.length <= 5) return `${nums.slice(0, 3)}-${nums.slice(3)}`;
    return `${nums.slice(0, 3)}-${nums.slice(3, 5)}-${nums.slice(5, 9)}`;
  };

  const formatPhone = (value: string) => {
    const nums = value.replace(/\D/g, '');
    if (nums.length <= 3) return nums;
    if (nums.length <= 6) return `(${nums.slice(0, 3)}) ${nums.slice(3)}`;
    return `(${nums.slice(0, 3)}) ${nums.slice(3, 6)}-${nums.slice(6, 10)}`;
  };

  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <div>
            <CheckCircleIcon className="mx-auto h-16 w-16 text-green-500" />
            <h2 className="mt-6 text-3xl font-bold text-gray-900">Application Submitted!</h2>
            <p className="mt-4 text-sm text-gray-600">
              Your client's application has been successfully submitted. You'll receive updates via email and can track progress in your deals dashboard.
            </p>
          </div>
          <div className="space-y-4">
            <button
              onClick={() => navigate('/dashboard/deals')}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              View My Deals
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Submit Another Application
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Equipment Finance Application</h1>
              <p className="mt-1 text-sm text-gray-600">
                Submit a complete application for your client's equipment financing needs
              </p>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-gray-600 hover:text-gray-900 text-sm"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav aria-label="Progress">
          <ol className="flex items-center">
            {steps.map((step, stepIdx) => (
              <li key={step.name} className={`${stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''} relative`}>
                {stepIdx !== steps.length - 1 ? (
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className={`h-0.5 w-full ${currentStep > step.id ? 'bg-green-600' : 'bg-gray-200'}`} />
                  </div>
                ) : null}
                <div
                  className={`relative flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                    currentStep === step.id
                      ? 'border-green-600 bg-white'
                      : currentStep > step.id
                      ? 'border-green-600 bg-green-600'
                      : 'border-gray-300 bg-white'
                  }`}
                >
                  {currentStep > step.id ? (
                    <CheckCircleIcon className="h-5 w-5 text-white" />
                  ) : (
                    <step.icon className={`h-4 w-4 ${currentStep === step.id ? 'text-green-600' : 'text-gray-500'}`} />
                  )}
                </div>
                <span className={`absolute top-10 left-1/2 transform -translate-x-1/2 text-xs font-medium ${
                  currentStep >= step.id ? 'text-green-600' : 'text-gray-500'
                }`}>
                  {step.name}
                </span>
              </li>
            ))}
          </ol>
        </nav>

        {/* Form */}
        <div className="mt-12 bg-white shadow rounded-lg">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 divide-y divide-gray-200">
            <div className="p-8">
              {/* Step 1: Customer Information */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 flex items-center">
                      <UserIcon className="w-5 h-5 mr-2 text-green-600" />
                      Customer Information
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">
                      All fields are required for application processing
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Full Name *</label>
                      <input
                        type="text"
                        {...register('customer_name', { required: 'Full name is required' })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                        placeholder="John Doe"
                      />
                      {errors.customer_name && (
                        <p className="mt-1 text-sm text-red-600">{errors.customer_name.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email Address *</label>
                      <input
                        type="email"
                        {...register('customer_email', { 
                          required: 'Email is required',
                          pattern: { value: /^\S+@\S+$/i, message: 'Invalid email format' }
                        })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                        placeholder="john@example.com"
                      />
                      {errors.customer_email && (
                        <p className="mt-1 text-sm text-red-600">{errors.customer_email.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone Number *</label>
                      <input
                        type="tel"
                        {...register('customer_phone', { 
                          required: 'Phone number is required',
                          pattern: { value: /^\(\d{3}\) \d{3}-\d{4}$/, message: 'Invalid phone format' }
                        })}
                        onChange={(e) => {
                          e.target.value = formatPhone(e.target.value);
                        }}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                        placeholder="(555) 123-4567"
                      />
                      {errors.customer_phone && (
                        <p className="mt-1 text-sm text-red-600">{errors.customer_phone.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Date of Birth *</label>
                      <input
                        type="date"
                        {...register('customer_dob', { required: 'Date of birth is required' })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                      />
                      {errors.customer_dob && (
                        <p className="mt-1 text-sm text-red-600">{errors.customer_dob.message}</p>
                      )}
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Social Security Number *</label>
                      <input
                        type="text"
                        {...register('customer_ssn', { 
                          required: 'SSN is required',
                          pattern: { value: /^\d{3}-\d{2}-\d{4}$/, message: 'Invalid SSN format (XXX-XX-XXXX)' }
                        })}
                        onChange={(e) => {
                          e.target.value = formatSSN(e.target.value);
                        }}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                        placeholder="123-45-6789"
                        maxLength={11}
                      />
                      {errors.customer_ssn && (
                        <p className="mt-1 text-sm text-red-600">{errors.customer_ssn.message}</p>
                      )}
                      <p className="mt-1 text-xs text-gray-500">
                        <ExclamationTriangleIcon className="w-3 h-3 inline mr-1" />
                        All personal information is encrypted and secured
                      </p>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Street Address *</label>
                      <input
                        type="text"
                        {...register('customer_address', { required: 'Address is required' })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                        placeholder="123 Main St"
                      />
                      {errors.customer_address && (
                        <p className="mt-1 text-sm text-red-600">{errors.customer_address.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">City *</label>
                      <input
                        type="text"
                        {...register('customer_city', { required: 'City is required' })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                        placeholder="New York"
                      />
                      {errors.customer_city && (
                        <p className="mt-1 text-sm text-red-600">{errors.customer_city.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">State *</label>
                      <select
                        {...register('customer_state', { required: 'State is required' })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                      >
                        <option value="">Select State</option>
                        <option value="CA">California</option>
                        <option value="TX">Texas</option>
                        <option value="FL">Florida</option>
                        <option value="NY">New York</option>
                        <option value="IL">Illinois</option>
                        {/* Add more states as needed */}
                      </select>
                      {errors.customer_state && (
                        <p className="mt-1 text-sm text-red-600">{errors.customer_state.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">ZIP Code *</label>
                      <input
                        type="text"
                        {...register('customer_zip', { 
                          required: 'ZIP code is required',
                          pattern: { value: /^\d{5}(-\d{4})?$/, message: 'Invalid ZIP code format' }
                        })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                        placeholder="12345"
                      />
                      {errors.customer_zip && (
                        <p className="mt-1 text-sm text-red-600">{errors.customer_zip.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Business Information */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 flex items-center">
                      <BuildingOfficeIcon className="w-5 h-5 mr-2 text-green-600" />
                      Business & Equipment Information
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">
                      Provide business details and sales representative information
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Business Name *</label>
                      <input
                        type="text"
                        {...register('business_name', { required: 'Business name is required' })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                        placeholder="Acme Construction LLC"
                      />
                      {errors.business_name && (
                        <p className="mt-1 text-sm text-red-600">{errors.business_name.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Business Start Date *</label>
                      <input
                        type="date"
                        {...register('business_start_date', { required: 'Business start date is required' })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                      />
                      {errors.business_start_date && (
                        <p className="mt-1 text-sm text-red-600">{errors.business_start_date.message}</p>
                      )}
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Years of Experience *</label>
                      <input
                        type="number"
                        {...register('years_experience', { 
                          required: 'Years of experience is required',
                          min: { value: 0, message: 'Must be 0 or greater' }
                        })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                        placeholder="5"
                      />
                      {errors.years_experience && (
                        <p className="mt-1 text-sm text-red-600">{errors.years_experience.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-6">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Sales Representative</h4>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Sales Person Name *</label>
                        <input
                          type="text"
                          {...register('sales_person_name', { required: 'Sales person name is required' })}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                          placeholder="Jane Smith"
                          defaultValue={`${userProfile?.first_name || ''} ${userProfile?.last_name || ''}`.trim()}
                        />
                        {errors.sales_person_name && (
                          <p className="mt-1 text-sm text-red-600">{errors.sales_person_name.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Sales Person Email *</label>
                        <input
                          type="email"
                          {...register('sales_person_email', { 
                            required: 'Sales person email is required',
                            pattern: { value: /^\S+@\S+$/i, message: 'Invalid email format' }
                          })}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                          placeholder="jane@company.com"
                          defaultValue={userProfile?.email || ''}
                        />
                        {errors.sales_person_email && (
                          <p className="mt-1 text-sm text-red-600">{errors.sales_person_email.message}</p>
                        )}
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Sales Person Phone *</label>
                        <input
                          type="tel"
                          {...register('sales_person_phone', { 
                            required: 'Sales person phone is required',
                            pattern: { value: /^\(\d{3}\) \d{3}-\d{4}$/, message: 'Invalid phone format' }
                          })}
                          onChange={(e) => {
                            e.target.value = formatPhone(e.target.value);
                          }}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                          placeholder="(555) 123-4567"
                          defaultValue={userProfile?.phone ? formatPhone(userProfile.phone) : ''}
                        />
                        {errors.sales_person_phone && (
                          <p className="mt-1 text-sm text-red-600">{errors.sales_person_phone.message}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-6">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Equipment Details</h4>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Equipment Description *</label>
                        <textarea
                          rows={3}
                          {...register('equipment_description', { required: 'Equipment description is required' })}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                          placeholder="2024 CAT 320 Excavator, 300 hours, includes bucket and hydraulic thumb..."
                        />
                        {errors.equipment_description && (
                          <p className="mt-1 text-sm text-red-600">{errors.equipment_description.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Equipment Price *</label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">$</span>
                          </div>
                          <input
                            type="number"
                            {...register('equipment_price', { 
                              required: 'Equipment price is required',
                              min: { value: 1000, message: 'Minimum price is $1,000' }
                            })}
                            className="block w-full pl-7 border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                            placeholder="75000"
                          />
                        </div>
                        {errors.equipment_price && (
                          <p className="mt-1 text-sm text-red-600">{errors.equipment_price.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Down Payment</label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">$</span>
                          </div>
                          <input
                            type="number"
                            {...register('down_payment', { 
                              min: { value: 0, message: 'Down payment must be positive' }
                            })}
                            className="block w-full pl-7 border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                            placeholder="15000"
                          />
                        </div>
                        {errors.down_payment && (
                          <p className="mt-1 text-sm text-red-600">{errors.down_payment.message}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Document Uploads */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 flex items-center">
                      <DocumentArrowUpIcon className="w-5 h-5 mr-2 text-green-600" />
                      Document Uploads
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">
                      Upload required and optional documents to support the application
                    </p>
                  </div>

                  <div className="space-y-6">
                    {fileUploads.map((upload) => (
                      <div key={upload.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-medium text-gray-900 flex items-center">
                            {upload.name}
                            {upload.required && <span className="text-red-500 ml-1">*</span>}
                          </h4>
                          {upload.uploaded && (
                            <button
                              type="button"
                              onClick={() => removeFile(upload.id)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        
                        {upload.uploaded ? (
                          <div className="flex items-center space-x-2 text-sm text-green-600">
                            <CheckCircleIcon className="w-4 h-4" />
                            <span>{upload.file?.name}</span>
                          </div>
                        ) : (
                          <div className="border-2 border-dashed border-gray-300 rounded-md px-6 py-4 text-center">
                            <DocumentArrowUpIcon className="mx-auto h-8 w-8 text-gray-400" />
                            <div className="mt-2">
                              <label className="cursor-pointer text-sm font-medium text-green-600 hover:text-green-500">
                                <span>Click to upload</span>
                                <input
                                  type="file"
                                  className="sr-only"
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleFileUpload(upload.id, file);
                                  }}
                                />
                              </label>
                              <p className="text-xs text-gray-500 mt-1">
                                PDF, JPG, PNG up to 10MB
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                    <div className="flex">
                      <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400 mr-3 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-yellow-800">Document Requirements:</p>
                        <ul className="mt-2 text-yellow-700 space-y-1">
                          <li>• <strong>Quote/Invoice:</strong> Required - Equipment pricing and specifications</li>
                          <li>• <strong>Customer ID:</strong> Optional but recommended - Driver's license or state ID</li>
                          <li>• <strong>Bank Statements:</strong> Optional - Last 3 months for faster processing</li>
                          <li>• <strong>Spec Sheet:</strong> Optional but required for specialized equipment</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="px-8 py-4 bg-gray-50 flex justify-between">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 1}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  currentStep === 1
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
                }`}
              >
                Previous
              </button>

              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting || !fileUploads.filter(f => f.required).every(f => f.uploaded)}
                  className="px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Application'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};