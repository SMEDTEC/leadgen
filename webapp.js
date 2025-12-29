/**
 * Web App for Shopify Medical Device Scraper
 * Simple web interface - no coding required!
 */

const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const StandaloneScraper = require('./standalone');

const app = express();
const PORT = 3000;

// Store scraping status
let scrapingStatus = {
    isRunning: false,
    progress: '',
    totalStores: 0,
    processedStores: 0,
    leadsFound: 0,
    currentStore: '',
    logs: []
};

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Serve main page
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Medical Device Lead Generator</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 900px;
            margin: 0 auto;
        }
        .card {
            background: white;
            border-radius: 12px;
            padding: 30px;
            margin-bottom: 20px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        h1 {
            color: #333;
            margin-bottom: 10px;
            font-size: 28px;
        }
        .subtitle {
            color: #666;
            margin-bottom: 30px;
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            color: #333;
            font-weight: 600;
            margin-bottom: 8px;
        }
        input[type="text"],
        input[type="number"],
        textarea {
            width: 100%;
            padding: 12px;
            border: 2px solid #e0e0e0;
            border-radius: 6px;
            font-size: 14px;
            transition: border-color 0.3s;
        }
        input:focus, textarea:focus {
            outline: none;
            border-color: #667eea;
        }
        textarea {
            min-height: 100px;
            font-family: monospace;
            resize: vertical;
        }
        .checkbox-group {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        input[type="checkbox"] {
            width: 20px;
            height: 20px;
            cursor: pointer;
        }
        button {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 14px 30px;
            border-radius: 6px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s;
            width: 100%;
        }
        button:hover {
            transform: translateY(-2px);
        }
        button:active {
            transform: translateY(0);
        }
        button:disabled {
            background: #ccc;
            cursor: not-allowed;
            transform: none;
        }
        .secondary-btn {
            background: white;
            color: #667eea;
            border: 2px solid #667eea;
        }
        .status {
            padding: 15px;
            border-radius: 6px;
            margin-bottom: 20px;
            display: none;
        }
        .status.active {
            display: block;
        }
        .status.running {
            background: #e3f2fd;
            border: 2px solid #2196f3;
            color: #1565c0;
        }
        .status.success {
            background: #e8f5e9;
            border: 2px solid #4caf50;
            color: #2e7d32;
        }
        .status.error {
            background: #ffebee;
            border: 2px solid #f44336;
            color: #c62828;
        }
        .progress-bar {
            width: 100%;
            height: 8px;
            background: #e0e0e0;
            border-radius: 4px;
            overflow: hidden;
            margin: 10px 0;
        }
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
            transition: width 0.3s;
            width: 0%;
        }
        .logs {
            background: #f5f5f5;
            border: 2px solid #e0e0e0;
            border-radius: 6px;
            padding: 15px;
            max-height: 300px;
            overflow-y: auto;
            font-family: monospace;
            font-size: 12px;
            margin-top: 15px;
            display: none;
        }
        .logs.active {
            display: block;
        }
        .log-entry {
            padding: 4px 0;
            color: #333;
        }
        .hint {
            color: #666;
            font-size: 13px;
            margin-top: 5px;
        }
        .example-urls {
            background: #f5f5f5;
            padding: 12px;
            border-radius: 6px;
            font-size: 13px;
            margin-top: 10px;
        }
        .grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }
        @media (max-width: 768px) {
            .grid { grid-template-columns: 1fr; }
        }
        .badge {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            margin-left: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <h1>🏥 Medical Device Lead Generator</h1>
            <p class="subtitle">Find Shopify stores selling medical devices - no coding required!</p>

            <div id="status" class="status"></div>

            <form id="scraperForm">
                <div class="form-group">
                    <label>Store URLs (one per line) <span class="badge">Optional</span></label>
                    <textarea id="storeUrls" name="storeUrls" placeholder="https://vitality-medical.myshopify.com
https://1800wheelchair.com
https://healthproductsforyou.com">https://vitality-medical.myshopify.com
https://1800wheelchair.com
https://healthproductsforyou.com</textarea>
                    <div class="hint">Leave empty to auto-search for stores, or add specific Shopify store URLs</div>
                </div>

                <div class="grid">
                    <div class="form-group">
                        <label>Maximum Stores</label>
                        <input type="number" id="maxStores" name="maxStores" value="5" min="1" max="100">
                        <div class="hint">Start with 5 for testing</div>
                    </div>

                    <div class="form-group">
                        <label>Minimum Products Per Store</label>
                        <input type="number" id="minProducts" name="minProducts" value="1" min="1">
                        <div class="hint">Lower = more results</div>
                    </div>
                </div>

                <div class="grid">
                    <div class="form-group">
                        <div class="checkbox-group">
                            <input type="checkbox" id="extractProducts" name="extractProducts" checked>
                            <label for="extractProducts" style="margin: 0">Extract Product Details</label>
                        </div>
                    </div>

                    <div class="form-group">
                        <div class="checkbox-group">
                            <input type="checkbox" id="extractContact" name="extractContact" checked>
                            <label for="extractContact" style="margin: 0">Extract Contact Info</label>
                        </div>
                    </div>
                </div>

                <button type="submit" id="startBtn">🚀 Start Scraping</button>
            </form>

            <div class="progress-bar" id="progressBar" style="display: none;">
                <div class="progress-fill" id="progressFill"></div>
            </div>

            <div id="logs" class="logs"></div>
        </div>

        <div class="card">
            <h2 style="margin-bottom: 15px;">📊 Recent Results</h2>
            <button onclick="viewResults()" class="secondary-btn">View All Results</button>
        </div>
    </div>

    <script>
        const form = document.getElementById('scraperForm');
        const statusDiv = document.getElementById('status');
        const logsDiv = document.getElementById('logs');
        const startBtn = document.getElementById('startBtn');
        const progressBar = document.getElementById('progressBar');
        const progressFill = document.getElementById('progressFill');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const storeUrls = document.getElementById('storeUrls').value
                .split('\\n')
                .map(url => url.trim())
                .filter(url => url.length > 0);

            const config = {
                startUrls: storeUrls,
                maxStores: parseInt(document.getElementById('maxStores').value),
                minProductsPerStore: parseInt(document.getElementById('minProducts').value),
                extractProducts: document.getElementById('extractProducts').checked,
                extractContactInfo: document.getElementById('extractContact').checked
            };

            startBtn.disabled = true;
            startBtn.textContent = '⏳ Scraping...';
            statusDiv.className = 'status active running';
            statusDiv.textContent = '🔄 Starting scraper...';
            logsDiv.className = 'logs active';
            logsDiv.innerHTML = '';
            progressBar.style.display = 'block';
            progressFill.style.width = '0%';

            try {
                const response = await fetch('/api/scrape', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(config)
                });

                // Poll for status
                pollStatus();

            } catch (error) {
                statusDiv.className = 'status active error';
                statusDiv.textContent = '❌ Error: ' + error.message;
                startBtn.disabled = false;
                startBtn.textContent = '🚀 Start Scraping';
            }
        });

        function pollStatus() {
            const interval = setInterval(async () => {
                try {
                    const response = await fetch('/api/status');
                    const status = await response.json();

                    if (!status.isRunning) {
                        clearInterval(interval);
                        startBtn.disabled = false;
                        startBtn.textContent = '🚀 Start Scraping';
                        progressBar.style.display = 'none';

                        if (status.leadsFound > 0) {
                            statusDiv.className = 'status active success';
                            statusDiv.textContent = \`✅ Complete! Found \${status.leadsFound} leads. Check results below.\`;
                        } else {
                            statusDiv.className = 'status active error';
                            statusDiv.textContent = '⚠️ No medical device stores found. Try different URLs or settings.';
                        }
                        return;
                    }

                    // Update progress
                    const progress = status.totalStores > 0
                        ? (status.processedStores / status.totalStores * 100)
                        : 0;
                    progressFill.style.width = progress + '%';

                    statusDiv.textContent = \`🔄 Processing: \${status.processedStores}/\${status.totalStores} stores | \${status.leadsFound} leads found\`;

                    // Update logs
                    if (status.logs.length > 0) {
                        logsDiv.innerHTML = status.logs.map(log =>
                            \`<div class="log-entry">\${log}</div>\`
                        ).join('');
                        logsDiv.scrollTop = logsDiv.scrollHeight;
                    }

                } catch (error) {
                    clearInterval(interval);
                    console.error('Status poll error:', error);
                }
            }, 1000);
        }

        function viewResults() {
            window.open('/results', '_blank');
        }
    </script>
</body>
</html>
    `);
});

// API endpoint to start scraping
app.post('/api/scrape', async (req, res) => {
    if (scrapingStatus.isRunning) {
        return res.status(400).json({ error: 'Scraping already in progress' });
    }

    scrapingStatus = {
        isRunning: true,
        progress: 'Starting...',
        totalStores: req.body.maxStores || 10,
        processedStores: 0,
        leadsFound: 0,
        currentStore: '',
        logs: []
    };

    res.json({ message: 'Scraping started' });

    // Run scraper in background
    const config = {
        maxStores: req.body.maxStores || 10,
        minProductsPerStore: req.body.minProductsPerStore || 1,
        extractProducts: req.body.extractProducts !== false,
        maxProductsPerStore: 30,
        extractContactInfo: req.body.extractContactInfo !== false,
        timeout: 15000
    };

    const startUrls = req.body.startUrls || [];

    try {
        const scraper = new StandaloneScraper(config);

        // Override console.log to capture logs
        const originalLog = console.log;
        console.log = (...args) => {
            const message = args.join(' ');
            scrapingStatus.logs.push(message);
            if (scrapingStatus.logs.length > 100) {
                scrapingStatus.logs.shift();
            }

            // Update progress
            if (message.includes('Processing:')) {
                scrapingStatus.processedStores++;
            }
            if (message.includes('Added lead')) {
                scrapingStatus.leadsFound++;
            }

            originalLog(...args);
        };

        await scraper.run(startUrls);

        console.log = originalLog;

        scrapingStatus.isRunning = false;
        scrapingStatus.progress = 'Complete';
        scrapingStatus.leadsFound = scraper.leads.length;

    } catch (error) {
        console.error('Scraping error:', error);
        scrapingStatus.isRunning = false;
        scrapingStatus.progress = 'Error: ' + error.message;
        scrapingStatus.logs.push('Error: ' + error.message);
    }
});

// API endpoint to get status
app.get('/api/status', (req, res) => {
    res.json(scrapingStatus);
});

// Results viewer page
app.get('/results', async (req, res) => {
    try {
        const resultsDir = path.join(__dirname, 'results');
        const files = await fs.readdir(resultsDir);
        const jsonFiles = files.filter(f => f.endsWith('.json')).sort().reverse();

        if (jsonFiles.length === 0) {
            return res.send('<h1>No results yet</h1><p>Run a scrape first!</p>');
        }

        const latestFile = path.join(resultsDir, jsonFiles[0]);
        const data = await fs.readFile(latestFile, 'utf8');
        const leads = JSON.parse(data);

        res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Scraping Results</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f5f5f5;
            padding: 20px;
        }
        .container { max-width: 1200px; margin: 0 auto; }
        h1 { color: #333; margin-bottom: 20px; }
        .stats {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .lead-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 15px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .lead-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        .store-name {
            font-size: 20px;
            font-weight: 600;
            color: #333;
        }
        .score {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 6px 15px;
            border-radius: 20px;
            font-weight: 600;
        }
        .info-row {
            margin: 8px 0;
            color: #666;
        }
        .info-row strong { color: #333; }
        .categories {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            margin-top: 10px;
        }
        .category-badge {
            background: #e3f2fd;
            color: #1565c0;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
        }
        .download-btn {
            background: #4caf50;
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            text-decoration: none;
            display: inline-block;
            margin-right: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📊 Scraping Results</h1>

        <div class="stats">
            <h2>Summary</h2>
            <p>Total Leads: <strong>${leads.length}</strong></p>
            <p>File: <code>${jsonFiles[0]}</code></p>
            <p style="margin-top: 15px;">
                <a href="/download/json" class="download-btn">Download JSON</a>
                <a href="/download/csv" class="download-btn">Download CSV</a>
            </p>
        </div>

        ${leads.map((lead, idx) => `
            <div class="lead-card">
                <div class="lead-header">
                    <div class="store-name">${idx + 1}. ${lead.storeName}</div>
                    <div class="score">Score: ${lead.leadScore}/100</div>
                </div>
                <div class="info-row">🌐 <a href="${lead.storeUrl}" target="_blank">${lead.storeUrl}</a></div>
                ${lead.email ? `<div class="info-row">📧 ${lead.email}</div>` : ''}
                ${lead.phone ? `<div class="info-row">📞 ${lead.phone}</div>` : ''}
                <div class="info-row">📦 <strong>${lead.productCount}</strong> products</div>
                ${lead.socialMedia && Object.keys(lead.socialMedia).length > 0 ? `
                    <div class="info-row">
                        🔗
                        ${Object.entries(lead.socialMedia).map(([platform, url]) =>
                            `<a href="${url}" target="_blank">${platform}</a>`
                        ).join(' | ')}
                    </div>
                ` : ''}
                ${lead.categories && lead.categories.length > 0 ? `
                    <div class="categories">
                        ${lead.categories.map(cat => `<span class="category-badge">${cat}</span>`).join('')}
                    </div>
                ` : ''}
            </div>
        `).join('')}
    </div>
</body>
</html>
        `);

    } catch (error) {
        res.send(`<h1>Error loading results</h1><p>${error.message}</p>`);
    }
});

// Download endpoints
app.get('/download/:format', async (req, res) => {
    try {
        const resultsDir = path.join(__dirname, 'results');
        const files = await fs.readdir(resultsDir);
        const format = req.params.format;

        if (format === 'json') {
            const jsonFiles = files.filter(f => f.endsWith('.json')).sort().reverse();
            if (jsonFiles.length > 0) {
                res.download(path.join(resultsDir, jsonFiles[0]));
            }
        } else if (format === 'csv') {
            const csvFiles = files.filter(f => f.endsWith('.csv')).sort().reverse();
            if (csvFiles.length > 0) {
                res.download(path.join(resultsDir, csvFiles[0]));
            }
        }
    } catch (error) {
        res.status(500).send('Error downloading file');
    }
});

// Start server
app.listen(PORT, () => {
    console.log('\n╔═══════════════════════════════════════════════════════╗');
    console.log('║     🎉 WEB APP STARTED SUCCESSFULLY! 🎉              ║');
    console.log('╚═══════════════════════════════════════════════════════╝\n');
    console.log(`✅ Open your browser and go to:\n`);
    console.log(`   👉 http://localhost:${PORT}\n`);
    console.log('📝 Instructions:');
    console.log('   1. Fill in the form');
    console.log('   2. Click "Start Scraping"');
    console.log('   3. View results when complete\n');
    console.log('Press Ctrl+C to stop the server\n');
});
