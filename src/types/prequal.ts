
export interface PreQualData {
  annualRevenue: string;
  monthsInBusiness: string;
  creditScore: string;
  industry: string;
  loanAmount: string;
  collateral: string;
  personalGuarantee: string;
}

export interface PreQualResult {
  approved: boolean;
  confidence: number;
  reasons: string[];
  recommendedAmount?: number;
  conditions?: string[];
}

export interface PreQualToolProps {
  onSubmitApplication?: (customerData: any) => void;
}
