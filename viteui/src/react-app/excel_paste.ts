export const cleanHtmlForExcel = (): string => {
  try {
    // @ts-ignore
    const wb = (window as any).XLSX.utils.book_new();

    // Parse the HTML table into a worksheet
    // @ts-ignore
    const ws = (window as any).XLSX.utils.table_to_sheet(document.querySelector('table'));

    // Set column width for columns A and B
    ws['!cols'] = [
      { wch: 80 }, // Column A width
      { wch: 80 }, // Column B width
    ];

    // Enable word wrap for the first two columns
    for (let i = 0; i < 2; i++) {
      const col = (window as any).XLSX.utils.encode_col(i);
      for (let row = 1; row <= 100; row++) { // Assuming a maximum of 100 rows
        const cellAddress = col + row;
        if (ws[cellAddress]) {
          ws[cellAddress].s = {
            alignment: {
              wrapText: true,
            },
          };
        }
      }
    }

    // Add the worksheet to the workbook
    // @ts-ignore
    (window as any).XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

    // Generate the XLSX file as a base64 string
    // @ts-ignore
    const wbout = (window as any).XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });

    // Convert the base64 string to a data URL
    const dataUrl = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${wbout}`;
    return dataUrl;
  } catch (error) {
    console.error("Error in cleanHtmlForExcel:", error);
    throw error;
  }
};
