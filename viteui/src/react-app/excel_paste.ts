export const cleanHtmlForExcel = (): string => {
  // @ts-ignore
  const wb = XLSX.utils.book_new();

  // Parse the HTML table into a worksheet
  // @ts-ignore
  const ws = XLSX.utils.table_to_sheet(document.querySelector('table'));

  // Add the worksheet to the workbook
  // @ts-ignore
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

  // Generate the XLSX file as a base64 string
  // @ts-ignore
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });

  // Convert the base64 string to a data URL
  const dataUrl = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${wbout}`;
  return dataUrl;
};
