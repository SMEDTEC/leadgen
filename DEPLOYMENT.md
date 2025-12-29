# Deployment Guide

## Deploying to Apify Platform

### Step 1: Create Apify Account

1. Sign up at https://apify.com
2. Get your API token from Settings > Integrations

### Step 2: Install Apify CLI

```bash
npm install -g apify-cli
```

### Step 3: Login to Apify

```bash
apify login
```

Enter your API token when prompted.

### Step 4: Initialize Actor (if not already done)

```bash
apify init
```

Select "Existing project" and confirm.

### Step 5: Push to Apify

```bash
apify push
```

This will:
- Build the Docker image
- Upload the actor to Apify
- Make it available in your account

### Step 6: Run the Actor

Via Web Console:
1. Go to https://console.apify.com/actors
2. Find "shopify-medical-device-scraper"
3. Click "Start"
4. Configure input JSON
5. Run

Via CLI:
```bash
apify call
```

Via API:
```bash
curl -X POST https://api.apify.com/v2/acts/YOUR_ACTOR_ID/runs \
  -H 'Authorization: Bearer YOUR_API_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "proxy": { "useApifyProxy": true },
    "maxStores": 50
  }'
```

## Local Development

### Run Locally

```bash
# Install dependencies
npm install

# Run the actor
npm start
```

### Test with Sample Input

Create `apify_storage/key_value_stores/default/INPUT.json`:

```json
{
  "proxy": {
    "useApifyProxy": false
  },
  "startUrls": [
    { "url": "https://example.myshopify.com" }
  ],
  "maxStores": 5
}
```

Then run:
```bash
npm start
```

Results will be in `apify_storage/datasets/default/`

### Debug Mode

Enable verbose logging:

```bash
DEBUG=* npm start
```

## Scheduling Runs

### Via Apify Console

1. Open your actor
2. Go to "Schedules" tab
3. Click "Create schedule"
4. Set frequency (daily, weekly, etc.)
5. Configure input
6. Save

### Via API

```javascript
const ApifyClient = require('apify-client');

const client = new ApifyClient({
    token: 'YOUR_API_TOKEN',
});

await client.schedules().create({
    name: 'Daily Medical Store Scrape',
    actorId: 'YOUR_ACTOR_ID',
    cronExpression: '0 9 * * *', // 9 AM daily
    input: {
        proxy: { useApifyProxy: true },
        maxStores: 100
    }
});
```

## Monitoring

### View Runs

```bash
apify runs ls
```

### View Run Details

```bash
apify run info RUN_ID
```

### Download Results

```bash
apify dataset download DATASET_ID
```

## Cost Optimization

### Reduce Compute Time

- Lower `maxStores`
- Disable `extractProducts` if not needed
- Increase `minProductsPerStore`
- Use specific `startUrls` instead of search

### Reduce Proxy Costs

- Use residential proxy only when needed
- Set lower `maxConcurrency`
- Cache results for repeat runs

### Typical Costs (as of 2025)

- 100 stores with products: ~$0.50-1.00
- 1000 stores with products: ~$5-10
- Search + scraping: Higher proxy usage

Actual costs depend on:
- Store sizes
- Product extraction
- Proxy type
- Apify plan

## Webhook Integration

Send results to your CRM/database:

```json
{
  "proxy": { "useApifyProxy": true },
  "maxStores": 50,
  "webhooks": [
    {
      "eventTypes": ["ACTOR.RUN.SUCCEEDED"],
      "requestUrl": "https://your-crm.com/api/leads"
    }
  ]
}
```

## Troubleshooting

### "Actor build failed"

- Check Dockerfile syntax
- Ensure all dependencies in package.json
- Review build logs in Apify console

### "Request failed: 403"

- Enable Apify proxy
- Check if target site blocks scrapers
- Reduce request rate

### "No results returned"

- Verify search keywords are correct
- Check minimum product threshold
- Review actor logs for errors

### "Out of memory"

- Reduce `maxStores`
- Lower `maxProductsPerStore`
- Increase memory in Actor settings

## Updates and Maintenance

### Update Actor

1. Make code changes locally
2. Test locally
3. Push to Apify: `apify push`
4. Test on Apify platform
5. Update version number

### Monitor Performance

- Check success rate
- Review average runtime
- Monitor proxy usage
- Track cost per lead

## Support

For issues:
1. Check Apify documentation: https://docs.apify.com
2. Review actor logs
3. Test locally first
4. Contact Apify support for platform issues
