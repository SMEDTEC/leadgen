/**
 * Standalone Shopify Medical Device Scraper
 * No Apify required - runs 100% locally
 */

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const path = require('path');

// Import our config
const config = require('./src/config');
const { extractStoreInfo, extractProducts, extractContactInfo, calculateLeadScore, isMedicalStore } = require('./src/utils');

class StandaloneScraper {
    constructor(options = {}) {
        this.options = {
            maxStores: options.maxStores || 50,
            minProductsPerStore: options.minProductsPerStore || 5,
            extractProducts: options.extractProducts !== false,
            maxProductsPerStore: options.maxProductsPerStore || 50,
            extractContactInfo: options.extractContactInfo !== false,
            timeout: options.timeout || 10000,
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            ...options
        };

        this.leads = [];
        this.processedStores = new Set();
    }

    /**
     * Make HTTP request with retry logic
     */
    async fetchPage(url, retries = 3) {
        for (let i = 0; i < retries; i++) {
            try {
                console.log(`Fetching: ${url}`);
                const response = await axios.get(url, {
                    headers: {
                        'User-Agent': this.options.userAgent,
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                        'Accept-Language': 'en-US,en;q=0.5',
                        'Accept-Encoding': 'gzip, deflate',
                        'Connection': 'keep-alive',
                    },
                    timeout: this.options.timeout,
                    maxRedirects: 5
                });

                // Add delay to be respectful
                await this.delay(1000 + Math.random() * 1000);

                return response.data;
            } catch (error) {
                console.log(`  Attempt ${i + 1} failed: ${error.message}`);
                if (i === retries - 1) throw error;
                await this.delay(2000 * (i + 1)); // Exponential backoff
            }
        }
    }

