# Local Setup - No Apify Required!

Run the medical device scraper 100% locally without any external services.

## Quick Start

### 1. Install Dependencies

```bash
npm install axios cheerio
```

That's it! Only 2 lightweight packages needed.

### 2. Configure Your Search

Edit `standalone.config.json`:

```json
{
  "startUrls": [
    "https://vitality-medical.myshopify.com",
    "https://1800wheelchair.com"
  ],
  "maxStores": 10,
  "minProductsPerStore": 3,
  "extractProducts": true,
  "extractContactInfo": true
}
```

**Or leave `startUrls` empty to auto-search for stores.**

### 3. Run It!

```bash
npm run standalone
```

Or directly:
```bash
node standalone.js
```

### 4. Get Results

Results are automatically saved to the `results/` folder:
- `leads-[timestamp].json` - Full data
- `leads-[timestamp].csv` - Spreadsheet format

---

## Configuration Options

All options in `standalone.config.json`:

```json
{
  "startUrls": [],              // Specific stores to scrape (empty = auto-search)
  "maxStores": 20,               // Max number of stores to process
  "minProductsPerStore": 3,      // Minimum products required
  "extractProducts": true,       // Extract product details
  "maxProductsPerStore": 30,     // Max products per store
  "extractContactInfo": true,    // Extract email/phone/social
  "timeout": 15000               // Request timeout in ms
}
```

---

## Examples

### Example 1: Quick Test (5 Specific Stores)

```json
{
  "startUrls": [
    "https://vitality-medical.myshopify.com",
    "https://1800wheelchair.com",
    "https://healthproductsforyou.com",
    "https://carewell.com",
    "https://medicalsupplydepot.com"
  ],
  "maxStores": 5,
  "minProductsPerStore": 1,
  "extractProducts": true,
  "extractContactInfo": true
}
```

Runtime: ~2-3 minutes

### Example 2: Auto-Discovery (Find Stores for You)

```json
{
  "startUrls": [],
  "maxStores": 20,
  "minProductsPerStore": 5,
  "extractProducts": true,
  "extractContactInfo": true
}
```

Runtime: ~10-15 minutes (searches Google then scrapes)

### Example 3: Fast Contact-Only Scrape

```json
{
  "startUrls": [
    "https://store1.myshopify.com",
    "https://store2.myshopify.com"
  ],
  "maxStores": 10,
  "extractProducts": false,
  "extractContactInfo": true,
  "minProductsPerStore": 1
}
```

Runtime: ~1-2 minutes

---

## Tips for Best Results

### ✅ DO:
- Start with 5-10 stores for testing
- Provide specific `startUrls` for faster, more reliable results
- Use `minProductsPerStore: 1-3` for niche categories
- Run during off-peak hours to avoid rate limiting

### ❌ DON'T:
- Scrape more than 50 stores at once (breaks politeness)
- Set timeout below 10000ms (too aggressive)
- Leave `startUrls` empty for first test (slower)

---

## What You'll Get

Each lead includes:

```json
{
  "storeName": "Vitality Medical",
  "storeUrl": "https://vitality-medical.myshopify.com",
  "email": "customerservice@vitalitymedical.com",
  "phone": "1-800-397-5899",
  "productCount": 45,
  "products": [
    {
      "name": "Blood Pressure Monitor",
      "price": "$49.99",
      "description": "...",
      "url": "/products/bp-monitor"
    }
  ],
  "categories": ["diagnostic", "homeEquipment"],
  "socialMedia": {
    "facebook": "https://facebook.com/vitalitymedical",
    "instagram": "https://instagram.com/vitalitymedical"
  },
  "leadScore": 85,
  "scrapedAt": "2025-12-29T10:00:00.000Z"
}
```

---

## Troubleshooting

### "Cannot find module 'axios'"

```bash
npm install axios cheerio
```

### "Error: connect ETIMEDOUT"

- Increase `timeout` in config to 30000
- Check your internet connection
- Try fewer stores at once

### "No stores found"

- Provide specific `startUrls` instead of auto-search
- Lower `minProductsPerStore` to 1
- Check that URLs are actually Shopify stores

### "Request failed: 403"

- You're being rate-limited
- Add delays between runs
- Use fewer stores per run
- Provide specific URLs instead of search

---

## How It Works

1. **Fetches** store pages using axios (respectful delays built-in)
2. **Parses** HTML with cheerio (like jQuery for Node.js)
3. **Filters** for medical device keywords (100+ keywords)
4. **Extracts** products, contact info, and social media
5. **Scores** each lead 0-100 based on completeness
6. **Saves** results to `results/` folder

---

## Performance

- **5 stores**: ~2 minutes
- **20 stores**: ~8-10 minutes
- **50 stores**: ~20-25 minutes

Times vary based on store size and product extraction settings.

---

## Comparison: Standalone vs Apify

| Feature | Standalone (Local) | Apify (Cloud) |
|---------|-------------------|---------------|
| **Cost** | Free | ~$1 per 100 stores |
| **Setup** | 30 seconds | 5 minutes |
| **Proxies** | No (your IP) | Yes (rotating) |
| **Speed** | Slower (polite) | Faster (parallel) |
| **Reliability** | May get blocked | High |
| **Best For** | Testing, <50 stores | Production, >100 stores |

---

## Need More?

- For large-scale scraping (100+ stores), use the Apify version
- For scheduling/automation, use Apify or cron jobs
- For proxy support, deploy to Apify

Check `DEPLOYMENT.md` for Apify setup.
