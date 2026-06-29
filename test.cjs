const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));
  
  await page.goto('http://localhost:3000/?url=google.com', { waitUntil: 'networkidle2' });
  
  // Wait for scan to complete (it should crash within 10-15 seconds)
  await new Promise(r => setTimeout(r, 15000));
  
  await browser.close();
})();