    /**
     * Delay helper
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Search Google for Shopify stores (simplified version)
     */
    async searchForStores(keywords) {
        console.log('\n=== Searching for Shopify Medical Device Stores ===\n');
        const storeUrls = new Set();

        for (const keyword of keywords.slice(0, 5)) {
            try {
                const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(keyword)}&num=20`;
                const html = await this.fetchPage(searchUrl);
                const $ = cheerio.load(html);

                // Extract URLs from search results
                $('a[href]').each((i, el) => {
                    const href = $(el).attr('href');
                    if (href) {
                        const shopifyUrl = this.extractShopifyUrl(href);
                        if (shopifyUrl && !this.processedStores.has(shopifyUrl)) {
                            storeUrls.add(shopifyUrl);
                        }
                    }
                });

                console.log(`  Found ${storeUrls.size} stores so far...`);

                if (storeUrls.size >= this.options.maxStores) break;

            } catch (error) {
                console.log(`  Search failed for "${keyword}": ${error.message}`);
            }
        }

        return Array.from(storeUrls).slice(0, this.options.maxStores);
    }

    /**
     * Extract Shopify URL from search result
     */
    extractShopifyUrl(href) {
        try {
            // Remove Google redirect
            if (href.includes('/url?q=')) {
                const match = href.match(/[?&]q=([^&]+)/);
                if (match) {
                    href = decodeURIComponent(match[1]);
                }
            }

            const url = new URL(href);
            if (url.hostname.includes('myshopify.com') || url.hostname.includes('.com')) {
                // Check if it looks like a Shopify store
                return url.origin;
            }
        } catch (e) {
            // Invalid URL
        }
        return null;
    }

    /**
     * Scrape a single Shopify store
     */
    async scrapeStore(storeUrl) {
        if (this.processedStores.has(storeUrl)) {
            return null;
        }

        this.processedStores.add(storeUrl);
        console.log(`\nProcessing: ${storeUrl} (${this.processedStores.size}/${this.options.maxStores})`);

        try {
            // Fetch main page
            const html = await this.fetchPage(storeUrl);
            const $ = cheerio.load(html);

            // Check if it's actually a Shopify store
            const isShopify = $('script[src*="shopify"]').length > 0 ||
                            $('link[href*="shopify"]').length > 0 ||
                            html.includes('Shopify.theme') ||
                            html.includes('shopify-');

            if (!isShopify) {
                console.log('  ❌ Not a Shopify store');
                return null;
            }

            // Extract store info
            const storeInfo = extractStoreInfo($, storeUrl);

            // Check if it sells medical devices
            const pageText = $('body').text().toLowerCase();
            const productTexts = [];
            $('.product-item, .product-card, .product, .grid-product').each((i, el) => {
                productTexts.push($(el).text().toLowerCase());
            });

            const allText = pageText + ' ' + productTexts.join(' ');

            if (!isMedicalStore(allText, config.MEDICAL_KEYWORDS)) {
                console.log('  ❌ Not a medical device store');
                return null;
            }

            console.log('  ✅ Medical device store detected');

            // Extract products
            let products = [];
            if (this.options.extractProducts) {
                products = extractProducts($, this.options.maxProductsPerStore);
                console.log(`  📦 Found ${products.length} products`);

                // Try to get more products from collections
                if (products.length < 5) {
                    const collectionProducts = await this.scrapeCollections(storeUrl, $);
                    products = [...products, ...collectionProducts].slice(0, this.options.maxProductsPerStore);
                    console.log(`  📦 Total products: ${products.length}`);
                }
            }

            // Check minimum products
            if (products.length < this.options.minProductsPerStore) {
                console.log(`  ⚠️  Only ${products.length} products (min: ${this.options.minProductsPerStore}) - skipping`);
                return null;
            }

            // Extract contact info
            let contactInfo = {};
            if (this.options.extractContactInfo) {
                contactInfo = await this.extractContactInfoLocal($, storeUrl);
                console.log(`  📧 Contact: ${contactInfo.email || 'none'} | ${contactInfo.phone || 'none'}`);
            }

            // Determine categories
            const categories = this.determineCategories(products, allText);
            console.log(`  🏷️  Categories: ${categories.join(', ')}`);

            // Calculate lead score
            const leadScore = calculateLeadScore({
                email: contactInfo.email,
                phone: contactInfo.phone,
                socialMedia: contactInfo.socialMedia,
                productCount: products.length,
                categoryCount: categories.length,
                hasAboutPage: contactInfo.hasAboutPage,
                hasContactPage: contactInfo.hasContactPage
            });

            const lead = {
                storeName: storeInfo.name,
                storeUrl: storeUrl,
                email: contactInfo.email || null,
                phone: contactInfo.phone || null,
                socialMedia: contactInfo.socialMedia || {},
                productCount: products.length,
                products: products,
                categories: categories,
                leadScore: leadScore,
                scrapedAt: new Date().toISOString()
            };

            console.log(`  ⭐ Lead Score: ${leadScore}/100`);
            return lead;

        } catch (error) {
            console.log(`  ❌ Error: ${error.message}`);
            return null;
        }
    }

    /**
     * Try to scrape product collections
     */
    async scrapeCollections(storeUrl, $) {
        const products = [];

        // Look for collection links
        const collectionLinks = [];
        $('a[href*="/collections/"]').each((i, el) => {
            const href = $(el).attr('href');
            if (href && !href.includes('/collections/all')) {
                const fullUrl = new URL(href, storeUrl).href;
                collectionLinks.push(fullUrl);
            }
        });

        // Try first collection
        if (collectionLinks.length > 0) {
            try {
                const collectionUrl = collectionLinks[0];
                console.log(`  🔍 Checking collection: ${collectionUrl}`);
                const html = await this.fetchPage(collectionUrl);
                const $collection = cheerio.load(html);
                const collectionProducts = extractProducts($collection, 20);
                products.push(...collectionProducts);
            } catch (error) {
                console.log(`  ⚠️  Collection fetch failed: ${error.message}`);
            }
        }

        return products;
    }

    /**
     * Extract contact info locally
     */
    async extractContactInfoLocal($, storeUrl) {
        const contactInfo = {
            email: null,
            phone: null,
            socialMedia: {},
            hasAboutPage: false,
            hasContactPage: false
        };

        const pageText = $('body').text();

        // Extract email
        const emailMatches = pageText.match(config.CONTACT_PATTERNS.email);
        if (emailMatches) {
            const validEmails = emailMatches.filter(email =>
                !email.includes('example.com') &&
                !email.includes('yourdomain.com') &&
                !email.includes('sentry.io') &&
                !email.includes('w3.org')
            );
            if (validEmails.length > 0) {
                contactInfo.email = validEmails[0];
            }
        }

        // Extract phone
        const phoneMatches = pageText.match(config.CONTACT_PATTERNS.phone);
        if (phoneMatches) {
            contactInfo.phone = phoneMatches[0];
        }

        // Extract social media
        $('a[href]').each((i, el) => {
            const href = $(el).attr('href');
            if (href) {
                if (href.match(/facebook\.com/i)) contactInfo.socialMedia.facebook = href;
                if (href.match(/instagram\.com/i)) contactInfo.socialMedia.instagram = href;
                if (href.match(/twitter\.com/i)) contactInfo.socialMedia.twitter = href;
                if (href.match(/linkedin\.com/i)) contactInfo.socialMedia.linkedin = href;
            }
        });

        // Check for pages
        contactInfo.hasAboutPage = $('a[href*="/about"], a[href*="/our-story"]').length > 0;
        contactInfo.hasContactPage = $('a[href*="/contact"]').length > 0;

        return contactInfo;
    }

    /**
     * Determine medical device categories
     */
    determineCategories(products, pageText) {
        const categories = [];
        const text = (pageText + ' ' + products.map(p => p.name + ' ' + p.description).join(' ')).toLowerCase();

        for (const [category, keywords] of Object.entries(config.CATEGORIES)) {
            const hasCategory = keywords.some(keyword => text.includes(keyword.toLowerCase()));
            if (hasCategory) {
                categories.push(category);
            }
        }

        return categories;
    }

    /**
     * Main run method
     */
    async run(startUrls = []) {
        console.log('\n╔═══════════════════════════════════════════════════════╗');
        console.log('║  Shopify Medical Device Lead Generator (Standalone)  ║');
        console.log('╚═══════════════════════════════════════════════════════╝\n');

        console.log(`Configuration:`);
        console.log(`  Max Stores: ${this.options.maxStores}`);
        console.log(`  Min Products: ${this.options.minProductsPerStore}`);
        console.log(`  Extract Products: ${this.options.extractProducts}`);
        console.log(`  Extract Contact: ${this.options.extractContactInfo}`);

        let storesToScrape = startUrls;

        // If no URLs provided, search for them
        if (storesToScrape.length === 0) {
            storesToScrape = await this.searchForStores(config.SEARCH_QUERIES);
            console.log(`\n✅ Found ${storesToScrape.length} potential stores to check\n`);
        }

        // Scrape each store
        for (const storeUrl of storesToScrape) {
            if (this.leads.length >= this.options.maxStores) break;

            const lead = await this.scrapeStore(storeUrl);
            if (lead) {
                this.leads.push(lead);
                console.log(`  ✅ Added lead #${this.leads.length}`);
            }
        }

