# Run Locally - 3 Steps

## 1. Install (first time only)

```bash
npm install axios cheerio
```

## 2. Configure (optional)

Edit `standalone.config.json` - already set with example stores.

Or add your own Shopify store URLs:

```json
{
  "startUrls": [
    "https://your-medical-store.myshopify.com",
    "https://another-store.com"
  ],
  "maxStores": 10
}
```

## 3. Run

```bash
npm run standalone
```

## Results

Find your leads in:
- `results/leads-[timestamp].json`
- `results/leads-[timestamp].csv`

## Example Output

```
╔═══════════════════════════════════════════════════════╗
║                    RESULTS SUMMARY                    ║
╚═══════════════════════════════════════════════════════╝

Total Leads Found: 8

═══ TOP LEADS ═══

1. Vitality Medical (Score: 85/100)
   🌐 https://vitality-medical.myshopify.com
   📦 45 products | 🏷️  diagnostic, homeEquipment
   📧 info@vitalitymedical.com
   📞 1-800-397-5899

2. 1800Wheelchair (Score: 82/100)
   🌐 https://1800wheelchair.com
   📦 38 products | 🏷️  mobility, homeEquipment
   📧 sales@1800wheelchair.com
```

## Troubleshooting

**No internet**: Can't run without connection
**Timeout errors**: Increase timeout in config to 30000
**No results**: Provide specific store URLs instead of auto-search

## Full Docs

- `LOCAL_SETUP.md` - Complete guide
- `USAGE.md` - Configuration options
- `README.md` - Overview

## Need Cloud/Scale?

For 100+ stores or scheduled runs, see `DEPLOYMENT.md` for Apify setup.
