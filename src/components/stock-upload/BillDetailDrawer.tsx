import { useState, useEffect } from 'react'
import { X, Calendar, User, ExternalLink, Package, Receipt, CheckCircle, Clock, Loader2, FileText, LayoutDashboard, Paperclip } from 'lucide-react'
import { StockUploadService, type BatchInvoiceDetail } from '../../services/stockUploadService'
import toast from 'react-hot-toast'

interface BillDetailDrawerProps {
  id: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export function BillDetailDrawer({ id, isOpen, onClose }: BillDetailDrawerProps) {
  const [data, setData] = useState<BatchInvoiceDetail | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'attachments'>('overview')

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

  useEffect(() => {
    if (id && isOpen) {
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
          <span className="text-[11px] font-bold text-blue-600 dark:text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded uppercase tracking-widest mb-6 inline-block">
            Bill Overview
          </span>

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
              <a 
                href={data?.billUrl} 
                target="_blank" 
                rel="noreferrer"
                className="text-[12px] font-black text-blue-600 dark:text-blue-500 hover:underline flex items-center gap-1"
              >
                View Bill <ExternalLink size={12} strokeWidth={2.5} />
              </a>
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
              {activeTab === 'overview' && (
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
                        <div key={i} className="group relative bg-card border border-border-main rounded-xl p-3 flex items-center gap-4 hover:shadow-lg hover:border-blue-500/40 transition-all cursor-default shadow-sm border-l-4 border-l-border-main/20 hover:border-l-blue-500">
                          <div className="w-12 h-12 rounded-lg bg-surface border border-border-main/50 overflow-hidden flex items-center justify-center p-1.5 shrink-0 group-hover:scale-105 transition-transform">
                            {p.productUrl ? (
                              <img src={p.productUrl} alt="" className="w-full h-full object-contain" />
                            ) : (
                              <Package size={24} className="text-muted-text/30" />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                            <span className="text-[14px] font-black text-primary-text truncate tracking-tight">{p.name}</span>
                            <span className="text-[11px] font-bold text-muted-text/60">@ {formatIndianCurrency(p.price)} per {p.unit}</span>
                          </div>

                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className="text-[10px] font-black text-muted-text/30 uppercase tracking-widest mb-0.5">Inbound</span>
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 rounded-lg">
                               <span className="text-[12px] font-black text-emerald-600">{p.quantity} {p.unit}</span>
                               <CheckCircle size={10} className="text-emerald-500" strokeWidth={3} />
                            </div>
                          </div>

                          <ChevronRight size={14} className="text-muted-text/20 absolute -right-0 group-hover:text-blue-500 transition-colors ml-1" />
                        </div>
                      ))}
                    </div>
                  </div>
                </>
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
