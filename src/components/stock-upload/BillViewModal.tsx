import { useState } from 'react';
import { X, FileText, Calendar, Building2, Package, Loader2, ExternalLink, Hash } from 'lucide-react';
import { StockUploadService, type UploadBatch, type BatchInvoiceDetail } from '../../services/stockUploadService';
import { formatIndianCurrency } from '../../utils/numberFormat';

interface BillViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  batch: UploadBatch;
}

export function BillViewModal({ isOpen, onClose, batch }: BillViewModalProps) {
  const [detail, setDetail] = useState<BatchInvoiceDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [prevBatchId, setPrevBatchId] = useState<number | null>(null);

  if (isOpen && batch.id !== prevBatchId) {
    setPrevBatchId(batch.id);
    setIsLoading(true);
    setDetail(null);
    StockUploadService.fetchBatchById(batch.id)
      .then(res => setDetail(res.data))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }

  if (!isOpen) return null;

  const products = detail?.products ?? [];
  const billUrl = detail?.billUrl ?? batch.billUrl;
  const vendorName = detail?.vendor?.name ?? batch.supplierName;

  const billDate = detail?.billDate
    ? new Date(detail.billDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : batch.createdAt
      ? new Date(batch.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      : '–';

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-0 md:p-4 bg-black/60 backdrop-blur-md animate-[fadeIn_0.2s_ease-out]">
      <div className="bg-card border border-border-main w-full h-full md:h-[96vh] md:w-[98vw] md:max-w-[1400px] md:rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden relative animate-[fadeInUp_0.3s_ease-out]">

        {/* ─── Sidebar: Bill Preview ─── */}
        <div className="w-full md:w-[400px] lg:w-[500px] xl:w-[600px] bg-[#121212] hidden md:flex flex-col shrink-0 z-10 border-r border-[#2a2a2a]">
          <div className="p-5 border-b border-border-main/30 bg-[#1a1a1a] flex items-center justify-between">
            <h2 className="text-[15px] font-black text-white uppercase tracking-widest flex items-center gap-2.5">
              <FileText size={16} /> Bill Preview
            </h2>
            {billUrl && (
              <a href={billUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[10px] font-bold text-white/50 hover:text-white uppercase tracking-widest transition-colors">
                <ExternalLink size={11} /> Open
              </a>
            )}
          </div>
          <div className="flex-1 overflow-hidden bg-[#111]">
            {billUrl ? (
              <iframe src={billUrl} className="w-full h-full border-0 bg-transparent" title="Bill PDF" />
            ) : (
              <div className="flex flex-col items-center justify-center h-full opacity-30 gap-3">
                <FileText size={48} className="text-white" />
                <span className="text-[12px] font-bold text-white/50 uppercase tracking-widest">No bill attached</span>
              </div>
            )}
          </div>
        </div>

        {/* ─── Main Content ─── */}
        <div className="flex-1 flex flex-col bg-card min-w-[300px] overflow-hidden">

          {/* ─── Header Banner ─── */}
          <div className="bg-[#0f0f0f] text-white px-5 lg:px-8 py-4 flex flex-col gap-3 shrink-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-1 min-w-0 flex-1">
                <h1 className="text-[18px] md:text-[22px] font-black tracking-tight leading-tight uppercase truncate">
                  {vendorName || 'Unknown Vendor'}
                </h1>
                {detail?.vendor?.address && (
                  <p className="text-[11px] text-white/40 font-medium truncate">{detail.vendor.address}</p>
                )}
                {detail?.vendor?.gst && (
                  <p className="text-[10px] text-white/30 font-bold tracking-wider">GST: {detail.vendor.gst}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {billUrl && (
                  <a href={billUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all md:hidden">
                    <ExternalLink size={11} /> View Bill
                  </a>
                )}
                <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/50 hover:text-white">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Detail Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-2 pt-2 border-t border-white/10">
              <div className="flex flex-col gap-0.5">
                <span className="flex items-center gap-1 text-[9px] font-bold text-white/30 uppercase tracking-widest">
                  <Hash size={9} /> Invoice No.
                </span>
                <span className="text-[13px] font-bold text-white/80 tracking-tight truncate">
                  {detail?.invoiceNumber ?? batch.refNo ?? '–'}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="flex items-center gap-1 text-[9px] font-bold text-white/30 uppercase tracking-widest">
                  <Calendar size={9} /> Bill Date
                </span>
                <span className="text-[13px] font-bold text-white/80 tracking-tight">{billDate}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="flex items-center gap-1 text-[9px] font-bold text-white/30 uppercase tracking-widest">
                  <Building2 size={9} /> Sites
                </span>
                <span className="text-[13px] font-bold text-white/80 tracking-tight truncate" title={batch.siteNames}>
                  {batch.siteNames || '–'}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="flex items-center gap-1 text-[9px] font-bold text-white/30 uppercase tracking-widest">
                  <Package size={9} /> Items
                </span>
                <span className="text-[13px] font-bold text-white/80 tracking-tight">{products.length}</span>
              </div>
            </div>
          </div>

          {/* ─── Scrollable Table Area ─── */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-6 xl:p-8">
            <div className="max-w-[1200px] mx-auto w-full">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Loader2 size={32} className="animate-spin text-muted-text/30" />
                  <span className="text-[12px] font-bold text-muted-text uppercase tracking-widest">Loading invoice...</span>
                </div>
              ) : products.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-40">
                  <Package size={48} className="text-muted-text" />
                  <span className="text-[14px] font-black text-muted-text uppercase tracking-widest">No products found</span>
                </div>
              ) : (
                <div className="rounded-xl border border-border-main/60 bg-surface/20 overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left table-fixed min-w-[600px]">
                    <colgroup>
                      <col className="w-10" />
                      <col />
                      <col className="w-[70px]" />
                      <col className="w-[60px]" />
                      <col className="w-[90px]" />
                      <col className="w-[60px]" />
                      <col className="w-[80px]" />
                      <col className="w-[110px]" />
                    </colgroup>
                    <thead className="bg-table-head/80 border-b border-border-main/60">
                      <tr>
                        <th className="px-2 py-2 text-[10px] font-black text-muted-text uppercase tracking-widest text-center">#</th>
                        <th className="px-2 py-2 text-[10px] font-black text-muted-text uppercase tracking-widest">Product</th>
                        <th className="px-2 py-2 text-[10px] font-black text-muted-text uppercase tracking-widest text-center">Qty</th>
                        <th className="px-2 py-2 text-[10px] font-black text-muted-text uppercase tracking-widest text-center">Unit</th>
                        <th className="px-2 py-2 text-[10px] font-black text-muted-text uppercase tracking-widest text-right">Price</th>
                        <th className="px-2 py-2 text-[10px] font-black text-muted-text uppercase tracking-widest text-center">Tax %</th>
                        <th className="px-2 py-2 text-[10px] font-black text-muted-text uppercase tracking-widest text-right">Tax</th>
                        <th className="px-2 py-2 text-right text-[10px] font-black text-muted-text uppercase tracking-widest">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-main/30">
                      {products.map((p, i) => {
                        const taxPerc = (p.cgstInPerc ?? 0) + (p.sgstInPerc ?? 0);
                        return (
                          <tr key={p.inboundId ?? i} className="hover:bg-surface/50 transition-colors">
                            <td className="px-2 py-2.5 text-[11px] font-bold text-muted-text text-center">{i + 1}</td>
                            <td className="px-2 py-2.5">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 bg-surface border border-border-main/30 rounded flex items-center justify-center shrink-0 overflow-hidden">
                                  {p.productUrl
                                    ? <img src={p.productUrl} alt="" className="w-full h-full object-contain" />
                                    : <Package size={11} className="text-muted-text/30" />}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-[11px] font-bold text-primary-text leading-tight line-clamp-2">{p.name}</p>
                                  {p.hsnCode && (
                                    <p className="text-[9px] text-muted-text font-medium">HSN: {p.hsnCode}</p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-2 py-2.5 text-[11px] font-bold text-primary-text text-center">{p.quantity}</td>
                            <td className="px-2 py-2.5 text-[10px] font-bold text-muted-text text-center uppercase">{p.unit ?? 'EA'}</td>
                            <td className="px-2 py-2.5 text-[11px] font-bold text-primary-text text-right tracking-tight">
                              {formatIndianCurrency(p.price ?? 0)}
                            </td>
                            <td className="px-2 py-2.5 text-[11px] font-bold text-primary-text text-center">{taxPerc}%</td>
                            <td className="px-2 py-2.5 text-right text-[11px] font-bold text-primary-text tracking-tight">
                              {formatIndianCurrency(p.tax ?? 0)}
                            </td>
                            <td className="px-2 py-2.5 text-right">
                              <div className="flex flex-col text-[11px] font-black text-primary-text tracking-tight">
                                {formatIndianCurrency(p.totalIncludingTax ?? 0)}
                                <span className="text-[8px] text-muted-text font-medium">
                                  +{formatIndianCurrency(p.tax ?? 0)} tax
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* ─── Sticky Footer ─── */}
          {!isLoading && detail && products.length > 0 && (
            <div className="shrink-0 border-t border-border-main bg-card px-4 lg:px-6 xl:px-8 py-4">
              <div className="max-w-[1200px] mx-auto w-full flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
                <div className="flex items-end gap-6">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-muted-text/60 uppercase tracking-widest">Subtotal</span>
                    <span className="text-[14px] font-bold text-primary-text tracking-tight">
                      {formatIndianCurrency(detail.totalWithoutTax)}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-muted-text/60 uppercase tracking-widest">Tax</span>
                    <span className="text-[14px] font-bold text-primary-text tracking-tight">
                      {formatIndianCurrency(detail.tax)}
                    </span>
                  </div>
                  {Boolean(detail.totalIncAll) && (
                    <div className="flex flex-col pl-4 border-l border-border-main/50">
                      <span className="text-[9px] font-black text-muted-text/60 uppercase tracking-widest">Invoice</span>
                      <span className="text-[14px] font-bold text-secondary-text tracking-tight">
                        {formatIndianCurrency(detail.totalIncAll ?? 0)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[9px] font-black text-muted-text/60 uppercase tracking-widest">Total</span>
                  <span className="text-3xl font-black text-primary-text tracking-tighter leading-none">
                    {formatIndianCurrency(detail.totalWithTax)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
