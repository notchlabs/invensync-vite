import { Coffee, Store, BarChart3, Receipt, FileText, CreditCard, Banknote, Crown, Clock, Calendar as CalendarIcon, MessageCircle } from 'lucide-react';
import { formatDateToDisplay } from '../../utils/dateUtils';
import Skeleton from 'react-loading-skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const fmtTime = (iso?: string) => {
  if (!iso) return null
  // Bare "T14:30" constant (no timezone) → parse directly
  const bare = iso.match(/^T(\d{2}):(\d{2})/)
  if (bare) {
    let h = parseInt(bare[1])
    const m = bare[2]
    const ampm = h >= 12 ? 'PM' : 'AM'
    h = h % 12 || 12
    return `${h}:${m} ${ampm}`
  }
  // Real UTC ISO string → append Z if no offset present so browser applies local +5:30
  const normalized = /(Z|[+-]\d{2}:?\d{2})$/.test(iso) ? iso : iso + 'Z'
  const d = new Date(normalized)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

import type { Shift } from '../../services/consumptionService';
import { generateWhatsAppAsciiMessage } from '../../utils/asciiReportGenerator';

interface ReportCardProps {
  type: 'shift' | 'day';
  title: string;
  date: string;
  data: {
    wbcSale?: number;
    wStoreSale?: number;
    totalSale?: number;
    billedMop?: number;
    nonBilled?: number;
    upiTotal?: number;
    cashTotal?: number;
    loyaltyTotal?: number;
  };
  isLoading?: boolean;
  lastUpdated?: string;
  isConcluded?: boolean;
  shifts?: Shift[];
}

