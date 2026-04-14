import { AlertCircle, Check, Loader2, RefreshCw, RotateCcw } from 'lucide-react';
import { formatIndianCurrency } from '../../utils/numberFormat';

import type { DuplicateInfo } from '../../services/stockUploadService';

interface BillFooterProps {
  subtotal: number;
  tax: number;
  calculatedTotal: number;
  billedTotal: number;
  isDuplicate: boolean;
  duplicateInfo?: DuplicateInfo & { siteNames?: string };
  isSubmitting: boolean;
  onConfirmAndSave: () => void;
  reprocessCount: number;
  isReprocessing: boolean;
  onReprocess: () => void;
  isEdited: boolean;
  onReset: () => void;
}

const BILL_MISMATCH_THRESHOLD = 500;

export function BillFooter({
  subtotal,
  tax,
  calculatedTotal,
  billedTotal,
  isDuplicate,
  duplicateInfo,
  isSubmitting,
  onConfirmAndSave,
  reprocessCount,
  isReprocessing,
  onReprocess,
  isEdited,
  onReset,
}: BillFooterProps) {
  const diff = Math.abs(billedTotal - calculatedTotal);
  const isHighMismatch = diff > BILL_MISMATCH_THRESHOLD;
  const isMinorMismatch = diff > 1 && diff <= BILL_MISMATCH_THRESHOLD;

  return (
    <div className="shrink-0 border-t border-border-main bg-card px-4 lg:px-6 xl:px-8 py-4">
      <div className="max-w-[1200px] mx-auto w-full flex flex-col gap-3">
        {/* Summary Row */}
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
          <div className="flex items-end gap-6">
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-muted-text/60 uppercase tracking-widest">Subtotal</span>
              <span className="text-[14px] font-bold text-primary-text tracking-tight">{formatIndianCurrency(subtotal)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-muted-text/60 uppercase tracking-widest">Tax</span>
              <span className="text-[14px] font-bold text-primary-text tracking-tight">{formatIndianCurrency(tax)}</span>
            </div>
            <div className="flex flex-col gap-0.5 relative group/extra">
              <span className="text-[9px] font-bold text-muted-text/50 uppercase tracking-widest cursor-help flex items-center gap-0.5">Extra <span className="text-muted-text/25 text-[7px]">ⓘ</span></span>
              <span className="text-[14px] font-bold text-primary-text tracking-tight">{formatIndianCurrency(0)}</span>
              <div className="absolute bottom-full left-0 mb-2 w-[200px] bg-card border border-border-main rounded-xl shadow-2xl p-3 flex flex-col gap-1.5 opacity-0 invisible group-hover/extra:opacity-100 group-hover/extra:visible transition-all duration-200 z-[60]">
                <span className="text-[9px] font-black text-muted-text uppercase tracking-widest border-b border-border-main pb-1.5 mb-0.5">Charge Breakup</span>
                <div className="flex justify-between text-[11px]"><span className="text-muted-text">Shipping</span><span className="font-bold text-primary-text">{formatIndianCurrency(0)}</span></div>
                <div className="flex justify-between text-[11px]"><span className="text-muted-text">Handling</span><span className="font-bold text-primary-text">{formatIndianCurrency(0)}</span></div>
                <div className="flex justify-between text-[11px]"><span className="text-muted-text">Other</span><span className="font-bold text-primary-text">{formatIndianCurrency(0)}</span></div>
              </div>
            </div>
            {billedTotal > 0 && (
              <div className="flex flex-col pl-4 border-l border-border-main/50">
                <span className="text-[9px] font-black text-muted-text/60 uppercase tracking-widest">Invoice</span>
                <span className="text-[14px] font-bold text-secondary-text tracking-tight">{formatIndianCurrency(billedTotal)}</span>
              </div>
            )}
          </div>
          <div className="flex flex-col items-end pl-8">
            <span className="text-[9px] font-black text-muted-text/60 uppercase tracking-widest">Calculated</span>
            <span className="text-3xl font-black text-primary-text tracking-tighter leading-none">
              {formatIndianCurrency(calculatedTotal)}
            </span>
          </div>
        </div>

        {/* Validation + Action */}
        {isDuplicate ? (
          <div className="flex items-center gap-3 p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl text-orange-600">
            <div className="w-8 h-8 rounded-lg bg-orange-500/15 flex items-center justify-center shrink-0"><AlertCircle size={16} className="text-orange-500" /></div>
            <span className="text-[12px] font-bold tracking-wide flex-1">
              {duplicateInfo?.siteNames ? (
                <>Already uploaded to <strong className="font-black">{duplicateInfo.siteNames}</strong>.</>
              ) : (
                <>Already uploaded but not yet inbounded to any site.</>
              )}
            </span>
          </div>
        ) : isHighMismatch ? (
          <div className="flex items-center justify-between gap-3 p-3 bg-rose-500/5 border border-rose-500/20 rounded-xl">
            <div className="flex items-center gap-2.5">
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 w-fit">
                  <AlertCircle size={14} className="text-rose-500" />
                  <span className="text-rose-600 text-[12px] font-black">{formatIndianCurrency(diff)} difference</span>
                </div>
                <span className="text-[10px] text-rose-500/50 mt-1 pl-1">Exceeds ₹{BILL_MISMATCH_THRESHOLD} — fix prices or quantities manually or try re-processing</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isEdited ? (
                <button
                  onClick={onReset}
                  className="flex items-center gap-2 px-4 py-2.5 bg-rose-500 text-white rounded-lg text-[11px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all shadow-sm"
                >
                  <RotateCcw size={14} />
                  Undo Edits
                </button>
              ) : (
                reprocessCount < 3 && (
                  <button
                    onClick={onReprocess}
                    disabled={isReprocessing}
                    className="flex items-center gap-2 px-4 py-2.5 bg-rose-500 text-white rounded-lg text-[11px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all disabled:opacity-40 shadow-sm"
                  >
                    <RefreshCw size={14} className={isReprocessing ? 'animate-spin' : ''} />
                    {isReprocessing ? 'Extracting...' : `Extract Data Again (${reprocessCount}/3)`}
                  </button>
                )
              )}
              <button disabled className="shrink-0 px-5 py-2.5 bg-primary-text text-card rounded-lg text-[11px] font-black uppercase tracking-widest opacity-15 cursor-not-allowed">Confirm and Save</button>
            </div>
          </div>
        ) : isMinorMismatch ? (
          <div className="flex items-center justify-between gap-3 p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                <AlertCircle size={14} className="text-amber-500" />
                <span className="text-amber-700 text-[12px] font-black">{formatIndianCurrency(diff)} difference</span>
              </div>
              <span className="text-[10px] text-amber-600/50">Minor mismatch — you can still submit</span>
            </div>
            <button onClick={onConfirmAndSave} disabled={isSubmitting} className="shrink-0 px-5 py-2.5 bg-primary-text text-card rounded-lg text-[11px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg flex items-center justify-center gap-2">
              {isSubmitting ? <><Loader2 size={14} className="animate-spin text-card/80"/> Saving...</> : 'Confirm and Save'}
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3 p-3 bg-[#1a7a4a]/5 border border-[#1a7a4a]/15 rounded-xl">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#1a7a4a]/10 flex items-center justify-center shrink-0"><Check size={16} strokeWidth={3} className="text-[#1a7a4a]" /></div>
              <div className="flex flex-col">
                <span className="text-[#1a7a4a] text-[12px] font-black">Bill verified and ready</span>
                <span className="text-[10px] text-[#1a7a4a]/40">Totals match — valid for submission</span>
              </div>
            </div>
            <button onClick={onConfirmAndSave} disabled={isSubmitting} className="shrink-0 px-5 py-2.5 bg-primary-text text-card rounded-lg text-[11px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg flex items-center justify-center gap-2">
              {isSubmitting ? <><Loader2 size={14} className="animate-spin text-card/80"/> Saving...</> : 'Confirm and Save'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
