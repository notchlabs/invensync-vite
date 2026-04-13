import React from 'react';
import { ShieldCheck, Upload } from 'lucide-react';
import type { ExistingSales } from '../../services/consumptionService';

interface ManagerAuditFormProps {
  isConcluded: boolean;
  salesRecord: ExistingSales | null;
  mopReading: number;
  setMopReading: (val: number) => void;
  posReading: number;
  setPosReading: (val: number) => void;
  cashCollected: number;
  setCashCollected: (val: number) => void;
  upiCollected: number;
  setUpiCollected: (val: number) => void;
  dayAggr: {
    billedMop: number;
    upiTotal: number;
    cashTotal: number;
  };
  handleSave: (concludeShift: boolean) => void;
  handleSaveAudit: () => void;
}

export const ManagerAuditForm = ({
  isConcluded,
  salesRecord,
  mopReading,
  setMopReading,
  posReading,
  setPosReading,
  cashCollected,
  setCashCollected,
  upiCollected,
  setUpiCollected,
  dayAggr,
  handleSave,
  handleSaveAudit,
}: ManagerAuditFormProps) => {
  return (
    <div className="bg-card border border-border-main rounded-xl p-5 md:p-7 shadow-sm mt-4 flex flex-col gap-6 relative overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border-main pb-4">
        <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-border-main flex items-center justify-center">
          <ShieldCheck size={16} className="text-primary-text" />
        </div>
        <h3 className="text-[16px] font-bold text-primary-text font-display">Manager Audit</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
        
        <div className="flex flex-col gap-2">
          <h4 className="text-[14px] font-bold text-primary-text mb-1">MOP / POS Reading (Billed Sales)</h4>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-bold text-primary-text flex justify-between">
              MOP Machine Reading (Billed)
            </label>
            <span className="text-[11px] text-muted-text mb-1 italic">Total billed amount shown on MOP machine</span>
            <input 
              type="number"
              min="0"
              disabled={isConcluded}
              value={mopReading || ''}
              onChange={(e) => setMopReading(Number(e.target.value))}
              className="w-full h-[42px] px-3 bg-transparent border border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg text-[16px] font-bold text-primary-text outline-none focus:border-solid focus:border-primary-text focus:ring-4 focus:ring-primary-text/5 disabled:bg-secondary transition-all font-mono"
            />
            <div className="flex items-center justify-between mt-1 text-[12px]">
              <span className="text-muted-text">System Billed: ₹ {dayAggr.billedMop.toFixed(2)}</span>
              {mopReading > 0 && (
                <span className={`font-bold ${Math.abs(mopReading - dayAggr.billedMop) > 0 ? 'text-red-500' : 'text-primary-text'}`}>
                  Difference: ₹ {(mopReading - dayAggr.billedMop).toFixed(2)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 mt-0 md:mt-7">
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-bold text-primary-text flex justify-between">
              POS Machine Reading
            </label>
            <span className="text-[11px] text-muted-text mb-1 italic">Total sales amount shown on POS system</span>
            <input 
              type="number"
              min="0"
              disabled={isConcluded}
              value={posReading || ''}
              onChange={(e) => setPosReading(Number(e.target.value))}
              className="w-full h-[42px] px-3 bg-transparent border border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg text-[16px] font-bold text-primary-text outline-none focus:border-solid focus:border-primary-text focus:ring-4 focus:ring-primary-text/5 disabled:bg-secondary transition-all font-mono"
            />
            <div className="flex items-center justify-between mt-1 text-[12px]">
              <span className="text-muted-text">System POS Sale: ₹ {dayAggr.upiTotal.toFixed(2)}</span>
              {posReading > 0 && (
                <span className={`font-bold ${Math.abs(posReading - dayAggr.upiTotal) > 0 ? 'text-red-500' : 'text-primary-text'}`}>
                  Difference: ₹ {(posReading - dayAggr.upiTotal).toFixed(2)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="col-span-1 md:col-span-2 border-t border-border-main my-2"></div>

        <div className="flex flex-col gap-2">
          <h4 className="text-[14px] font-bold text-primary-text mb-1">Cash / UPI Collection</h4>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-bold text-primary-text">Cash Collected by Manager</label>
            <span className="text-[11px] text-muted-text mb-1 italic">Physical cash counted at end of day</span>
            <input 
              type="number"
              min="0"
              disabled={isConcluded}
              value={cashCollected || ''}
              onChange={(e) => setCashCollected(Number(e.target.value))}
              className="w-full h-[42px] px-3 bg-transparent border border-border-main rounded-lg text-[16px] font-bold text-primary-text outline-none focus:border-primary-text focus:ring-4 focus:ring-primary-text/5 disabled:bg-secondary transition-all font-mono shadow-sm"
            />
            <div className="flex items-center justify-between mt-1 text-[12px]">
              <span className="text-muted-text">System Cash: ₹ {dayAggr.cashTotal.toFixed(2)}</span>
              {cashCollected > 0 && (
                <span className={`font-bold ${Math.abs(cashCollected - dayAggr.cashTotal) > 0 ? 'text-red-500' : 'text-primary-text'}`}>
                  Difference: ₹ {(cashCollected - dayAggr.cashTotal).toFixed(2)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 mt-0 md:mt-7">
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-bold text-primary-text">UPI / Card Collected by Manager</label>
            <span className="text-[11px] text-muted-text mb-1 italic">Settlement amount from UPI / Card reports</span>
            <input 
              type="number"
              min="0"
              disabled={isConcluded}
              value={upiCollected || ''}
              onChange={(e) => setUpiCollected(Number(e.target.value))}
              className="w-full h-[42px] px-3 bg-transparent border border-border-main rounded-lg text-[16px] font-bold text-primary-text outline-none focus:border-primary-text focus:ring-4 focus:ring-primary-text/5 disabled:bg-secondary transition-all font-mono shadow-sm"
            />
            <div className="flex items-center justify-between mt-1 text-[12px]">
              <span className="text-muted-text">System UPI/Card: ₹ {dayAggr.upiTotal.toFixed(2)}</span>
              {upiCollected > 0 && (
                <span className={`font-bold ${Math.abs(upiCollected - dayAggr.upiTotal) > 0 ? 'text-red-500' : 'text-primary-text'}`}>
                  Difference: ₹ {(upiCollected - dayAggr.upiTotal).toFixed(2)}
                </span>
              )}
            </div>
          </div>
        </div>

      </div>

      <div className="flex items-center justify-end gap-3 pt-6 border-t border-border-main mt-4">
        {!isConcluded && (
          <button 
            onClick={() => handleSave(false)}
            className="px-6 py-2.5 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-[13px] font-bold rounded-lg hover:opacity-90 transition-all"
          >
            Save Audit
          </button>
        )}
        {salesRecord && isConcluded && (
          <button 
            onClick={handleSaveAudit}
            className="px-6 py-2.5 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-[13px] font-bold rounded-lg hover:opacity-90 transition-all"
          >
            Update Audit
          </button>
        )}
      </div>
    </div>
  );
};
