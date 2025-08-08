import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { calculatePrequalificationScore } from '../lib/utils';
import type { PrequalificationForm } from '../types';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

export const PreQualify: React.FC = () => {
  const [result, setResult] = useState<{
    score: number;
    result: 'green' | 'yellow' | 'red';
    message: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PrequalificationForm>();

  const onSubmit = async (data: PrequalificationForm) => {
    setLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const prequalResult = calculatePrequalificationScore({
      estimated_credit_score: data.estimated_credit_score,
      time_in_business: data.time_in_business,
      equipment_price: data.equipment_price,
      estimated_down_payment: data.estimated_down_payment,
    });

    setResult(prequalResult);
    setLoading(false);
  };

  const handleReset = () => {
    setResult(null);
    reset();
  };

  const getResultIcon = () => {
    if (!result) return null;
    
    switch (result.result) {
      case 'green':
        return <CheckCircleIcon className="w-12 h-12 text-green-600" />;
      case 'yellow':
        return <ExclamationTriangleIcon className="w-12 h-12 text-yellow-600" />;
      case 'red':
        return <XCircleIcon className="w-12 h-12 text-red-600" />;
      default:
        return null;
    }
  };

  const getResultColor = () => {
    if (!result) return '';
    
    switch (result.result) {
      case 'green':
        return 'bg-green-50 border-green-200';
      case 'yellow':
        return 'bg-yellow-50 border-yellow-200';
      case 'red':
        return 'bg-red-50 border-red-200';
      default:
        return '';
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Pre-Qualification Tool</h1>
        <p className="text-gray-600 mt-1">
          Quickly assess your customer's financing prospects before submitting a full application.
        </p>
      </div>

      {!result ? (
        <Card>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Input
                label="Customer Name"
                {...register('customer_name', {
                  required: 'Customer name is required',
                })}
                error={errors.customer_name?.message}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Credit Score
                </label>
                <select
                  {...register('estimated_credit_score', {
                    required: 'Credit score estimate is required',
                    valueAsNumber: true,
                  })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                >
                  <option value="">Select credit score range</option>
                  <option value={800}>Excellent (750+)</option>
                  <option value={700}>Good (650-749)</option>
                  <option value={600}>Fair (550-649)</option>
                  <option value={500}>Poor (Below 550)</option>
                </select>
                {errors.estimated_credit_score && (
                  <p className="mt-1 text-sm text-red-600">{errors.estimated_credit_score.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time in Business (Years)
                </label>
                <select
                  {...register('time_in_business', {
                    required: 'Time in business is required',
                    valueAsNumber: true,
                  })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                >
                  <option value="">Select time in business</option>
                  <option value={3}>2+ Years</option>
                  <option value={1.5}>1-2 Years</option>
                  <option value={0.5}>Less than 1 Year</option>
                </select>
                {errors.time_in_business && (
                  <p className="mt-1 text-sm text-red-600">{errors.time_in_business.message}</p>
                )}
              </div>

              <Input
                label="Equipment Price"
                type="number"
                placeholder="0"
                {...register('equipment_price', {
                  required: 'Equipment price is required',
                  valueAsNumber: true,
                  min: { value: 1000, message: 'Minimum equipment price is $1,000' },
                })}
                error={errors.equipment_price?.message}
              />

              <Input
                label="Estimated Down Payment"
                type="number"
                placeholder="0"
                {...register('estimated_down_payment', {
                  required: 'Down payment estimate is required',
                  valueAsNumber: true,
                  min: { value: 0, message: 'Down payment must be positive' },
                })}
                error={errors.estimated_down_payment?.message}
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    How it works
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>
                      This tool uses industry-standard criteria to evaluate financing prospects:
                    </p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li><strong>Green Light:</strong> Strong likelihood of approval</li>
                      <li><strong>Yellow Light:</strong> Possible approval with manual review</li>
                      <li><strong>Red Light:</strong> High likelihood of decline</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" loading={loading} size="lg">
                Check Pre-Qualification
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        <Card className={`border-2 ${getResultColor()}`}>
          <div className="text-center">
            <div className="flex justify-center mb-4">
              {getResultIcon()}
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {result.result.toUpperCase()} LIGHT
            </h2>
            
            <p className="text-lg text-gray-700 mb-6 max-w-2xl mx-auto">
              {result.message}
            </p>

            <div className="flex justify-center space-x-4">
              <Button onClick={handleReset} variant="outline">
                Check Another Customer
              </Button>
              {result.result !== 'red' && (
                <Button 
                  onClick={() => window.location.href = '/deals/new'}
                  className="bg-primary hover:bg-primary/90"
                >
                  Submit Full Application
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Scoring Criteria Card */}
      <Card className="mt-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Scoring Criteria</h3>
        
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Credit Score</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <div>750+ → +2 points</div>
              <div>650-749 → +1 point</div>
              <div>550-649 → 0 points</div>
              <div>&lt;550 → -1 point</div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Time in Business</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <div>2+ years → +1 point</div>
              <div>1-2 years → 0 points</div>
              <div>&lt;1 year → -1 point</div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Down Payment</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <div>20%+ → +1 point</div>
              <div>10-19% → 0 points</div>
              <div>&lt;10% → -1 point</div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Equipment Price</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <div>$25K-$500K → +1 point</div>
              <div>$10K-$25K → 0 points</div>
              <div>Other ranges → -1 point</div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex justify-between items-center text-sm">
            <span className="font-medium">Results:</span>
            <div className="flex space-x-6">
              <span className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                Green: 3+ points
              </span>
              <span className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                Yellow: 0-2 points
              </span>
              <span className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                Red: &lt;0 points
              </span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};