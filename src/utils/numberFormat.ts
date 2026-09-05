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

export const fmtShort = (n: number | string | undefined | null): string => {
  if (n === null || n === undefined) return '₹0';
  const num = Number(n);
  if (isNaN(num)) return '₹0';

  const abs = Math.abs(num);
  const sign = num < 0 ? '-' : '';

  if (abs >= 1_00_00_000) {
    const val = abs / 1_00_00_000;
    const formatted = val % 1 === 0 ? val.toFixed(0) : val.toFixed(2).replace(/\.?0+$/, '');
    return `${sign}₹${formatted} Cr`;
  }

  if (abs >= 1_00_000) {
    const val = abs / 1_00_000;
    const formatted = val % 1 === 0 ? val.toFixed(0) : val.toFixed(2).replace(/\.?0+$/, '');
    return `${sign}₹${formatted} L`;
  }

  if (abs >= 1_000) {
    const val = abs / 1_000;
    const formatted = val % 1 === 0 ? val.toFixed(0) : val.toFixed(1).replace(/\.?0+$/, '');
    return `${sign}₹${formatted}K`;
  }

  const formatted = abs % 1 === 0 ? abs.toFixed(0) : abs.toFixed(2).replace(/\.?0+$/, '');
  return `${sign}₹${formatted}`;
};
