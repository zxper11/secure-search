const express = require('express');
const puppeteer = require('puppeteer');
const { exec } = require('child_process');

const app = express();
const PORT = 3000;

// Serve static files
app.use(express.static('public'));

// VPN Setup (example: replace 'start-vpn-command' with actual VPN command)
function startVPN() {
    exec('start-vpn-command', (err, stdout, stderr) => {
        if (err) {
            console.error('VPN Error:', err);
        } else {
            console.log('VPN started:', stdout);
        }
    });
}

// Adblocker and browser launch with Puppeteer
async function launchBrowser(query) {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();

    // Ad-blocking setup
    await page.setRequestInterception(true);
    page.on('request', (req) => {
        if (req.resourceType() === 'image' || req.url().includes('ads')) {
            req.abort();
        } else {
            req.continue();
        }
    });

    // Open query or URL
    if (query.startsWith('http')) {
        await page.goto(query);
    } else {
        await page.goto(`https://www.google.com/search?q=${encodeURIComponent(query)}`);
    }

    // Wait for 30 seconds before closing
    setTimeout(async () => {
        await browser.close();
        console.log('Session ended.');
    }, 30000); // Adjust timeout as needed
}

// Route to start a browsing session
app.get('/start-session', async (req, res) => {
    const query = req.query.query;
    if (!query) {
        res.status(400).send('Query required');
        return;
    }

    startVPN(); // Optional VPN setup
    launchBrowser(query);

    res.send(`
        <h1>Browsing Session Started</h1>
        <p>Your query: "${query}"</p>
        <p>The session will automatically close after 30 seconds.</p>
    `);
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
