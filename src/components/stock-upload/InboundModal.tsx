import { useState, useEffect, Fragment } from 'react';
import { X, Loader2, Package, CheckCircle, UploadCloud, ArrowRight, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { StockUploadService, type InboundItem } from '../../services/stockUploadService';
import { CustomCheckbox } from '../common/CustomCheckbox';
import { formatIndianCurrency } from '../../utils/numberFormat';
import { SiteFilterSingle } from '../filters/SiteFilterSingle';
import type { Site } from '../../types/inventory';
import toast from 'react-hot-toast';

interface InboundModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InboundModal({ isOpen, onClose }: InboundModalProps) {
  const [inbounds, setInbounds] = useState<(InboundItem & { sendQty: number | '' })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInbounds, setSelectedInbounds] = useState<Set<number>>(new Set());
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inboundedSites, setInboundedSites] = useState<Set<number>>(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen) return;
    const fetchAll = async () => {
      setIsLoading(true);
      try {
        const batchRes = await StockUploadService.fetchPendingBatches();
        const pendingBatches = batchRes.data || [];

        const allInbounds: (InboundItem & { sendQty: number | '' })[] = [];
        for (const batch of pendingBatches) {
          const inboundRes = await StockUploadService.fetchInbounds(batch.id);
          if (inboundRes.data) {
            // Initialize sendQty for each item
            const mapped = inboundRes.data.map((item: InboundItem) => ({
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

  const toggleBatchSelection = (batchItemIndexes: number[]) => {
    const allSelected = batchItemIndexes.every(idx => selectedInbounds.has(idx));
    const next = new Set(selectedInbounds);
    
    if (allSelected) {
      batchItemIndexes.forEach(idx => next.delete(idx));
    } else {
      batchItemIndexes.forEach(idx => next.add(idx));
    }
    
    setSelectedInbounds(next);
  };

  const handleQtyChange = (globalIdx: number, val: string) => {
    setInbounds(prev => {
      if (globalIdx < 0 || globalIdx >= prev.length) return prev;
      const next = [...prev];
      const max = next[globalIdx].quantity;
      if (val === '') {
        next[globalIdx].sendQty = '';
      } else {
        const num = parseFloat(val);
        if (!isNaN(num)) {
          next[globalIdx].sendQty = Math.max(0, Math.min(max, num));
        }
      }
      return next;
    });
  };

  const handleInboundMaterial = async () => {
    if (!selectedSite) return toast.error('Please select a site');
    
    const payload = Array.from(selectedInbounds).map(idx => {
      const item = inbounds[idx];
      return {
        destinationSiteId: selectedSite.id,
        destinationSiteName: selectedSite.name,
        productId: item.productId,
        productName: item.productName,
        quantity: Number(item.sendQty) || 0,
        inboundId: item.inboundId
      };
    }).filter(p => p.quantity > 0);

    if (payload.length === 0) return toast.error('Please specify valid send quantities > 0 for selected items');

    setIsSubmitting(true);
    try {
      const res = await StockUploadService.inboundMaterial(payload);
      if (res.success) {
        toast.success(res.message || 'Inbound completed successfully');
        
        setInbounds(prev => {
          const next = prev.map((item, i) => {
            if (!selectedInbounds.has(i)) return item;
            const sent = Number(item.sendQty) || 0;
            return { ...item, quantity: item.quantity - sent, sendQty: item.quantity - sent };
          }).filter(item => item.quantity > 0);
          
          setSelectedInbounds(new Set());
          return next;
        });
        
        setInboundedSites(prev => new Set(prev).add(selectedSite.id as number));
      } else {
        toast.error(res.message || 'Failed to inbound material');
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error occurred while inbounding';
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
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
              {!(inbounds.length === 0 && !isLoading && inboundedSites.size > 0) && (
                <table className="w-full text-left bg-card">
                  <thead className="bg-card border-b border-border-main/40 sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="px-4 py-3 text-[10px] font-black text-muted-text uppercase tracking-widest w-10 text-center">
                        <CustomCheckbox
                          checked={selectedInbounds.size === inbounds.length && inbounds.length > 0}
                          onChange={() => {
                            if (selectedInbounds.size === inbounds.length) {
                              setSelectedInbounds(new Set());
                            } else {
                              setSelectedInbounds(new Set(inbounds.map((_, i) => i)));
                            }
                          }}
                          className="mx-auto"
                        />
                      </th>
                      <th className="px-4 py-3 text-[10px] font-black text-muted-text uppercase tracking-widest w-12 text-center">No.</th>
                      <th className="px-4 py-3 text-[10px] font-black text-muted-text uppercase tracking-widest">Product Name</th>
                      <th className="px-4 py-3 text-[10px] font-black text-muted-text uppercase tracking-widest text-right">Price</th>
                      <th className="px-4 py-3 text-[10px] font-black text-muted-text uppercase tracking-widest text-right">Total</th>
                      <th className="px-4 py-3 text-[10px] font-black text-muted-text uppercase tracking-widest w-[200px] text-center">Send Qty / Total Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-main/20">
                    {(() => {
                    // Group inbound items by batchId
                    interface InboundGroup {
                      batchId: number;
                      supplierNames: string;
                      refNumber: string;
                      billDate: string;
                      billUrl: string;
                      items: { item: InboundItem & { sendQty: number | '' }; globalIdx: number }[];
                    }
                    const groups: InboundGroup[] = [];
                    inbounds.forEach((item, idx) => {
                      const existing = groups.find(g => g.batchId === item.batchId);
                      if (existing) {
                        existing.items.push({ item, globalIdx: idx });
                      } else {
                        groups.push({
                          batchId: item.batchId,
                          supplierNames: item.supplierNames || 'Unknown',
                          refNumber: item.refNumber || '-',
                          billDate: item.billDate,
                          billUrl: item.billUrl || '',
                          items: [{ item, globalIdx: idx }],
                        });
                      }
                    });

                    return groups.map((group) => (
                      <Fragment key={`group-${group.batchId}`}> 
                        {/* Group Header */}
                        <tr key={`g-${group.batchId}`} className="bg-surface/50">
                          <td colSpan={6} className="px-4 py-2.5">
                            <div className="flex items-center gap-3 flex-wrap">
                              <CustomCheckbox
                                checked={group.items.length > 0 && group.items.every(item => selectedInbounds.has(item.globalIdx))}
                                onChange={() => toggleBatchSelection(group.items.map(item => item.globalIdx))}
                              />
                              <span className="text-[12px] font-black text-primary-text">{group.supplierNames}</span>
                              <span className="text-muted-text/30">•</span>
                              <a href={group.billUrl} target="_blank" rel="noreferrer" className="text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded hover:opacity-80 transition-opacity">
                                Ref: {group.refNumber}
                              </a>
                              <span className="text-muted-text/30">•</span>
                              <span className="text-[10px] font-medium text-muted-text">
                                {group.billDate ? new Date(group.billDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric'}) : '-'}
                              </span>
                              <span className="text-[10px] font-bold text-muted-text/40 ml-auto">{group.items.length} item{group.items.length > 1 ? 's' : ''}</span>
                            </div>
                          </td>
                        </tr>
                        {/* Group Items */}
                        {group.items.map(({ item, globalIdx }, li) => (
                          <tr key={globalIdx} className="hover:bg-surface/30 transition-colors">
                            <td className="px-4 py-3 text-center">
                              <CustomCheckbox
                                checked={selectedInbounds.has(globalIdx)}
                                onChange={() => toggleSelection(globalIdx)}
                                className="mx-auto"
                              />
                            </td>
                            <td className="px-4 py-3 text-[11px] font-bold text-muted-text text-center">{li + 1}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-surface border border-border-main/30 rounded flex items-center justify-center shrink-0 overflow-hidden">
                                  {item.imageUrl ? <img src={item.imageUrl} alt="" className="w-full h-full object-contain" /> : <Package size={12} className="text-muted-text/30" />}
                                </div>
                                <span className="text-[11px] font-bold text-primary-text leading-tight line-clamp-2" title={item.productName}>{item.productName}</span>
                              </div>
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
                              <div className="flex items-center justify-center gap-1.5 bg-surface border border-border-main/50 px-2 py-1.5 rounded-lg w-full max-w-[180px] mx-auto transition-all focus-within:border-accent shadow-sm">
                                <input 
                                  type="number" 
                                  className="w-[70px] text-[12px] font-black text-primary-text text-center outline-none bg-transparent" 
                                  value={item.sendQty}
                                  onChange={(e) => handleQtyChange(globalIdx, e.target.value)}
                                />
                                <span className="text-[10px] font-bold text-muted-text/40">/</span>
                                <span className="text-[11px] font-black text-primary-text/60 truncate">{item.quantity} {item.unit}</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </Fragment>
                    ));
                  })()}
                  {inbounds.length === 0 && !isLoading && inboundedSites.size === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-[12px] font-bold text-muted-text">
                        No pending inbound items found.
                      </td>
                    </tr>
                  )}
                </tbody>
                </table>
              )}
              {inbounds.length === 0 && !isLoading && inboundedSites.size > 0 && (
                <div className="flex flex-col items-center justify-center py-20 px-4 animate-[fadeIn_0.5s_ease-out]">
                  <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6 shadow-left">
                    <CheckCircle size={40} className="text-emerald-500" strokeWidth={2.5} />
                  </div>
                  <h3 className="text-2xl font-black text-primary-text mb-2 tracking-tight">All Items Inbounded Successfully!</h3>
                  <p className="text-[13px] text-muted-text mb-8 max-w-md text-center">
                    The stock has been securely added to your selected inventory locations.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <button 
                      onClick={onClose}
                      className="flex items-center gap-2 px-6 py-3 bg-surface hover:bg-header border border-border-main rounded-xl text-[13px] font-bold text-primary-text transition-all w-full sm:w-auto justify-center"
                    >
                      <UploadCloud size={16} /> Upload More Bills
                    </button>
                    <button 
                      onClick={() => navigate(`/app/panel/inventory?sites=${Array.from(inboundedSites).join(',')}`)}
                      className="flex items-center gap-2 px-6 py-3 bg-primary-text text-card hover:opacity-90 rounded-xl text-[13px] font-bold transition-all w-full sm:w-auto justify-center shadow-lg"
                    >
                      Go to Inventory <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {inbounds.length > 0 && (
          <div className="bg-card border-t border-border-main/60 px-5 py-4 flex items-center justify-end shrink-0 drop-shadow-md z-20 gap-4">
            <div className="w-[300px]">
               <SiteFilterSingle 
                value={selectedSite}
                onChange={setSelectedSite}
                placeholder="Select Site to Send Stock To"
                alignDropdown="right"
                openUpwards={true}
              />
            </div>

            <button 
              disabled={!selectedSite || selectedInbounds.size === 0 || isSubmitting}
              onClick={handleInboundMaterial}
              className="flex items-center gap-2 bg-primary-text text-card hover:opacity-90 rounded-lg px-6 py-2.5 text-[11px] font-black uppercase tracking-widest transition-all shadow-md disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
            >
              {isSubmitting ? <><Loader2 size={14} className="animate-spin" /> Inbounding...</> : <>Inbound Material <ChevronRight size={14} /></>}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

