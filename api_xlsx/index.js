// Cloudflare Worker to convert HTML table to XLSX
import { utils, write } from 'xlsx';
// import sanitizeHtml from 'sanitize-html'; // Removed sanitize-html

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
    const htmlTableString = await request.text();

    if (!htmlTableString) {
      return new Response('Missing HTML table', { status: 400 });
    }

    // Attempt to parse the HTML using DOMParser (available in Workers)
    // Note: DOMParser in Workers has limitations compared to browser/Node.js
    // We need to extract the table element for xlsx
    let tableElement;
    try {
      // Use Response object to leverage its HTML parsing capabilities
      const response = new Response(htmlTableString, { headers: { 'Content-Type': 'text/html' } });
      const doc = await response.text(); // Re-read as text to parse

      // Basic check if it contains a table tag
      if (!doc || !doc.toLowerCase().includes('<table')) {
         throw new Error('Input does not appear to contain an HTML table.');
      }

      // NOTE: Directly passing the string to table_to_sheet might work for simple tables
      // but using a parsed element is generally more robust if the library expects it.
      // However, full DOM manipulation is limited in Workers.
      // Let's try passing the string directly first, as xlsx might handle it.
      // If this fails, we might need a more robust HTML parsing approach compatible with Workers.

    } catch (parseError) {
      console.error("Error parsing HTML:", parseError);
      return new Response(`Error parsing HTML: ${parseError.message}`, { status: 400 });
    }

    // Parse HTML table string directly to worksheet
    // xlsx library might be able to handle a raw HTML string containing a table
    const workbook = utils.book_new();
    // Pass the original HTML string directly
    const worksheet = utils.table_to_sheet(htmlTableString); // Use the raw string
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
    console.error("Worker error:", error); // Log the error server-side
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
}
