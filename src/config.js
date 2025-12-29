/**
 * Medical Device Keywords and Configuration
 * Used to identify Shopify stores selling medical devices for consumer use
 */

module.exports = {
  // Medical device product keywords for filtering
  MEDICAL_KEYWORDS: [
    // Diagnostic & Monitoring
    'blood pressure monitor',
    'thermometer',
    'pulse oximeter',
    'glucose monitor',
    'blood sugar',
    'stethoscope',
    'otoscope',
    'heart rate monitor',
    'ecg monitor',
    'medical scale',

    // Respiratory Care
    'nebulizer',
    'cpap',
    'bipap',
    'oxygen concentrator',
    'pulse oximeter',
    'spirometer',
    'peak flow meter',
    'humidifier medical',

    // Mobility & Accessibility
    'wheelchair',
    'walker',
    'rollator',
    'cane',
    'crutches',
    'mobility scooter',
    'lift chair',
    'transfer bench',
    'grab bar',
    'hospital bed',

    // Diabetes Management
    'insulin pump',
    'glucose meter',
    'diabetic supplies',
    'test strips',
    'lancets',
    'continuous glucose monitor',
    'insulin syringe',

    // Wound Care & First Aid
    'wound care',
    'bandages',
    'gauze',
    'medical tape',
    'compression stockings',
    'compression wrap',
    'first aid kit',
    'sterile dressing',

    // Home Medical Equipment
    'hospital bed',
    'patient lift',
    'bedpan',
    'urinal',
    'commode',
    'shower chair',
    'medical supplies',
    'incontinence',

    // Personal Protective Equipment
    'medical mask',
    'n95 mask',
    'surgical mask',
    'medical gloves',
    'face shield',
    'protective gown',

    // Pain Management & Therapy
    'tens unit',
    'heating pad medical',
    'cold therapy',
    'massage therapy',
    'ultrasound therapy',

    // General Medical
    'medical device',
    'healthcare product',
    'home healthcare',
    'medical equipment',
    'durable medical equipment',
    'dme'
  ],

  // Category keywords for classification
  CATEGORIES: {
    diagnostic: [
      'blood pressure',
      'thermometer',
      'glucose',
      'oximeter',
      'stethoscope',
      'otoscope',
      'monitor',
      'test'
    ],
    mobility: [
      'wheelchair',
      'walker',
      'rollator',
      'cane',
      'crutches',
      'scooter',
      'lift'
    ],
    respiratory: [
      'nebulizer',
      'cpap',
      'bipap',
      'oxygen',
      'breathing',
      'respiratory'
    ],
    diabetes: [
      'diabetes',
      'diabetic',
      'insulin',
      'glucose',
      'blood sugar'
    ],
    woundCare: [
      'wound',
      'bandage',
      'gauze',
      'dressing',
      'compression',
      'first aid'
    ],
    homeEquipment: [
      'hospital bed',
      'patient lift',
      'commode',
      'shower chair',
      'medical supplies'
    ]
  },

  // Google search queries for finding Shopify medical stores
  SEARCH_QUERIES: [
    'site:myshopify.com "medical devices"',
    'site:myshopify.com "home healthcare"',
    'site:myshopify.com "medical supplies"',
    'site:myshopify.com "mobility aids"',
    'site:myshopify.com "diabetes supplies"',
    'site:myshopify.com "blood pressure monitor"',
    'site:myshopify.com "wheelchair" OR "walker"',
    'site:myshopify.com "nebulizer" OR "cpap"',
    'site:myshopify.com "wound care supplies"',
    'site:myshopify.com "first aid medical"',
    'site:myshopify.com "pulse oximeter"',
    'site:myshopify.com "glucose monitor"',
    'site:myshopify.com "durable medical equipment"'
  ],

  // Patterns to extract contact information
  CONTACT_PATTERNS: {
    email: /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi,
    phone: /(\+?1?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4})/g,
    facebook: /(?:https?:\/\/)?(?:www\.)?facebook\.com\/([a-zA-Z0-9._-]+)/i,
    instagram: /(?:https?:\/\/)?(?:www\.)?instagram\.com\/([a-zA-Z0-9._-]+)/i,
    twitter: /(?:https?:\/\/)?(?:www\.)?twitter\.com\/([a-zA-Z0-9._-]+)/i,
    linkedin: /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/company\/([a-zA-Z0-9._-]+)/i
  },

  // Scoring weights for lead quality
  LEAD_SCORING: {
    hasEmail: 20,
    hasPhone: 15,
    hasSocialMedia: 10,
    perProduct: 0.5, // 0.5 points per product
    perCategory: 10, // 10 points per medical category
    hasAboutPage: 5,
    hasContactPage: 10,
    maxScore: 100
  },

  // Pages to check for contact information
  CONTACT_PAGES: [
    '/pages/contact',
    '/pages/contact-us',
    '/pages/about',
    '/pages/about-us',
    '/pages/our-story',
    '/pages/faq',
    '/pages/customer-service'
  ]
};
