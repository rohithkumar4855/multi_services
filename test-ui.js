const puppeteer = require('puppeteer');

async function run() {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  
  try {
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
    console.log("Page loaded");
    
    // Switch to super admin tab to trigger syncData if hash matters
    await page.goto('http://localhost:5173/#/superadmin', { waitUntil: 'networkidle2' });
    console.log("Super admin page loaded");
    
    // Wait a bit to ensure network requests finish
    await new Promise(r => setTimeout(r, 3000));
  } catch (err) {
    console.error("Puppeteer error:", err);
  } finally {
    await browser.close();
  }
}
run();
