const axios = require('axios');
const { parse } = require('node-html-parser');
const TurndownService = require('turndown');
const fs = require('fs').promises; // Use promises for async file operations

async function scrapeAndConvert() {
  try {
    // Scrape Chinese page
    const responseZh = await axios.get('https://www.lotsawahouse.org/zh/tibetan-masters/mipham/');
    const htmlZh = responseZh.data;
    const rootZh = parse(htmlZh);
    const contentDivZh = rootZh.querySelector('div#content');
    if (!contentDivZh) {
      console.error('Could not find div#content in Chinese page');
    } else {
      const htmlContentZh = contentDivZh.innerHTML;
      const turndownServiceZh = new TurndownService();
      const markdownZh = turndownServiceZh.turndown(htmlContentZh);
      fs.writeFileSync('out.md', markdownZh); // Save Chinese content
      console.log('Chinese content saved to out.md');
    }

    // Scrape English page
    const responseEn = await axios.get('https://www.lotsawahouse.org/tibetan-masters/mipham/');
    const htmlEn = responseEn.data;
    const rootEn = parse(htmlEn);
    const contentDivEn = rootEn.querySelector('div#content');
    if (!contentDivEn) {
      console.error('Could not find div#content in English page');
    } else {
      const htmlContentEn = contentDivEn.innerHTML;
      const turndownServiceEn = new TurndownService();
      const markdownEn = turndownServiceEn.turndown(htmlContentEn);
      fs.writeFileSync('out_en.md', markdownEn); // Save English content
      console.log('English content saved to out_en.md');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

scrapeAndConvert().then(()=>console.log('done'));