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
    <div className={`flex flex-col lg:flex-row items-center gap-4 lg:gap-6 p-4 transition-all border-b border-border-main/50 last:border-0 ${isAlt ? 'bg-black/[0.01] dark:bg-white/[0.01]' : 'bg-transparent'} hover:bg-black/[0.03] dark:hover:bg-white/[0.03]`}>
      
      <div className="flex items-center gap-4 flex-1 w-full lg:w-auto">
        {!isConcluded && (
          <button 
            onClick={() => handleRevertItem(item.cuBillId)}
            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <Trash2 size={16} />
          </button>
        )}
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.productName} className="w-10 h-10 object-contain rounded-md border border-border-main bg-white" />
        ) : (
          <div className="w-10 h-10 flex items-center justify-center bg-background border border-border-main rounded-md text-muted-text text-[10px]">Img</div>
        )}
        <div className="flex flex-col flex-1 pl-1">
          <span className="text-[13px] font-bold text-primary-text font-display leading-tight">{item.productName}</span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11px] text-muted-text font-medium truncate max-w-[200px]">Supplier: {item.vendorNames || 'Unknown'}</span>
            {item.vendorNames?.toLowerCase().includes('wild bean') && (
              <span className="text-[9px] font-black tracking-wider bg-black text-white px-1.5 py-0.5 rounded uppercase">WBC</span>
            )}
          </div>
          <span className="text-[11px] text-muted-text italic mt-0.5">Consumed By: {item.consumedByEmail}</span>
        </div>
      </div>

      <div className="flex items-center gap-4 lg:gap-6 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0">
        <div className="flex flex-col gap-1 items-end min-w-[70px]">
          <span className="text-[11px] text-muted-text font-bold whitespace-nowrap">{item.qty} {item.unit}</span>
          <span className="text-[13px] font-bold text-green-600 dark:text-green-500 bg-green-50 dark:bg-green-500/10 px-2 py-0.5 rounded-full whitespace-nowrap">₹ {item.amountIncTax.toFixed(2)}</span>
        </div>

        <div className="flex items-start gap-3">
          <div className="flex flex-col gap-1.5 w-[80px]">
            <label className="text-[10px] text-muted-text font-bold uppercase tracking-wider pl-1">Cash</label>
            <input type="number" disabled={isConcluded} value={item.cash} onChange={(e) => updateItem(idx, 'cash', Number(e.target.value))} className="w-full h-8 px-2 text-[13px] font-medium bg-secondary border border-border-main rounded-md outline-none focus:border-btn-primary focus:bg-transparent focus:ring-2 focus:ring-btn-primary/20 disabled:bg-secondary transition-all" />
          </div>
          <div className="flex flex-col gap-1.5 w-[80px]">
            <label className="text-[10px] text-muted-text font-bold uppercase tracking-wider pl-1">UPI</label>
            <input type="number" disabled={isConcluded} value={item.upi} onChange={(e) => updateItem(idx, 'upi', Number(e.target.value))} className="w-full h-8 px-2 text-[13px] font-medium bg-secondary border border-border-main rounded-md outline-none focus:border-btn-primary focus:bg-transparent focus:ring-2 focus:ring-btn-primary/20 disabled:bg-secondary transition-all" />
          </div>
          <div className="flex flex-col gap-1.5 w-[80px]">
            <label className="text-[10px] text-muted-text font-bold uppercase tracking-wider pl-1">No Bill</label>
            <input type="number" disabled={isConcluded} value={item.noBill} onChange={(e) => updateItem(idx, 'noBill', Number(e.target.value))} className="w-full h-8 px-2 text-[13px] font-medium bg-secondary border border-border-main rounded-md outline-none focus:border-btn-primary focus:bg-transparent focus:ring-2 focus:ring-btn-primary/20 disabled:bg-secondary transition-all" />
          </div>
          <div className="flex flex-col gap-1.5 w-[80px]">
            <label className="text-[10px] text-muted-text font-bold uppercase tracking-wider pl-1">Loyalty</label>
            <input type="number" disabled={isConcluded} value={item.loyalty} onChange={(e) => updateItem(idx, 'loyalty', Number(e.target.value))} className="w-full h-8 px-2 text-[13px] font-medium bg-secondary border border-border-main rounded-md outline-none focus:border-btn-primary focus:bg-transparent focus:ring-2 focus:ring-btn-primary/20 disabled:bg-secondary transition-all" />
          </div>
        </div>
      </div>

    </div>
  );
};
