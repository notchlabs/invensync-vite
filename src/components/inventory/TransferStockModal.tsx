import { useState, useEffect } from 'react'
import { X, Calendar, CheckCircle2, AlertCircle, Trash2, Package, LayoutGrid, ChevronRight, RotateCw, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { SiteFilterSingle } from '../filters/SiteFilterSingle'
import type { InventoryItem, Site } from '../../types/inventory'

interface TransferStockModalProps {
  isOpen: boolean
  onClose: () => void
  items: InventoryItem[]
  onSuccess: () => void
}

export function TransferStockModal({ isOpen, onClose, items, onSuccess }: TransferStockModalProps) {
  // Local state for items being transferred
  const [localItems, setLocalItems] = useState<(InventoryItem & { transferQty: number })[]>([])
  const [destinationSite, setDestinationSite] = useState<Site | null>(null)
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0])
  const [isLoading, setIsLoading] = useState(false)

  // Initialize local items when modal opens
  useEffect(() => {
    if (isOpen) {
      setLocalItems(items.map(item => ({ ...item, transferQty: 1 })))
      setDestinationSite(null)
      setBillDate(new Date().toISOString().split('T')[0])
    }
  }, [isOpen, items])

  // Validation: Check for unique "From Site"
  const fromSites = Array.from(new Set(localItems.map(item => item.siteId)))
  const isMultiSite = fromSites.length > 1
  const fromSiteName = localItems.length > 0 ? localItems[0].site : ''

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
    if (isMultiSite) {
      toast.error('Multiple source sites selected. Please unify your selection.')
      return
    }
    if (!destinationSite) {
      toast.error('Please select a destination site')
      return
    }
    if (localItems.length === 0) {
      toast.error('No items to transfer')
      return
    }

    setIsLoading(true)
    // Mocking API call for now
    setTimeout(() => {
      toast.success(type === 'accounting' ? 'Transfer invoice generated!' : 'Quick correction completed!')
      setIsLoading(false)
      onSuccess()
      onClose()
    }, 1500)
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
          
          {/* Main Area: Item Table */}
          <div className="flex-1 flex flex-col min-w-0">
            {isMultiSite && (
              <div className="mx-6 mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-600 animate-[shake_0.5s_ease-in-out]">
                <AlertCircle size={20} />
                <div className="flex flex-col">
                  <span className="text-[13px] font-black  tracking-tight">Multiple Source Sites Detected</span>
                  <span className="text-[11px] font-medium opacity-80 text-red-500">Transfer is only possible within a single source site. Currently selected: {fromSites.length} sites.</span>
                </div>
              </div>
            )}

            <div className="p-6">
              <table className="w-full border-collapse table-fixed">
                <thead>
                  <tr className="border-b border-border-main/50">
                    <th className="px-4 py-3 text-left w-[40%]">
                      <div className="flex items-center gap-2">
                        <input type="checkbox" checked={true} readOnly className="rounded border-border-main" />
                        <span className="text-[11px] font-black text-muted-text  tracking-widest">Product</span>
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left w-[25%] text-[11px] font-black text-muted-text  tracking-widest">From</th>
                    <th className="px-4 py-3 text-center w-[25%] text-[11px] font-black text-muted-text  tracking-widest">Transfer Qty</th>
                    <th className="px-4 py-3 text-right w-[10%] tracking-widest"></th>
                  </tr>
                </thead>
                <tbody>
                  {localItems.map((item) => (
                    <tr key={`${item.productId}-${item.siteId}`} className="group hover:bg-surface/50 transition-colors border-b border-border-main/30 last:border-0">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <input type="checkbox" checked={true} readOnly className="rounded border-border-main shrink-0" />
                          <div className="w-10 h-10 rounded-lg border border-border-main bg-surface p-1.5 flex items-center justify-center shrink-0">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt="" className="w-full h-full object-contain" />
                            ) : (
                              <Package className="text-muted-text/30" size={16} />
                            )}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-[13px] font-black text-primary-text  tracking-tight truncate leading-tight">
                              {item.productName}
                            </span>
                            <span className="text-[10px] text-muted-text font-bold  truncate opacity-60">
                              {item.vendorNames || 'Generic'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 truncate">
                        <span className={`text-[12px] font-black  tracking-tight ${isMultiSite ? 'text-red-500' : 'text-primary-text'}`}>
                          {item.site}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-3">
                          <input 
                            type="number"
                            value={item.transferQty}
                            onChange={(e) => handleQtyChange(item.productId, item.siteId, e.target.value)}
                            className="w-16 h-9 text-center bg-card border border-border-main rounded-xl text-[13px] font-black text-primary-text outline-none focus:border-secondary-text shadow-sm shrink-0"
                          />
                          <span className="text-[11px] text-muted-text font-bold  tracking-tight truncate">
                            / {item.quantity} {item.unit}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 pr-6 text-right">
                        <button 
                          onClick={() => removeItem(item.productId, item.siteId)}
                          className="p-2 text-muted-text/40 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
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
          </div>

          {/* Sidebar Area: Actions */}
          <div className="w-full lg:w-[360px] p-6 bg-card border-l-0 lg:border-l border-border-main flex flex-col gap-6 shadow-2xl">
            
            <div className="flex flex-col gap-5 p-5 bg-header/20 border border-border-main border-dashed rounded-2xl">
              {/* Destination Site */}
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-black text-muted-text  tracking-widest ml-1">Destination Site</label>
                <SiteFilterSingle 
                  value={destinationSite}
                  onChange={setDestinationSite}
                  placeholder="Select Site to Send Stock To"
                />
              </div>

              {/* Bill Date */}
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-black text-muted-text  tracking-widest ml-1">Bill Date</label>
                <div className="relative group/date">
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-text group-hover/date:text-primary-text transition-colors pointer-events-none">
                    <Calendar size={16} />
                  </div>
                  <input 
                    type="date"
                    value={billDate}
                    onChange={(e) => setBillDate(e.target.value)}
                    className="w-full h-12 pl-5 pr-12 bg-surface border border-border-main rounded-xl text-[14px] font-black text-primary-text outline-none focus:border-secondary-text shadow-sm cursor-pointer"
                  />
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none pr-12 bg-surface overflow-hidden mr-10 h-[calc(100%-4px)]">
                     <span className="text-[14px] font-black text-primary-text">{formatDate(billDate)}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 mt-2">
                <button 
                  disabled={isLoading || !destinationSite || isMultiSite || localItems.length === 0}
                  className="w-full h-12 rounded-xl text-[12px] font-black  tracking-widest bg-card border border-border-main text-secondary-text hover:bg-header hover:text-primary-text transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
                >
                  Preview Invoice
                </button>
                
                <button 
                  onClick={() => handleTransfer('accounting')}
                  disabled={isLoading || !destinationSite || isMultiSite || localItems.length === 0}
                  className="w-full h-14 rounded-xl text-[13px] font-black  tracking-widest bg-primary-text text-card hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-30 disabled:scale-100 flex items-center justify-center gap-2 shadow-lg"
                >
                  {isLoading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                  Generate Transfer Invoice
                </button>

                <button 
                  onClick={() => handleTransfer('correction')}
                  disabled={isLoading || !destinationSite || isMultiSite || localItems.length === 0}
                  className="w-full h-12 rounded-xl text-[11px] font-black  tracking-widest bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all disabled:opacity-30 shadow-sm"
                >
                  Quick Correction — No Accounting
                </button>
              </div>
            </div>

            {/* Bottom Utilities */}
            <div className="mt-auto flex flex-col gap-1 px-1">
              <button className="flex items-center justify-between group p-3 hover:bg-surface rounded-xl transition-all">
                <span className="text-[12px] font-black  tracking-wide text-primary-text">Add More Products</span>
                <ChevronRight size={16} className="text-muted-text group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="flex items-center justify-between group p-3 hover:bg-surface rounded-xl transition-all">
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
