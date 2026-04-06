interface LeadMagnetContent {
  content: string;
  filename: string;
}

export const generateLeadMagnetContent = (type?: string): LeadMagnetContent => {
  switch (type) {
    case 'guide':
      return {
        content: `# Home Buyer's Guide 2025\n\n` +
          `1. Understanding Your Budget\n` +
          `   - Calculate your monthly payments\n` +
          `   - Factor in additional costs\n` +
          `   - Get pre-approved for a mortgage\n\n` +
          `2. Finding the Right Location\n` +
          `   - Research neighborhoods\n` +
          `   - Check local amenities\n` +
          `   - Consider commute times\n\n` +
          `3. The Home Buying Process\n` +
          `   - Working with a realtor\n` +
          `   - Making an offer\n` +
          `   - Home inspection tips\n`,
        filename: 'home-buyers-guide-2024.md'
      };
      
    case 'tool':
      return {
        content: `Property Value Calculator Instructions\n\n` +
          `1. Enter property details\n` +
          `2. Input local market data\n` +
          `3. Review comparable properties\n` +
          `4. Get estimated value range\n`,
        filename: 'property-value-calculator-guide.txt'
      };
      
    case 'report':
      return {
        content: `Market Report - ${new Date().toLocaleDateString()}\n\n` +
          `1. Market Overview\n` +
          `2. Price Trends\n` +
          `3. Inventory Levels\n` +
          `4. Days on Market\n` +
          `5. Future Projections\n`,
        filename: 'market-report.txt'
      };
      
    case 'checklist':
      return {
        content: `Smart Home Search Checklist\n\n` +
          `□ Location preferences\n` +
          `□ Must-have features\n` +
          `□ Deal breakers\n` +
          `□ Budget range\n` +
          `□ School districts\n` +
          `□ Commute times\n`,
        filename: 'home-search-checklist.txt'
      };
      
    case 'interactive':
      return {
        content: `Neighborhood Analysis Guide\n\n` +
          `1. Schools and Education\n` +
          `2. Crime Statistics\n` +
          `3. Local Amenities\n` +
          `4. Property Values\n` +
          `5. Future Development\n`,
        filename: 'neighborhood-analysis.txt'
      };
      
    case 'kit':
      return {
        content: `First-Time Seller's Kit\n\n` +
          `1. Pricing Strategy\n` +
          `2. Home Preparation\n` +
          `3. Marketing Plan\n` +
          `4. Showing Tips\n` +
          `5. Negotiation Guide\n`,
        filename: 'sellers-kit.txt'
      };
      
    case 'calculator':
      return {
        content: `Investment Property ROI Calculator Guide\n\n` +
          `1. Purchase Price\n` +
          `2. Down Payment\n` +
          `3. Monthly Expenses\n` +
          `4. Expected Rent\n` +
          `5. Appreciation Rate\n`,
        filename: 'investment-calculator-guide.txt'
      };
      
    case 'predictor':
      return {
        content: `Market Timing Guide\n\n` +
          `1. Historical Trends\n` +
          `2. Seasonal Patterns\n` +
          `3. Economic Indicators\n` +
          `4. Local Market Factors\n` +
          `5. Prediction Models\n`,
        filename: 'market-timing-guide.txt'
      };
      
    default:
      return {
        content: `Thank you for your interest in our real estate resources!\n`,
        filename: 'resource-guide.txt'
      };
  }
};

export const downloadContent = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};