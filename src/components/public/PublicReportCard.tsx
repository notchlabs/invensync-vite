import { Coffee, Store, BarChart3, Clock, Calendar as CalendarIcon } from 'lucide-react';
import { formatDateToDisplay } from '../../utils/dateUtils';
import Skeleton from 'react-loading-skeleton';
import { motion, AnimatePresence } from 'framer-motion';

interface PublicReportCardProps {
  type: 'shift' | 'day';
  title: string;
  date: string;
  data: {
    wbcSale?: number;
    wStoreSale?: number;
    totalSale?: number;
  };
  isLoading?: boolean;
  lastUpdated?: string;
  isConcluded?: boolean;
}

const fmtTime = (iso?: string) => {
  if (!iso) return null;
  const bare = iso.match(/^T(\d{2}):(\d{2})/);
  if (bare) {
    let h = parseInt(bare[1]);
    const m = bare[2];
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${m} ${ampm}`;
  }
  const normalized = /(Z|[+-]\d{2}:?\d{2})$/.test(iso) ? iso : iso + 'Z';
  const d = new Date(normalized);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

const formatAmount = (val?: number): string => {
  if (val == null || isNaN(val)) return '0';
  const formatted = val.toFixed(2);
  return formatted.endsWith('.00') ? formatted.slice(0, -3) : formatted;
};

export const PublicReportCard = ({ type, title, date, data, isLoading, lastUpdated, isConcluded }: PublicReportCardProps) => {
  const isDayReport = type === 'day';
  const isGreen = isDayReport;

  const cardBg = isGreen ? "bg-[#F4FAF6] dark:bg-emerald-950/20" : "bg-[#FFF9F5] dark:bg-orange-950/20";
  const cardBorder = isGreen ? "border-emerald-200/80 dark:border-emerald-900/40" : "border-orange-200/80 dark:border-orange-900/40";
  const leftBarBg = isGreen ? "before:bg-[#065F46]" : "before:bg-[#D94600]";
  const iconBg = isGreen ? "bg-[#065F46]" : "bg-[#D94600]";
  const titleText = isGreen ? "text-[#065F46] dark:text-emerald-400" : "text-[#A33300] dark:text-orange-400";
  const sectionTitle = isGreen ? "text-[#065F46]" : "text-[#D94600]";
  const rowIconBg = isGreen ? "bg-emerald-100/70 dark:bg-emerald-900/40 text-[#065F46] dark:text-emerald-300" : "bg-orange-100/70 dark:bg-orange-900/40 text-[#D94600] dark:text-orange-300";
  const lineDashed = isGreen ? "border-emerald-300/60 dark:border-emerald-800/60" : "border-orange-300/60 dark:border-orange-800/60";
  const totalLabelText = isGreen ? "text-[#065F46] dark:text-emerald-400" : "text-[#D94600] dark:text-orange-400";
  const totalPillBg = isGreen
    ? "bg-emerald-100/90 dark:bg-emerald-900/50 border-emerald-200/80 dark:border-emerald-800/60 text-[#065F46] dark:text-emerald-300"
    : "bg-orange-100/90 dark:bg-orange-900/50 border-orange-200/80 dark:border-orange-800/60 text-[#D94600] dark:text-orange-300";

  return (
    <div className={`relative overflow-hidden rounded-xl ${cardBg} border ${cardBorder} flex flex-col before:absolute before:left-0 before:top-0 before:bottom-0 before:w-2 ${leftBarBg}`}>
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-4 flex flex-col gap-3"
          >
            <Skeleton width={180} height={20} />
            <Skeleton width="100%" height={80} borderRadius={8} />
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col"
          >
            {/* Header */}
            <div className={`p-3.5 sm:p-4 border-b ${isGreen ? 'border-emerald-200/60 dark:border-emerald-900/30' : 'border-orange-200/60 dark:border-orange-900/30'} flex items-center justify-between gap-2`}>
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-8 h-8 rounded-lg ${iconBg} text-white flex items-center justify-center shrink-0`}>
                  {isDayReport ? <CalendarIcon size={16} /> : <Clock size={16} />}
                </div>
                <h3 className={`text-[14px] font-bold font-display truncate ${titleText}`}>
                  {title} - {formatDateToDisplay(date)}
                </h3>
              </div>

              {/* Header Right Action / Time Pill */}
              {isGreen ? (
                <div className="flex flex-col items-end shrink-0 gap-0.5">
                  {fmtTime(lastUpdated) && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-[#065F46] dark:text-emerald-400">
                      <Clock size={11} />
                      {fmtTime(lastUpdated)}
                    </span>
                  )}
                  {!isConcluded && (
                    <span className="text-[8.5px] font-bold uppercase tracking-wider bg-amber-100/90 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded">
                      LAST UPDATED
                    </span>
                  )}
                </div>
              ) : (
                fmtTime(lastUpdated) && (
                  <div className="px-2.5 py-0.5 rounded-full bg-orange-100/90 dark:bg-orange-900/40 text-[#D94600] dark:text-orange-300 text-[11px] font-semibold flex items-center gap-1 shrink-0">
                    <Clock size={11} />
                    <span>{fmtTime(lastUpdated)}</span>
                  </div>
                )
              )}
            </div>

            {/* Body: SALE FORMATION */}
            <div className="p-3.5 sm:p-4 flex flex-col gap-3">
              <span className={`text-[10px] font-bold tracking-wider uppercase pl-0.5 ${sectionTitle}`}>
                SALE FORMATION
              </span>

              {/* Row 1: WBC Sale */}
              <div className="flex items-center gap-2.5">
                <div className={`w-7 h-7 rounded-lg ${rowIconBg} flex items-center justify-center shrink-0`}>
                  <Coffee size={14} />
                </div>
                <span className="text-[13px] font-medium text-secondary-text font-display">WBC Sale</span>
                <div className={`flex-1 border-b border-dashed ${lineDashed} mx-1`} />
                <span className="text-[13.5px] font-bold text-primary-text font-mono">
                  ₹ {formatAmount(data.wbcSale)}
                </span>
              </div>

              {/* Row 2: W Store Sale */}
              <div className="flex items-center gap-2.5">
                <div className={`w-7 h-7 rounded-lg ${rowIconBg} flex items-center justify-center shrink-0`}>
                  <Store size={14} />
                </div>
                <span className="text-[13px] font-medium text-secondary-text font-display">W Store Sale</span>
                <div className={`flex-1 border-b border-dashed ${lineDashed} mx-1`} />
                <span className="text-[13.5px] font-bold text-primary-text font-mono">
                  ₹ {formatAmount(data.wStoreSale)}
                </span>
              </div>

              {/* Row 3: Total Sale */}
              <div className="flex items-center justify-between pt-1 border-t border-border-main/40 mt-0.5">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-lg ${rowIconBg} flex items-center justify-center shrink-0`}>
                    <BarChart3 size={14} />
                  </div>
                  <span className={`text-[14px] font-bold font-display ${totalLabelText}`}>Total Sale</span>
                </div>
                <div className={`px-3 py-1 rounded-lg border font-mono text-[14.5px] font-bold tracking-tight ${totalPillBg}`}>
                  ₹ {formatAmount(data.totalSale)}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
