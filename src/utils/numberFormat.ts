export const formatIndianNumber = (num: number | string | undefined | null): string => {
  if (num === null || num === undefined) return '0';
  const parsed = Number(num);
  if (isNaN(parsed)) return '0';
  
  const hasDecimals = parsed % 1 !== 0;
  return parsed.toLocaleString('en-IN', {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  });
};

export const formatIndianCurrency = (num: number | string | undefined | null): string => {
  return `₹${formatIndianNumber(num)}`;
};

export const fmtShort = (n: number): string => {
  const abs  = Math.abs(n)
  const sign = n < 0 ? '-' : ''
  if (abs >= 1_00_00_000) return `${sign}₹${(abs / 1_00_00_000).toFixed(2)} Cr`
  if (abs >= 1_00_000)    return `${sign}₹${(abs / 1_00_00_000).toFixed(2)} L`
  if (abs >= 1_000)       return `${sign}₹${(abs / 1_000).toFixed(2)} K`
  return `${sign}₹${abs % 1 !== 0 ? abs.toFixed(2) : abs}`
}
