export const formatIndianNumber = (num: number | string | undefined | null): string => {
  if (num === null || num === undefined) return '0.00';
  const parsed = Number(num);
  if (isNaN(parsed)) return '0.00';
  
  return parsed.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const formatIndianCurrency = (num: number | string | undefined | null): string => {
  return `₹${formatIndianNumber(num)}`;
};

export const fmtShort = (n: number): string => {
  const abs  = Math.abs(n)
  const sign = n < 0 ? '-' : ''
  if (abs >= 100_000) return `${sign}₹${(abs / 100_000).toFixed(2)} L`
  if (abs >= 1_000)   return `${sign}₹${(abs / 1_000).toFixed(2)} K`
  return `${sign}₹${abs.toFixed(2)}`
}
