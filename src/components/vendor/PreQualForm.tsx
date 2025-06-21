
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator, RefreshCw } from 'lucide-react';
import { PreQualData } from '@/types/prequal';

interface PreQualFormProps {
  formData: PreQualData;
  onInputChange: (field: keyof PreQualData, value: string) => void;
  onCalculate: () => void;
  onReset: () => void;
  isCalculating: boolean;
}

const PreQualForm = ({ formData, onInputChange, onCalculate, onReset, isCalculating }: PreQualFormProps) => {
  return (
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
            onChange={(e) => onInputChange('annualRevenue', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="monthsInBusiness">Months in Business *</Label>
          <Input
            id="monthsInBusiness"
            type="number"
            placeholder="24"
            value={formData.monthsInBusiness}
            onChange={(e) => onInputChange('monthsInBusiness', e.target.value)}
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
            onChange={(e) => onInputChange('creditScore', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="industry">Industry *</Label>
          <Select value={formData.industry} onValueChange={(value) => onInputChange('industry', value)}>
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
            onChange={(e) => onInputChange('loanAmount', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="collateral">Collateral Available</Label>
          <Select value={formData.collateral} onValueChange={(value) => onInputChange('collateral', value)}>
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
          <Select value={formData.personalGuarantee} onValueChange={(value) => onInputChange('personalGuarantee', value)}>
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
            onClick={onCalculate} 
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
          <Button variant="outline" onClick={onReset}>
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PreQualForm;
