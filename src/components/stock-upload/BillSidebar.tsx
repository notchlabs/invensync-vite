import { FileText, ChevronDown, AlertCircle, X, Loader2 } from 'lucide-react';
import type { UploadQueueItem } from './UploadArea';

interface BillSidebarProps {
  isVerifying: boolean;
  uniqueBills: UploadQueueItem[];
  duplicateBills: (UploadQueueItem & { duplicateInfo: any })[];
  selectedBillId: string | null;
  setSelectedBillId: (id: string) => void;
  uniqueOpen: boolean;
  setUniqueOpen: (v: boolean) => void;
  duplicatesOpen: boolean;
  setDuplicatesOpen: (v: boolean) => void;
  fileUrl: string | null;
  previewHidden: boolean;
  setPreviewHidden: (v: boolean) => void;
}

export function BillSidebar({
  isVerifying,
  uniqueBills,
  duplicateBills,
  selectedBillId,
  setSelectedBillId,
  uniqueOpen,
  setUniqueOpen,
  duplicatesOpen,
  setDuplicatesOpen,
  fileUrl,
  previewHidden,
  setPreviewHidden,
}: BillSidebarProps) {

  if (isVerifying) {
    return (
      <div className="flex flex-col items-center justify-center mt-20 opacity-50">
        <Loader2 size={32} className="mb-4 animate-spin text-white" />
        <span className="text-[12px] font-bold text-white/50 tracking-widest uppercase text-center leading-relaxed">Verifying bills &<br />loading images...</span>
      </div>
    );
  }

  return (
    <>
      {/* Unique Bills */}
      <div className="flex flex-col bg-[#1a1a1a] rounded-xl overflow-hidden border border-[#2a2a2a]">
        <button onClick={() => setUniqueOpen(!uniqueOpen)} className="w-full p-4 flex justify-between items-center bg-[#222222] hover:bg-[#2a2a2a] transition-colors">
          <div className="flex items-center gap-2.5 text-[12px] font-black uppercase tracking-widest text-white">
            <FileText size={14} className="text-white/60" /> Unique Bills ({uniqueBills.length})
          </div>
          <ChevronDown size={14} className={`text-white/40 transition-transform duration-300 ${uniqueOpen ? 'rotate-180' : ''}`} />
        </button>
        {uniqueOpen && uniqueBills.length > 0 && (
          <div className="flex flex-col p-2 gap-1 bg-[#161616]">
            {uniqueBills.map(bill => (
              <div key={bill.id} onClick={() => setSelectedBillId(bill.id)}
                className={`p-4 rounded-xl text-left flex flex-col gap-1.5 transition-all text-white border ${selectedBillId === bill.id ? 'bg-[#333333] border-[#555555] shadow-lg' : 'bg-transparent border-transparent hover:bg-[#222222] hover:border-[#333333] cursor-pointer'}`}>
                <span className={`text-[15px] font-black truncate leading-none tracking-tight ${selectedBillId === bill.id ? 'text-white' : 'text-white/80'}`}>
                  {bill.extractedData?.vendor?.name || 'Unknown Vendor'}
                </span>
                <div className={`flex flex-col text-[12px] font-medium tracking-wide ${selectedBillId === bill.id ? 'text-white/70' : 'text-white/40'}`}>
                  <span>Ref: {bill.extractedData?.invoiceNumber || '-'}</span>
                  <span className="mt-0.5">{bill.extractedData?.billDate || 'No Date'}</span>
                </div>
                {selectedBillId === bill.id && fileUrl && (
                  previewHidden ? (
                    <button onClick={(e) => { e.stopPropagation(); setPreviewHidden(false); }} className="mt-3 w-full py-2.5 bg-[#111] hover:bg-[#222] border border-[#333] rounded-lg text-[11px] font-bold text-white/70 uppercase tracking-widest flex items-center justify-center gap-2 transition-colors">
                      <FileText size={14} /> Show Attachment
                    </button>
                  ) : (
                    <div className="mt-4 w-full h-[500px] xl:h-[600px] 2xl:h-[750px] bg-[#111111] rounded-lg overflow-hidden border border-[#555] cursor-default shadow-inner relative group/preview" onClick={e => e.stopPropagation()}>
                      <button onClick={(e) => { e.stopPropagation(); setPreviewHidden(true); }} className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black text-white rounded-lg z-[50] transition-colors shadow-md backdrop-blur-sm opacity-0 group-hover/preview:opacity-100" title="Hide Preview">
                        <X size={16} />
                      </button>
                      <iframe src={fileUrl} className="absolute inset-0 w-full h-full border-0 bg-transparent" />
                    </div>
                  )
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Duplicates */}
      <div className="flex flex-col bg-[#2e1515] rounded-xl overflow-hidden border border-[#4a2222]">
        <button onClick={() => setDuplicatesOpen(!duplicatesOpen)} className="w-full p-4 flex justify-between items-center bg-[#3a1a1a] hover:bg-[#4a2222] transition-colors">
          <div className="flex items-center gap-2.5 text-[12px] font-black uppercase tracking-widest text-[#ff6b6b]">
            <AlertCircle size={14} className="opacity-80" /> Duplicates ({duplicateBills.length})
          </div>
          <ChevronDown size={14} className={`text-[#ff6b6b]/60 transition-transform duration-300 ${duplicatesOpen ? 'rotate-180' : ''}`} />
        </button>
        {duplicatesOpen && duplicateBills.length > 0 && (
          <div className="flex flex-col p-2 gap-1 bg-[#221010]">
            {duplicateBills.map(bill => (
              <div key={bill.id} onClick={() => setSelectedBillId(bill.id)}
                className={`p-4 rounded-xl text-left flex flex-col gap-1.5 transition-all border ${selectedBillId === bill.id ? 'bg-[#ff4444]/20 border-[#ff4444]/40 shadow-lg' : 'bg-transparent border-transparent hover:bg-[#ff4444]/10 hover:border-[#ff4444]/20 cursor-pointer'}`}>
                <span className={`text-[15px] font-black truncate leading-none tracking-tight ${selectedBillId === bill.id ? 'text-[#ff6b6b]' : 'text-[#ff6b6b]/80'}`}>
                  {bill.extractedData?.vendor?.name || 'Unknown Vendor'}
                </span>
                <div className={`flex flex-col text-[12px] font-medium tracking-wide ${selectedBillId === bill.id ? 'text-[#ff6b6b]/80' : 'text-[#ff6b6b]/50'}`}>
                  <span>Ref: {bill.extractedData?.invoiceNumber || '-'}</span>
                  <span className="mt-0.5">{bill.extractedData?.billDate || 'No Date'}</span>
                </div>
                {selectedBillId === bill.id && fileUrl && (
                  previewHidden ? (
                    <button onClick={(e) => { e.stopPropagation(); setPreviewHidden(false); }} className="mt-3 w-full py-2.5 bg-[#4a2222]/50 hover:bg-[#4a2222] border border-[#ff4444]/30 rounded-lg text-[11px] font-bold text-[#ff6b6b]/70 uppercase tracking-widest flex items-center justify-center gap-2 transition-colors">
                      <FileText size={14} /> Show Attachment
                    </button>
                  ) : (
                    <div className="mt-4 w-full h-[500px] xl:h-[600px] 2xl:h-[750px] bg-[#111111] rounded-lg overflow-hidden border border-[#555] cursor-default shadow-inner relative group/preview" onClick={e => e.stopPropagation()}>
                      <button onClick={(e) => { e.stopPropagation(); setPreviewHidden(true); }} className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black text-white rounded-lg z-[50] transition-colors shadow-md backdrop-blur-sm opacity-0 group-hover/preview:opacity-100" title="Hide Preview">
                        <X size={16} />
                      </button>
                      <iframe src={fileUrl} className="absolute inset-0 w-full h-full border-0 bg-transparent" />
                    </div>
                  )
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
