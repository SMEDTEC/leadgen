const config = require('./config');

/**
 * Extract basic store information from Shopify page
 */
function extractStoreInfo($, storeUrl) {
    let storeName = '';

    // Try to get store name from various places
    storeName = $('meta[property="og:site_name"]').attr('content') ||
                $('title').text().split('|')[0].trim() ||
                $('.site-header__logo-link').text().trim() ||
                $('.header__heading-link').text().trim() ||
                'Unknown Store';

    return {
        name: storeName,
        url: storeUrl
    };
}

/**
 * Extract products from Shopify page
 */
function extractProducts($, maxProducts = 50) {
    const products = [];

    // Common Shopify product selectors
    const productSelectors = [
        '.product-item',
        '.product-card',
        '.grid-product',
        '.product',
        '[data-product-id]',
        '.product-grid-item'
    ];

    let productElements = $();
    for (const selector of productSelectors) {
        const elements = $(selector);
        if (elements.length > 0) {
            productElements = elements;
            break;
        }
    }

    // If no products found on main page, try JSON data
    if (productElements.length === 0) {
        const scriptTags = $('script[type="application/json"]');
        scriptTags.each((i, el) => {
            try {
                const data = JSON.parse($(el).html());
                if (data.products && Array.isArray(data.products)) {
                    data.products.slice(0, maxProducts).forEach(p => {
                        products.push({
                            name: p.title || p.name || '',
                            price: formatPrice(p.price || p.variants?.[0]?.price),
                            description: stripHtml(p.body_html || p.description || ''),
                            url: p.url || '',
                            image: p.featured_image || p.images?.[0] || ''
                        });
                    });
                }
            } catch (e) {
                // Not valid JSON or not product data
            }
        });
    }

    // Extract from HTML elements
    productElements.slice(0, maxProducts).each((i, el) => {
        const $product = $(el);

        const name = $product.find('.product-title, .product-card__title, .product__title, h2, h3').first().text().trim() ||
                     $product.attr('data-product-title') ||
                     '';

        const priceText = $product.find('.price, .product-price, .product__price, [data-product-price]').first().text().trim();
        const price = formatPrice(priceText);

        const description = $product.find('.product-description, .product__description').first().text().trim();

        const url = $product.find('a').first().attr('href') || '';

        const image = $product.find('img').first().attr('src') || '';

        if (name) {
            products.push({
                name,
                price,
                description: description.substring(0, 200),
                url,
                image
            });
        }
    });

    return products;
}

/**
 * Extract contact information from store
 */
async function extractContactInfo($, storeUrl, crawler) {
    const contactInfo = {
        email: null,
        phone: null,
        socialMedia: {},
        hasAboutPage: false,
        hasContactPage: false
    };

    // Get page text
    const pageText = $('body').text();
    const pageHtml = $('body').html();

    // Extract email
    const emailMatches = pageText.match(config.CONTACT_PATTERNS.email);
    if (emailMatches) {
        // Filter out common false positives
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

    // Extract social media links
    const links = $('a[href]');
    links.each((i, el) => {
        const href = $(el).attr('href');
        if (href) {
            if (href.match(/facebook\.com/i)) {
                const match = href.match(config.CONTACT_PATTERNS.facebook);
                if (match) contactInfo.socialMedia.facebook = href;
            }
            if (href.match(/instagram\.com/i)) {
                const match = href.match(config.CONTACT_PATTERNS.instagram);
                if (match) contactInfo.socialMedia.instagram = href;
            }
            if (href.match(/twitter\.com/i)) {
                const match = href.match(config.CONTACT_PATTERNS.twitter);
                if (match) contactInfo.socialMedia.twitter = href;
            }
            if (href.match(/linkedin\.com/i)) {
                const match = href.match(config.CONTACT_PATTERNS.linkedin);
                if (match) contactInfo.socialMedia.linkedin = href;
            }
        }
    });

    // Check for about/contact pages
    const aboutLinks = $('a[href*="/about"], a[href*="/our-story"]');
    if (aboutLinks.length > 0) {
        contactInfo.hasAboutPage = true;
    }

    const contactLinks = $('a[href*="/contact"]');
    if (contactLinks.length > 0) {
        contactInfo.hasContactPage = true;
    }

    return contactInfo;
}

/**
 * Calculate lead score based on available information
 */
function calculateLeadScore(data) {
    let score = 0;

    const {
        email,
        phone,
        socialMedia = {},
        productCount = 0,
        categoryCount = 0,
        hasAboutPage = false,
        hasContactPage = false
    } = data;

    // Contact information
    if (email) score += config.LEAD_SCORING.hasEmail;
    if (phone) score += config.LEAD_SCORING.hasPhone;

    // Social media presence
    const socialCount = Object.keys(socialMedia).length;
    if (socialCount > 0) {
        score += config.LEAD_SCORING.hasSocialMedia * Math.min(socialCount, 3);
    }

    // Product catalog
    score += Math.min(productCount * config.LEAD_SCORING.perProduct, 30);

    // Category diversity
    score += categoryCount * config.LEAD_SCORING.perCategory;

    // Website completeness
    if (hasAboutPage) score += config.LEAD_SCORING.hasAboutPage;
    if (hasContactPage) score += config.LEAD_SCORING.hasContactPage;

    // Cap at maximum score
    return Math.min(Math.round(score), config.LEAD_SCORING.maxScore);
}

/**
 * Check if store sells medical devices
 */
function isMedicalStore(text, keywords) {
    const lowerText = text.toLowerCase();

    // Count how many medical keywords appear
    let matchCount = 0;
    for (const keyword of keywords) {
        if (lowerText.includes(keyword.toLowerCase())) {
            matchCount++;
        }
    }

    // Require at least 3 medical keyword matches to qualify
    return matchCount >= 3;
}

/**
 * Format price string
 */
function formatPrice(priceInput) {
    if (!priceInput) return '';

    let price = priceInput.toString();

    // If it's just a number, format it as currency
    if (/^\d+(\.\d+)?$/.test(price)) {
        return `$${parseFloat(price).toFixed(2)}`;
    }

    // Otherwise return as-is
    return price;
}

/**
 * Strip HTML tags from text
 */
function stripHtml(html) {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

module.exports = {
    extractStoreInfo,
    extractProducts,
    extractContactInfo,
    calculateLeadScore,
    isMedicalStore,
    formatPrice,
    stripHtml
};
