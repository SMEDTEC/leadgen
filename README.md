# Shopify Medical Device Lead Generator

This project scrapes Shopify stores to identify businesses selling medical devices for consumer use. It leverages Apify's web scraping infrastructure to find and extract relevant store information.

## Overview

The lead generator targets Shopify stores selling:
- Home medical devices (blood pressure monitors, thermometers, pulse oximeters)
- Mobility aids (wheelchairs, walkers, canes)
- Diabetic supplies (glucose monitors, insulin pumps)
- Respiratory equipment (nebulizers, CPAP machines, oxygen concentrators)
- First aid and wound care products
- Diagnostic equipment for home use
- Health monitoring wearables
- Medical supplies and consumables

## Features

- **Automated Discovery**: Finds Shopify stores through Google search and product listings
- **Medical Device Filtering**: Identifies stores selling medical devices using keyword matching
- **Store Validation**: Verifies stores are active and selling to consumers
- **Contact Extraction**: Captures store contact information and social media links
- **Product Analysis**: Extracts product categories, pricing, and inventory data
- **Lead Scoring**: Ranks stores based on product variety and engagement metrics

## Architecture

```
┌─────────────────┐
│  Search Engine  │ → Find Shopify stores with medical keywords
└────────┬────────┘
         │
┌────────▼────────┐
│  Store Scraper  │ → Extract store details and product data
└────────┬────────┘
         │
┌────────▼────────┐
│ Medical Filter  │ → Identify medical device stores
└────────┬────────┘
         │
┌────────▼────────┐
│  Lead Database  │ → Store qualified leads
└─────────────────┘
```

## Setup

### Prerequisites
- Apify account (https://apify.com)
- Node.js 18+ (for local development)

### Installation

1. Clone this repository:
```bash
git clone <your-repo-url>
cd leadgen
```

2. Install dependencies:
```bash
npm install
```

3. Configure Apify credentials:
```bash
export APIFY_TOKEN=your_api_token
```

## Usage

### Running on Apify Platform

1. Upload the actor to Apify
2. Configure the input JSON (see `input-examples/`)
3. Run the actor and collect results

### Input Configuration

```json
{
  "proxy": {
    "useApifyProxy": true
  },
  "searchKeywords": [
    "medical devices",
    "home healthcare",
    "medical supplies"
  ],
  "maxStores": 100,
  "extractProducts": true,
  "minProductsPerStore": 5
}
```

### Output Format

```json
{
  "storeName": "Example Medical Supply",
  "storeUrl": "https://example.myshopify.com",
  "email": "contact@example.com",
  "phone": "+1-555-0123",
  "products": [
    {
      "name": "Digital Blood Pressure Monitor",
      "price": "$49.99",
      "category": "Diagnostic Equipment"
    }
  ],
  "socialMedia": {
    "facebook": "https://facebook.com/example",
    "instagram": "https://instagram.com/example"
  },
  "leadScore": 85
}
```

## Medical Device Categories

The scraper identifies stores based on these categories:
- Diagnostic & Monitoring
- Mobility & Accessibility
- Respiratory Care
- Diabetes Management
- Wound Care & First Aid
- Home Medical Equipment
- Personal Protective Equipment
- Medical Consumables

## Contributing

Contributions are welcome! Please submit pull requests or open issues for improvements.

## License

MIT License
