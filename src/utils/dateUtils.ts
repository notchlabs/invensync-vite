/**
 * Formats a given date string into 'dd MMM yyyy' format.
 * If the input is 'YYYY-MM-DD', it reliably extracts the components
 * to prevent timezone-related date shifting (e.g. 10th becoming 9th).
 */
export function formatDateToDisplay(dateStr: string): string {
  if (!dateStr) return '';
  
  const parts = dateStr.split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    const year = parts[0];
    const monthStr = parts[1];
    const day = parts[2];
    const date = new Date(Number(year), Number(monthStr) - 1, Number(day));
    const month = date.toLocaleString('en-US', { month: 'short' });
    return `${day} ${month} ${year}`;
  }
  
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, '0');
  const month = date.toLocaleString('en-US', { month: 'short' });
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}
