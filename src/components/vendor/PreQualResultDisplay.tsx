import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calculator, AlertCircle, CheckCircle, XCircle, FileText } from 'lucide-react';
import { PreQualResult } from '@/types/prequal';

interface PreQualResultDisplayProps {
  result: PreQualResult | null;
  onSubmitApplication: () => void;
}

const PreQualResultDisplay = ({ result, onSubmitApplication }: PreQualResultDisplayProps) => {
  
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

            {/* Submit Application Button - Only show if approved */}
            {result.approved && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-green-900">Ready to Submit Application</h4>
                    <p className="text-sm text-green-700">Customer meets pre-qualification criteria</p>
                  </div>
                  <Button 
                    onClick={onSubmitApplication}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Submit Application
                  </Button>
                </div>
              </div>
            )}

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
                  Customer meets pre-qualification criteria. Click "Submit Application" to proceed with full application.
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
  );
};

export default PreQualResultDisplay;
