import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Calendar, CheckCircle2, AlertCircle, Trash2, Package, LayoutGrid, ChevronRight, RotateCw, Loader2, FileText, ExternalLink } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { SiteFilterSingle } from '../filters/SiteFilterSingle'
import { InventoryService } from '../../services/inventoryService'
import { CustomCheckbox } from '../common/CustomCheckbox'
import type { InventoryItem, Site } from '../../types/inventory'

interface TransferStockModalProps {
  isOpen: boolean
  onClose: () => void
  items: InventoryItem[]
  onSuccess: () => void
}

export function TransferStockModal({ isOpen, onClose, items, onSuccess }: TransferStockModalProps) {
  const navigate = useNavigate()
  // Local state for items being transferred
  const [localItems, setLocalItems] = useState<(InventoryItem & { transferQty: number })[]>([])
  const [destinationSite, setDestinationSite] = useState<Site | null>(null)
  const [billDate, setBillDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [isTransferLoading, setIsTransferLoading] = useState(false)
  const [isCorrectionLoading, setIsCorrectionLoading] = useState(false)
  const [successData, setSuccessData] = useState<{ url: string; type: string } | null>(null)

  // Sync items from props when modal opens
  useEffect(() => {
    if (isOpen) {
      setLocalItems(items.map(item => ({ ...item, transferQty: 1 })))
      setDestinationSite(null)
      const d = new Date()
      setBillDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
      setSuccessData(null)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  // Validation: Check for unique "From Site"
  const fromSites = Array.from(new Set(localItems.map(item => item.siteId)))
  const isMultiSite = fromSites.length > 1
  const fromSiteName = localItems.length > 0 ? localItems[0].site : ''

  // Validation: Same Site Transfer
  const isSameSite = destinationSite && !isMultiSite && fromSites.length > 0 && destinationSite.id === fromSites[0]

  const calculatePayload = () => {
    if (!destinationSite || fromSites.length === 0) return null

    // Get source site details from the first item since we validated isMultiSite earlier
    const firstItem = localItems[0]
    
    const transferItems = localItems.map(item => {
      const totalExcludingTax = item.transferQty * item.price
      const taxPerc = (item.cgstInPerc || 0) + (item.sgstInPerc || 0)
      const taxAmount = totalExcludingTax * (taxPerc / 100)
      const totalIncludingTax = totalExcludingTax + taxAmount

      return {
        sourceSiteId: item.siteId,
        sourceSiteName: item.site,
        hsnCode: item.hsnCode,
        cgstInPerc: item.cgstInPerc || 0,
        sgstInPerc: item.sgstInPerc || 0,
        price: item.price,
        destinationSiteId: destinationSite.id,
        destinationSiteName: destinationSite.name,
        productId: item.productId,
        productName: item.productName,
        quantity: item.transferQty,
        unit: item.unit,
        totalExcludingTax: parseFloat(totalExcludingTax.toFixed(4)),
        totalIncludingTax: parseFloat(totalIncludingTax.toFixed(4))
      }
    })

    const totalAmount = transferItems.reduce((sum, item) => sum + item.totalExcludingTax, 0)
    const totalAmountIncTax = transferItems.reduce((sum, item) => sum + item.totalIncludingTax, 0)

    return {
      billDate,
      fromSite: {
        id: firstItem.siteId,
        name: firstItem.site,
        address: firstItem.siteAddress
      },
      toSite: {
        id: destinationSite.id,
        name: destinationSite.name,
        address: destinationSite.address
      },
      transferItems,
      totalAmount: parseFloat(totalAmount.toFixed(4)),
      totalAmountIncTax: parseFloat(totalAmountIncTax.toFixed(4)),
      taxAmount: parseFloat((totalAmountIncTax - totalAmount).toFixed(4))
    }
  }

  const handleQtyChange = (productId: number, siteId: number, val: string) => {
    const num = parseFloat(val) || 0
    setLocalItems(prev => prev.map(item => 
      (item.productId === productId && item.siteId === siteId) 
        ? { ...item, transferQty: Math.min(item.quantity, Math.max(0, num)) } 
        : item
    ))
  }

  const removeItem = (productId: number, siteId: number) => {
    setLocalItems(prev => prev.filter(i => !(i.productId === productId && i.siteId === siteId)))
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const handleTransfer = (type: 'accounting' | 'correction') => {
    const payload = calculatePayload()
    if (!payload) return

    const setLoading = type === 'accounting' ? setIsTransferLoading : setIsCorrectionLoading
    setLoading(true)
    
    const action = type === 'accounting' 
      ? InventoryService.generateTransferInvoice(payload)
      : InventoryService.quickTransfer(payload)

    action.then(res => {
      if (res.success && res.data) {
        toast.success(type === 'accounting' ? 'Transfer Successful' : 'Correction Successful')
        setSuccessData({ url: res.data, type })
        onSuccess()
      } else {
        toast.error(res.message || 'Operation failed')
      }
    }).catch(err => {
      toast.error('Network error. Please try again.')
      console.error(err)
    }).finally(() => {
      setLoading(false)
    })
  }

  const handlePreview = () => {
    const payload = calculatePayload()
    if (!payload) return

    setIsPreviewLoading(true)
    InventoryService.transferPreview(payload)
      .then(res => {
        if (res.success && res.data) {
          window.open(res.data, '_blank')
        } else {
          toast.error(res.message || 'Failed to generate preview')
        }
      })
      .catch(() => toast.error('Failed to connect to server'))
      .finally(() => setIsPreviewLoading(false))
  }

  const hasRemaining = localItems.some(i => i.quantity > i.transferQty)
  const handleTransferMore = () => {
    setLocalItems(prev => prev.map(item => ({
      ...item,
      quantity: item.quantity - item.transferQty,
      transferQty: 1
    })).filter(i => i.quantity > 0))
    setSuccessData(null)
    setDestinationSite(null)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-card border border-border-main rounded-none sm:rounded-2xl w-full max-w-[1240px] overflow-hidden flex flex-col animate-[fadeInUp_0.3s_ease-out] h-screen sm:h-[92dvh] max-h-screen sm:max-h-[92dvh]">
        
        {/* Header */}
        <div className="px-5 sm:px-8 py-5 bg-header border-b border-border-main flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-[20px] font-black text-primary-text tracking-tight flex items-center gap-3">
              Transfer Stock to Site
            </h2>
            <p className="text-[12px] text-muted-text font-medium">
              Select items and destination site. You can also make a quick correction (no accounting change).
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface border border-transparent hover:border-border-main rounded-xl text-muted-text transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-auto flex flex-col lg:flex-row bg-surface/30">
          
          {/* Main Area: Item Table or Summary */}
          <div className="flex-1 flex flex-col min-w-0">
            {successData ? (
              <div className="p-8 flex flex-col gap-8 animate-[fadeIn_0.4s_ease-out]">
                <div className="flex items-center gap-4 text-muted-text/40">
                  <div className="px-3 py-1 bg-surface border border-border-main rounded-lg text-[11px] font-black uppercase tracking-widest">{fromSiteName}</div>
                  <ChevronRight size={16} />
                  <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-lg text-[11px] font-black uppercase tracking-widest">{destinationSite?.name}</div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="p-5 bg-header/30 border border-border-main rounded-2xl flex flex-col gap-1">
                    <span className="text-[10px] font-black text-muted-text uppercase tracking-widest leading-none">Items Transferred</span>
                    <span className="text-[20px] font-black text-primary-text">{localItems.length} Products</span>
                  </div>
                  <div className="p-5 bg-header/30 border border-border-main rounded-2xl flex flex-col gap-1">
                    <span className="text-[10px] font-black text-muted-text uppercase tracking-widest leading-none">Total Excl. Tax</span>
                    <span className="text-[20px] font-black text-primary-text">₹ {calculatePayload()?.totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="p-5 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl flex flex-col gap-1">
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none">Total Incl. Tax</span>
                    <span className="text-[20px] font-black text-emerald-700">₹ {calculatePayload()?.totalAmountIncTax.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <h5 className="text-[11px] font-black text-muted-text uppercase tracking-widest ml-1">Items Detail</h5>
                  <div className="border border-border-main rounded-2xl overflow-hidden bg-header/10">
                    <table className="w-full border-collapse">
                      <thead className="bg-table-head/50 border-b border-border-main">
                        <tr>
                          <th className="px-5 py-3 text-left text-[10px] font-black text-muted-text uppercase tracking-widest">Product</th>
                          <th className="px-5 py-3 text-right text-[10px] font-black text-muted-text uppercase tracking-widest">Quantity</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-main/30">
                        {localItems.map(item => (
                          <tr key={item.productId} className="text-[13px] font-bold text-primary-text">
                            <td className="px-5 py-3">{item.productName}</td>
                            <td className="px-5 py-3 text-right">{item.transferQty} {item.unit}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 overflow-x-auto custom-scrollbar">
                <table className="w-full border-collapse table-fixed min-w-[700px]">
                  <thead>
                    <tr className="bg-table-head border-b border-border-main/50">
                      <th className="px-4 py-3 text-left w-[35%]">
                        <div className="flex items-center gap-2">
                          <CustomCheckbox checked={true} readOnly />
                          <span className="text-[13px] font-bold text-primary-text tracking-tight">Product</span>
                        </div>
                      </th>
                      <th className="px-4 py-3 text-left w-[20%] text-[13px] font-bold text-primary-text tracking-tight">Vendor</th>
                      <th className="px-4 py-3 text-left w-[15%] text-[13px] font-bold text-primary-text tracking-tight">From</th>
                      <th className="px-4 py-3 text-center w-[20%] text-[13px] font-bold text-primary-text tracking-tight">Qty</th>
                      <th className="px-4 py-3 text-center w-[10%] text-[13px] font-bold text-primary-text tracking-tight">Unit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {localItems.map((item) => (
                      <tr key={`${item.productId}-${item.siteId}`} className="group hover:bg-surface/50 transition-colors border-b border-border-main/30 last:border-0 relative">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <CustomCheckbox checked={true} readOnly className="shrink-0" />
                            <div className="w-10 h-10 rounded-lg border border-border-main bg-white p-1 flex items-center justify-center shrink-0 shadow-sm">
                              {item.imageUrl ? (
                                <img src={item.imageUrl} alt="" className="w-full h-full object-contain rounded-md" />
                              ) : (
                                <Package className="text-muted-text/30" size={16} />
                              )}
                            </div>
                            <div className="flex flex-col min-w-0 pr-2">
                              <span className="text-[13px] font-bold text-primary-text tracking-tight truncate leading-tight">
                                {item.productName}
                              </span>
                              <span className="text-[11px] text-muted-text font-medium truncate mt-0.5">
                                {item.vendorNames || 'Generic'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 truncate">
                          <span className="text-[13px] font-medium text-muted-text tracking-tight">
                            {item.vendorNames || 'Generic'}
                          </span>
                        </td>
                        <td className="px-4 py-4 truncate">
                          <span className={`text-[13px] font-bold tracking-tight ${isMultiSite ? 'text-rose-500' : 'text-primary-text'}`}>
                            {item.site}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <input 
                              type="number"
                              value={item.transferQty}
                              onChange={(e) => handleQtyChange(item.productId, item.siteId, e.target.value)}
                              className="w-16 h-8 text-center bg-card border border-border-main rounded-md text-[13px] font-bold text-primary-text outline-none focus:border-secondary-text shadow-sm shrink-0"
                            />
                            <span className="text-[12px] text-muted-text font-medium tracking-tight whitespace-nowrap">
                              / {item.quantity.toFixed(2)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="flex items-center justify-center gap-3">
                            <span className="text-[13px] font-bold text-primary-text tracking-tight">
                              {item.unit || 'Ea'}
                            </span>
                            
                            {/* Hidden Trash icon that appears on row hover */}
                            <button 
                              onClick={() => removeItem(item.productId, item.siteId)}
                              className="absolute right-4 p-1.5 text-muted-text/40 hover:text-red-500 hover:bg-red-50 rounded-md transition-all opacity-0 group-hover:opacity-100 bg-surface shadow-sm translate-x-2 group-hover:translate-x-0"
                              title="Remove item"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {localItems.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-20 text-center">
                          <div className="flex flex-col items-center gap-3 opacity-20">
                            <LayoutGrid size={48} />
                            <span className="text-[14px] font-black  tracking-widest">No Items Selected</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Sidebar Area: Actions */}
          <div className="w-full lg:w-[360px] p-6 bg-card border-l-0 lg:border-l border-border-main flex flex-col gap-6 relative">
            
            <div className="flex-1 flex flex-col gap-5">
              {successData ? (
                <div className="p-8 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex flex-col items-center text-center gap-6 animate-[fadeInUp_0.4s_ease-out]">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-sm border border-emerald-500/20">
                    <CheckCircle2 size={32} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <h4 className="text-[18px] font-black text-emerald-500 tracking-tight leading-tight">
                      {successData.type === 'accounting' ? 'Transfer Successful' : 'Quick Transfer Successful'}
                    </h4>
                    <p className="text-[13px] text-muted-text font-medium leading-relaxed">
                      All selected items have been successfully transferred to <span className="text-primary-text font-black">{destinationSite?.name}</span>.
                    </p>
                  </div>
                  <div className="w-full h-px bg-emerald-500/10" />
                  <div className="flex flex-col gap-3 w-full">
                    <a 
                      href={successData.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-full h-14 rounded-xl bg-primary-text text-card flex items-center justify-center gap-2 text-[13px] font-black tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-emerald-500/10"
                    >
                      <FileText size={18} />
                      View Invoice
                    </a>

                    {hasRemaining && (
                      <button 
                        onClick={handleTransferMore}
                        className="w-full h-12 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/40 hover:bg-emerald-500/20 hover:border-emerald-500/50 active:scale-[0.98] text-[12px] font-black tracking-widest flex items-center justify-center gap-2 transition-all shadow-sm"
                      >
                        <RotateCw size={16} />
                        Transfer More Items
                      </button>
                    )}
                  </div>
                </div>
              ) : isMultiSite || isSameSite ? (
                <div className="p-6 bg-rose-500/5 border border-rose-500/10 rounded-2xl flex flex-col items-center text-center gap-4 animate-[fadeInUp_0.3s_ease-out]">
                  <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500/50">
                    <AlertCircle size={24} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <h4 className="text-[15px] font-black text-rose-400 tracking-tight">
                      {isMultiSite ? 'Multiple Source Sites' : 'Same Site Transfer'}
                    </h4>
                    <p className="text-[12px] text-muted-text font-medium leading-relaxed">
                      {isMultiSite 
                        ? `Transfer is only possible within a single source site. Currently ${fromSites.length} sites are selected in the list.`
                        : `Stock cannot be transferred to the same site it is currently located in (${fromSiteName}).`
                      }
                    </p>
                  </div>
                  <div className="w-full h-px bg-rose-500/10" />
                  <p className="text-[11px] text-muted-text/60 font-bold uppercase tracking-widest">
                    {isMultiSite ? 'Please remove items from other sites' : 'Please select a different destination'}
                  </p>
                  {isSameSite && (
                    <button 
                      onClick={() => setDestinationSite(null)}
                      className="text-[11px] font-black text-rose-500 hover:underline decoration-2 underline-offset-4"
                    >
                      Clear Destination Site
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-5 p-5 bg-header/20 border border-border-main border-dashed rounded-2xl">
                  {/* Destination Site */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-black tracking-widest ml-1">Destination Site</label>
                    <SiteFilterSingle 
                      value={destinationSite}
                      onChange={setDestinationSite}
                      placeholder="Select Site to Send Stock To"
                    />
                  </div>

                  {/* Bill Date */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-black tracking-widest ml-1">Bill Date</label>
                    <div className="relative group/date">
                      <style>{`
                        input[type="date"]::-webkit-calendar-picker-indicator {
                          background: transparent;
                          bottom: 0;
                          color: transparent;
                          cursor: pointer;
                          height: auto;
                          left: 0;
                          position: absolute;
                          right: 0;
                          top: 0;
                          width: auto;
                        }
                      `}</style>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-text group-hover/date:text-primary-text transition-colors pointer-events-none">
                        <Calendar size={16} />
                      </div>
                      <input 
                        type="date"
                        value={billDate}
                        onChange={(e) => setBillDate(e.target.value)}
                        className="w-full h-12 pl-5 pr-12 bg-surface border border-border-main rounded-xl text-[14px] font-black text-primary-text outline-none focus:border-secondary-text shadow-sm cursor-pointer appearance-none"
                      />
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none pr-12 bg-surface overflow-hidden mr-10 h-[calc(100%-4px)]">
                         <span className="text-[14px] font-black text-primary-text">{formatDate(billDate)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-3 mt-2">
                    {/* Utility shared loading check */}
                    {(() => {
                      const isAnyLoading = isPreviewLoading || isTransferLoading || isCorrectionLoading;
                      return (
                        <>
                          <button 
                            onClick={handlePreview}
                            disabled={isAnyLoading || !destinationSite || localItems.length === 0}
                            className="w-full h-12 rounded-xl text-[12px] font-black  tracking-widest bg-card border border-border-main text-secondary-text hover:bg-header hover:text-primary-text transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm flex items-center justify-center gap-2"
                          >
                            {isPreviewLoading ? <Loader2 size={16} className="animate-spin" /> : <ExternalLink size={16} />}
                            Preview Invoice
                          </button>
                          
                          <button 
                            onClick={() => handleTransfer('accounting')}
                            disabled={isAnyLoading || !destinationSite || localItems.length === 0}
                            className="w-full h-14 rounded-xl text-[13px] font-black  tracking-widest bg-primary-text text-card hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-30 disabled:scale-100 flex items-center justify-center gap-2 shadow-lg"
                          >
                            {isTransferLoading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                            Generate Transfer Invoice
                          </button>

                          <button 
                            onClick={() => handleTransfer('correction')}
                            disabled={isAnyLoading || !destinationSite || localItems.length === 0}
                            className="w-full h-12 rounded-xl text-[11px] font-black  tracking-widest bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all disabled:opacity-30 shadow-sm"
                          >
                            {isCorrectionLoading ? <Loader2 size={14} className="animate-spin mr-2" /> : null}
                            Quick Correction — No Accounting
                          </button>
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Utilities */}
            <div className="mt-auto flex flex-col gap-1 px-1">
              <button 
                onClick={() => { onClose(); navigate('/app/panel/transit'); }}
                className="flex items-center justify-between group p-3 hover:bg-surface rounded-xl transition-all"
              >
                <span className="text-[12px] font-black  tracking-wide text-primary-text">Go to Transit Page</span>
                <ChevronRight size={16} className="text-muted-text group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="px-8 py-4 bg-header border-t border-border-main">
          <p className="text-[11px] text-muted-text font-medium opacity-80 leading-relaxed italic">
            Note: Generating a transfer will create ledger entries. Quick Correction updates site without ledger changes.
          </p>
        </div>
      </div>
    </div>
  )
}
