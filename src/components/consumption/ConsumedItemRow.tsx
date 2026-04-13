import React from 'react';
import { Trash2 } from 'lucide-react';
import type { BucketItem } from '../../services/consumptionService';

interface ConsumedItemRowProps {
  item: BucketItem;
  idx: number;
  isConcluded: boolean;
  updateItem: (index: number, field: keyof BucketItem, value: number) => void;
  handleRevertItem: (cuBillId: number) => void;
}

export const ConsumedItemRow = ({
  item,
  idx,
  isConcluded,
  updateItem,
  handleRevertItem,
}: ConsumedItemRowProps) => {
  const isAlt = idx % 2 === 1;

  return (
    <div className={`flex flex-col lg:grid lg:grid-cols-[100px_1fr_120px_420px] lg:items-center gap-4 lg:gap-6 p-4 transition-all border-b border-border-main/50 last:border-0 ${isAlt ? 'bg-black/[0.01] dark:bg-white/[0.01]' : 'bg-transparent'} hover:bg-black/[0.03] dark:hover:bg-white/[0.03]`}>
      
      {/* Mobile-only header (hidden on desktop) */}
      <div className="flex lg:hidden items-start justify-between w-full">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.productName} className="w-20 h-20 object-contain rounded-xl border border-border-main bg-white shadow-sm" />
        ) : (
          <div className="w-20 h-20 flex items-center justify-center bg-background border border-border-main rounded-xl text-muted-text text-[12px]">Img</div>
        )}
        {!isConcluded && (
          <button 
            onClick={() => handleRevertItem(item.cuBillId)}
            className="p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors"
          >
            <Trash2 size={20} />
          </button>
        )}
      </div>

      {/* Column 1: Desktop Actions & Image */}
      <div className="hidden lg:flex items-center gap-4">
        <div className="w-8 flex justify-center">
          {!isConcluded && (
            <button 
              onClick={() => handleRevertItem(item.cuBillId)}
              className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
        <div className="w-10 h-10 flex-shrink-0">
          {item.imageUrl ? (
            <img src={item.imageUrl} alt={item.productName} className="w-10 h-10 object-contain rounded-md border border-border-main bg-white" />
          ) : (
            <div className="w-10 h-10 flex items-center justify-center bg-background border border-border-main rounded-md text-muted-text text-[10px]">Img</div>
          )}
        </div>
      </div>

      {/* Column 2: Product Details */}
      <div className="flex flex-col flex-1 pl-0 lg:pl-1 overflow-hidden">
        <span className="text-[15px] lg:text-[13px] font-bold text-primary-text font-display leading-tight truncate">{item.productName}</span>
        <div className="flex flex-col lg:flex-row lg:items-center lg:gap-2 mt-1 lg:mt-0.5">
          <span className="text-[13px] lg:text-[11px] text-muted-text font-medium truncate max-w-full">Supplier: {item.vendorNames || 'Unknown'}</span>
          {item.vendorNames?.toLowerCase().includes('wild bean') && (
            <span className="hidden lg:inline text-[9px] font-black tracking-wider bg-black text-white px-1.5 py-0.5 rounded uppercase">WBC</span>
          )}
        </div>
        <span className="text-[13px] lg:text-[11px] text-muted-text/80 font-medium italic mt-0.5 lg:mt-0 truncate">Consumed By: {item.consumedByEmail?.split('@')[0] || 'Unknown'}</span>
      </div>

      {/* Column 3: Quantity & Amount */}
      <div className="flex items-center gap-3 lg:flex-col lg:items-end lg:gap-1 min-w-[70px]">
        <span className="text-[14px] lg:text-[11px] text-muted-text font-bold whitespace-nowrap order-1 lg:order-none">{item.qty} {item.unit}</span>
        <span className="text-[14px] lg:text-[13px] font-bold text-green-600 dark:text-green-500 bg-green-50/80 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 px-3 py-1 lg:px-2 lg:py-0.5 rounded-lg lg:rounded-full whitespace-nowrap order-2 lg:order-none">
          ₹ {item.amountIncTax.toFixed(2)}
        </span>
      </div>

      {/* Column 4: Input Grid */}
      <div className="grid grid-cols-4 gap-2.5 lg:gap-3 w-full">
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          <label className="text-[11px] lg:text-[10px] text-muted-text font-bold uppercase tracking-wider pl-1 font-display">Cash</label>
          <input type="number" disabled={isConcluded} value={item.cash} onChange={(e) => updateItem(idx, 'cash', Number(e.target.value))} className="w-full h-10 lg:h-8 px-2 text-[13px] font-bold text-primary-text bg-secondary border border-border-main rounded-xl lg:rounded-md outline-none focus:border-primary-text focus:bg-background focus:ring-4 focus:ring-primary-text/5 transition-all font-display" />
        </div>
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          <label className="text-[11px] lg:text-[10px] text-muted-text font-bold uppercase tracking-wider pl-1 font-display">UPI</label>
          <input type="number" disabled={isConcluded} value={item.upi} onChange={(e) => updateItem(idx, 'upi', Number(e.target.value))} className="w-full h-10 lg:h-8 px-2 text-[13px] font-bold text-primary-text bg-secondary border border-border-main rounded-xl lg:rounded-md outline-none focus:border-primary-text focus:bg-background focus:ring-4 focus:ring-primary-text/5 transition-all font-display" />
        </div>
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          <label className="text-[11px] lg:text-[10px] text-muted-text font-bold uppercase tracking-wider pl-1 font-display">No Bill</label>
          <input type="number" disabled={isConcluded} value={item.noBill} onChange={(e) => updateItem(idx, 'noBill', Number(e.target.value))} className="w-full h-10 lg:h-8 px-2 text-[13px] font-bold text-primary-text bg-secondary border border-border-main rounded-xl lg:rounded-md outline-none focus:border-primary-text focus:bg-background focus:ring-4 focus:ring-primary-text/5 transition-all font-display" />
        </div>
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          <label className="text-[11px] lg:text-[10px] text-muted-text font-bold uppercase tracking-wider pl-1 font-display">Loyalty</label>
          <input type="number" disabled={isConcluded} value={item.loyalty} onChange={(e) => updateItem(idx, 'loyalty', Number(e.target.value))} className="w-full h-10 lg:h-8 px-2 text-[13px] font-bold text-primary-text bg-secondary border border-border-main rounded-xl lg:rounded-md outline-none focus:border-primary-text focus:bg-background focus:ring-4 focus:ring-primary-text/5 transition-all font-display" />
        </div>
      </div>

    </div>
  );
};
