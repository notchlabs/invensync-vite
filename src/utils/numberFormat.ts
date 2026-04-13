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
