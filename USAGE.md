# Usage Guide

## Quick Start

### Option 1: Use Provided Shopify Store URLs

If you already know specific Shopify stores selling medical devices:

```json
{
  "proxy": {
    "useApifyProxy": true
  },
  "startUrls": [
    {
      "url": "https://example.myshopify.com"
    }
  ],
  "maxStores": 10,
  "extractProducts": true,
  "extractContactInfo": true
}
```

### Option 2: Auto-Discovery via Search

Let the scraper find stores for you:

```json
{
  "proxy": {
    "useApifyProxy": true
  },
  "searchKeywords": [
    "medical devices shopify",
    "home healthcare shopify"
  ],
  "maxStores": 50,
  "extractProducts": true,
  "extractContactInfo": true,
  "minProductsPerStore": 5
}
```

## Configuration Options

### Required Settings

- **proxy**: Proxy configuration (use Apify proxy recommended)
  ```json
  "proxy": {
    "useApifyProxy": true
  }
  ```

### Optional Settings

- **startUrls**: Array of specific Shopify store URLs to scrape
  - Default: `[]` (will use search instead)

- **searchKeywords**: Search queries to find Shopify stores
  - Default: Pre-configured medical device searches
  - Only used if `startUrls` is empty

- **maxStores**: Maximum number of stores to process
  - Default: `100`
  - Range: 1-1000

- **minProductsPerStore**: Minimum products required to include a store
  - Default: `5`
  - Use lower values for niche stores

- **extractProducts**: Whether to extract product details
  - Default: `true`

- **maxProductsPerStore**: Maximum products to extract per store
  - Default: `50`
  - Range: 1-500

- **extractContactInfo**: Whether to extract contact information
  - Default: `true`

- **medicalCategories**: Filter for specific medical categories
  - Default: All categories
  - Options: `diagnostic`, `mobility`, `respiratory`, `diabetes`, `woundCare`, `homeEquipment`

## Use Cases

### 1. Find All Medical Device Stores

Best for broad lead generation:

```json
{
  "proxy": { "useApifyProxy": true },
  "maxStores": 200,
  "minProductsPerStore": 10,
  "extractProducts": true,
  "extractContactInfo": true
}
```

### 2. Target Specific Category (Diabetes)

```json
{
  "proxy": { "useApifyProxy": true },
  "searchKeywords": [
    "site:myshopify.com diabetes supplies",
    "site:myshopify.com glucose monitor"
  ],
  "medicalCategories": ["diabetes"],
  "maxStores": 100
}
```

### 3. Validate Known Stores

Check if stores you know about sell medical devices:

```json
{
  "proxy": { "useApifyProxy": true },
  "startUrls": [
    { "url": "https://store1.myshopify.com" },
    { "url": "https://store2.myshopify.com" }
  ],
  "minProductsPerStore": 1
}
```

### 4. High-Quality Leads Only

Focus on established stores with good contact info:

```json
{
  "proxy": { "useApifyProxy": true },
  "maxStores": 50,
  "minProductsPerStore": 20,
  "extractProducts": true,
  "extractContactInfo": true
}
```

## Understanding Lead Scores

Leads are scored 0-100 based on:

- **Email found**: +20 points
- **Phone found**: +15 points
- **Social media**: +10 per platform (max 30)
- **Products**: +0.5 per product (max 30)
- **Categories**: +10 per medical category
- **About page**: +5 points
- **Contact page**: +10 points

**Score Interpretation:**
- **80-100**: Excellent lead - established store with complete info
- **60-79**: Good lead - decent product catalog and some contact info
- **40-59**: Average lead - basic information available
- **0-39**: Low quality - limited information or small catalog

## Output Format

Each lead contains:

```json
{
  "storeName": "Medical Supply Store",
  "storeUrl": "https://example.myshopify.com",
  "email": "contact@example.com",
  "phone": "+1-555-0123",
  "socialMedia": {
    "facebook": "https://facebook.com/example",
    "instagram": "https://instagram.com/example"
  },
  "productCount": 45,
  "products": [
    {
      "name": "Digital Blood Pressure Monitor",
      "price": "$49.99",
      "description": "Automatic upper arm monitor...",
      "url": "/products/blood-pressure-monitor",
      "image": "https://cdn.shopify.com/..."
    }
  ],
  "categories": ["diagnostic", "homeEquipment"],
  "leadScore": 85,
  "scrapedAt": "2025-12-29T10:00:00.000Z"
}
```

## Tips for Best Results

1. **Use Apify Proxy**: Always enable `useApifyProxy` to avoid being blocked
2. **Start Small**: Test with `maxStores: 10` first
3. **Adjust Minimums**: Lower `minProductsPerStore` for niche categories
4. **Category Focus**: Use `medicalCategories` to target specific markets
5. **Contact Info**: Enable `extractContactInfo` for sales-ready leads
6. **Monitor Progress**: Check Apify logs for real-time progress

## Common Issues

### No Stores Found

- Try different `searchKeywords`
- Lower `minProductsPerStore` threshold
- Provide specific `startUrls` if you know stores

### Too Many Irrelevant Stores

- Increase `minProductsPerStore`
- Focus on specific `medicalCategories`
- Use more specific `searchKeywords`

### Missing Contact Information

- Some stores hide contact info
- Check store websites manually for hidden contact pages
- Look in footer or checkout pages

## Advanced: Custom Search Queries

Format: `"site:myshopify.com [your keywords]"`

Examples:
- `"site:myshopify.com CPAP machine"`
- `"site:myshopify.com wheelchair accessible"`
- `"site:myshopify.com medical grade thermometer"`

The scraper will use Google to find matching Shopify stores.
