import { useState, useEffect, useMemo } from 'react';
import { FileText, Trash2, Plus } from 'lucide-react';
import { StockUploadService, type DuplicateInfo, type CreateBatchPayload } from '../../services/stockUploadService';
import toast from 'react-hot-toast';
import type { UploadQueueItem } from './UploadArea';
import { ProductPickerCell } from './ProductPickerCell';
import { formatIndianCurrency } from '../../utils/numberFormat';
import { InventoryService } from '../../services/inventoryService';
import { BillSidebar } from './BillSidebar';
import { BillHeaderBanner } from './BillHeaderBanner';
import { BillFooter } from './BillFooter';

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
  const [duplicateBills, setDuplicateBills] = useState<(UploadQueueItem & { duplicateInfo: DuplicateInfo })[]>([]);
  const [reprocessCounts, setReprocessCounts] = useState<Record<string, number>>({});
  
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
    const duplicate: (UploadQueueItem & { duplicateInfo: DuplicateInfo })[] = [];

    for (const item of items) {
      if (item.extractedData) {
        try {
          const res = await StockUploadService.verifyBill(item.extractedData);
          if (res.data) {
            duplicate.push({ ...item, duplicateInfo: res.data });
          } else {
            unique.push(item);
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
    if (!selectedItem?.id || !selectedItem?.file) return;
    const count = reprocessCounts[selectedItem.id] || 0;
    if (count >= 3) return toast.error('Maximum 3 re-process attempts reached for this bill');

    setIsReprocessing(true);
    try {
      const res = await StockUploadService.extractInvoice(selectedItem.file, true);
      if (res.data) {
        const updateList = <T extends UploadQueueItem>(list: T[]): T[] => 
          list.map(b => b.id === selectedItem.id ? { ...b, extractedData: res.data } : b);
        setUniqueBills(prev => updateList(prev));
        setDuplicateBills(prev => updateList(prev));
        setReprocessCounts(prev => ({ ...prev, [selectedItem.id]: count + 1 }));
        toast.success(`Bill re-processed (Attempt ${count + 1}/3)`);
      }
    } catch { toast.error('Re-processing failed'); }
    finally { setIsReprocessing(false); }
  };

  // ─── Editable Products ───
  const [editableProducts, setEditableProducts] = useState<NonNullable<UploadQueueItem['extractedData']>['products']>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (selectedItem?.extractedData?.products) {
      setEditableProducts(JSON.parse(JSON.stringify(selectedItem.extractedData.products)));
    } else {
      setEditableProducts([]);
    }
  }, [selectedItem]);

  const isEdited = useMemo(() => {
    if (!selectedItem?.extractedData?.products) return false;
    return JSON.stringify(editableProducts) !== JSON.stringify(selectedItem.extractedData.products);
  }, [editableProducts, selectedItem]);

  const handleProductChange = (index: number, field: string, value: string | number | null) => {
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

  const handleProductUpdate = (index: number, fields: Record<string, string | number | null>) => {
    setEditableProducts(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], ...fields };
      return updated;
    });
  };

  const handleAddProduct = () => {
    setEditableProducts(prev => [
      ...prev,
      { 
        name: '', 
        quantity: 1, 
        unit: 'EA', 
        price: 0, 
        cgstInPerc: 0, 
        sgstInPerc: 0, 
        taxPerc: 0,
        hsnCode: 0, 
        hsnName: '',
        existingProduct: false,
        productId: null,
        discountPercentage: 0 
      }
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
    const loader = toast.loading('Uploading bill & saving batch...');
    try {
      // Step 1: Upload bill attachment
      let uploadedBillUrl = '';
      if (selectedItem.file) {
        const uploadRes = await InventoryService.uploadAttachment(selectedItem.file);
        if (uploadRes.success && uploadRes.data?.docUrl) {
          uploadedBillUrl = uploadRes.data.docUrl;
        } else {
          toast.error('Bill upload failed. Please try again.', { id: loader });
          setIsSubmitting(false);
          return;
        }
      }

      // Step 2: Build payload matching backend contract
      const data = selectedItem.extractedData;
      const payload: CreateBatchPayload = {
        vendor: {
          name: data.vendor?.name || 'Unknown',
          gst: data.vendor?.gst || null,
          email: data.vendor?.email || '',
          phone: data.vendor?.phone || '',
          address: data.vendor?.address || '',
          billTotalIncludingTax: data.billTotalIncludingTax ?? null,
          invoiceNumber: data.invoiceNumber ?? null,
          isInvoiceNumberClear: data.isInvoiceNumberClear ?? null,
          billDate: data.billDate ?? null,
        },
        totalWithoutTax: String(subtotal),
        tax: String(tax),
        billTotalIncludingTax: data.billTotalIncludingTax ?? calculatedTotal,
        extraCharges: {},
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

          const product: CreateBatchPayload['products'][number] = {
            name: p.name,
            quantity: qty,
            unit: p.unit || 'pcs',
            hsnCode: p.hsnCode || null,
            hsnName: p.hsnName || null,
            cgstInPerc: Number(rawCgst) || 0,
            sgstInPerc: Number(rawSgst) || 0,
            price: price,
            totalExcludingTax: qty * price,
            tax: totalTaxLine,
            totalIncludingTax: qty * price + totalTaxLine,
            imageUrl: p.imageUrl || null,
          };
          if (p.productId) product.productId = p.productId;
          return product;
        }),
        invoiceNumber: data.invoiceNumber || null,
        isInvoiceNumberClear: data.isInvoiceNumberClear ?? true,
        billDate: data.billDate || null,
        totalWithTax: String(calculatedTotal),
        totalIncAll: String(calculatedTotal),
        billUrl: uploadedBillUrl,
      };

      StockUploadService.createBatch(payload)
        .then(res => {
          if (res.success) {
            toast.success('Batch saved successfully', { id: loader });
            onSuccess(selectedItem.id);
          } else {
            toast.error(res.message || 'Failed to save batch', { id: loader });
          }
        })
        .catch((e: Error) => {
          toast.error(e.message || 'Error occurred while saving', { id: loader });
        })
        .finally(() => {
          setIsSubmitting(false);
        });
    } catch (e: unknown) {
      const err = e as { message?: string };
      toast.error(err.message || 'Fatal error occurred', { id: loader });
      setIsSubmitting(false);
    }
  };

  const billedTotal = selectedItem?.extractedData?.billTotalIncludingTax || 0;

  if (!isOpen) return null;

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
            <BillSidebar
              isVerifying={isVerifying}
              uniqueBills={uniqueBills}
              duplicateBills={duplicateBills}
              selectedBillId={selectedBillId}
              setSelectedBillId={setSelectedBillId}
              uniqueOpen={uniqueOpen}
              setUniqueOpen={setUniqueOpen}
              duplicatesOpen={duplicatesOpen}
              setDuplicatesOpen={setDuplicatesOpen}
              fileUrl={fileUrl}
              previewHidden={previewHidden}
              setPreviewHidden={setPreviewHidden}
            />
          </div>
        </div>

        {/* ─── Main Content ─── */}
        <div className="flex-1 flex overflow-hidden bg-app">
          <div className="flex-1 flex flex-col bg-card min-w-[300px]">
            {selectedItem ? (
              <div className="flex flex-col flex-1 h-full overflow-hidden">
                
                {/* ─── Header Banner ─── */}
                <BillHeaderBanner
                  selectedItem={selectedItem}
                  onClose={onClose}
                />

                {/* ─── Scrollable Table Area ─── */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-6 xl:p-8">
                  <div className="max-w-[1200px] mx-auto w-full">
                    {/* Product Table */}
                    <div className="flex flex-col gap-0 w-full">

                      <div className="rounded-xl border border-border-main/60 bg-surface/20 overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left table-fixed min-w-[700px]">
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
                            {editableProducts.map((p, i) => {
                              const rawQty = p.quantity !== undefined ? p.quantity : '';
                              const rawPrice = p.price !== undefined ? p.price : '';
                              
                              const rawCgst = p.cgstInPerc;
                              const rawSgst = p.sgstInPerc;
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
                                    <ProductPickerCell product={p} index={i} onUpdate={handleProductUpdate} disabled={isDuplicate} />
                                  </td>
                                  <td className="px-2 py-2">
                                    <input type="number" disabled={isDuplicate} className={`w-full bg-card border border-border-main ${isDuplicate ? 'opacity-50 cursor-not-allowed' : 'hover:border-secondary-text/50 focus:border-secondary-text'} rounded-md px-1.5 py-1 text-[11px] font-bold text-primary-text text-center outline-none`} value={rawQty} onChange={e => handleProductChange(i, 'quantity', e.target.value)} />
                                  </td>
                                  <td className="px-2 py-2">
                                    <input disabled={isDuplicate} className={`w-full bg-card border border-border-main ${isDuplicate ? 'opacity-50 cursor-not-allowed' : 'hover:border-secondary-text/50 focus:border-secondary-text'} rounded-md px-1 py-1 text-[10px] font-bold text-muted-text text-center uppercase outline-none`} value={p.unit || 'EA'} onChange={e => handleProductChange(i, 'unit', e.target.value)} />
                                  </td>
                                  <td className="px-2 py-2">
                                    <input type="number" step="0.01" disabled={isDuplicate} className={`w-full bg-card border border-border-main ${isDuplicate ? 'opacity-50 cursor-not-allowed' : 'hover:border-secondary-text/50 focus:border-secondary-text'} rounded-md px-1.5 py-1 text-[11px] font-bold text-primary-text text-right outline-none`} value={rawPrice} onChange={e => handleProductChange(i, 'price', e.target.value)} />
                                  </td>
                                  <td className="px-2 py-2">
                                    <input type="number" step="0.5" disabled={isDuplicate} className={`w-full bg-card border border-border-main ${isDuplicate ? 'opacity-50 cursor-not-allowed' : 'hover:border-secondary-text/50 focus:border-secondary-text'} rounded-md px-1 py-1 text-[11px] font-bold text-primary-text text-center outline-none`} value={rawTaxPerc} onChange={e => {
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
                                    {!isDuplicate && (
                                      <button 
                                        onClick={() => handleRemoveProduct(i)} 
                                        className="p-1.5 text-muted-text hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors flex items-center justify-center shrink-0"
                                        title="Remove Item"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      <button
                        onClick={handleAddProduct}
                        disabled={isDuplicate}
                        className={`mt-3 flex items-center justify-center gap-2 w-full py-2.5 border-2 border-dashed border-border-main ${isDuplicate ? 'opacity-30 cursor-not-allowed' : 'hover:border-secondary-text/50 hover:bg-surface/30'} rounded-xl text-[11px] font-black text-muted-text hover:text-primary-text uppercase tracking-widest transition-all`}
                      >
                        <Plus size={14} strokeWidth={3} /> Add Product
                      </button>
                    </div>
                  </div>
                </div>

                {/* ─── Sticky Footer ─── */}
                <BillFooter
                  subtotal={subtotal}
                  tax={tax}
                  calculatedTotal={calculatedTotal}
                  billedTotal={billedTotal}
                  isDuplicate={isDuplicate}
                  duplicateInfo={duplicateInfo}
                  isSubmitting={isSubmitting}
                  onConfirmAndSave={handleConfirmAndSave}
                  reprocessCount={selectedItem?.id ? (reprocessCounts[selectedItem.id] || 0) : 0}
                  isReprocessing={isReprocessing}
                  onReprocess={handleReprocess}
                  isEdited={isEdited}
                  onReset={resetProducts}
                />
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
