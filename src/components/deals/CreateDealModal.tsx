import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import { Deal, CustomerInfo, EquipmentInfo, FinancialInfo } from '../../types';

interface CreateDealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (deal: Omit<Deal, 'id' | 'created_at' | 'last_updated' | 'submission_date'>) => void;
}

interface DealFormData {
  // Customer Info
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_ssn: string;
  customer_dob: string;
  customer_street: string;
  customer_city: string;
  customer_state: string;
  customer_zip: string;
  
  // Business Info (optional)
  company_name?: string;
  business_street?: string;
  business_city?: string;
  business_state?: string;
  business_zip?: string;
  business_start_date?: string;
  estimated_down_payment?: number;
  
  // Equipment Info
  equipment_type: string;
  equipment_description: string;
  equipment_price: number;
  vendor_quote_number?: string;
  
  // Financial Info
  estimated_credit_score?: number;
  time_in_business?: number;
  down_payment_percentage?: number;
  requested_amount?: number;
}

export const CreateDealModal: React.FC<CreateDealModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit 
}) => {
  const { userProfile } = useAuth();
  const [step, setStep] = useState(1);
  const { 
    register, 
    handleSubmit, 
    formState: { errors }, 
    reset,
    watch
  } = useForm<DealFormData>();

  const equipmentPrice = watch('equipment_price');
  const downPaymentPercentage = watch('down_payment_percentage');

  if (!isOpen) return null;

  const onSubmitForm = (data: DealFormData) => {
    const customerInfo: CustomerInfo = {
      full_name: data.customer_name,
      email: data.customer_email,
      phone: data.customer_phone,
      ssn: data.customer_ssn,
      date_of_birth: data.customer_dob,
      address: {
        street: data.customer_street,
        city: data.customer_city,
        state: data.customer_state,
        zip: data.customer_zip
      },
      company_name: data.company_name,
      business_address: data.business_street ? {
        street: data.business_street,
        city: data.business_city!,
        state: data.business_state!,
        zip: data.business_zip!
      } : undefined,
      business_start_date: data.business_start_date,
      estimated_down_payment: data.estimated_down_payment
    };

    const equipmentInfo: EquipmentInfo = {
      equipment_type: data.equipment_type,
      equipment_description: data.equipment_description,
      equipment_price: data.equipment_price,
      vendor_quote_number: data.vendor_quote_number
    };

    const financialInfo: FinancialInfo = {
      estimated_credit_score: data.estimated_credit_score,
      time_in_business: data.time_in_business,
      down_payment_percentage: data.down_payment_percentage,
      requested_amount: data.requested_amount
    };

    const deal: Omit<Deal, 'id' | 'created_at' | 'last_updated' | 'submission_date'> = {
      organization_id: userProfile!.organization_id,
      vendor_id: userProfile?.role === 'vendor' ? userProfile.id : undefined,
      assigned_to: null,
      status: 'submitted',
      customer_info: customerInfo,
      equipment_info: equipmentInfo,
      financial_info: financialInfo,
      prequalification_result: undefined
    };

    onSubmit(deal);
    reset();
    setStep(1);
  };

  const handleClose = () => {
    reset();
    setStep(1);
    onClose();
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose}></div>
        
        <div className="bg-white rounded-lg shadow-xl transform transition-all max-w-2xl w-full">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Create New Deal</h3>
                <p className="text-sm text-gray-600">Step {step} of 3</p>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            {/* Progress Bar */}
            <div className="flex mt-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex-1">
                  <div className={`h-2 rounded-full ${
                    i <= step ? 'bg-green-500' : 'bg-gray-200'
                  } ${i < 3 ? 'mr-2' : ''}`}></div>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmitForm)}>
            <div className="px-6 py-4 max-h-96 overflow-y-auto">
              {step === 1 && (
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Customer Information</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                        {...register('customer_name', { required: 'Full name is required' })}
                      />
                      {errors.customer_name && (
                        <p className="mt-1 text-sm text-red-600">{errors.customer_name.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                        {...register('customer_email', { 
                          required: 'Email is required',
                          pattern: {
                            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                            message: 'Invalid email format'
                          }
                        })}
                      />
                      {errors.customer_email && (
                        <p className="mt-1 text-sm text-red-600">{errors.customer_email.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone *
                      </label>
                      <input
                        type="tel"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                        {...register('customer_phone', { required: 'Phone is required' })}
                      />
                      {errors.customer_phone && (
                        <p className="mt-1 text-sm text-red-600">{errors.customer_phone.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date of Birth *
                      </label>
                      <input
                        type="date"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                        {...register('customer_dob', { required: 'Date of birth is required' })}
                      />
                      {errors.customer_dob && (
                        <p className="mt-1 text-sm text-red-600">{errors.customer_dob.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SSN *
                    </label>
                    <input
                      type="text"
                      placeholder="XXX-XX-XXXX"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                      {...register('customer_ssn', { required: 'SSN is required' })}
                    />
                    {errors.customer_ssn && (
                      <p className="mt-1 text-sm text-red-600">{errors.customer_ssn.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Street Address *
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                        {...register('customer_street', { required: 'Street address is required' })}
                      />
                      {errors.customer_street && (
                        <p className="mt-1 text-sm text-red-600">{errors.customer_street.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City *
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                        {...register('customer_city', { required: 'City is required' })}
                      />
                      {errors.customer_city && (
                        <p className="mt-1 text-sm text-red-600">{errors.customer_city.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        State *
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                        {...register('customer_state', { required: 'State is required' })}
                      />
                      {errors.customer_state && (
                        <p className="mt-1 text-sm text-red-600">{errors.customer_state.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ZIP Code *
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                        {...register('customer_zip', { required: 'ZIP code is required' })}
                      />
                      {errors.customer_zip && (
                        <p className="mt-1 text-sm text-red-600">{errors.customer_zip.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Business & Equipment Information</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                      {...register('company_name')}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Business Start Date
                      </label>
                      <input
                        type="date"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                        {...register('business_start_date')}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Estimated Down Payment
                      </label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                        {...register('estimated_down_payment', { valueAsNumber: true })}
                      />
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Equipment Type *
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                          {...register('equipment_type', { required: 'Equipment type is required' })}
                        />
                        {errors.equipment_type && (
                          <p className="mt-1 text-sm text-red-600">{errors.equipment_type.message}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Equipment Price *
                        </label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                          {...register('equipment_price', { 
                            required: 'Equipment price is required',
                            valueAsNumber: true,
                            min: { value: 1, message: 'Price must be greater than 0' }
                          })}
                        />
                        {errors.equipment_price && (
                          <p className="mt-1 text-sm text-red-600">{errors.equipment_price.message}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Equipment Description *
                      </label>
                      <textarea
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                        {...register('equipment_description', { required: 'Equipment description is required' })}
                      ></textarea>
                      {errors.equipment_description && (
                        <p className="mt-1 text-sm text-red-600">{errors.equipment_description.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Vendor Quote Number
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                        {...register('vendor_quote_number')}
                      />
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Financial Information</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Estimated Credit Score
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                        {...register('estimated_credit_score', { valueAsNumber: true })}
                      >
                        <option value="">Select range</option>
                        <option value={800}>750+ (Excellent)</option>
                        <option value={700}>650-749 (Good)</option>
                        <option value={600}>550-649 (Fair)</option>
                        <option value={500}>Below 550 (Poor)</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Time in Business (years)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                        {...register('time_in_business', { valueAsNumber: true })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Down Payment %
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                        {...register('down_payment_percentage', { valueAsNumber: true })}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Requested Amount
                      </label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                        {...register('requested_amount', { valueAsNumber: true })}
                        placeholder={equipmentPrice && downPaymentPercentage ? 
                          `Suggested: $${((equipmentPrice * (100 - downPaymentPercentage)) / 100).toLocaleString()}` : 
                          'Enter amount'
                        }
                      />
                    </div>
                  </div>

                  {equipmentPrice && downPaymentPercentage && (
                    <div className="bg-green-50 border border-green-200 rounded-md p-3">
                      <p className="text-sm text-green-800">
                        <strong>Calculation:</strong> Equipment Price (${equipmentPrice.toLocaleString()}) - 
                        Down Payment ({downPaymentPercentage}%) = 
                        Suggested Loan Amount: ${((equipmentPrice * (100 - downPaymentPercentage)) / 100).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
              <div>
                {step > 1 && (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Previous
                  </button>
                )}
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                
                {step < 3 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700"
                  >
                    Create Deal
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};