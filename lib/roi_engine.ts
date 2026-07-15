export const calculatePropertyMetrics = (price: number, rental: number, is13sex: boolean) => {
  // Annual rental income
  const annualRental = rental * 12;
  
  // Gross Yield
  const grossYield = price > 0 ? (annualRental / price) * 100 : 0;
  
  // Section 13sex Tax Benefit (5% of 55% of purchase price annually)
  const annualTaxWriteOff = is13sex ? (price * 0.55) * 0.05 : 0;
  
  return {
    grossYield: grossYield.toFixed(2),
    annualIncome: annualRental.toLocaleString(),
    taxBenefit: annualTaxWriteOff.toLocaleString(),
    monthlyCashflow: (rental - (price * 0.009)).toFixed(0) // Rough estimate minus 0.9% bond/exp
  };
};