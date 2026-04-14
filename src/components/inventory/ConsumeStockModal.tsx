import { useState, useEffect } from 'react'
import { X, Package, Loader2, AlertCircle, ShoppingBag, Send, Trash2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { InventoryService } from '../../services/inventoryService'
import { ConsumptionUnitSelect } from '../common/ConsumptionUnitSelect'
import { FriendlyDateTimePicker } from '../common/FriendlyDateTimePicker'
import { CustomCheckbox } from '../common/CustomCheckbox'
import { type ConsumptionUnit } from '../common/ConsumptionUnitSelect'
import type { InventoryItem } from '../../types/inventory'

interface ConsumeStockModalProps {
  isOpen: boolean
  onClose: () => void
  items: InventoryItem[]
  onSuccess: () => void
}

export function ConsumeStockModal({ isOpen, onClose, items, onSuccess }: ConsumeStockModalProps) {
  const [currentItems, setCurrentItems] = useState<InventoryItem[]>(items)
  const [records, setRecords] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {}
    items.forEach(item => {
      initial[`${item.productId}-${item.siteId}`] = Math.min(1, item.quantity)
    })
    return initial
  })
  const [consumptionUnit, setConsumptionUnit] = useState<ConsumptionUnit | null>(null)
  const [consumptionDate, setConsumptionDate] = useState(() => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const datePart = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const timePart = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    return `${datePart}T${timePart}`;
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAllConsumed, setIsAllConsumed] = useState(false)


  // Validation: Multi-site check
  const fromSites = Array.from(new Set(currentItems.map(item => item.siteId)))
  const isMultiSite = fromSites.length > 1

  const removeProduct = (productId: number, siteId: number) => {
    setCurrentItems(prev => prev.filter(i => !(i.productId === productId && i.siteId === siteId)))
  }
  
  const handleQtyChange = (productId: number, siteId: number, value: string, max: number) => {
    const key = `${productId}-${siteId}`
    const num = parseFloat(value) || 0
    
    // Clamp between 0 and available stock
    const clamped = Math.min(Math.max(0, num), max)
    
    setRecords(prev => ({ ...prev, [key]: clamped }))
  }

  const handleConsume = () => {
    if (isMultiSite) return
    if (!consumptionUnit) {
      setError('Please select a consumption unit')
      return
    }

    const consumeRecords = currentItems.map(item => ({
      sourceSiteId: item.siteId,
      sourceSiteName: item.site,
      productId: item.productId,
      productName: item.productName,
      quantity: records[`${item.productId}-${item.siteId}`] || 0
    })).filter(r => r.quantity > 0)

    if (consumeRecords.length === 0) {
      setError('Please enter quantity for at least one product')
      return
    }

    setIsLoading(true)
    setError(null)

    const payload = {
      siteId: currentItems[0].siteId,
      consumptionUnitId: consumptionUnit.id,
      consumptionDate: consumptionDate,
      records: consumeRecords
    }

    InventoryService.consumeStock(payload)
      .then(res => {
        if (res.success) {
          toast.success('Consumption Successful')
          onSuccess()
          
          const consumedMap = new Map(consumeRecords.map(r => [`${r.productId}-${r.sourceSiteId}`, r.quantity]))
          
          const nextItems = currentItems.map(item => {
            const key = `${item.productId}-${item.siteId}`
            const consumedQty = consumedMap.get(key) || 0
            return {
              ...item,
              quantity: Math.max(0, item.quantity - consumedQty)
            }
          }).filter(item => item.quantity > 0)

          if (nextItems.length === 0) {
            setIsAllConsumed(true)
          } else {
            setCurrentItems(nextItems)
            const nextRecords: Record<string, number> = {}
            nextItems.forEach(item => {
              nextRecords[`${item.productId}-${item.siteId}`] = Math.min(1, item.quantity)
            })
            setRecords(nextRecords)
          }
        } else {
          const msg = res.message || 'Consumption failed'
          setError(msg)
          toast.error(msg)
        }
      })
      .catch((err: Error) => {
        toast.error(err.message)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-0 sm:p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]" 
        onClick={onClose}
      />
      
      <div className="relative bg-card border border-border-main shadow-2xl rounded-none sm:rounded-2xl w-full max-w-[1000px] overflow-hidden flex flex-col animate-[fadeInUp_0.3s_ease-out] min-h-screen sm:min-h-[600px] max-h-screen sm:max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 bg-header border-b border-border-main flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black text-secondary-text  tracking-[0.2em]">Consume Stock</span>
            <h2 className="text-[18px] sm:text-[24px] font-black text-primary-text flex items-center gap-3">
              <ShoppingBag size={24} className="text-primary-text" />
              Products
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-surface border border-transparent hover:border-border-main rounded-xl text-muted-text transition-all"
          >
            <X size={24} />
          </button>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-auto bg-surface/30 custom-scrollbar relative">
          {isAllConsumed ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-surface animate-[fadeIn_0.3s_ease-out]">
              <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <Check size={40} strokeWidth={3} />
              </div>
              <div className="flex flex-col items-center gap-1 text-center">
                <h3 className="text-[20px] font-black text-primary-text">All products Consumed</h3>
                <p className="text-[14px] text-secondary-text">Inventory levels updated successfully.</p>
              </div>
              <button 
                onClick={onClose}
                className="mt-4 px-8 py-3 bg-primary-text text-card text-[13px] font-black rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all  tracking-widest cursor-pointer shadow-lg"
              >
                Done
              </button>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="sticky top-0 bg-card z-10 border-b border-border-main/50">
                <tr className="bg-table-head">
                  <th className="px-5 py-3 w-[5%] text-center">
                    <div className="flex items-center justify-center">
                      <CustomCheckbox checked={true} readOnly />
                    </div>
                  </th>
                  <th className="px-5 py-3 w-[45%] text-[13px] font-bold text-primary-text tracking-tight">Product</th>
                  <th className="px-5 py-3 w-[20%] text-[13px] font-bold text-primary-text tracking-tight">From</th>
                  <th className="px-5 py-3 w-[20%] text-center text-[13px] font-bold text-primary-text tracking-tight">Qty</th>
                  <th className="px-5 py-3 w-[10%] text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-main/30">
                {currentItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-3 opacity-30">
                        <Package size={48} />
                        <span className="text-[14px] font-black uppercase tracking-widest">No Items Selected</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentItems.map((item) => {
                    const key = `${item.productId}-${item.siteId}`
                    const currentQty = records[key] || 0
                    
                    return (
                      <tr key={key} className="group hover:bg-surface/50 transition-colors relative">
                        <td className="px-5 py-4 text-center align-middle">
                          <CustomCheckbox checked={true} readOnly className="mx-auto" />
                        </td>
                        <td className="px-5 py-4 align-top">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-10 h-10 rounded-lg border border-border-main bg-white p-1 flex items-center justify-center shrink-0 shadow-sm">
                              {item.imageUrl ? (
                                <img src={item.imageUrl} alt="" className="w-full h-full object-contain rounded-md" />
                              ) : (
                                <Package className="text-muted-text/30" size={16} />
                              )}
                            </div>
                            <div className="flex flex-col min-w-0 pr-2">
                              <span className="text-[13px] font-bold text-primary-text tracking-tight truncate leading-tight">{item.productName}</span>
                              <span className="text-[11px] text-muted-text font-medium truncate mt-0.5">{item.vendorNames || 'Generic'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 align-middle truncate">
                          <span className={`text-[13px] font-bold tracking-tight ${isMultiSite ? 'text-rose-500' : 'text-primary-text'}`}>
                            {item.site}
                          </span>
                        </td>
                        <td className="px-5 py-4 align-middle">
                          <div className="flex items-center justify-center gap-2">
                            <input
                              type="number"
                              step="0.01"
                              value={currentQty === 0 ? '' : currentQty}
                              onChange={(e) => handleQtyChange(item.productId, item.siteId, e.target.value, item.quantity)}
                              className="w-16 h-8 text-center bg-card border border-border-main rounded-md text-[13px] font-bold text-primary-text outline-none focus:border-secondary-text shadow-sm shrink-0"
                              placeholder="0"
                            />
                            <span className="text-[12px] text-muted-text font-medium tracking-tight whitespace-nowrap">
                              / {item.quantity.toFixed(2)} {item.unit}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4 pr-6 text-right align-middle">
                          {/* Hidden Trash icon that appears on row hover */}
                          <div className="flex items-center justify-end">
                            <button 
                              onClick={() => removeProduct(item.productId, item.siteId)}
                              className="absolute right-4 p-1.5 text-muted-text/40 hover:text-red-500 hover:bg-red-50 rounded-md transition-all opacity-0 group-hover:opacity-100 bg-surface shadow-sm translate-x-2 group-hover:translate-x-0"
                              title="Remove item"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Condensed Footer */}
        {!isAllConsumed && (
          <div className="p-4 bg-header border-t border-border-main">
            {isMultiSite ? (
              <div className="flex items-center gap-4 text-rose-500 bg-rose-500/5 p-4 rounded-xl border border-rose-500/20 animate-[fadeInUp_0.3s_ease-out]">
                <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center shrink-0">
                  <AlertCircle size={20} />
                </div>
                <div className="flex flex-col gap-1">
                  <h4 className="text-[14px] font-black uppercase tracking-widest leading-none">Multiple Sites Detected</h4>
                  <p className="text-[12px] opacity-80 font-medium">Consumption is only possible within a single site. Please ensure all selected items are from the same location before proceeding.</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4 sm:gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Left: Consumption Logic */}
                  <div className="w-full sm:flex-1 min-w-0">
                    <ConsumptionUnitSelect
                      siteId={currentItems[0]?.siteId}
                      value={consumptionUnit}
                      onChange={setConsumptionUnit}
                      error={error?.includes('consumption unit')}
                      openUpwards={true}
                    />
                  </div>
                  
                  {/* Center: Date Picker */}
                  <div className="w-full sm:w-[300px]">
                    <FriendlyDateTimePicker
                      value={consumptionDate}
                      onChange={setConsumptionDate}
                    />
                  </div>

                  {/* Right: Submit Button */}
                  <button
                    onClick={handleConsume}
                    disabled={isLoading || currentItems.length === 0}
                    className="w-full sm:w-auto min-w-[210px] px-8 h-[48px] bg-primary-text text-card text-[10px] font-black rounded-xl hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2.5 shadow-md disabled:opacity-50 disabled:scale-100  tracking-widest shrink-0 cursor-pointer"
                  >
                    {isLoading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <>
                        <Send size={14} />
                        Consume Stock
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function Check({ size, className, strokeWidth }: { size: number, className?: string, strokeWidth?: number }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth={strokeWidth || 2} 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}
