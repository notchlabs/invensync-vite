import { useState } from 'react';
import { Coffee, Clock, Calendar as CalendarIcon, CreditCard, Banknote, ChevronDown, Receipt, FileText, BarChart3, Sun, Moon, Crown, History, Store } from 'lucide-react';
import { formatDateToDisplay, formatTimeToAmPm } from '../../utils/dateUtils';
import type { Shift } from '../../services/consumptionService';
import Skeleton from 'react-loading-skeleton';
import { motion, AnimatePresence } from 'framer-motion';

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
  return formatTimeToAmPm(iso);
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
  shifts,
}: SalesDayReportCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const isDayReport = variant === 'dayReport';
  const isNightShift = variant === 'nightShift';

  const dayShift = shifts?.find(s => s.shiftType === 'DAY');
  const nightShift = shifts?.find(s => s.shiftType === 'NIGHT');
  const dayShiftSale = dayShift?.totalSale || 0;
  const nightShiftSale = nightShift?.totalSale || 0;
  const hasShiftDetails = Boolean(shifts && shifts.length > 0 && (dayShiftSale > 0 || nightShiftSale > 0));

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
            <div className={`p-3.5 sm:p-4 border-b border-border-main/50 flex items-center justify-between gap-3`}>
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
                  {isDayReport ? <CalendarIcon size={16} /> : <Clock size={16} />}
                </div>
                <h3 className={`text-[14px] font-bold font-display truncate ${titleText}`}>
                  {title} - {formatDateToDisplay(date)}
                </h3>
              </div>

              {fmtTime(lastUpdated) && (
                <div className={`px-2.5 py-1 rounded-full ${timePillBg} text-[11.5px] font-semibold flex items-center gap-1.5 shrink-0 font-mono shadow-2xs`}>
                  <History size={13} className="shrink-0" />
                  <span>{fmtTime(lastUpdated)}</span>
                </div>
              )}
            </div>

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
                    <div className="bg-surface/60 border border-border-main/50 rounded-xl p-2.5 flex flex-col justify-between gap-1.5 min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className="w-5 h-5 rounded-md bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                          <Sun size={12} />
                        </div>
                        <span className="text-[11.5px] font-semibold text-secondary-text truncate whitespace-nowrap">
                          Day Shift
                        </span>
                      </div>
                      <span className="text-[13.5px] font-bold text-primary-text font-mono whitespace-nowrap">
                        ₹ {formatAmount(dayShiftSale)}
                      </span>
                    </div>

                    <div className="bg-surface/60 border border-border-main/50 rounded-xl p-2.5 flex flex-col justify-between gap-1.5 min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className="w-5 h-5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                          <Moon size={12} />
                        </div>
                        <span className="text-[11.5px] font-semibold text-secondary-text truncate whitespace-nowrap">
                          Night Shift
                        </span>
                      </div>
                      <span className="text-[13.5px] font-bold text-primary-text font-mono whitespace-nowrap">
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

