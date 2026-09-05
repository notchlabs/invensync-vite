import { Clock, Package } from 'lucide-react';
import type { BucketItem } from '../../services/consumptionService';

const fmtTime = (iso?: string) => {
  if (!iso) return '10:14 PM';
  const match = iso.match(/T(\d{2}):(\d{2})/);
  if (!match) return '10:14 PM';
  let h = parseInt(match[1]);
  const m = match[2];
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
};

const formatAmount = (val?: number): string => {
  if (val == null || isNaN(val)) return '0';
  const formatted = val.toFixed(2);
  return formatted.endsWith('.00') ? formatted.slice(0, -3) : formatted;
};

interface PublicConsumedItemRowProps {
  item: BucketItem;
  idx?: number;
}

export const PublicConsumedItemRow = ({ item }: PublicConsumedItemRowProps) => {
  const time = fmtTime(item.consumedDate);

  return (
    <div className="bg-card border border-border-main rounded-xl p-3 flex items-center justify-between gap-3 hover:border-border-main/80 transition-colors">
      {/* Left: Product Image */}
      <div className="w-14 h-14 shrink-0 rounded-lg border border-border-main/60 bg-surface flex items-center justify-center overflow-hidden p-1">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.productName ?? ''} className="w-full h-full object-contain" />
        ) : (
          <span className="text-[13px] font-bold text-muted-text/50">{item.productName?.charAt(0) ?? '?'}</span>
        )}
      </div>

      {/* Middle: Details */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex items-center gap-1.5 flex-wrap">
          <h4 className="text-[13.5px] font-semibold text-primary-text font-display leading-snug break-words">
            {item.productName ?? ''}
          </h4>
          {Boolean(item.vendorNames?.toLowerCase().includes('wild bean') || item.vendorNames?.toLowerCase().includes('wbc') || item.vendorIds === '-1' || item.vendorIds?.includes('-1')) ? (
            <span className="text-[8px] font-black tracking-wider bg-black dark:bg-white text-white dark:text-black px-1.5 py-0.5 rounded uppercase shrink-0">WBC</span>
          ) : (
            <span className="text-[8px] font-black tracking-wider bg-secondary text-secondary-text border border-border-main px-1.5 py-0.5 rounded uppercase shrink-0">W STORE</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-text mt-0.5 flex-wrap">
          {time && (
            <>
              <Clock size={12} className="text-muted-text/60 shrink-0" />
              <span>{time}</span>
              <span className="text-muted-text/40">•</span>
            </>
          )}
          <Package size={12} className="text-muted-text/60 shrink-0" />
          <span>{item.qty} {item.unit || 'Unit'}</span>
        </div>
      </div>

      {/* Right: Amount Pill */}
      <div className="shrink-0">
        <span className="inline-block px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[13.5px] font-bold font-mono tracking-tight">
          ₹{formatAmount(item.price)}
        </span>
      </div>
    </div>
  );
};
