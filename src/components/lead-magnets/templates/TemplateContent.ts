export const getTemplateContent = (type: string) => {
  switch (type) {
    case "calculator":
      return `# Property Value Calculator

## Property Details

1. Basic Information
   □ Address: _____________________
   □ Square Footage: ______________ sq ft
   □ Bedrooms: __________________
   □ Bathrooms: _________________
   □ Year Built: _________________
   □ Lot Size: __________________ sq ft

2. Property Condition (select one)
   □ Excellent (Recently renovated/updated)
   □ Good (Well-maintained)
   □ Fair (Some updates needed)
   □ Poor (Major updates needed)

3. Recent Improvements
   □ Kitchen Remodel (Year: _____)
   □ Bathroom Remodel (Year: _____)
   □ New Roof (Year: _____)
   □ HVAC Replacement (Year: _____)
   □ Other: ____________________

4. Market Factors
   □ Recent comparable sales in your area
     - Similar home 1: $_________
     - Similar home 2: $_________
     - Similar home 3: $_________
   
   □ Average price per square foot in area: $_______

5. Location Features
   □ School District Rating: _____/10
   □ Distance to amenities
     - Shopping: _____ miles
     - Public Transit: _____ miles
     - Parks/Recreation: _____ miles

6. Estimated Value Calculation

   Base Value (sq ft × avg price per sq ft):     $_________
   
   Condition Adjustments:
   □ Excellent: +10%
   □ Good: +5%
   □ Fair: -5%
   □ Poor: -10%                                  $_________

   Improvements Value:
   □ Kitchen: $___________
   □ Bathrooms: $___________
   □ Roof: $___________
   □ HVAC: $___________
   □ Other: $___________                         $_________

   Location Adjustments:
   □ School Rating Bonus: $___________
   □ Amenities Proximity: $___________            $_________

   ESTIMATED MARKET VALUE:                        $_________

Need a professional opinion? Contact our team for a detailed market analysis and personalized valuation of your property.

Contact Information:
Name: ____________________
Email: ___________________
Phone: ___________________

Note: This calculator provides an estimate based on current market data. Actual property value may vary based on additional factors and market conditions.`;

    case "tool":
      return `# Property Value Calculator Guide

## Introduction
This comprehensive property valuation tool helps you estimate your home's current market value using advanced algorithms and local market data.

## How to Use This Calculator
1. Property Details
   □ Enter square footage
   □ Number of bedrooms and bathrooms
   □ Year built
   □ Recent upgrades or renovations

2. Location Analysis
   □ Input your address
   □ Review neighborhood statistics
   □ Check nearby amenities
   □ School district ratings

3. Market Comparison
   □ Recent sales in your area
   □ Current market trends
   □ Days on market analysis
   □ Price per square foot comparison

4. Value Adjustments
   □ Property condition
   □ Special features
   □ Seasonal market factors
   □ Economic indicators

## Tips for Accurate Valuation
- Update property information regularly
- Consider recent home improvements
- Monitor local market changes
- Factor in seasonal trends

Need professional assistance? Contact our team for a detailed market analysis.`;

    case "checklist":
      return `# Ultimate Home Buyer's Checklist 2025

## Pre-Search Preparation
□ Get pre-approved for a mortgage
□ Calculate total monthly payment budget
□ List must-have features
□ Research target neighborhoods

## Property Requirements
□ Minimum square footage: _____
□ Number of bedrooms: _____
□ Number of bathrooms: _____
□ Parking requirements: _____
□ Lot size: _____

## Location Priorities
□ School district quality
□ Commute time to work
□ Public transportation access
□ Shopping and amenities
□ Parks and recreation
□ Future development plans

## Financial Considerations
□ Down payment amount: _____
□ Monthly payment budget: _____
□ Property tax estimates
□ Insurance costs
□ HOA fees (if applicable)
□ Maintenance reserves

## Home Viewing Checklist
□ Natural lighting
□ Storage space
□ Room sizes
□ Kitchen layout
□ Bathroom conditions
□ HVAC system age
□ Roof condition
□ Foundation status

## Next Steps
□ Schedule home viewings
□ Research property history
□ Contact home inspector
□ Review neighborhood comps
□ Prepare offer strategy

Remember to take photos and notes during each viewing!`;

    case "expat-guide":
      return `# Complete US Relocation Guide for International Clients

## Pre-Arrival Checklist
□ Visa and Immigration
   □ Verify visa status and requirements
   □ Schedule necessary appointments
   □ Prepare required documentation
   □ Set up mail forwarding

□ Essential Documents
   □ Valid passport
   □ Birth certificates
   □ Marriage certificate (if applicable)
   □ Academic credentials
   □ Medical records
   □ Driver's license

## First Week in the US
□ Legal Requirements
   □ Apply for Social Security Number
   □ Register with local authorities
   □ Update immigration status (if required)

□ Banking and Finance
   □ Open US bank account
   □ Set up credit card
   □ Understand credit building process
   □ Transfer funds internationally
   □ Tax obligations overview

## Housing Guide
□ Temporary Accommodation
   □ Research short-term rentals
   □ Book temporary housing
   □ Understand lease terms

□ Permanent Housing Search
   □ Define budget range: $_____
   □ Preferred neighborhoods: _____
   □ School district requirements
   □ Commute considerations
   □ Required amenities

## Healthcare Setup
□ Insurance Options
   □ Compare health plans
   □ Dental coverage
   □ Vision care
   □ Emergency contacts

□ Medical Setup
   □ Find primary care physician
   □ Locate nearest hospital
   □ Transfer medical records
   □ List important medications

## Daily Life Establishment
□ Transportation
   □ Public transit options
   □ Car purchase/lease planning
   □ Driver's license requirements
   □ Insurance requirements

□ Utilities and Services
   □ Electricity setup
   □ Water service
   □ Internet/cable
   □ Mobile phone plan
   □ Streaming services

## Community Integration
□ Social Network
   □ Join expat groups
   □ Explore community centers
   □ Find cultural organizations
   □ Research local events

□ Family Support
   □ School enrollment
   □ Childcare options
   □ Pet registration
   □ Recreation activities

## Cultural Adaptation Tips
- Understanding tipping culture
- American business etiquette
- Social customs and norms
- Holiday celebrations
- Local emergency numbers

Need personalized assistance with your relocation? Contact our international relocation specialists!`;

    default:
      return `# [Template Name]

## Overview
[Brief description of the template's purpose]

## Key Sections
1. [Section 1]
   □ Point 1
   □ Point 2
   □ Point 3

2. [Section 2]
   □ Point 1
   □ Point 2
   □ Point 3

## Notes
[Additional information or instructions]

Need assistance? Contact our team for personalized help!`;
  }
};
