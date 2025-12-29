const { Actor } = require('apify');
const { CheerioCrawler, Dataset } = require('crawlee');
const config = require('./config');
const { extractStoreInfo, extractProducts, extractContactInfo, calculateLeadScore, isMedicalStore } = require('./utils');

/**
 * Main Actor entry point
 */
Actor.main(async () => {
    const input = await Actor.getInput();

    // Set defaults
    const {
        proxy = { useApifyProxy: true },
        startUrls = [],
        searchKeywords = config.SEARCH_QUERIES,
        maxStores = 100,
        minProductsPerStore = 5,
        extractProducts: shouldExtractProducts = true,
        maxProductsPerStore = 50,
        medicalCategories = Object.keys(config.CATEGORIES),
        extractContactInfo: shouldExtractContactInfo = true
    } = input;

    console.log('Starting Shopify Medical Device Lead Generator');
    console.log(`Configuration: Max stores: ${maxStores}, Min products: ${minProductsPerStore}`);

    const processedStores = new Set();
    const leads = [];

    // Create request list from start URLs or search queries
    const requests = [];

    if (startUrls && startUrls.length > 0) {
        console.log(`Using ${startUrls.length} provided start URLs`);
        requests.push(...startUrls.map(req => ({
            url: typeof req === 'string' ? req : req.url,
            userData: { type: 'STORE' }
        })));
    } else {
        console.log('No start URLs provided, will search for medical device stores');
        // Add Google search URLs for finding Shopify stores
        for (const query of searchKeywords.slice(0, 10)) {
            requests.push({
                url: `https://www.google.com/search?q=${encodeURIComponent(query)}&num=20`,
                userData: { type: 'SEARCH' }
            });
        }
    }

    // Create crawler
    const crawler = new CheerioCrawler({
        proxyConfiguration: proxy.useApifyProxy ? await Actor.createProxyConfiguration() : undefined,
        maxRequestsPerCrawl: maxStores * 5, // Allow multiple pages per store
        maxConcurrency: 10,
        requestHandler: async ({ request, $, crawler }) => {
            const { url, userData } = request;

            console.log(`Processing: ${url} (Type: ${userData.type || 'UNKNOWN'})`);

            // Handle search results
            if (userData.type === 'SEARCH') {
                await handleSearchResults($, crawler, processedStores, maxStores);
                return;
            }

            // Handle Shopify stores
            if (userData.type === 'STORE' || url.includes('myshopify.com') || url.includes('/collections/')) {
                await handleShopifyStore({
                    $,
                    url,
                    crawler,
                    processedStores,
                    leads,
                    maxStores,
                    minProductsPerStore,
                    shouldExtractProducts,
                    maxProductsPerStore,
                    medicalCategories,
                    shouldExtractContactInfo
                });
                return;
            }

            // Handle product collection pages
            if (userData.type === 'COLLECTION') {
                await handleCollectionPage($, url, crawler, userData.storeUrl, maxProductsPerStore);
                return;
            }
        },
        failedRequestHandler: async ({ request }) => {
            console.log(`Request failed: ${request.url}`);
        }
    });

    // Run the crawler
    await crawler.run(requests);

    // Save results
    console.log(`\n=== Scraping Complete ===`);
    console.log(`Total leads found: ${leads.length}`);
    console.log(`Stores processed: ${processedStores.size}`);

    if (leads.length > 0) {
        // Sort by lead score
        leads.sort((a, b) => b.leadScore - a.leadScore);

        // Save to dataset
        await Dataset.pushData(leads);
        console.log(`Saved ${leads.length} leads to dataset`);

        // Print summary
        console.log('\n=== Top 5 Leads ===');
        leads.slice(0, 5).forEach((lead, idx) => {
            console.log(`${idx + 1}. ${lead.storeName} (Score: ${lead.leadScore})`);
            console.log(`   URL: ${lead.storeUrl}`);
            console.log(`   Products: ${lead.productCount}`);
            console.log(`   Contact: ${lead.email || 'N/A'}`);
        });
    } else {
        console.log('No medical device stores found. Try adjusting your search criteria.');
    }

    console.log('\nActor finished.');
});

/**
 * Handle Google search results to find Shopify stores
 */
