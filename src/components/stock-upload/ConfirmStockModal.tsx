import { useState, useEffect, useMemo } from 'react';
import { X, FileText, ChevronDown, AlertCircle, Phone, FileDigit, Calendar, Check, Loader2, RefreshCw, MapPin, Paperclip, RotateCcw, Trash2, Plus } from 'lucide-react';
import { StockUploadService } from '../../services/stockUploadService';
import type { UploadQueueItem } from './UploadArea';
import { ProductPickerCell } from './ProductPickerCell';
import { formatIndianCurrency } from '../../utils/numberFormat';
import { InventoryService } from '../../services/inventoryService';

interface ConfirmStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  queue: UploadQueueItem[];
  onSuccess: (itemId?: string) => void;
}

// ─── Main Modal ───
export function ConfirmStockModal({ isOpen, onClose, queue, onSuccess }: ConfirmStockModalProps) {
  const [isVerifying, setIsVerifying] = useState(true);
  const [isReprocessing, setIsReprocessing] = useState(false);
  const [uniqueBills, setUniqueBills] = useState<UploadQueueItem[]>([]);
  const [duplicateBills, setDuplicateBills] = useState<(UploadQueueItem & { duplicateInfo: any })[]>([]);
  
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);
  const [previewHidden, setPreviewHidden] = useState(false);

  const [uniqueOpen, setUniqueOpen] = useState(true);
  const [duplicatesOpen, setDuplicatesOpen] = useState(true);

  useEffect(() => {
    if (isOpen && queue.length > 0) verifyBills(queue);
  }, [isOpen, queue]);

  useEffect(() => { setPreviewHidden(false); }, [selectedBillId]);

  const verifyBills = async (items: UploadQueueItem[]) => {
    setIsVerifying(true);
    const unique: UploadQueueItem[] = [];
    const duplicate: (UploadQueueItem & { duplicateInfo: any })[] = [];

    for (const item of items) {
      if (item.extractedData) {
        try {
          const res = await StockUploadService.verifyBill(item.extractedData);
          if (res.data) {
            duplicate.push({ ...item, duplicateInfo: res.data });
          } else {
            unique.push(item);
          }
          // Fetch product images + mark new vs existing
          if (item.extractedData.products && Array.isArray(item.extractedData.products)) {
            await Promise.all(
              item.extractedData.products.map(async (p: any) => {
                if (p.name) {
                  try {
                    const imgRes = await StockUploadService.searchProductCache(p.name);
                    if (imgRes.data) {
                      p.imageUrl = imgRes.data.imageUrl || p.imageUrl;
                      p._cacheId = imgRes.data.id;
                    }
                  } catch { /* leave as new */ }
                }
              })
            );
          }
        } catch { unique.push(item); }
      }
    }
    setUniqueBills(unique);
    setDuplicateBills(duplicate);
    if (unique.length > 0) { setSelectedBillId(unique[0].id); setUniqueOpen(true); }
    else if (duplicate.length > 0) { setSelectedBillId(duplicate[0].id); setDuplicatesOpen(true); }
    setIsVerifying(false);
  };

  const selectedItem = useMemo(() => {
    return uniqueBills.find(b => b.id === selectedBillId) || 
           duplicateBills.find(b => b.id === selectedBillId) || null;
  }, [selectedBillId, uniqueBills, duplicateBills]);

  const isDuplicate = Boolean(duplicateBills.find(b => b.id === selectedBillId));
  const duplicateInfo = duplicateBills.find(b => b.id === selectedBillId)?.duplicateInfo;

  const fileUrl = useMemo(() => {
    if (selectedItem?.file) return URL.createObjectURL(selectedItem.file);
    return null;
  }, [selectedItem]);

  // Re-process invoice
  const handleReprocess = async () => {
    if (!selectedItem?.file) return;
    setIsReprocessing(true);
    try {
      const res = await StockUploadService.extractInvoice(selectedItem.file, true);
      if (res.data) {
        // Update the selected item's extractedData
        const updateList = (list: any[]) => list.map(b => b.id === selectedItem.id ? { ...b, extractedData: res.data } : b);
        setUniqueBills(prev => updateList(prev));
        setDuplicateBills(prev => updateList(prev));
      }
    } catch { /* ignore */ }
    finally { setIsReprocessing(false); }
  };

  // Editable products
  const [editableProducts, setEditableProducts] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (selectedItem?.extractedData?.products) {
      setEditableProducts(JSON.parse(JSON.stringify(selectedItem.extractedData.products)));
    } else {
      setEditableProducts([]);
    }
  }, [selectedItem]);

  const handleProductChange = (index: number, field: string, value: any) => {
    setEditableProducts(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const resetProducts = () => {
    if (selectedItem?.extractedData?.products) {
      setEditableProducts(JSON.parse(JSON.stringify(selectedItem.extractedData.products)));
    }
  };

  const handleProductUpdate = (index: number, fields: Record<string, any>) => {
    setEditableProducts(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], ...fields };
      return updated;
    });
  };

  const handleAddProduct = () => {
    setEditableProducts(prev => [
      ...prev,
      { name: '', quantity: 1, unit: 'EA', price: 0, cgstInPerc: 0, sgstInPerc: 0 }
    ]);
  };

  const handleRemoveProduct = (index: number) => {
    setEditableProducts(prev => prev.filter((_, i) => i !== index));
  };

  const { subtotal, tax, calculatedTotal } = useMemo(() => {
    let s = 0;
    let t = 0;
    editableProducts.forEach(p => {
      const qty = Number(p.quantity) || 0;
      const price = Number(p.price) || 0;
      const cgst = Number(p.cgstInPerc) || 0;
      const sgst = Number(p.sgstInPerc) || 0;
      const taxPerc = cgst + sgst;
      const taxAmount = (price * taxPerc) / 100;
      s += qty * price;
      t += qty * taxAmount;
    });
    return { subtotal: s, tax: t, calculatedTotal: s + t };
  }, [editableProducts]);

  const handleConfirmAndSave = async () => {
    if (!selectedItem || !selectedItem.extractedData) return;
    setIsSubmitting(true);
    try {
      let uploadedBillUrl = '';
      if (selectedItem.file) {
        const uploadRes = await InventoryService.uploadAttachment(selectedItem.file);
        if (uploadRes.success && uploadRes.data?.docUrl) {
          uploadedBillUrl = uploadRes.data.docUrl;
        }
      }

      const data = selectedItem.extractedData;
      const payload = {
        vendorName: data.vendor?.name || 'Unknown',
        billNumber: data.invoiceNumber || 'Unknown',
        billDate: data.billDate ? new Date(data.billDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        billUrl: uploadedBillUrl,
        totalWithoutTax: subtotal,
        tax: tax,
        totalIncAll: calculatedTotal,
        products: editableProducts.map(p => {
          const rawQty = p.quantity !== undefined ? p.quantity : '';
          const qty = Number(rawQty) || 0;
          const rawPrice = p.price !== undefined ? p.price : '';
          const price = Number(rawPrice) || 0;
          
          const rawCgst = p.cgstInPerc;
          const rawSgst = p.sgstInPerc;
          const rawTaxPerc = p.taxPerc !== undefined ? p.taxPerc : (rawCgst != null || rawSgst != null ? (Number(rawCgst) || 0) + (Number(rawSgst) || 0) : '');
          const taxPerc = Number(rawTaxPerc) || 0;

          const taxAmount = (price * taxPerc) / 100;
          const totalTaxLine = qty * taxAmount;
          return {
            name: p.name,
            quantity: qty,
            unit: p.unit || 'pcs',
            hsnCode: p.hsnCode || null,
            hsnName: null,
            cgstInPerc: Number(rawCgst) || 0,
            sgstInPerc: Number(rawSgst) || 0,
            price: price,
            totalExcludingTax: qty * price,
            tax: totalTaxLine,
            totalIncludingTax: qty * price + totalTaxLine,
            imageUrl: p.imageUrl || null
          };
        }),
      };

      const res = await StockUploadService.createBatch(payload);
      if (res.success) {
        onSuccess(selectedItem.id);
      } else {
        alert(res.message || 'Failed to save batch');
      }
    } catch (e: any) {
      alert(e.message || 'Error occurred while saving');
    } finally {
      setIsSubmitting(false);
    }
  };

  const BILL_MISMATCH_THRESHOLD = 500;
  const billedTotal = selectedItem?.extractedData?.billTotalIncludingTax || 0;
  const diff = Math.abs(billedTotal - calculatedTotal);
  const isHighMismatch = diff > BILL_MISMATCH_THRESHOLD;
  const isMinorMismatch = diff > 1 && diff <= BILL_MISMATCH_THRESHOLD;

  const newProductCount = editableProducts.filter(p => !p._cacheId).length;

  // ─── Product Table ───
  const renderProductTable = () => (
    <div className="flex flex-col gap-0 w-full">
      <div className="flex items-center justify-between mb-2">
        {newProductCount > 0 ? (
          <div className="flex items-center gap-2 px-1 text-[11px] font-medium text-amber-700/70">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
            {newProductCount} new product{newProductCount > 1 ? 's' : ''} — select from dropdown to map.
          </div>
        ) : <div />}
        <button
          onClick={resetProducts}
          className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold text-muted-text hover:text-primary-text uppercase tracking-widest transition-colors"
          title="Reset all changes"
        >
          <RotateCcw size={11} /> Reset
        </button>
      </div>

      <div className="rounded-xl border border-border-main/60 bg-surface/20 overflow-hidden">
        <table className="w-full text-left table-fixed">
          <colgroup>
            <col className="w-10" />
            <col />
            <col className="w-[70px]" />
            <col className="w-[60px]" />
            <col className="w-[90px]" />
            <col className="w-[60px]" />
            <col className="w-[80px]" />
            <col className="w-[110px]" />
            <col className="w-10" />
          </colgroup>
          <thead className="bg-table-head/80 border-b border-border-main/60">
            <tr>
              <th className="px-2 py-2 text-[10px] font-black text-muted-text uppercase tracking-widest text-center">#</th>
              <th className="px-2 py-2 text-[10px] font-black text-muted-text uppercase tracking-widest">Product Name</th>
              <th className="px-2 py-2 text-[10px] font-black text-muted-text uppercase tracking-widest text-center">Qty</th>
              <th className="px-2 py-2 text-[10px] font-black text-muted-text uppercase tracking-widest text-center">Unit</th>
              <th className="px-2 py-2 text-[10px] font-black text-muted-text uppercase tracking-widest text-right">Price</th>
              <th className="px-2 py-2 text-[10px] font-black text-muted-text uppercase tracking-widest text-center">Tax %</th>
              <th className="px-2 py-2 text-[10px] font-black text-muted-text uppercase tracking-widest text-right">Tax/u</th>
              <th className="px-2 py-2 text-right text-[10px] font-black text-muted-text uppercase tracking-widest">Total</th>
              <th className="px-2 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-main/30">
            {editableProducts.map((p: any, i: number) => {
              const rawQty = p.quantity !== undefined ? p.quantity : '';
              const rawPrice = p.price !== undefined ? p.price : '';
              
              const rawCgst = p.cgstInPerc;
              const rawSgst = p.sgstInPerc;
              // If taxPerc is not yet stored as a string, derive it from cgst/sgst
              const rawTaxPerc = p.taxPerc !== undefined ? p.taxPerc : (rawCgst != null || rawSgst != null ? (Number(rawCgst) || 0) + (Number(rawSgst) || 0) : '');

              const qty = Number(rawQty) || 0;
              const price = Number(rawPrice) || 0;
              const taxPerc = Number(rawTaxPerc) || 0;

              const taxAmount = (price * taxPerc) / 100;
              const totalTaxLine = qty * taxAmount;
              const totalIncl = qty * price + totalTaxLine;

              return (
                <tr key={`${selectedItem?.id || 'x'}-${i}`} className="hover:bg-surface/50 transition-colors group">
                  <td className="px-2 py-2 text-[11px] font-bold text-muted-text text-center">{i + 1}</td>
                  <td className="px-2 py-2 overflow-hidden">
                    <ProductPickerCell product={p} index={i} onUpdate={handleProductUpdate} />
                  </td>
                  <td className="px-2 py-2">
                    <input type="number" className="w-full bg-card border border-border-main hover:border-secondary-text/50 focus:border-secondary-text rounded-md px-1.5 py-1 text-[11px] font-bold text-primary-text text-center outline-none" value={rawQty} onChange={e => handleProductChange(i, 'quantity', e.target.value)} />
                  </td>
                  <td className="px-2 py-2">
                    <input className="w-full bg-card border border-border-main hover:border-secondary-text/50 focus:border-secondary-text rounded-md px-1 py-1 text-[10px] font-bold text-muted-text text-center uppercase outline-none" value={p.unit || 'EA'} onChange={e => handleProductChange(i, 'unit', e.target.value)} />
                  </td>
                  <td className="px-2 py-2">
                    <input type="number" step="0.01" className="w-full bg-card border border-border-main hover:border-secondary-text/50 focus:border-secondary-text rounded-md px-1.5 py-1 text-[11px] font-bold text-primary-text text-right outline-none" value={rawPrice} onChange={e => handleProductChange(i, 'price', e.target.value)} />
                  </td>
                  <td className="px-2 py-2">
                    <input type="number" step="0.5" className="w-full bg-card border border-border-main hover:border-secondary-text/50 focus:border-secondary-text rounded-md px-1 py-1 text-[11px] font-bold text-primary-text text-center outline-none" value={rawTaxPerc} onChange={e => {
                      const val = e.target.value;
                      const num = Number(val);
                      handleProductUpdate(i, { 
                        taxPerc: val, 
                        cgstInPerc: val === '' || isNaN(num) ? 0 : num / 2, 
                        sgstInPerc: val === '' || isNaN(num) ? 0 : num / 2 
                      });
                    }} title="Total Tax %" />
                  </td>
                  <td className="px-2 py-2 text-right text-[11px] font-bold text-primary-text tracking-tight">
                    {formatIndianCurrency(taxAmount)}
                  </td>
                  <td className="px-2 py-2 text-right">
                    <div className="flex flex-col text-[11px] font-black text-primary-text tracking-tight">
                      {formatIndianCurrency(totalIncl)}
                      <span className="text-[8px] text-muted-text font-medium">+{formatIndianCurrency(totalTaxLine)} tax</span>
                    </div>
                  </td>
                  <td className="px-2 py-2">
                    <button 
                      onClick={() => handleRemoveProduct(i)} 
                      className="p-1.5 text-muted-text hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors flex items-center justify-center shrink-0"
                      title="Remove Item"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <button
        onClick={handleAddProduct}
        className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 border-2 border-dashed border-border-main hover:border-secondary-text/50 hover:bg-surface/30 rounded-xl text-[11px] font-black text-muted-text hover:text-primary-text uppercase tracking-widest transition-all"
      >
        <Plus size={14} strokeWidth={3} /> Add Product
      </button>
    </div>
  );

  if (!isOpen) return null;

  const vendor = selectedItem?.extractedData?.vendor;
  const fileName = selectedItem?.file?.name;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-0 md:p-4 bg-black/60 backdrop-blur-md animate-[fadeIn_0.2s_ease-out]">
      <div className="bg-card border border-border-main w-full h-full md:h-[96vh] md:w-[98vw] md:max-w-[1600px] md:rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden relative animate-[fadeInUp_0.3s_ease-out]">

        {/* ─── Sidebar ─── */}
        <div className="w-full md:w-[400px] lg:w-[500px] xl:w-[600px] 2xl:w-[800px] bg-[#121212] flex flex-col shrink-0 z-10 border-r border-[#2a2a2a] hidden md:flex transition-all">
          <div className="p-5 border-b border-border-main/30 bg-[#1a1a1a]">
            <h2 className="text-[15px] font-black text-white uppercase tracking-widest flex items-center gap-2.5">
              <FileText size={16} /> Process Uploads
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 flex flex-col gap-3">
            {isVerifying ? (
              <div className="flex flex-col items-center justify-center mt-20 opacity-50">
                <Loader2 size={32} className="mb-4 animate-spin text-white" />
                <span className="text-[12px] font-bold text-white/50 tracking-widest uppercase text-center leading-relaxed">Verifying bills &<br />loading images...</span>
              </div>
            ) : (
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
                              <div className="mt-4 w-full h-[500px] xl:h-[600px] 2xl:h-[750px] bg-[#111111] rounded-lg overflow-hidden border border-[#ff4444]/40 cursor-default shadow-inner relative group/preview" onClick={e => e.stopPropagation()}>
                                <button onClick={(e) => { e.stopPropagation(); setPreviewHidden(true); }} className="absolute top-3 right-3 p-2 bg-black/80 hover:bg-black text-white rounded-lg z-[50] transition-colors shadow-md backdrop-blur-sm opacity-0 group-hover/preview:opacity-100" title="Hide Preview">
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
            )}
          </div>
        </div>

        {/* ─── Main Content ─── */}
        <div className="flex-1 flex overflow-hidden bg-app">
          <div className="flex-1 flex flex-col bg-card min-w-[300px]">
            {selectedItem ? (
              <div className="flex flex-col flex-1 h-full overflow-hidden">
                
                {/* ─── Header Banner ─── */}
                <div className="bg-[#0f0f0f] text-white px-5 lg:px-8 py-4 flex flex-col gap-3 shrink-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-col gap-1 min-w-0 flex-1">
                      <h1 className="text-[18px] md:text-[22px] font-black tracking-tight leading-tight uppercase truncate">
                        {vendor?.name || 'Unknown Vendor'}
                      </h1>
                      {fileName && (
                        <div className="flex items-center gap-1.5 text-[11px] text-white/40 font-medium">
                          <Paperclip size={10} />
                          <span className="truncate">{fileName}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Re-process Button */}
                      <button
                        onClick={handleReprocess}
                        disabled={isReprocessing}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all disabled:opacity-40"
                      >
                        <RefreshCw size={11} className={isReprocessing ? 'animate-spin' : ''} />
                        {isReprocessing ? 'Processing...' : 'Re-Process'}
                      </button>
                      {/* Close */}
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
                      <span className="flex items-center gap-1 text-[9px] font-bold text-white/30 uppercase tracking-widest"><FileText size={9}/> Ref No.</span>
                      <span className="text-[13px] font-bold text-white/80 tracking-tight">{selectedItem.extractedData?.invoiceNumber || '-'}</span>
                    </div>
                    {vendor?.address && (
                      <div className="flex flex-col gap-0.5 col-span-2">
                        <span className="flex items-center gap-1 text-[9px] font-bold text-white/30 uppercase tracking-widest"><MapPin size={9}/> Address</span>
                        <span className="text-[12px] font-medium text-white/60 tracking-tight truncate" title={vendor.address}>{vendor.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* ─── Scrollable Table Area ─── */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-6 xl:p-8">
                  <div className="max-w-[1200px] mx-auto w-full">
                    {renderProductTable()}
                  </div>
                </div>

                {/* ─── Sticky Footer ─── */}
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
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20">
                            <AlertCircle size={14} className="text-rose-500" />
                            <span className="text-rose-600 text-[12px] font-black">{formatIndianCurrency(diff)} difference</span>
                          </div>
                          <span className="text-[10px] text-rose-500/50">Exceeds ₹{BILL_MISMATCH_THRESHOLD} — fix prices or quantities</span>
                        </div>
                        <button disabled className="shrink-0 px-5 py-2.5 bg-primary-text text-card rounded-lg text-[11px] font-black uppercase tracking-widest opacity-15 cursor-not-allowed">Confirm and Save</button>
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
                        <button onClick={handleConfirmAndSave} disabled={isSubmitting} className="shrink-0 px-5 py-2.5 bg-primary-text text-card rounded-lg text-[11px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg flex items-center justify-center gap-2">
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
                        <button onClick={handleConfirmAndSave} disabled={isSubmitting} className="shrink-0 px-5 py-2.5 bg-primary-text text-card rounded-lg text-[11px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg flex items-center justify-center gap-2">
                          {isSubmitting ? <><Loader2 size={14} className="animate-spin text-card/80"/> Saving...</> : 'Confirm and Save'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="m-auto flex flex-col items-center opacity-30 gap-4">
                <FileText size={64} className="text-muted-text" />
                <span className="text-[16px] font-black uppercase tracking-widest text-muted-text">Select a bill to review</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
