// Cloudflare Worker to convert sanitized HTML table to XLSX
import { utils, write } from 'xlsx';
import sanitizeHtml from 'sanitize-html';

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  // Only allow POST requests
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    // Get the HTML table string from the request body
    const htmlTable = await request.text();

    if (!htmlTable) {
      return new Response('Missing HTML table', { status: 400 });
    }

    // Sanitize the HTML input
    const cleanHtml = sanitizeHtml(htmlTable, {
      allowedTags: ['table', 'tr', 'th', 'td', 'tbody', 'thead', 'tfoot'],
      allowedAttributes: {
        '*': ['class', 'style'] // Allow basic styling if needed
      },
      disallowedTagsMode: 'discard'
    });

    if (!cleanHtml.includes('<table')) {
      return new Response('Invalid HTML table after sanitization', { status: 400 });
    }

    // Parse sanitized HTML table to worksheet
    const workbook = utils.book_new();
    const worksheet = utils.table_to_sheet(cleanHtml);
    utils.book_append_sheet(workbook, worksheet, 'Sheet1');

    // Generate XLSX buffer
    const xlsxBuffer = write(workbook, { bookType: 'xlsx', type: 'array' });

    // Return the XLSX file as a response
    return new Response(xlsxBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="翻译结果.xlsx"',
        'Access-Control-Allow-Origin': '*' // Optional for browser access
      }
    });
  } catch (error) {
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
}