async function handleSearchResults($, crawler, processedStores, maxStores) {
    if (processedStores.size >= maxStores) {
        console.log('Max stores reached, skipping search results');
        return;
    }

    // Extract URLs from search results
    const searchResults = [];
    $('a[href*="myshopify.com"], a[href*="/collections/"]').each((i, el) => {
        const href = $(el).attr('href');
        if (href) {
            const cleanUrl = extractShopifyUrl(href);
            if (cleanUrl && !processedStores.has(cleanUrl)) {
                searchResults.push(cleanUrl);
            }
        }
    });

    console.log(`Found ${searchResults.length} potential Shopify stores in search results`);

    // Add stores to crawler queue
    for (const storeUrl of searchResults.slice(0, maxStores - processedStores.size)) {
        await crawler.addRequests([{
            url: storeUrl,
            userData: { type: 'STORE' }
        }]);
    }
}

/**
 * Handle individual Shopify store pages
 */
async function handleShopifyStore(options) {
    const {
        $,
        url,
        crawler,
        processedStores,
        leads,
        maxStores,
        minProductsPerStore,
        shouldExtractProducts,
        maxProductsPerStore,
        medicalCategories,
        shouldExtractContactInfo
    } = options;

    // Extract store base URL
    const storeUrl = extractStoreBaseUrl(url);

    if (processedStores.has(storeUrl) || processedStores.size >= maxStores) {
        return;
    }

    processedStores.add(storeUrl);
    console.log(`Processing store: ${storeUrl} (${processedStores.size}/${maxStores})`);

    try {
        // Extract basic store information
        const storeInfo = extractStoreInfo($, storeUrl);

        // Check if this is a medical device store
        const pageText = $('body').text().toLowerCase();
        const productTexts = [];
        $('.product-item, .product-card, .product').each((i, el) => {
            productTexts.push($(el).text().toLowerCase());
        });

        const allText = pageText + ' ' + productTexts.join(' ');

        if (!isMedicalStore(allText, config.MEDICAL_KEYWORDS)) {
            console.log(`Skipping ${storeUrl} - not a medical device store`);
            return;
        }

        console.log(`✓ ${storeUrl} is a medical device store`);

        // Extract products if enabled
        let products = [];
        if (shouldExtractProducts) {
            products = extractProducts($, maxProductsPerStore);
            console.log(`  Found ${products.length} products`);
        }

        // Check minimum products requirement
        if (products.length < minProductsPerStore) {
            console.log(`  Skipping - only ${products.length} products (min: ${minProductsPerStore})`);
            return;
        }

        // Extract contact information if enabled
        let contactInfo = {};
        if (shouldExtractContactInfo) {
            contactInfo = await extractContactInfo($, storeUrl, crawler);
            console.log(`  Contact info: Email=${!!contactInfo.email}, Phone=${!!contactInfo.phone}`);
        }

        // Determine product categories
        const detectedCategories = determineCategories(products, allText);
        console.log(`  Categories: ${detectedCategories.join(', ')}`);

        // Calculate lead score
        const leadScore = calculateLeadScore({
            email: contactInfo.email,
            phone: contactInfo.phone,
            socialMedia: contactInfo.socialMedia,
            productCount: products.length,
            categoryCount: detectedCategories.length,
            hasAboutPage: contactInfo.hasAboutPage,
            hasContactPage: contactInfo.hasContactPage
        });

        // Create lead object
        const lead = {
            storeName: storeInfo.name,
            storeUrl: storeUrl,
            email: contactInfo.email || null,
            phone: contactInfo.phone || null,
            socialMedia: contactInfo.socialMedia || {},
            productCount: products.length,
            products: products,
            categories: detectedCategories,
            leadScore: leadScore,
            scrapedAt: new Date().toISOString()
        };

        leads.push(lead);
        console.log(`✓ Added lead: ${storeInfo.name} (Score: ${leadScore})`);

    } catch (error) {
        console.error(`Error processing store ${storeUrl}:`, error.message);
    }
}

/**
 * Handle product collection pages
 */
async function handleCollectionPage($, url, crawler, storeUrl, maxProducts) {
    // This would be implemented to paginate through product collections
    // For now, we handle products on the main page
}

/**
 * Determine which medical device categories the store sells
 */
function determineCategories(products, pageText) {
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
 * Extract Shopify URL from search result link
 */
function extractShopifyUrl(href) {
    try {
        // Remove Google redirect
        if (href.includes('/url?q=')) {
            const match = href.match(/[?&]q=([^&]+)/);
            if (match) {
                href = decodeURIComponent(match[1]);
            }
        }

        const url = new URL(href);
        if (url.hostname.includes('myshopify.com') || url.pathname.includes('/collections/')) {
            return url.origin;
        }
    } catch (e) {
        // Invalid URL
    }
    return null;
}

/**
 * Extract base store URL from any store page
 */
function extractStoreBaseUrl(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.origin;
    } catch (e) {
        return url;
    }
}
