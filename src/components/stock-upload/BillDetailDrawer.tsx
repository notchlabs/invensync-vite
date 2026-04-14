import { StockUploadService, type BatchInvoiceDetail } from '../../services/stockUploadService'
import { InventoryService, type SiteDistribution } from '../../services/inventoryService'
import { BillViewModal } from './BillViewModal'
import toast from 'react-hot-toast'
import { useState, useEffect } from 'react'
import { Calendar, CheckCircle, ChevronLeft, FileText, LayoutDashboard, Loader2, MapPin, Package, Paperclip, X } from 'lucide-react'

interface BillDetailDrawerProps {
  id: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export function BillDetailDrawer({ id, isOpen, onClose }: BillDetailDrawerProps) {
  const [data, setData] = useState<BatchInvoiceDetail | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'attachments'>('overview')

  // Distribution Drill-down State
  const [selectedProduct, setSelectedProduct] = useState<{ id: number; name: string; unit: string } | null>(null)
  const [distData, setDistData] = useState<SiteDistribution | null>(null)
  const [isDistLoading, setIsDistLoading] = useState(false)

  // Bill View Modal State
  const [isBillModalOpen, setIsBillModalOpen] = useState(false)

  const formatIndianCurrency = (num: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(num);
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const handleProductClick = async (product: BatchInvoiceDetail['products'][number]) => {
    setSelectedProduct({ id: product.inboundId, name: product.name, unit: product.unit })
    setIsDistLoading(true)
    try {
      const res = await InventoryService.fetchSiteDistribution(product.inboundId)
      if (res.success) {
        setDistData(res.data)
      } else {
        toast.error(res.message || 'Failed to fetch site distribution')
      }
    } catch (err) {
      console.error(err)
      toast.error('Error fetching site distribution')
    } finally {
      setIsDistLoading(false)
    }
  }

  const handleBackToMain = () => {
    setSelectedProduct(null)
    setDistData(null)
  }

  useEffect(() => {
    if (id && isOpen) {
      handleBackToMain() // Reset drill-down when opening new drawer
      const fetchDetail = async () => {
        setIsLoading(true)
        try {
          const res = await StockUploadService.fetchBatchById(id)
          if (res.success) {
            setData(res.data)
          } else {
            toast.error(res.message || 'Failed to fetch bill details')
          }
        } catch (err) {
          console.error(err)
          toast.error('Error occurred while fetching bill details')
        } finally {
          setIsLoading(false)
        }
      }
      fetchDetail()
    } else {
      setData(null)
      setActiveTab('overview')
    }
  }, [id, isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[300] flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.3s_ease-out]" 
        onClick={onClose} 
      />
      
      {/* Drawer */}
      <div className="relative w-full max-w-[500px] h-full bg-card border-l border-border-main flex flex-col shadow-2xl animate-[slideInRight_0.3s_ease-out]">
        
        {/* Header Section */}
        <div className="p-6 border-b border-border-main shrink-0">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-[20px] font-black text-primary-text tracking-tight uppercase">
              {isLoading ? 'Loading...' : data?.invoiceNumber}
            </h2>
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-surface hover:bg-rose-500/10 text-muted-text hover:text-rose-500 flex items-center justify-center transition-colors shadow-sm"
            >
              <X size={18} />
            </button>
          </div>
          <div className="flex items-center gap-2 mb-6">
            <button 
              onClick={handleBackToMain}
              disabled={!selectedProduct}
              className={`text-[11px] font-extrabold uppercase tracking-widest px-2 py-1 rounded transition-all ${selectedProduct ? 'text-blue-500 hover:bg-blue-500/10' : 'text-blue-600 dark:text-blue-400 bg-blue-500/10 cursor-default'}`}
            >
              Bill Overview
            </button>
            {selectedProduct && (
              <>
                <ChevronRight size={10} className="text-muted-text/40 translate-y-[0.5px]" />
                <span className="text-[11px] font-extrabold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-1 rounded uppercase tracking-widest animate-in fade-in slide-in-from-left-2 duration-300">
                  {selectedProduct.name} Timeline
                </span>
              </>
            )}
          </div>

          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-black text-muted-text/60 uppercase tracking-tighter">Vendor</span>
              <span className="text-[13px] font-bold text-primary-text truncate">{data?.vendor.name || '-'}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-black text-muted-text/60 uppercase tracking-tighter">Billing Date</span>
              <div className="flex items-center gap-1.5 text-[12px] font-bold text-primary-text">
                <Calendar size={13} className="text-secondary-text" strokeWidth={2.5} />
                <span>{data?.billDate ? formatDate(data.billDate) : '-'}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-black text-muted-text/60 uppercase tracking-tighter">Total Amount</span>
              <span className="text-[13px] font-black text-primary-text">₹{(data?.totalWithTax || 0) >= 1000 ? `${((data?.totalWithTax || 0) / 1000).toFixed(0)} K` : data?.totalWithTax}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-black text-muted-text/60 uppercase tracking-tighter">Bill</span>
              <button 
                onClick={() => setIsBillModalOpen(true)}
                className="text-[12px] font-black text-blue-600 dark:text-blue-500 hover:underline flex items-center gap-1"
              >
                View Bill
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border-main px-6 shrink-0 bg-surface/30">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-4 flex items-center gap-2 text-[12px] font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'overview' ? 'text-blue-500 border-blue-500 bg-blue-500/5' : 'text-muted-text/50 border-transparent hover:text-muted-text'}`}
          >
            <LayoutDashboard size={14} /> Overview
          </button>
          <button 
            onClick={() => setActiveTab('attachments')}
            className={`py-3 px-4 flex items-center gap-2 text-[12px] font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'attachments' ? 'text-blue-500 border-blue-500 bg-blue-500/5' : 'text-muted-text/50 border-transparent hover:text-muted-text'}`}
          >
            <Paperclip size={14} /> Attachments
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 bg-surface/10 custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-text/40">
              <Loader2 size={32} className="animate-spin" />
              <span className="text-[11px] font-black uppercase tracking-[0.2em] animate-pulse">Fetching Details...</span>
            </div>
          ) : data && (
            <div className="p-6 flex flex-col gap-8">
              {activeTab === 'overview' && !selectedProduct && (
                <>
                  {/* Summary Cards */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-card border border-border-main p-4 rounded-xl shadow-sm flex flex-col gap-1.5 shadow-left">
                      <span className="text-[10px] font-black text-muted-text/60 uppercase tracking-widest">Total Materials</span>
                      <span className="text-[20px] font-black text-primary-text">{data.products.length}</span>
                    </div>
                    <div className="bg-blue-500/5 border border-blue-500/20 p-4 rounded-xl shadow-sm flex flex-col gap-1.5 shadow-left">
                      <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Tax Amount</span>
                      <span className="text-[20px] font-black text-blue-600 dark:text-blue-500">₹{data.tax.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-xl shadow-sm flex flex-col gap-1.5 shadow-left">
                      <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Net Amount</span>
                      <span className="text-[20px] font-black text-emerald-600 dark:text-emerald-500">₹{data.totalWithTax.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {/* Material Summary */}
                  <div>
                    <h3 className="text-[13px] font-black text-primary-text uppercase tracking-widest mb-4 flex items-center gap-2">
                       Material Summary
                    </h3>
                    <div className="flex flex-col gap-2">
                      {data.products.map((p, i) => (
                        <div key={i} onClick={() => handleProductClick(p)}
                          className="group relative bg-card border border-border-main rounded-2xl p-4 flex items-center gap-5 hover:shadow-lg hover:border-blue-500/40 transition-all cursor-pointer shadow-sm border-l-4 border-l-border-main/20 hover:border-l-blue-500">
                          <div className="w-14 h-14 rounded-xl bg-surface border border-border-main/50 overflow-hidden flex items-center justify-center p-2 shrink-0 group-hover:scale-110 transition-transform duration-300">
                            {p.productUrl ? (
                              <img src={p.productUrl} alt="" className="w-full h-full object-contain" />
                            ) : (
                              <Package size={28} className="text-muted-text/30" />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0 flex flex-col gap-1">
                            <span className="text-[15px] font-black text-primary-text truncate tracking-tight">{p.name}</span>
                            <span className="text-[12px] font-bold text-muted-text/60">@ {formatIndianCurrency(p.price)} per {p.unit}</span>
                          </div>

                          <div className="flex flex-col items-end gap-1.5 shrink-0 pr-6">
                            <span className="text-[9px] font-black text-muted-text/30 uppercase tracking-[0.1em] mb-0.5">Inbound</span>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 rounded-xl border border-emerald-500/10">
                               <span className="text-[13px] font-black text-emerald-600">{p.quantity} {p.unit}</span>
                               <CheckCircle size={12} className="text-emerald-500" strokeWidth={3} />
                            </div>
                          </div>

                          <ChevronRight size={16} className="text-muted-text/20 absolute right-4 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'overview' && selectedProduct && (
                <div className="flex flex-col gap-6 animate-in slide-in-from-right-4 duration-300">
                  {/* Sub Header */}
                  <div className="flex items-center gap-3 border-b border-border-main/50 pb-4">
                    <button 
                      onClick={handleBackToMain}
                      className="p-2 bg-surface hover:bg-rose-500/10 text-muted-text hover:text-rose-500 rounded-lg transition-colors border border-border-main"
                    >
                      <ChevronLeft size={16} strokeWidth={2.5} />
                    </button>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-muted-text uppercase tracking-widest pl-1">Site Distribution</span>
                      <h4 className="text-[16px] font-black text-primary-text tracking-tight uppercase">{selectedProduct.name}</h4>
                    </div>
                  </div>

                  {isDistLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4 text-muted-text/40">
                      <Loader2 size={32} className="animate-spin" />
                      <span className="text-[11px] font-black uppercase tracking-[0.2em]">Analyzing sites...</span>
                    </div>
                  ) : distData && (
                    <>
                      {/* Distribution Summary */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-card border border-border-main p-4 rounded-xl shadow-sm flex flex-col gap-1.5 shadow-left">
                          <span className="text-[10px] font-black text-muted-text/60 uppercase tracking-widest">Available</span>
                          <span className="text-[20px] font-black text-emerald-600 dark:text-emerald-500">{distData.availableQty} <span className="text-[11px] font-bold text-muted-text uppercase">{selectedProduct.unit}</span></span>
                        </div>
                        <div className="bg-orange-500/5 border border-orange-500/20 p-4 rounded-xl shadow-sm flex flex-col gap-1.5 shadow-left">
                          <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">In Transit</span>
                          <span className="text-[20px] font-black text-orange-600 dark:text-orange-500">{distData.transitQty} <span className="text-[11px] font-bold text-muted-text uppercase">{selectedProduct.unit}</span></span>
                        </div>
                        <div className="bg-rose-500/5 border border-rose-500/20 p-4 rounded-xl shadow-sm flex flex-col gap-1.5 shadow-left">
                          <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Consumed</span>
                          <span className="text-[20px] font-black text-rose-600 dark:text-rose-500">{distData.consumedQty} <span className="text-[11px] font-bold text-muted-text uppercase">{selectedProduct.unit}</span></span>
                        </div>
                      </div>

                      {/* Site List */}
                      <div>
                        <h3 className="text-[13px] font-black text-primary-text uppercase tracking-widest mb-4 flex items-center gap-2">
                          <MapPin size={14} className="text-secondary-text" /> Site Allocation ({distData.totalSites})
                        </h3>
                        <div className="flex flex-col gap-3">
                          {distData.sites.map((site, i) => (
                            <div key={i} className="bg-card border border-border-main rounded-2xl p-4 flex flex-col gap-4 hover:shadow-md transition-shadow cursor-default shadow-sm relative group overflow-hidden">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center text-primary-text border border-border-main">
                                    <MapPin size={18} />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-[14px] font-black text-primary-text tracking-tight uppercase group-hover:text-blue-500 transition-colors">{site.name}</span>
                                    <span className="text-[11px] font-bold text-muted-text/60 italic">{site.city}, {site.state}</span>
                                  </div>
                                </div>
                                <div className="px-2.5 py-1 bg-blue-500/10 text-blue-600 rounded-lg text-[10px] font-black tracking-widest uppercase">
                                  ID: {site.id}
                                </div>
                              </div>

                              <div className="grid grid-cols-3 gap-2 mt-1">
                                <div className="flex flex-col gap-0.5 bg-surface/50 p-2 rounded-xl">
                                  <span className="text-[10px] font-black text-muted-text/40 uppercase tracking-tighter">Current At Site</span>
                                  <span className="text-[14px] font-black text-emerald-600">{site.availableQty} {selectedProduct.unit}</span>
                                </div>
                                <div className="flex flex-col gap-0.5 bg-orange-500/5 p-2 rounded-xl">
                                  <span className="text-[10px] font-black text-muted-text/40 uppercase tracking-tighter">Transit To Site</span>
                                  <span className="text-[14px] font-black text-orange-600">{site.transitQty} {selectedProduct.unit}</span>
                                </div>
                                <div className="flex flex-col gap-0.5 bg-rose-500/5 p-2 rounded-xl">
                                  <span className="text-[10px] font-black text-muted-text/40 uppercase tracking-tighter">Consumed Here</span>
                                  <span className="text-[14px] font-black text-rose-600">{site.consumedQty} {selectedProduct.unit}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {activeTab === 'attachments' && (
                <div className="w-full h-[600px] bg-black/5 rounded-2xl border-2 border-dashed border-border-main flex flex-col items-center justify-center overflow-hidden">
                  {data.billUrl ? (
                    <iframe 
                      src={data.billUrl} 
                      className="w-full h-full border-0" 
                      title="Bill PDF"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-3 text-muted-text/40">
                      <FileText size={48} strokeWidth={1.5} />
                      <span className="text-[12px] font-bold uppercase tracking-widest text-center px-8">No preview available for this document</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Animation Styles */}
        <style>{`
          @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(0,0,0,0.02);
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(0,0,0,0.1);
            border-radius: 20px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(0,0,0,0.2);
          }
          .animate-spin-slow {
            animation: spin 3s linear infinite;
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>

      {data && id && (
        <BillViewModal
          isOpen={isBillModalOpen}
          onClose={() => setIsBillModalOpen(false)}
          batch={{
            id: id,
            supplierName: data.vendor.name,
            refNo: data.invoiceNumber,
            totalPrice: data.totalWithTax,
            state: 'INBOUNDED',
            siteNames: '',
            createdAt: data.billDate,
            billUrl: data.billUrl
          }}
        />
      )}
    </div>
  )
}

function ChevronRight({ className, size }: { className?: string; size?: number }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size || 16} 
      height={size || 16} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}
