// this project is a react app run on cloudflare workers
// but this file is run in the browser, so we need to use window instead of globalThis
// so do not use cloudflare workers variables like env or context in this file
// this file is used to convert html table to excel file
// and to paste the excel file to the clipboard
// and to download the excel file
// will ignore the typescript errors in this file
// because we are using window instead of globalThis

// Declare DOMPurify for TypeScript, assuming it's loaded globally via script tag
declare const DOMPurify: any;

export const cleanHtmlForExcel = (): string => {
  try {
    // Find the table element
    const tableElement = document.querySelector('table');
    if (!tableElement) {
      throw new Error("Table element not found");
    }

    // Clone the table to avoid modifying the original DOM directly
    const clonedTable = tableElement.cloneNode(true) as HTMLTableElement;

    // Sanitize the HTML content of the cloned table
    // Iterate through cells if more granular control is needed,
    // but sanitizing the whole outerHTML is simpler here.
    // Note: DOMPurify might alter structure slightly if it removes harmful elements.
    const cleanHtml = DOMPurify.sanitize(clonedTable.outerHTML);

    // Create a temporary div to parse the cleaned HTML back into an element
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = cleanHtml;
    const cleanTableElement = tempDiv.querySelector('table');

    if (!cleanTableElement) {
        throw new Error("Failed to parse sanitized table HTML");
    }

    // @ts-ignore
    const wb = (window as any).XLSX.utils.book_new();

    // Parse the *cleaned* HTML table into a worksheet
    // @ts-ignore
    const ws = (window as any).XLSX.utils.table_to_sheet(cleanTableElement);

    // Set column width for all columns
    // Add comments for changes
    ws['!cols'] = [ // Set column widths
      { wch: 80 }, // Column A width
      { wch: 80 }, // Column B width
    ];

    // Enable word wrap for all cells
    const range = (window as any).XLSX.utils.decode_range(ws['!ref']);
    for (let row = range.s.r; row <= range.e.r; row++) {
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = (window as any).XLSX.utils.encode_cell({ r: row, c: col });
        if (!ws[cellAddress]) continue; // Skip if the cell doesn't exist
        if (!ws[cellAddress].s) ws[cellAddress].s = {}; // Initialize style if not present
        ws[cellAddress].s.alignment = { wrapText: true }; // Set wrapText to true
      }
    }

    // Add the worksheet to the workbook
    // @ts-ignore
    (window as any).XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

    // Generate the XLSX file as a base64 string
    // @ts-ignore
    const wbout = (window as any).XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });

    // Return the base64 string of the excel file
    return wbout;
  } catch (error) {
    console.error("Error in cleanHtmlForExcel:", error);
    throw error;
  }
};
