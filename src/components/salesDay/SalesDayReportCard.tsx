import { useState, useMemo } from 'react';
import { Coffee, Store, BarChart3, Clock, Calendar as CalendarIcon, Receipt, FileText, CreditCard, Banknote, Crown, ChevronDown, MessageCircle, Sun, Moon, Terminal, Copy, Check } from 'lucide-react';
import { formatDateToDisplay } from '../../utils/dateUtils';
import type { Shift } from '../../services/consumptionService';
import { generateAsciiReport, generateWhatsAppAsciiMessage } from '../../utils/asciiReportGenerator';
import Skeleton from 'react-loading-skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export interface SalesDayReportData {
  wbcSale?: number;
  wStoreSale?: number;
  totalSale?: number;
  billedAmount?: number;
  nonBilledAmount?: number;
  upiAndCardAmount?: number;
  cashAmount?: number;
  loyalty?: number;
  totalCost?: number;
  totalProfit?: number;
  margin?: number;
}

interface SalesDayReportCardProps {
  variant: 'dayShift' | 'nightShift' | 'dayReport';
  title: string;
  date: string;
  data: SalesDayReportData;
  isLoading?: boolean;
  lastUpdated?: string;
  isConcluded?: boolean;
  shifts?: Shift[];
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
  if (isNaN(d.getTime())) return null;
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

const formatAmount = (val?: number): string => {
  if (val == null || isNaN(val)) return '0.00';
  return val.toFixed(2);
};

export const SalesDayReportCard = ({
  variant,
  title,
  date,
  data,
  isLoading,
  lastUpdated,
  isConcluded,
  shifts,
}: SalesDayReportCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPlainText, setShowPlainText] = useState(false);
  const [hasCopiedAscii, setHasCopiedAscii] = useState(false);

  const isDayReport = variant === 'dayReport';
  const isNightShift = variant === 'nightShift';

  const dayShift = shifts?.find(s => s.shiftType === 'DAY');
  const nightShift = shifts?.find(s => s.shiftType === 'NIGHT');
  const dayShiftSale = dayShift?.totalSale || 0;
  const nightShiftSale = nightShift?.totalSale || 0;
  const hasShiftDetails = Boolean(shifts && shifts.length > 0 && (dayShiftSale > 0 || nightShiftSale > 0));

  const formattedDate = date ? formatDateToDisplay(date) : '';
  const siteDisplayName = 'WildBean Cafe Rengali';

  const asciiReportText = useMemo(() => {
    return generateAsciiReport({
      title: isDayReport ? 'DAILY SALES' : title.toUpperCase(),
      outletName: siteDisplayName,
      dateStr: formattedDate,
      isConcluded,
      totalSale: data.totalSale,
      wbcSale: data.wbcSale,
      wStoreSale: data.wStoreSale,
      dayShiftSale: isDayReport ? dayShiftSale : (variant === 'dayShift' ? (data.totalSale || 0) : 0),
      nightShiftSale: isDayReport ? nightShiftSale : (variant === 'nightShift' ? (data.totalSale || 0) : 0),
      billedAmount: data.billedAmount,
      nonBilledAmount: data.nonBilledAmount,
      upiAndCardAmount: data.upiAndCardAmount,
      cashAmount: data.cashAmount,
      loyalty: data.loyalty,
      includeShiftSection: isDayReport || hasShiftDetails,
    });
  }, [isDayReport, title, siteDisplayName, formattedDate, isConcluded, data, dayShiftSale, nightShiftSale, variant, hasShiftDetails]);

