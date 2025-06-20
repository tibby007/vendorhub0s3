
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calculator, AlertCircle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface PreQualData {
  annualRevenue: string;
  monthsInBusiness: string;
  creditScore: string;
  industry: string;
  loanAmount: string;
  collateral: string;
  personalGuarantee: string;
}

interface PreQualResult {
  approved: boolean;
  confidence: number;
  reasons: string[];
  recommendedAmount?: number;
  conditions?: string[];
}

const PreQualTool = () => {
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
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Pre-qualification logic
      const revenue = parseFloat(formData.annualRevenue);
      const months = parseInt(formData.monthsInBusiness);
      const credit = parseInt(formData.creditScore);
      const loanAmount = parseFloat(formData.loanAmount);

      let score = 0;
      const reasons: string[] = [];
      const conditions: string[] = [];

      // Revenue criteria (30% weight)
      if (revenue >= 500000) {
        score += 30;
        reasons.push("Strong annual revenue");
      } else if (revenue >= 250000) {
        score += 20;
        reasons.push("Adequate annual revenue");
      } else if (revenue >= 100000) {
        score += 10;
        reasons.push("Moderate annual revenue");
        conditions.push("Additional financial documentation required");
      } else {
        reasons.push("Low annual revenue");
        conditions.push("Collateral or co-signer required");
      }

      // Time in business criteria (25% weight)
      if (months >= 24) {
        score += 25;
        reasons.push("Established business history");
      } else if (months >= 12) {
        score += 15;
        reasons.push("Adequate business history");
      } else if (months >= 6) {
        score += 8;
        reasons.push("Limited business history");
        conditions.push("Personal guarantee required");
      } else {
        reasons.push("Very limited business history");
        conditions.push("Strong collateral and personal guarantee required");
      }

      // Credit score criteria (25% weight)
      if (credit >= 750) {
        score += 25;
        reasons.push("Excellent credit score");
      } else if (credit >= 700) {
        score += 20;
        reasons.push("Good credit score");
      } else if (credit >= 650) {
        score += 15;
        reasons.push("Fair credit score");
      } else if (credit >= 600) {
        score += 10;
        reasons.push("Below average credit score");
        conditions.push("Higher interest rate may apply");
      } else {
        reasons.push("Poor credit score");
        conditions.push("Significant collateral required");
      }

      // Loan to revenue ratio (20% weight)
      const loanToRevenueRatio = loanAmount / revenue;
      if (loanToRevenueRatio <= 0.25) {
        score += 20;
        reasons.push("Conservative loan amount");
      } else if (loanToRevenueRatio <= 0.5) {
        score += 15;
        reasons.push("Reasonable loan amount");
      } else if (loanToRevenueRatio <= 0.75) {
        score += 10;
        reasons.push("Higher loan amount");
        conditions.push("Detailed cash flow analysis required");
      } else {
        reasons.push("Very high loan amount relative to revenue");
        conditions.push("Strong justification and collateral required");
      }

      // Industry adjustments
      const highRiskIndustries = ['restaurant', 'retail', 'construction'];
      const lowRiskIndustries = ['healthcare', 'technology', 'professional_services'];
      
      if (lowRiskIndustries.includes(formData.industry)) {
        score += 5;
        reasons.push("Low-risk industry");
      } else if (highRiskIndustries.includes(formData.industry)) {
        score -= 5;
        reasons.push("Higher-risk industry");
        conditions.push("Industry-specific requirements may apply");
      }

      // Collateral and personal guarantee adjustments
      if (formData.collateral === 'yes') {
        score += 5;
        reasons.push("Collateral available");
      }
      
      if (formData.personalGuarantee === 'yes') {
        score += 5;
        reasons.push("Personal guarantee provided");
      }

      // Determine approval
      const approved = score >= 60;
      const confidence = Math.min(score, 100);

      // Calculate recommended amount
      let recommendedAmount = loanAmount;
      if (!approved && score >= 40) {
        recommendedAmount = loanAmount * 0.7; // Suggest 70% of requested amount
        conditions.push(`Consider reducing loan amount to $${recommendedAmount.toLocaleString()}`);
      }

      setResult({
        approved,
        confidence,
        reasons: reasons.slice(0, 5), // Limit to top 5 reasons
        recommendedAmount: approved ? loanAmount : (score >= 40 ? recommendedAmount : undefined),
        conditions: conditions.length > 0 ? conditions : undefined
      });

      toast({
        title: "Pre-qualification Complete",
        description: approved ? "Customer appears to qualify" : "Additional requirements needed",
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

  const getResultIcon = () => {
    if (!result) return null;
    
    if (result.approved) {
      return <CheckCircle className="w-6 h-6 text-green-600" />;
    } else if (result.confidence >= 40) {
      return <AlertCircle className="w-6 h-6 text-yellow-600" />;
    } else {
      return <XCircle className="w-6 h-6 text-red-600" />;
    }
  };

  const getResultColor = () => {
    if (!result) return '';
    
    if (result.approved) {
      return 'text-green-600 bg-green-50 border-green-200';
    } else if (result.confidence >= 40) {
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    } else {
      return 'text-red-600 bg-red-50 border-red-200';
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
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
            <CardDescription>Enter customer details for pre-qualification</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="annualRevenue">Annual Revenue *</Label>
              <Input
                id="annualRevenue"
                type="number"
                placeholder="250000"
                value={formData.annualRevenue}
                onChange={(e) => handleInputChange('annualRevenue', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthsInBusiness">Months in Business *</Label>
              <Input
                id="monthsInBusiness"
                type="number"
                placeholder="24"
                value={formData.monthsInBusiness}
                onChange={(e) => handleInputChange('monthsInBusiness', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="creditScore">Credit Score *</Label>
              <Input
                id="creditScore"
                type="number"
                placeholder="720"
                min="300"
                max="850"
                value={formData.creditScore}
                onChange={(e) => handleInputChange('creditScore', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">Industry *</Label>
              <Select value={formData.industry} onValueChange={(value) => handleInputChange('industry', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                  <SelectItem value="professional_services">Professional Services</SelectItem>
                  <SelectItem value="manufacturing">Manufacturing</SelectItem>
                  <SelectItem value="retail">Retail</SelectItem>
                  <SelectItem value="restaurant">Restaurant</SelectItem>
                  <SelectItem value="construction">Construction</SelectItem>
                  <SelectItem value="transportation">Transportation</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="loanAmount">Requested Loan Amount *</Label>
              <Input
                id="loanAmount"
                type="number"
                placeholder="100000"
                value={formData.loanAmount}
                onChange={(e) => handleInputChange('loanAmount', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="collateral">Collateral Available</Label>
              <Select value={formData.collateral} onValueChange={(value) => handleInputChange('collateral', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="personalGuarantee">Personal Guarantee</Label>
              <Select value={formData.personalGuarantee} onValueChange={(value) => handleInputChange('personalGuarantee', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                onClick={calculatePreQual} 
                disabled={isCalculating}
                className="flex-1"
              >
                {isCalculating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Calculating...
                  </>
                ) : (
                  <>
                    <Calculator className="w-4 h-4 mr-2" />
                    Calculate PreQual
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={resetForm}>
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle>Pre-qualification Result</CardTitle>
            <CardDescription>AI-powered qualification assessment</CardDescription>
          </CardHeader>
          <CardContent>
            {!result ? (
              <div className="text-center py-12 text-gray-500">
                <Calculator className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Enter customer information and click "Calculate PreQual" to see results</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Overall Result */}
                <div className={`p-4 rounded-lg border-2 ${getResultColor()}`}>
                  <div className="flex items-center gap-3 mb-2">
                    {getResultIcon()}
                    <h3 className="font-semibold text-lg">
                      {result.approved ? 'Pre-Qualified' : result.confidence >= 40 ? 'Conditional Approval' : 'Does Not Qualify'}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Confidence Score:</span>
                    <Badge variant={result.confidence >= 70 ? 'default' : result.confidence >= 40 ? 'secondary' : 'destructive'}>
                      {result.confidence}%
                    </Badge>
                  </div>
                </div>

                {/* Recommended Amount */}
                {result.recommendedAmount && (
                  <div>
                    <h4 className="font-medium mb-2">Recommended Loan Amount</h4>
                    <p className="text-2xl font-bold text-green-600">
                      ${result.recommendedAmount.toLocaleString()}
                    </p>
                  </div>
                )}

                {/* Reasons */}
                <div>
                  <h4 className="font-medium mb-2">Key Factors</h4>
                  <ul className="space-y-1">
                    {result.reasons.map((reason, index) => (
                      <li key={index} className="text-sm flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Conditions */}
                {result.conditions && result.conditions.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Conditions & Requirements</h4>
                    <ul className="space-y-1">
                      {result.conditions.map((condition, index) => (
                        <li key={index} className="text-sm flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                          {condition}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Next Steps */}
                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Next Steps</h4>
                  {result.approved ? (
                    <p className="text-sm text-gray-600">
                      Customer meets pre-qualification criteria. Proceed with full application.
                    </p>
                  ) : result.confidence >= 40 ? (
                    <p className="text-sm text-gray-600">
                      Customer may qualify with conditions. Consider discussing requirements with customer.
                    </p>
                  ) : (
                    <p className="text-sm text-gray-600">
                      Customer does not meet current criteria. Consider alternative financing options.
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Disclaimer */}
      <Card className="bg-gray-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-gray-600">
              <p className="font-medium mb-1">Disclaimer</p>
              <p>
                This pre-qualification tool provides an estimate based on the information provided. 
                Final approval is subject to full underwriting review, verification of information, 
                and additional requirements. This is not a guarantee of financing.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PreQualTool;