        // Sort by lead score
        this.leads.sort((a, b) => b.leadScore - a.leadScore);

        // Display results
        this.displayResults();

        // Save results
        await this.saveResults();

        return this.leads;
    }

    /**
     * Display results summary
     */
    displayResults() {
        console.log('\n\n╔═══════════════════════════════════════════════════════╗');
        console.log('║                    RESULTS SUMMARY                    ║');
        console.log('╚═══════════════════════════════════════════════════════╝\n');

        console.log(`Total Leads Found: ${this.leads.length}`);
        console.log(`Stores Processed: ${this.processedStores.size}\n`);

        if (this.leads.length > 0) {
            console.log('═══ TOP 10 LEADS ═══\n');
            this.leads.slice(0, 10).forEach((lead, idx) => {
                console.log(`${idx + 1}. ${lead.storeName} (Score: ${lead.leadScore}/100)`);
                console.log(`   🌐 ${lead.storeUrl}`);
                console.log(`   📦 ${lead.productCount} products | 🏷️  ${lead.categories.join(', ')}`);
                if (lead.email) console.log(`   📧 ${lead.email}`);
                if (lead.phone) console.log(`   📞 ${lead.phone}`);
                console.log('');
            });
        } else {
            console.log('❌ No medical device stores found.');
            console.log('\nTips:');
            console.log('  - Try providing specific Shopify store URLs');
            console.log('  - Lower the minProductsPerStore setting');
            console.log('  - Check your internet connection');
        }
    }

    /**
     * Save results to file
     */
    async saveResults() {
        const outputDir = path.join(__dirname, 'results');

        try {
            await fs.mkdir(outputDir, { recursive: true });
        } catch (e) {
            // Directory exists
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const jsonFile = path.join(outputDir, `leads-${timestamp}.json`);
        const csvFile = path.join(outputDir, `leads-${timestamp}.csv`);

        // Save JSON
        await fs.writeFile(jsonFile, JSON.stringify(this.leads, null, 2));
        console.log(`\n✅ Results saved to:`);
        console.log(`   ${jsonFile}`);

        // Save CSV
        if (this.leads.length > 0) {
            const csv = this.convertToCSV(this.leads);
            await fs.writeFile(csvFile, csv);
            console.log(`   ${csvFile}`);
        }
    }

    /**
     * Convert leads to CSV
     */
    convertToCSV(leads) {
        const headers = ['Store Name', 'URL', 'Email', 'Phone', 'Products', 'Categories', 'Lead Score', 'Facebook', 'Instagram'];
        const rows = leads.map(lead => [
            lead.storeName,
            lead.storeUrl,
            lead.email || '',
            lead.phone || '',
            lead.productCount,
            lead.categories.join('; '),
            lead.leadScore,
            lead.socialMedia?.facebook || '',
            lead.socialMedia?.instagram || ''
        ]);

        return [headers, ...rows]
            .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
            .join('\n');
    }
}

// Export for use as module
module.exports = StandaloneScraper;

// Run if called directly
if (require.main === module) {
    const config = require('./standalone.config.json');
    const scraper = new StandaloneScraper(config);

    scraper.run(config.startUrls || [])
        .then(() => {
            console.log('\n✅ Scraping complete!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Error:', error.message);
            process.exit(1);
        });
}
