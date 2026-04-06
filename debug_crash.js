const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

    console.log('Navigating to http://localhost:3005/colheita-dashboard...');
    await page.goto('http://localhost:3005/colheita-dashboard', { waitUntil: 'networkidle0' });

    console.log('Finished waiting.');
    await browser.close();
})();
