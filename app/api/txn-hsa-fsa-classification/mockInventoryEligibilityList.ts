// Mock MCC (Merchant Category Code) list for HSA/FSA merchant eligibility
export const mockMccEligibilityList = [
  {
    mcc: '5912',
    description: 'Drug Stores and Pharmacies',
    eligible: true,
  },
  {
    mcc: '8011',
    description: 'Doctors and Physicians',
    eligible: true,
  },
  {
    mcc: '8021',
    description: 'Dentists and Orthodontists',
    eligible: true,
  },
  {
    mcc: '8062',
    description: 'Hospitals',
    eligible: true,
  },
];


// Mock inventory eligibility list for HSA/FSA wellness products
export const mockInventoryEligibilityList = [
  {
    id: 'product-001',
    sku: '1001',
    upc: '10011001',
    name: 'Blood Pressure Monitor',
    category: 'Medical Devices',
    eligible: true,
    needsLmn: true,
    description: 'Mat designed for acupressure therapy to relieve stress and pain.',
  },
  {
    id: 'product-002',
    sku: '1002',
    upc: '10021002',
    name: 'First Aid Kit',
    category: 'Medical Supplies',
    eligible: true,
    needsLmn: false,
    description: 'Comprehensive kit for minor injuries and emergencies.',
  },
  {
    id: 'product-003',
    sku: '1003',
    upc: '10031003',
    name: 'Therapeutic Massager',
    category: 'Wellness',
    eligible: true,
    needsLmn: false,
    description: 'Handheld device for muscle relaxation and pain relief.',
  },
];