  const handleCopyAscii = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(asciiReportText).then(() => {
        setHasCopiedAscii(true);
        toast.success('Plain text report copied to clipboard!');
        setTimeout(() => setHasCopiedAscii(false), 2000);
      }).catch((err) => console.error('Clipboard error:', err));
    }
  };

  const handleSendWhatsAppShift = (e: React.MouseEvent) => {
    e.stopPropagation();

    const cleanTitle = title.endsWith('Report') ? title : `${title} Report`;
    const message = generateWhatsAppAsciiMessage({
      title: isDayReport ? 'DAILY SALES' : title.toUpperCase(),
      outletName: siteDisplayName,
      dateStr: formattedDate,
      isConcluded,
      totalSale: data.totalSale,
      wbcSale: data.wbcSale,
      wStoreSale: data.wStoreSale,
      dayShiftSale: isDayReport ? dayShiftSale : (variant === 'dayShift' ? (data.totalSale || 0) : 0),
      nightShiftSale: isDayReport ? nightShiftSale : (variant === 'nightShift' ? (data.totalSale || 0) : 0),
      billedAmount: data.billedAmount,
      nonBilledAmount: data.nonBilledAmount,
      upiAndCardAmount: data.upiAndCardAmount,
      cashAmount: data.cashAmount,
      loyalty: data.loyalty,
      includeShiftSection: isDayReport || hasShiftDetails,
    });

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(message).catch((err) => console.error('Clipboard error:', err));
    }

    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');

    toast.success(`${cleanTitle} copied & opening WhatsApp!`, { duration: 4000 });
  };

  // Styling maps based on card variant
  let cardBorder = "border-orange-500/50 dark:border-orange-500/40";
  let leftBarBg = "before:bg-orange-500";
  let iconBg = "bg-orange-500 text-white";
  let titleText = "text-orange-600 dark:text-orange-400";
  let sectionTitle = "text-orange-600 dark:text-orange-400";
  let rowIconBg = "bg-orange-500/10 text-orange-600 dark:text-orange-400";
  let lineDashed = "border-orange-500/20 dark:border-orange-500/30";
  let totalLabelText = "text-orange-600 dark:text-orange-400";
  let totalPillBg = "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30";
  let timePillBg = "bg-orange-500/10 text-orange-600 dark:text-orange-400";
  let expandBtnBg = "bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/20";

  if (isNightShift) {
    cardBorder = "border-blue-500/50 dark:border-blue-500/40";
    leftBarBg = "before:bg-blue-500";
    iconBg = "bg-blue-500 text-white";
    titleText = "text-blue-600 dark:text-blue-400";
    sectionTitle = "text-blue-600 dark:text-blue-400";
    rowIconBg = "bg-blue-500/10 text-blue-600 dark:text-blue-400";
    lineDashed = "border-blue-500/20 dark:border-blue-500/30";
    totalLabelText = "text-blue-600 dark:text-blue-400";
    totalPillBg = "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30";
    timePillBg = "bg-blue-500/10 text-blue-600 dark:text-blue-400";
    expandBtnBg = "bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/20";
  } else if (isDayReport) {
    cardBorder = "border-emerald-500/50 dark:border-emerald-500/40";
    leftBarBg = "before:bg-emerald-500";
    iconBg = "bg-emerald-500 text-white";
    titleText = "text-emerald-600 dark:text-emerald-400";
    sectionTitle = "text-emerald-600 dark:text-emerald-400";
    rowIconBg = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
    lineDashed = "border-emerald-500/20 dark:border-emerald-500/30";
    totalLabelText = "text-emerald-600 dark:text-emerald-400";
    totalPillBg = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
    timePillBg = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
    expandBtnBg = "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
  }

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-card border ${cardBorder} shadow-sm flex flex-col before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1.5 ${leftBarBg} transition-all`}>
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
            <Skeleton width="100%" height={120} borderRadius={8} />
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
            <div className={`p-3.5 sm:p-4 border-b border-border-main/50 flex items-center justify-between gap-2`}>
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
                  {isDayReport ? <CalendarIcon size={16} /> : <Clock size={16} />}
                </div>
                <h3 className={`text-[14px] font-bold font-display truncate ${titleText}`}>
                  {title} - {formatDateToDisplay(date)}
                </h3>
              </div>

              {/* Header Right Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowPlainText(!showPlainText)}
                  className={`px-2 py-1 bg-surface hover:bg-surface/80 border border-border-main active:scale-95 text-secondary-text font-bold text-[11px] rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-sm shrink-0 ${showPlainText ? 'ring-1 ring-emerald-500/50 text-emerald-600 dark:text-emerald-400' : ''}`}
                  title="View ASCII Plain Text Report"
                >
                  <Terminal size={13} />
                  <span className="hidden sm:inline">Plain text</span>
                </button>

                <button
                  type="button"
                  onClick={handleSendWhatsAppShift}
                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-[11px] rounded-lg transition-all flex items-center gap-1 cursor-pointer border border-emerald-500/30 shadow-sm shrink-0"
                  title={`Send ${title} Report to WhatsApp`}
                >
                  <MessageCircle size={13} />
                  <span className="hidden sm:inline">WhatsApp</span>
                </button>

                {isDayReport ? (
                  <div className="flex flex-col items-end shrink-0 gap-0.5">
                    {fmtTime(lastUpdated) && (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        <Clock size={11} />
                        {fmtTime(lastUpdated)}
                      </span>
                    )}
                    {!isConcluded && (
                      <span className="text-[8.5px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded">
                        LAST UPDATED
                      </span>
                    )}
                  </div>
                ) : (
                  fmtTime(lastUpdated) && (
                    <div className={`px-2.5 py-0.5 rounded-full ${timePillBg} text-[11px] font-semibold flex items-center gap-1 shrink-0`}>
                      <Clock size={11} />
                      <span>{fmtTime(lastUpdated)}</span>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* ── Plain Text Monospace Preview Container ── */}
            <AnimatePresence>
              {showPlainText && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3.5 sm:p-4 bg-neutral-950 text-neutral-200 border-b border-border-main flex flex-col gap-2.5 overflow-hidden"
                >
                  <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                    <span className="text-[11.5px] font-mono font-semibold text-neutral-400">
                      Plain text
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyAscii}
                      className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-neutral-200 font-mono text-[11px] rounded-lg transition-all flex items-center gap-1.5 cursor-pointer border border-neutral-700 shadow-sm"
                    >
                      {hasCopiedAscii ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      <span>{hasCopiedAscii ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="font-mono text-[11px] sm:text-[12px] leading-snug text-neutral-100 overflow-x-auto whitespace-pre selection:bg-neutral-800">
                    {asciiReportText}
                  </pre>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="p-3.5 sm:p-4 flex flex-col gap-3.5">
              {/* ── Section 1: SALE FORMATION ── */}
              <div className="flex flex-col gap-2.5">
                <span className={`text-[10px] font-bold tracking-wider uppercase ${sectionTitle}`}>
                  SALE FORMATION
                </span>

                {/* WBC Sale */}
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

                {/* W Store Sale */}
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

                {/* Total Sale */}
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

              {/* ── Day Report: Day & Night Shift Details in short ── */}
              {isDayReport && (hasShiftDetails || (shifts && shifts.length > 0)) && (
                <div className="flex flex-col gap-2 pt-1 border-t border-border-main/40">
                  <span className={`text-[10px] font-bold tracking-wider uppercase ${sectionTitle}`}>
                    SHIFT DETAILS
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-surface/60 border border-border-main/50 rounded-xl p-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-md bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                          <Sun size={12} />
                        </div>
                        <span className="text-[12px] font-medium text-secondary-text">Day Shift</span>
                      </div>
                      <span className="text-[13px] font-bold text-primary-text font-mono">
                        ₹ {formatAmount(dayShiftSale)}
                      </span>
                    </div>

                    <div className="bg-surface/60 border border-border-main/50 rounded-xl p-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                          <Moon size={12} />
                        </div>
                        <span className="text-[12px] font-medium text-secondary-text">Night Shift</span>
                      </div>
                      <span className="text-[13px] font-bold text-primary-text font-mono">
                        ₹ {formatAmount(nightShiftSale)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Shift Financial Metrics Summary Row (Total Cost, Total Profit, Margin) ── */}
              <div className="grid grid-cols-3 gap-2 bg-surface/60 border border-border-main/60 rounded-xl p-2.5 mt-1">
                <div className="flex flex-col items-center justify-center text-center">
                  <span className="text-[9.5px] font-bold text-muted-text uppercase tracking-wider">Total Cost</span>
                  <span className="text-[12.5px] font-bold text-primary-text font-mono mt-0.5">
                    ₹ {formatAmount(data.totalCost)}
                  </span>
                </div>
                <div className="flex flex-col items-center justify-center text-center border-x border-border-main/40 px-1">
                  <span className="text-[9.5px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Total Profit</span>
                  <span className="text-[12.5px] font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                    ₹ {formatAmount(data.totalProfit)}
                  </span>
                </div>
                <div className="flex flex-col items-center justify-center text-center">
                  <span className="text-[9.5px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Margin</span>
                  <span className="text-[12.5px] font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                    {formatAmount(data.margin)}%
                  </span>
                </div>
              </div>

              {/* ── Expandable Details Button ── */}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={`w-full py-2 px-3 rounded-xl font-semibold text-[12.5px] flex items-center justify-center gap-1.5 border transition-all cursor-pointer mt-1 ${expandBtnBg}`}
              >
                <span>
                  {isExpanded
                    ? (isDayReport ? 'Hide Full Day Details' : 'Hide Full Shift Details')
                    : (isDayReport ? 'View Full Day Report Details' : 'View Full Shift Details')}
                </span>
                <ChevronDown size={14} className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
              </button>

              {/* ── Collapsible Sections (Billing Breakup & Payment Modes) ── */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden flex flex-col gap-3.5 pt-2 border-t border-border-main/40 mt-1"
                  >
                    {/* ── Section 2: BILLING BREAKUP ── */}
                    <div className="flex flex-col gap-2.5">
                      <span className={`text-[10px] font-bold tracking-wider uppercase ${sectionTitle}`}>
                        BILLING BREAKUP
                      </span>

                      {/* Billed (MOP) */}
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-lg ${rowIconBg} flex items-center justify-center shrink-0`}>
                          <Receipt size={14} />
                        </div>
                        <span className="text-[13px] font-medium text-secondary-text font-display">Billed (MOP)</span>
                        <div className={`flex-1 border-b border-dashed ${lineDashed} mx-1`} />
                        <span className="text-[13.5px] font-bold text-primary-text font-mono">
                          ₹ {formatAmount(data.billedAmount)}
                        </span>
                      </div>

                      {/* Non-Billed */}
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-lg ${rowIconBg} flex items-center justify-center shrink-0`}>
                          <FileText size={14} />
                        </div>
                        <span className="text-[13px] font-medium text-secondary-text font-display">Non-Billed</span>
                        <div className={`flex-1 border-b border-dashed ${lineDashed} mx-1`} />
                        <span className="text-[13.5px] font-bold text-primary-text font-mono">
                          ₹ {formatAmount(data.nonBilledAmount)}
                        </span>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="w-full h-px bg-border-main/50" />

                    {/* ── Section 3: PAYMENT MODE (BILLED) ── */}
                    <div className="flex flex-col gap-2.5">
                      <span className={`text-[10px] font-bold tracking-wider uppercase ${sectionTitle}`}>
                        {isDayReport ? 'PAYMENT MODE' : 'PAYMENT MODE (BILLED)'}
                      </span>

                      {/* UPI / Card */}
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-lg ${rowIconBg} flex items-center justify-center shrink-0`}>
                          <CreditCard size={14} />
                        </div>
                        <span className="text-[13px] font-medium text-secondary-text font-display">UPI / Card</span>
                        <div className={`flex-1 border-b border-dashed ${lineDashed} mx-1`} />
                        <span className="text-[13.5px] font-bold text-primary-text font-mono">
                          ₹ {formatAmount(data.upiAndCardAmount)}
                        </span>
                      </div>

                      {/* Cash */}
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-lg ${rowIconBg} flex items-center justify-center shrink-0`}>
                          <Banknote size={14} />
                        </div>
                        <span className="text-[13px] font-medium text-secondary-text font-display">Cash</span>
                        <div className={`flex-1 border-b border-dashed ${lineDashed} mx-1`} />
                        <span className="text-[13.5px] font-bold text-primary-text font-mono">
                          ₹ {formatAmount(data.cashAmount)}
                        </span>
                      </div>

                      {/* Loyalty */}
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-lg ${rowIconBg} flex items-center justify-center shrink-0`}>
                          <Crown size={14} />
                        </div>
                        <span className="text-[13px] font-medium text-secondary-text font-display">Loyalty</span>
                        <div className={`flex-1 border-b border-dashed ${lineDashed} mx-1`} />
                        <span className="text-[13.5px] font-bold text-primary-text font-mono">
                          ₹ {formatAmount(data.loyalty)}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