export const ReportCard = ({ type, title, date, data, isLoading, lastUpdated, isConcluded, shifts }: ReportCardProps) => {
  const isDayReport = type === 'day';
  const isNightShift = title?.toLowerCase().includes('shift b') || title?.toLowerCase().includes('night');
  const isOrangeShift = !isDayReport && !isNightShift;

  const dayShift = shifts?.find(s => s.shiftType === 'DAY');
  const nightShift = shifts?.find(s => s.shiftType === 'NIGHT');
  const dayShiftSale = dayShift?.totalSale || 0;
  const nightShiftSale = nightShift?.totalSale || 0;
  const hasShiftDetails = Boolean(shifts && shifts.length > 0 && (dayShiftSale > 0 || nightShiftSale > 0));

  const handleSendWhatsAppShift = (e: React.MouseEvent) => {
    e.stopPropagation();
    const formattedDate = date ? formatDateToDisplay(date) : '';
    const siteDisplayName = 'WildBean Cafe Rengali';

    const cleanTitle = title.endsWith('Report') ? title : `${title} Report`;
    const message = generateWhatsAppAsciiMessage({
      title: isDayReport ? 'DAILY SALES' : cleanTitle.toUpperCase(),
      outletName: siteDisplayName,
      dateStr: formattedDate,
      isConcluded,
      totalSale: data.totalSale,
      wbcSale: data.wbcSale,
      wStoreSale: data.wStoreSale,
      dayShiftSale: isDayReport ? dayShiftSale : (title.toLowerCase().includes('day') ? (data.totalSale || 0) : 0),
      nightShiftSale: isDayReport ? nightShiftSale : (isNightShift ? (data.totalSale || 0) : 0),
      billedAmount: data.billedMop,
      nonBilledAmount: data.nonBilled,
      upiAndCardAmount: data.upiTotal,
      cashAmount: data.cashTotal,
      loyalty: data.loyaltyTotal,
      includeShiftSection: isDayReport || hasShiftDetails,
    });

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(message).catch((err) => console.error('Clipboard error:', err));
    }

    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');

    toast.success(`${cleanTitle} copied & opening WhatsApp!`, { duration: 4000 });
  };

  // Theme logic
  let cardBg = "bg-green-50/40 dark:bg-green-500/5";
  let cardBorder = "border-[#065f46]";
  let beforeBg = "before:bg-[#065f46]";
  let headerText = "text-[#065f46]";
  let headerBorder = "border-[#065f46]";
  let sectionTitle = "text-[#065f46]";
  let itemBorder = "border-[#065f46]";
  let totalBorder = "border-[#065f46]";
  let totalText = "text-[#065f46]";

  if (isNightShift) {
    cardBg = "bg-blue-50/40 dark:bg-blue-500/5";
    cardBorder = "border-[#2563eb]";
    beforeBg = "before:bg-[#2563eb]";
    headerText = "text-[#2563eb]";
    headerBorder = "border-[#2563eb]";
    sectionTitle = "text-[#2563eb]";
    itemBorder = "border-[#2563eb]";
    totalBorder = "border-[#2563eb]";
    totalText = "text-[#9a3412]"; // Keep orange as per screenshot
  } else if (isOrangeShift) {
    cardBg = "bg-orange-50/40 dark:bg-orange-500/5";
    cardBorder = "border-[#9a3412]";
    beforeBg = "before:bg-[#9a3412]";
    headerText = "text-[#9a3412]";
    headerBorder = "border-[#9a3412]";
    sectionTitle = "text-[#9a3412]";
    itemBorder = "border-[#9a3412]";
    totalBorder = "border-[#9a3412]";
    totalText = "text-[#9a3412]";
  }

  return (
    <div className={`relative overflow-hidden rounded-xl ${cardBg} border ${cardBorder} shadow-sm flex flex-col before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1.5 ${beforeBg} min-h-[400px]`}>
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col h-full"
          >
            <div className="p-4 border-b border-border-main flex items-center justify-between">
              <Skeleton width={180} height={20} />
            </div>
            <div className="p-5 flex flex-col gap-6">
              {[1, 2, 3].map(section => (
                <div key={section} className="flex flex-col gap-2.5">
                  <Skeleton width={100} height={12} />
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between py-1.5 border-b border-neutral-100 dark:border-neutral-800 border-dashed">
                      <Skeleton width={120} height={16} />
                      <Skeleton width={60} height={16} />
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-neutral-100 dark:border-neutral-800 border-dashed">
                      <Skeleton width={120} height={16} />
                      <Skeleton width={60} height={16} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col h-full"
          >
            <div className={`p-4 border-b ${headerBorder} flex items-center justify-between gap-2`}>
              <div className={`flex items-center gap-2 ${headerText} font-bold text-[14px] min-w-0`}>
                {isDayReport ? <CalendarIcon size={16} className="shrink-0" /> : <Clock size={16} className="shrink-0" />}
                <span className="truncate">{title} - {formatDateToDisplay(date)}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleSendWhatsAppShift}
                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-[11px] rounded-lg transition-all flex items-center gap-1 cursor-pointer border border-emerald-500/30 shadow-sm shrink-0"
                  title={`Send ${title} Report to WhatsApp`}
                >
                  <MessageCircle size={13} />
                  <span className="hidden sm:inline">WhatsApp</span>
                </button>

                {fmtTime(lastUpdated) && (
                  <div className="flex flex-col items-end gap-0.5">
                    <span className={`flex items-center gap-1 text-[11px] font-semibold ${headerText} opacity-70`}>
                      <Clock size={11} />
                      {fmtTime(lastUpdated)}
                    </span>
                    {isDayReport && !isConcluded && (
                      <span className="text-[9px] font-bold uppercase tracking-wider text-amber-500">
                        Last updated
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="p-5 flex flex-col gap-6">
              {/* SALE FORMATION */}
              <div className="flex flex-col gap-2.5">
                <span className={`text-[10px] font-black ${sectionTitle} uppercase tracking-widest pl-1`}>SALE FORMATION</span>
                <div className={`flex justify-between items-center text-[13px] font-medium text-secondary-text py-1.5 border-b ${itemBorder} border-dashed last:border-0`}>
                  <span className="flex items-center gap-1.5"><Coffee size={14} className="text-secondary-text/70" /> WBC Sale</span>
                  <span className="text-primary-text font-bold">₹ {data.wbcSale?.toFixed(2) || '-'}</span>
                </div>
                <div className={`flex justify-between items-center text-[13px] font-medium text-secondary-text py-1.5 border-b ${itemBorder} border-dashed last:border-0`}>
                  <span className="flex items-center gap-1.5"><Store size={14} className="text-secondary-text/70" /> W Store Sale</span>
                  <span className="text-primary-text font-bold">₹ {data.wStoreSale?.toFixed(2) || '-'}</span>
                </div>
                <div className={`flex justify-between items-center text-[15px] font-black ${totalText} pt-2.5 border-t ${totalBorder}`}>
                  <span className="flex items-center gap-1.5"><BarChart3 size={16} /> Total Sale</span>
                  <span className="tracking-tight">₹ {data.totalSale?.toFixed(2) || '-'}</span>
                </div>
              </div>

              {/* BILLING BREAKUP */}
              <div className="flex flex-col gap-2.5">
                <span className={`text-[10px] font-black ${sectionTitle} uppercase tracking-widest pl-1`}>BILLING BREAKUP</span>
                <div className={`flex justify-between items-center text-[13px] font-medium text-secondary-text py-1.5 border-b ${itemBorder} border-dashed last:border-0`}>
                  <span className="flex items-center gap-1.5"><Receipt size={14} className="text-secondary-text/70" /> Billed (MOP)</span>
                  <span className="text-primary-text font-bold">₹ {data.billedMop?.toFixed(2) || '-'}</span>
                </div>
                <div className={`flex justify-between items-center text-[13px] font-medium text-secondary-text py-1.5 border-b ${itemBorder} border-dashed last:border-0`}>
                  <span className="flex items-center gap-1.5"><FileText size={14} className="text-secondary-text/70" /> Non-Billed</span>
                  <span className="text-primary-text font-bold">₹ {data.nonBilled?.toFixed(2) || '-'}</span>
                </div>
              </div>

              {/* PAYMENT MODE */}
              <div className="flex flex-col gap-2.5">
                <span className={`text-[10px] font-black ${sectionTitle} uppercase tracking-widest pl-1`}>{isDayReport ? 'PAYMENT MODE' : 'PAYMENT MODE (BILLED)'}</span>
                <div className={`flex justify-between items-center text-[13px] font-medium text-secondary-text py-1.5 border-b ${itemBorder} border-dashed`}>
                  <span className="flex items-center gap-1.5"><CreditCard size={14} className="text-secondary-text/70" /> UPI / Card</span>
                  <span className="text-primary-text font-bold">₹ {data.upiTotal?.toFixed(2) || '-'}</span>
                </div>
                <div className={`flex justify-between items-center text-[13px] font-medium text-secondary-text py-1.5 border-b ${itemBorder} border-dashed`}>
                  <span className="flex items-center gap-1.5"><Banknote size={14} className="text-secondary-text/70" /> Cash</span>
                  <span className="text-primary-text font-bold">₹ {data.cashTotal?.toFixed(2) || '-'}</span>
                </div>
                <div className={`flex justify-between items-center text-[13px] font-medium text-secondary-text py-1.5`}>
                  <span className="flex items-center gap-1.5"><Crown size={14} className="text-secondary-text/70" /> Loyalty</span>
                  <span className="text-primary-text font-bold">₹ {data.loyaltyTotal?.toFixed(2) || '-'}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
