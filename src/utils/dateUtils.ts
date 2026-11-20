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

/**
 * Formats a given ISO date/time string or time string into 'h:mm AM/PM'.
 * Extracts the hours and minutes directly without timezone corruption.
 */
export function formatTimeToAmPm(isoOrTime?: string): string | null {
  if (!isoOrTime) return null;
  const str = isoOrTime.trim();
  if (/^\d{1,2}:\d{2}\s*(?:AM|PM)$/i.test(str)) {
    return str.toUpperCase();
  }
  const match = str.match(/(?:T|\s|^)(\d{1,2}):(\d{2})/);
  if (!match) return null;
  let h = parseInt(match[1], 10);
  const m = match[2];
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}
