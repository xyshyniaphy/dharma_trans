const axios = require('axios');
const { parse } = require('node-html-parser');
const TurndownService = require('turndown');
const fs = require('fs');

async function scrapeAndConvert() {
  try {
    const response = await axios.get('https://www.lotsawahouse.org/zh/tibetan-masters/mipham/');
    const html = response.data;

    const root = parse(html);
    const contentDiv = root.querySelector('div#content');

    if (!contentDiv) {
      console.error('Could not find div#content');
      return;
    }

    const htmlContent = contentDiv.innerHTML;
    
    const turndownService = new TurndownService();
    const markdown = turndownService.turndown(htmlContent);

    fs.writeFileSync('out.md', markdown);
    console.log('Content saved to out.md');
  } catch (error) {
    console.error('Error:', error);
  }
}

scrapeAndConvert();