import { X, Phone, FileDigit, Calendar, FileText, MapPin, Paperclip, Loader2 } from 'lucide-react';
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

export function BillHeaderBanner({ selectedItem, onClose, editableInvoiceNumber, isRefEditable, onRefNumberChange, refError, isVerifyingRef }: BillHeaderBannerProps) {
  const vendor = selectedItem?.extractedData?.vendor;
  const fileName = selectedItem?.file?.name;

  return (
    <div className="bg-[#0f0f0f] text-white px-5 lg:px-8 py-4 flex flex-col gap-3 shrink-0">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <h1 className="text-[18px] md:text-[22px] font-black tracking-tight leading-tight uppercase truncate">
            {vendor?.name || 'Unknown Vendor'}
          </h1>
          {fileName && selectedItem.file && (
            <button
              onClick={() => {
                const url = URL.createObjectURL(selectedItem.file)
                window.open(url, '_blank')
                setTimeout(() => URL.revokeObjectURL(url), 10000)
              }}
              className="flex items-center gap-1.5 text-[11px] text-white/40 hover:text-white/70 font-medium transition-colors cursor-pointer w-fit max-w-full"
            >
              <Paperclip size={10} />
              <span className="truncate">{fileName}</span>
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/50 hover:text-white">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Detail Grid */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-x-6 gap-y-2 pt-2 border-t border-white/10">
        <div className="flex flex-col gap-0.5">
          <span className="flex items-center gap-1 text-[9px] font-bold text-white/30 uppercase tracking-widest"><Phone size={9}/> Phone</span>
          <span className="text-[13px] font-bold text-white/80 tracking-tight">--</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="flex items-center gap-1 text-[9px] font-bold text-white/30 uppercase tracking-widest"><FileDigit size={9}/> GST</span>
          <span className="text-[13px] font-bold text-white/80 tracking-tight uppercase">{vendor?.gst || '-'}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="flex items-center gap-1 text-[9px] font-bold text-white/30 uppercase tracking-widest"><Calendar size={9}/> Bill Date</span>
          <span className="text-[13px] font-bold text-white/80 tracking-tight">{selectedItem.extractedData?.billDate || '-'}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="flex items-center gap-1 text-[9px] font-bold text-white/30 uppercase tracking-widest">
            <FileText size={9}/> Ref No.
            {isVerifyingRef && <Loader2 size={9} className="animate-spin text-white/40 ml-0.5" />}
          </span>
          {isRefEditable ? (
            <div className="flex flex-col gap-1">
              <input
                type="text"
                value={editableInvoiceNumber}
                onChange={e => onRefNumberChange(e.target.value)}
                placeholder="Enter ref number"
                className={`bg-transparent border-b text-[13px] font-bold text-white/80 outline-none placeholder:text-white/20 w-full py-0.5 transition-colors ${
                  refError === 'mandatory'
                    ? 'border-rose-500 placeholder:text-rose-400/50'
                    : refError === 'duplicate'
                      ? 'border-amber-500'
                      : 'border-white/20 focus:border-white/50'
                }`}
              />
              {refError === 'mandatory' && (
                <span className="text-[10px] font-bold text-rose-400">Ref number is mandatory</span>
              )}
              {refError === 'duplicate' && (
                <span className="text-[10px] font-bold text-amber-400">Duplicate — ref already exists</span>
              )}
            </div>
          ) : (
            <span className="text-[13px] font-bold text-white/80 tracking-tight">{selectedItem.extractedData?.invoiceNumber || '-'}</span>
          )}
        </div>
        {vendor?.address && (
          <div className="flex flex-col gap-0.5 col-span-2">
            <span className="flex items-center gap-1 text-[9px] font-bold text-white/30 uppercase tracking-widest"><MapPin size={9}/> Address</span>
            <span className="text-[12px] font-medium text-white/60 tracking-tight truncate" title={vendor.address}>{vendor.address}</span>
          </div>
        )}
      </div>
    </div>
  );
}
