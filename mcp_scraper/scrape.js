const puppeteer = require('puppeteer');
const TurndownService = require('turndown');
const fs = require('fs');

async function scrapeLotsawa() {
  try {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.goto('https://www.lotsawahouse.org/zh/tibetan-masters/mipham/verses-eight-noble-auspicious-ones');

    const htmlContent = await page.evaluate(() => {
      const contentElement = document.querySelector('div#content');
      if (contentElement) {
        return contentElement.innerHTML;
      }
      return null;
    });

    if (htmlContent) {
      const turndownService = new TurndownService();
      const markdown = turndownService.turndown(htmlContent);

      fs.writeFileSync('out.md', markdown);
      console.log('Content saved to out.md');
    } else {
      console.log('Content not found');
      }

    await browser.close();
    return;
  } catch (error) {
      console.error('Error:', error);
  }
}

scrapeLotsawa();