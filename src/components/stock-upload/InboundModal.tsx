import { useState, useEffect } from 'react';
import { X, Save, Building, Loader2, Package } from 'lucide-react';
import { StockUploadService } from '../../services/stockUploadService';
import { formatIndianCurrency } from '../../utils/numberFormat';
import { InventoryService } from '../../services/inventoryService';
import { SiteFilterSingle } from '../filters/SiteFilterSingle';
import type { Site } from '../../types/inventory';

interface InboundModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InboundModal({ isOpen, onClose }: InboundModalProps) {
  const [batches, setBatches] = useState<any[]>([]);
  const [inbounds, setInbounds] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInbounds, setSelectedInbounds] = useState<Set<number>>(new Set());
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const fetchAll = async () => {
      setIsLoading(true);
      try {
        const batchRes = await StockUploadService.fetchPendingBatches();
        const pendingBatches = batchRes.data || [];
        setBatches(pendingBatches);

        const allInbounds: any[] = [];
        for (const batch of pendingBatches) {
          const inboundRes = await StockUploadService.fetchInbounds(batch.id);
          if (inboundRes.data) {
            // Initialize sendQty for each item
            const mapped = inboundRes.data.map((item: any) => ({
              ...item,
              sendQty: item.quantity
            }));
            allInbounds.push(...mapped);
          }
        }
        setInbounds(allInbounds);
        setSelectedInbounds(new Set(allInbounds.map((_, i) => i)));
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAll();
  }, [isOpen]);

  const toggleSelection = (idx: number) => {
    const next = new Set(selectedInbounds);
    if (next.has(idx)) next.delete(idx);
    else next.add(idx);
    setSelectedInbounds(next);
  };

  const handleQtyChange = (idx: number, val: string) => {
    const num = parseFloat(val);
    setInbounds(prev => {
      const next = [...prev];
      const max = next[idx].quantity;
      if (isNaN(num)) next[idx].sendQty = 0;
      else next[idx].sendQty = Math.max(0, Math.min(max, num));
      return next;
    });
  };

  const handleInboundMaterial = async () => {
    if (!selectedSite) return alert('Please select a site');
    setIsSubmitting(true);
    
    // Simulate API call and state update
    setTimeout(() => {
      setInbounds(prev => {
        const next = prev.map((item, i) => {
          if (!selectedInbounds.has(i)) return item;
          return { ...item, quantity: item.quantity - item.sendQty };
        }).filter(item => item.quantity > 0);
        
        // Reset selection since indexes shifted and quantities changed
        setSelectedInbounds(new Set());
        return next;
      });
      
      setIsSubmitting(false);
      // Optional: close modal if everything is inbounded
      // if (inbounds.length === 0) onClose();
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out] p-4">
      <div className="bg-card rounded-xl shadow-2xl w-full max-w-[1200px] flex flex-col overflow-hidden animate-[fadeInUp_0.3s_ease-out] border border-border-main">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-border-main flex items-center justify-between bg-header">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-black text-muted-text uppercase tracking-widest">Inbound Stock to Site</span>
            <h2 className="text-lg font-bold text-primary-text flex items-center gap-2">
              <Package size={18} className="text-secondary-text" /> Products
            </h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-surface hover:bg-rose-500/10 text-muted-text hover:text-rose-500 flex items-center justify-center transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="bg-surface p-0 flex flex-col max-h-[70vh]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 size={32} className="animate-spin text-muted-text/30" />
              <span className="text-[12px] font-bold text-muted-text uppercase tracking-widest">Fetching pending batches...</span>
            </div>
          ) : (
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left bg-card">
                <thead className="bg-card border-b border-border-main/40 sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-4 py-3 text-[10px] font-black text-muted-text uppercase tracking-widest w-10 text-center">
                      <input 
                        type="checkbox" 
                        checked={selectedInbounds.size === inbounds.length && inbounds.length > 0}
                        onChange={() => {
                          if (selectedInbounds.size === inbounds.length) {
                            setSelectedInbounds(new Set());
                          } else {
                            setSelectedInbounds(new Set(inbounds.map((_, i) => i)));
                          }
                        }}
                        className="rounded bg-surface/50 border-border-main/50 text-accent focus:ring-accent" 
                      />
                    </th>
                    <th className="px-4 py-3 text-[10px] font-black text-muted-text uppercase tracking-widest w-12 text-center">No.</th>
                    <th className="px-4 py-3 text-[10px] font-black text-muted-text uppercase tracking-widest w-[25%]">Product Name</th>
                    <th className="px-4 py-3 text-[10px] font-black text-muted-text uppercase tracking-widest">Vendor</th>
                    <th className="px-4 py-3 text-[10px] font-black text-muted-text uppercase tracking-widest">Bill</th>
                    <th className="px-4 py-3 text-[10px] font-black text-muted-text uppercase tracking-widest text-right">Price</th>
                    <th className="px-4 py-3 text-[10px] font-black text-muted-text uppercase tracking-widest text-right">Total</th>
                    <th className="px-4 py-3 text-[10px] font-black text-muted-text uppercase tracking-widest w-[160px] text-center">Send Qty / Total Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-main/20">
                  {inbounds.map((item, i) => (
                    <tr key={i} className="hover:bg-surface/30 transition-colors">
                      <td className="px-4 py-3 text-center">
                        <input 
                          type="checkbox" 
                          checked={selectedInbounds.has(i)}
                          onChange={() => toggleSelection(i)}
                          className="rounded bg-surface border-border-main/50 text-accent focus:ring-accent" 
                        />
                      </td>
                      <td className="px-4 py-3 text-[11px] font-bold text-muted-text text-center">{i + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-surface border border-border-main/30 rounded flex items-center justify-center shrink-0 overflow-hidden">
                            {item.imageUrl ? <img src={item.imageUrl} alt="" className="w-full h-full object-contain" /> : <Package size={12} className="text-muted-text/30" />}
                          </div>
                          <span className="text-[11px] font-bold text-primary-text leading-tight line-clamp-2" title={item.productName}>{item.productName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded flex w-fit">{item.supplierNames}</span>
                      </td>
                      <td className="px-4 py-3">
                        <a href={item.billUrl} target="_blank" rel="noreferrer" className="flex flex-col hover:opacity-80 transition-opacity">
                          <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded w-fit">{item.refNumber}</span>
                          <span className="text-[9px] text-muted-text mt-0.5 px-2 font-medium">{new Date(item.billDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric'})}</span>
                        </a>
                      </td>
                      <td className="px-4 py-3 text-[11px] font-black text-primary-text text-right tracking-tight">{formatIndianCurrency(item.price)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-[11px] font-black text-primary-text tracking-tight">{formatIndianCurrency(item.totalIncTax)}</span>
                          <span className="text-[9px] text-muted-text font-bold uppercase tracking-tighter">
                            {formatIndianCurrency(item.totalExcTax)} + {formatIndianCurrency(item.tax)} (Tax)
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1.5 bg-surface border border-border-main/50 px-2 py-1.5 rounded-lg w-full max-w-[140px] mx-auto transition-all focus-within:border-accent shadow-sm">
                          <input 
                            type="number" 
                            className="w-[60px] text-[12px] font-black text-primary-text text-center outline-none bg-transparent" 
                            value={item.sendQty}
                            onChange={(e) => handleQtyChange(i, e.target.value)}
                          />
                          <span className="text-[10px] font-bold text-muted-text/40">/</span>
                          <span className="text-[11px] font-black text-primary-text/60 truncate">{item.quantity} {item.unit}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {inbounds.length === 0 && !isLoading && (
                    <tr>
                      <td colSpan={10} className="px-4 py-12 text-center text-[12px] font-bold text-muted-text">
                        No pending inbound items found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-card border-t border-border-main/60 px-5 py-4 flex items-center justify-between shrink-0 drop-shadow-md z-20">
          <div className="w-[300px]">
             <SiteFilterSingle 
              value={selectedSite}
              onChange={setSelectedSite}
              placeholder="Select Site to Send Stock To"
              alignDropdown="left"
              openUpwards={true}
            />
          </div>

          <button 
            disabled={!selectedSite || selectedInbounds.size === 0 || isSubmitting}
            onClick={handleInboundMaterial}
            className="flex items-center gap-2 bg-primary-text text-card hover:opacity-90 rounded-lg px-6 py-2.5 text-[11px] font-black uppercase tracking-widest transition-all shadow-md disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {isSubmitting ? <><Loader2 size={14} className="animate-spin" /> Inbounding...</> : <>Inbound Material <ChevronRight size={14} /></>}
          </button>
        </div>

      </div>
    </div>
  );
}

function ChevronRight({ size = 24, className = '', strokeWidth = 2 }: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m9 18 6-6-6-6"/>
    </svg>
  );
}
