// Cloudflare Worker to convert HTML table to XLSX
import ExcelJS from 'exceljs';

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

      // Parse the HTML string to extract the table element
      const parser = new DOMParser();
      const docNode = parser.parseFromString(doc, 'text/html');
      tableElement = docNode.querySelector('table');

      if (!tableElement) {
        throw new Error('No table element found in the HTML.');
      }

    } catch (parseError) {
      console.error("Error parsing HTML:", parseError);
      return new Response(`Error parsing HTML: ${parseError.message}`, { status: 400 });
    }

    // Create a new workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sheet1');

    // Convert the table element to rows and columns
    const rows = tableElement.querySelectorAll('tr');
    rows.forEach((row, rowIndex) => {
      const cells = row.querySelectorAll('td, th');
      const rowData = [];
      cells.forEach(cell => {
        rowData.push(cell.textContent.trim());
      });
      worksheet.addRow(rowData);
    });

    // Generate XLSX buffer
    const xlsxBuffer = await workbook.xlsx.writeBuffer();

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
