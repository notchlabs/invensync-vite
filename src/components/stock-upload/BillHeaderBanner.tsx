import { useState } from 'react';
import { X, Calendar, FileText, Paperclip, Loader2, Store, ChevronDown, ChevronUp } from 'lucide-react';
import type { UploadQueueItem } from './UploadArea';

interface BillHeaderBannerProps {
  selectedItem: UploadQueueItem;
  onClose: () => void;
  editableInvoiceNumber: string;
  isRefEditable: boolean;
  onRefNumberChange: (val: string) => void;
  refError: 'mandatory' | 'duplicate' | null;
  isVerifyingRef: boolean;
}

const formatBillDateDisplay = (dateStr?: string | null) => {
  if (!dateStr) return '-';
  const parts = dateStr.includes('-') ? dateStr.split('-') : dateStr.split('/');
  if (parts.length === 3) {
    let day = parts[0];
    let month = parts[1];
    let year = parts[2];
    if (parts[0].length === 4) {
      year = parts[0];
      day = parts[2];
    }
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const mIdx = parseInt(month, 10) - 1;
    if (mIdx >= 0 && mIdx < 12) {
      return `${parseInt(day, 10)} ${months[mIdx]} ${year}`;
    }
  }
  return dateStr;
};

export function BillHeaderBanner({ selectedItem, onClose, editableInvoiceNumber, isRefEditable, onRefNumberChange, refError, isVerifyingRef }: BillHeaderBannerProps) {
  const vendor = selectedItem?.extractedData?.vendor;
  const fileName = selectedItem?.file?.name;
  const [showMore, setShowMore] = useState(false);

  const displayRef = isRefEditable 
    ? (editableInvoiceNumber || '-') 
    : (selectedItem.extractedData?.invoiceNumber || '-');

  return (
    <div className="bg-[#121418] text-white p-4 md:p-5 border-b border-border-main/50 flex flex-col gap-3 shrink-0">
      {/* Top Vendor Info Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {/* Store Circle Icon */}
          <div className="w-11 h-11 rounded-full bg-amber-500/15 border border-amber-500/35 flex items-center justify-center text-amber-400 shrink-0">
            <Store size={20} />
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base md:text-lg font-bold text-white tracking-tight leading-none capitalize truncate">
                {vendor?.name || 'Unknown Vendor'}
              </h1>
            </div>

            <div className="flex items-center gap-3 text-xs text-muted-text font-medium mt-1">
              <span>Ref: <strong className="text-primary-text font-semibold">{displayRef}</strong></span>

              {fileName && selectedItem.file && (
                <button
                  onClick={() => {
                    const url = URL.createObjectURL(selectedItem.file);
                    window.open(url, '_blank');
                    setTimeout(() => URL.revokeObjectURL(url), 10000);
                  }}
                  className="flex items-center gap-1 text-[11px] text-muted-text hover:text-white font-medium transition-colors cursor-pointer"
                  title="View Invoice File"
                >
                  <Paperclip size={11} />
                  <span className="truncate max-w-[150px]">{fileName}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="p-2 hover:bg-white/10 rounded-full text-muted-text hover:text-white transition-colors shrink-0"
          title="Close Modal"
        >
          <X size={18} />
        </button>
      </div>

      {/* Inner Information Panel */}
      <div className="bg-[#181a1e] border border-border-main/60 rounded-xl p-3">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-12 gap-3 items-center text-left divide-y md:divide-y-0 md:divide-x divide-border-main/40">
          
          {/* GSTIN */}
          <div className="lg:col-span-3 flex flex-col gap-0.5 md:pr-3">
            <span className="text-[10px] font-bold text-muted-text uppercase tracking-wider">GSTIN</span>
            <span className="text-[12px] font-bold text-primary-text tracking-tight uppercase font-mono truncate">
              {vendor?.gst || '-'}
            </span>
          </div>

          {/* Bill Date */}
          <div className="lg:col-span-2 flex flex-col gap-0.5 pt-2 md:pt-0 md:px-3">
            <span className="flex items-center gap-1 text-[10px] font-bold text-muted-text uppercase tracking-wider">
              <Calendar size={11} className="text-muted-text/70" /> Bill Date
            </span>
            <span className="text-[12px] font-bold text-primary-text tracking-tight">
              {formatBillDateDisplay(selectedItem.extractedData?.billDate)}
            </span>
          </div>

          {/* Bill No. */}
          <div className="lg:col-span-3 flex flex-col gap-0.5 pt-2 md:pt-0 md:px-3">
            <span className="flex items-center gap-1 text-[10px] font-bold text-muted-text uppercase tracking-wider">
              <FileText size={11} className="text-muted-text/70" /> Bill No.
              {isVerifyingRef && <Loader2 size={10} className="animate-spin text-amber-400 ml-1" />}
            </span>

            {isRefEditable ? (
              <div className="flex flex-col gap-0.5">
                <input
                  type="text"
                  value={editableInvoiceNumber}
                  onChange={e => onRefNumberChange(e.target.value)}
                  placeholder="Enter bill no."
                  className={`bg-transparent border-b text-[12px] font-bold text-primary-text outline-none placeholder:text-muted-text/40 w-full py-0.5 transition-colors ${
                    refError === 'mandatory'
                      ? 'border-rose-500 placeholder:text-rose-400/50'
                      : refError === 'duplicate'
                        ? 'border-amber-500'
                        : 'border-border-main focus:border-amber-400'
                  }`}
                />
                {refError === 'mandatory' && (
                  <span className="text-[9.5px] font-bold text-rose-400">Bill number required</span>
                )}
                {refError === 'duplicate' && (
                  <span className="text-[9.5px] font-bold text-amber-400">Duplicate bill number</span>
                )}
              </div>
            ) : (
              <span className="text-[12px] font-bold text-primary-text tracking-tight">
                {displayRef}
              </span>
            )}
          </div>

          {/* Address & View More */}
          <div className="lg:col-span-4 flex items-center justify-between gap-2 pt-2 md:pt-0 md:pl-3">
            <div className="flex flex-col gap-0.5 min-w-0 flex-1">
              <span className="text-[10px] font-bold text-muted-text uppercase tracking-wider">Address</span>
              <span className="text-[11px] font-medium text-muted-text tracking-tight truncate" title={vendor?.address || ''}>
                {vendor?.address || 'No address provided'}
              </span>
            </div>

            <button
              onClick={() => setShowMore(prev => !prev)}
              className="flex items-center gap-1 text-[11px] font-bold text-amber-400 hover:text-amber-300 transition-colors shrink-0 cursor-pointer ml-2"
            >
              {showMore ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              <span>{showMore ? 'Less' : 'View More'}</span>
            </button>
          </div>
        </div>

        {/* Collapsible More Details */}
        {showMore && (
          <div className="mt-3 pt-3 border-t border-border-main/40 grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-[10px] font-bold text-muted-text uppercase block">Phone</span>
              <span className="font-semibold text-primary-text">{vendor?.phone || '--'}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-muted-text uppercase block">Email</span>
              <span className="font-semibold text-primary-text">{vendor?.email || '--'}</span>
            </div>
            <div className="col-span-2 md:col-span-1">
              <span className="text-[10px] font-bold text-muted-text uppercase block">Full Address</span>
              <span className="font-medium text-primary-text">{vendor?.address || '--'}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
