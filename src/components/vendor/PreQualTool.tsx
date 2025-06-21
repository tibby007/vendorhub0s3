
import React, { useState } from 'react';
import { Calculator } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { PreQualData, PreQualResult, PreQualToolProps } from '@/types/prequal';
import { calculatePreQualification } from '@/utils/prequalCalculation';
import PreQualForm from './PreQualForm';
import PreQualResult from './PreQualResult';
import PreQualDisclaimer from './PreQualDisclaimer';

const PreQualTool = ({ onSubmitApplication }: PreQualToolProps) => {
  const [formData, setFormData] = useState<PreQualData>({
    annualRevenue: '',
    monthsInBusiness: '',
    creditScore: '',
    industry: '',
    loanAmount: '',
    collateral: '',
    personalGuarantee: ''
  });

  const [result, setResult] = useState<PreQualResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const handleInputChange = (field: keyof PreQualData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear result when form changes
    if (result) {
      setResult(null);
    }
  };

  const calculatePreQual = async () => {
    // Validate required fields
    const requiredFields = ['annualRevenue', 'monthsInBusiness', 'creditScore', 'industry', 'loanAmount'];
    const missingFields = requiredFields.filter(field => !formData[field as keyof PreQualData]);
    
    if (missingFields.length > 0) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsCalculating(true);

    try {
      const calculatedResult = await calculatePreQualification(formData);
      setResult(calculatedResult);

      toast({
        title: "Pre-qualification Complete",
        description: calculatedResult.approved ? "Customer appears to qualify" : "Additional requirements needed",
      });

    } catch (error) {
      console.error('Error calculating pre-qualification:', error);
      toast({
        title: "Error",
        description: "Failed to calculate pre-qualification",
        variant: "destructive",
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const resetForm = () => {
    setFormData({
      annualRevenue: '',
      monthsInBusiness: '',
      creditScore: '',
      industry: '',
      loanAmount: '',
      collateral: '',
      personalGuarantee: ''
    });
    setResult(null);
  };

  const handleSubmitApplication = () => {
    if (!result?.approved) return;

    // Prepare customer data from PreQual form
    const customerData = {
      // Business Information
      businessName: '', // This would need to be added to the form
      industry: formData.industry,
      monthsInBusiness: formData.monthsInBusiness,
      annualRevenue: formData.annualRevenue,
      loanAmount: formData.loanAmount,
      
      // Pre-qualification results
      preQualResult: result,
      preQualData: formData
    };

    if (onSubmitApplication) {
      onSubmitApplication(customerData);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Calculator className="w-6 h-6" />
          PreQual Tool
        </h2>
        <p className="text-gray-600">Pre-qualify customers for financing quickly and accurately</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PreQualForm
          formData={formData}
          onInputChange={handleInputChange}
          onCalculate={calculatePreQual}
          onReset={resetForm}
          isCalculating={isCalculating}
        />

        <PreQualResult
          result={result}
          onSubmitApplication={handleSubmitApplication}
        />
      </div>

      <PreQualDisclaimer />
    </div>
  );
};

export default PreQualTool;
