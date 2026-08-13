import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { X, Search, AlertCircle, Trash2, Plus, Minus } from "lucide-react"
import Skeleton from "react-loading-skeleton"
import { InventoryService } from "../../services/inventoryService"
import { ConsumptionService } from "../../services/consumptionService"
import type { InventoryItem } from "../../types/inventory"
import { ProductImage } from "./ProductImage"
import { formatIndianCurrency } from "../../utils/numberFormat"
import { ENV } from "../../config/env"
import toast from "react-hot-toast"

interface ColdCoffeeOfferModalProps {
  onClose: () => void
  onSuccess: () => void
}

export function ColdCoffeeOfferModal({ onClose, onSuccess }: ColdCoffeeOfferModalProps) {
  const [search, setSearch] = useState("")
  const [products, setProducts] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [addedItems, setAddedItems] = useState<Map<number, { item: InventoryItem; qty: number }>>(new Map())
  const [paymentMode, setPaymentMode] = useState<"UPI" | "Cash">("UPI")
  const [isConfirming, setIsConfirming] = useState(false)

  // Search logic with debounce using the exact payload requested
  useEffect(() => {
    setLoading(true)
    const t = setTimeout(() => {
      InventoryService.fetchInventory(0, 100, {
        site: [],
        product: [],
        vendor: [168],
        showZeroStock: true,
        searchByProductName: search.trim() || null,
        searchByBillNo: null,
        searchBySupplierName: null,
        sortBy: null,
        sortDir: null,
        hsnSubHeading: null
      })
        .then(res => {
          setProducts(res.data.content ?? [])
        })
        .catch(console.error)
        .finally(() => setLoading(false))
    }, 300)

    return () => clearTimeout(t)
  }, [search])

  const handleAdd = (item: InventoryItem) => {
    setAddedItems(prev => {
      const next = new Map(prev)
      const existing = next.get(item.productId)
      if (existing) {
        next.set(item.productId, { item, qty: existing.qty + 1 })
      } else {
        next.set(item.productId, { item, qty: 1 })
      }
      return next
    })
  }

  const handleRemove = (productId: number) => {
    setAddedItems(prev => {
      const next = new Map(prev)
      const existing = next.get(productId)
      if (existing) {
        if (existing.qty > 1) {
          next.set(productId, { item: existing.item, qty: existing.qty - 1 })
        } else {
          next.delete(productId)
        }
      }
      return next
    })
  }

  const handleClear = (productId: number) => {
    setAddedItems(prev => {
      const next = new Map(prev)
      next.delete(productId)
      return next
    })
  }

  const addedList = Array.from(addedItems.values())
  const totalQty = addedList.reduce((acc, current) => acc + current.qty, 0)
  const totalAmount = totalQty * 25

  const handleConfirmConsume = async () => {
    if (isConfirming || totalQty === 0) return

    setIsConfirming(true)
    try {
      const now = new Date()
      const consumptionDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

      const records = addedList.map(({ item, qty }) => {
        const itemAmount = 25 * qty
        return {
          sourceSiteId: Number(ENV.DEFAULT_SITE_ID),
          productId: item.productId,
          productName: item.productName,
          quantity: qty,
          amountIncTax: itemAmount,
          upi: paymentMode === "UPI" ? itemAmount : 0,
          cash: paymentMode === "Cash" ? itemAmount : 0,
          loyaltyAmt: 11 * qty,
          noBill: false,
          loyalty: false,
        }
      })

      await ConsumptionService.consumeStock({
        consumptionUnitId: Number(ENV.DEFAULT_CONSUMPTION_UNIT_ID),
        consumptionDate,
        saveDetails: true,
        records
      })

      toast.success("Offer items consumed successfully!")
      onSuccess()
    } catch (e) {
      console.error(e)
      toast.error("Failed to consume offer items. Please try again.")
    } finally {
      setIsConfirming(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[130] flex items-end sm:items-center justify-center p-4 sm:p-0 bg-black/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 100 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 100 }}
        transition={{ type: "spring", stiffness: 350, damping: 30 }}
        className="bg-card w-full max-w-[580px] rounded-xl shadow-[0_20px_50px_rgb(0,0,0,0.3)] flex flex-col max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
          <div>
            <h2 className="text-[20px] font-black text-primary-text">
              Cold Coffee @25 Offer
            </h2>
            <p className="text-[12px] text-muted-text mt-0.5 font-medium">
              Select products from the vendor list and specify quantities. All items will be priced at ₹25.
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-surface text-muted-text hover:text-primary-text transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Search Input */}
        <div className="px-6 pb-3 shrink-0">
          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-text" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-[40px] pl-10 pr-4 bg-surface border border-border-main rounded-xl text-[13px] font-medium text-primary-text outline-none focus:border-secondary-text transition-all"
            />
          </div>
        </div>

        {/* Outer Split-Scroll Layout */}
        <div className="flex-1 overflow-y-auto px-6 pb-4 flex flex-col gap-4">
          
          {/* Section: Available Products */}
          <div className="flex flex-col gap-2">
            <p className="text-[11px] text-muted-text font-black uppercase tracking-wider">Available Products</p>
            <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-16 rounded-xl overflow-hidden shrink-0">
                    <Skeleton height="100%" borderRadius={12} />
                  </div>
                ))
              ) : products.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center border border-dashed border-border-main rounded-xl">
                  <AlertCircle size={20} className="text-muted-text/30 mb-1" />
                  <p className="text-[12px] font-bold text-muted-text">No products found</p>
                </div>
              ) : (
                products.map(product => {
                  const qty = addedItems.get(product.productId)?.qty ?? 0
                  return (
                    <div
                      key={product.productId}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all select-none ${
                        qty > 0
                          ? "bg-[#f0b44c]/5 border-[#f0b44c]/60 shadow-sm"
                          : "bg-surface border-border-main/50 hover:bg-card-light"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-card border border-border-main/40 flex items-center justify-center shrink-0">
                          <ProductImage src={product.imageUrl} name={product.productName} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-bold text-primary-text truncate">
                            {product.productName}
                          </p>
                          <p className="text-[11px] text-muted-text font-medium mt-0.5">
                            Original: {formatIndianCurrency(product.price)} | {product.unit}
                          </p>
                        </div>
                      </div>

                      {/* Quantity Modifier */}
                      <div className="flex items-center gap-2 shrink-0">
                        {qty === 0 ? (
                          <button
                            onClick={() => handleAdd(product)}
                            className="px-3 py-1.5 rounded-lg bg-primary-text text-card hover:opacity-90 text-[11px] font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap"
                          >
                            + Add
                          </button>
                        ) : (
                          <div className="flex items-center bg-card border border-border-main rounded-lg p-0.5 shrink-0">
                            <button
                              onClick={() => handleRemove(product.productId)}
                              className="p-1 text-muted-text hover:text-primary-text hover:bg-surface rounded transition-colors cursor-pointer"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="px-2 text-[12px] font-black text-primary-text min-w-[20px] text-center">
                              {qty}
                            </span>
                            <button
                              onClick={() => handleAdd(product)}
                              className="p-1 text-muted-text hover:text-primary-text hover:bg-surface rounded transition-colors cursor-pointer"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Section: Added Items (Below) */}
          {addedList.length > 0 && (
            <div className="flex flex-col gap-2 border-t border-border-main/50 pt-3">
              <p className="text-[11px] text-muted-text font-black uppercase tracking-wider">Added Items (₹25 each)</p>
              <div className="flex flex-col gap-2 max-h-[180px] overflow-y-auto pr-1">
                {addedList.map(({ item, qty }) => (
                  <div
                    key={item.productId}
                    className="flex items-center justify-between p-2.5 bg-surface border border-border-main/60 rounded-xl"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg overflow-hidden bg-card border border-border-main/40 flex items-center justify-center shrink-0">
                        <ProductImage src={item.imageUrl} name={item.productName} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[12px] font-bold text-primary-text truncate leading-tight">
                          {item.productName}
                        </p>
                        <p className="text-[10px] text-muted-text font-semibold mt-0.5">
                          {qty} × ₹25 = {formatIndianCurrency(qty * 25)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center bg-card border border-border-main rounded-lg p-0.5 scale-90 shrink-0">
                        <button
                          onClick={() => handleRemove(item.productId)}
                          className="p-1 text-muted-text hover:text-primary-text hover:bg-surface rounded transition-colors cursor-pointer"
                        >
                          <Minus size={11} />
                        </button>
                        <span className="px-1.5 text-[11px] font-black text-primary-text min-w-[16px] text-center">
                          {qty}
                        </span>
                        <button
                          onClick={() => handleAdd(item)}
                          className="p-1 text-muted-text hover:text-primary-text hover:bg-surface rounded transition-colors cursor-pointer"
                        >
                          <Plus size={11} />
                        </button>
                      </div>
                      <button
                        onClick={() => handleClear(item.productId)}
                        className="p-1.5 text-muted-text hover:text-red-500 hover:bg-red-500/10 rounded transition-colors cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payment Breakup Mode Selection */}
          <div className="bg-surface rounded-2xl p-4 flex flex-col gap-3.5 border border-border-main/60 shrink-0 mt-1">
            <div className="flex flex-col gap-3">
              <p className="text-[10px] text-muted-text font-black uppercase tracking-wider leading-none">Billing details (Payment mode)</p>
              
              <div className="flex items-center gap-2">
                {(['UPI', 'Cash'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setPaymentMode(mode)}
                    className={`flex-1 h-10 rounded-xl text-[13px] font-black transition-all cursor-pointer ${
                      paymentMode === mode
                        ? 'bg-primary-text text-card'
                        : 'bg-card border border-border-main text-primary-text hover:bg-surface'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Totals Summary Footer */}
        <div className="px-6 py-3 border-t border-border-main/60 flex items-center justify-between shrink-0 bg-tab-light">
          <span className="text-[13px] font-medium text-secondary-text">
            Total Qty: <span className="font-black text-primary-text">{totalQty}</span>
          </span>
          <div className="text-right">
            <span className="text-[13px] font-medium text-secondary-text">
              Overall Total: <span className="font-black text-primary-text">{formatIndianCurrency(totalAmount)}</span>
            </span>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 pb-6 pt-3 border-t border-border-main/60 grid grid-cols-2 gap-3 shrink-0">
          <button
            onClick={onClose}
            className="py-3 rounded-xl border border-border-main text-[13px] font-black text-primary-text hover:bg-surface transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmConsume}
            disabled={isConfirming || totalQty === 0}
            className="py-3 rounded-xl bg-primary-text text-card text-[13px] font-black hover:opacity-90 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isConfirming && (
              <span className="w-4 h-4 border-2 border-card/40 border-t-card rounded-full animate-spin shrink-0" />
            )}
            {isConfirming ? "Confirming..." : "Confirm & Consume"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
