# Quick Start Guide

## Launch Options

### Option 1: Apify Platform (Recommended for Production)

**1. Install Apify CLI**
```bash
npm install -g apify-cli
```

**2. Login**
```bash
apify login
```
Enter your API token from: https://console.apify.com/account/integrations

**3. Deploy**
```bash
apify push
```

**4. Run on Apify**
- Visit: https://console.apify.com/actors
- Find your actor "shopify-medical-device-scraper"
- Click "Start"
- Use this input:
```json
{
  "proxy": { "useApifyProxy": true },
  "maxStores": 10,
  "extractProducts": true,
  "extractContactInfo": true
}
```

---

### Option 2: Local Development

**1. Install Dependencies**
```bash
npm install
```

**2. Create Test Input**
Create file: `apify_storage/key_value_stores/default/INPUT.json`

```json
{
  "proxy": { "useApifyProxy": false },
  "startUrls": [
    { "url": "https://example.myshopify.com" }
  ],
  "maxStores": 5,
  "extractProducts": true,
  "extractContactInfo": true
}
```

**3. Run**
```bash
npm start
```

**4. View Results**
Results saved to: `apify_storage/datasets/default/`

---

### Option 3: Quick Test with Apify CLI

```bash
# Install dependencies
npm install

# Run with Apify CLI (handles storage automatically)
apify run --purge
```

Then edit input in the prompt or create `.actor/INPUT.json`

---

## Recommended First Run

Start small to test:

```json
{
  "proxy": { "useApifyProxy": true },
  "searchKeywords": [
    "medical devices shopify",
    "diabetes supplies shopify"
  ],
  "maxStores": 10,
  "minProductsPerStore": 5,
  "extractProducts": true,
  "extractContactInfo": true
}
```

Expected runtime: 5-10 minutes for 10 stores

---

## What You'll Get

Each lead includes:
- ✅ Store name and URL
- ✅ Contact email and phone
- ✅ Social media profiles
- ✅ Product catalog
- ✅ Medical device categories
- ✅ Quality score (0-100)

---

## Troubleshooting

**"Command not found: apify"**
```bash
npm install -g apify-cli
```

**"Cannot find module 'apify'"**
```bash
npm install
```

**"No results found"**
- Check your search keywords
- Lower `minProductsPerStore` to 3
- Try specific `startUrls` instead

**Running locally without proxy**
```json
{
  "proxy": { "useApifyProxy": false },
  "startUrls": [
    { "url": "https://known-medical-store.myshopify.com" }
  ],
  "maxStores": 5
}
```

---

## Cost Estimate (Apify)

- **Free tier**: $5 credit/month (enough for ~500 stores)
- **10 stores**: ~$0.10
- **100 stores**: ~$1.00
- **1000 stores**: ~$8-10

Actual costs vary based on product extraction and proxy usage.

---

## Next Steps

1. Start with 10 stores to test
2. Review the results
3. Adjust `searchKeywords` or `medicalCategories` as needed
4. Scale up to 100-1000 stores
5. Set up scheduled runs for ongoing lead generation

For detailed configuration options, see USAGE.md
