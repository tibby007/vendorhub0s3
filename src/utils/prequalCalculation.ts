
import { PreQualData, PreQualResult } from '@/types/prequal';

export const calculatePreQualification = async (formData: PreQualData): Promise<PreQualResult> => {
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

  return {
    approved,
    confidence,
    reasons: reasons.slice(0, 5), // Limit to top 5 reasons
    recommendedAmount: approved ? loanAmount : (score >= 40 ? recommendedAmount : undefined),
    conditions: conditions.length > 0 ? conditions : undefined
  };
};
