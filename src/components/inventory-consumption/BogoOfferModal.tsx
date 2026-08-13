import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { X, Search, Check, AlertCircle } from "lucide-react"
import Skeleton from "react-loading-skeleton"
import { InventoryService, type PreparationProduct } from "../../services/inventoryService"
import { ConsumptionService } from "../../services/consumptionService"
import { ProductImage } from "./ProductImage"
import { formatIndianCurrency } from "../../utils/numberFormat"
import { ENV } from "../../config/env"
import toast from "react-hot-toast"

interface BogoOfferModalProps {
  onClose: () => void
  onSuccess: () => void
}

export function BogoOfferModal({ onClose, onSuccess }: BogoOfferModalProps) {
  const [search, setSearch] = useState("")
  const [products, setProducts] = useState<PreparationProduct[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<PreparationProduct[]>([])

  // Billing states
  const [amount, setAmount] = useState("")
  const [paymentMode, setPaymentMode] = useState<"UPI" | "Cash" | "Loyalty">("UPI")
  const [noBill, setNoBill] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)

  // Search logic with debounce
  useEffect(() => {
    setLoading(true)
    const t = setTimeout(() => {
      InventoryService.searchPreparationProducts(search.trim())
        .then(res => {
          setProducts(res.data.content ?? [])
        })
        .catch(console.error)
        .finally(() => setLoading(false))
    }, 300)

    return () => clearTimeout(t)
  }, [search])

  // Populate default price once 2 items are selected
  useEffect(() => {
    if (selected.length === 2) {
      setAmount(String(selected[0].price || 0))
    }
  }, [selected])

  const handleSelect = (product: PreparationProduct) => {
    setSelected(prev => {
      const exists = prev.find(p => p.productId === product.productId)
      if (exists) {
        // Deselect
        return prev.filter(p => p.productId !== product.productId)
      } else {
        // Add only if selected count is < 2
        if (prev.length < 2) {
          return [...prev, product]
        }
        return [prev[0], product]
      }
    })
  }

  const handleConfirmConsume = async () => {
    if (isConfirming || selected.length !== 2) return
    
    const amt = parseFloat(amount)
    if (amount.trim() === "" || isNaN(amt) || amt < 0) {
      toast.error("Please enter a valid price")
      return
    }

    setIsConfirming(true)
    try {
      const now = new Date()
      const consumptionDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

      const [p1, p2] = selected
      const cash = paymentMode === 'Cash' ? amt : 0
      const upi = (paymentMode === 'UPI' || paymentMode === 'Loyalty') ? amt : 0
      const loyalty = paymentMode === 'Loyalty'

      // Product 1 (paid)
      await ConsumptionService.prepareAndConsume({
        compositeProductId: p1.productId,
        siteId: Number(ENV.DEFAULT_SITE_ID),
        quantityToPrepare: 1,
        consumptionUnitId: Number(ENV.DEFAULT_CONSUMPTION_UNIT_ID),
        rawMaterials: [],
        extraCharges: {},
        consumptionDate,
        saveDetails: true,
        amountIncTax: amt,
        cash,
        upi,
        loyalty,
        noBill,
        isWbc: false,
      })

      // Product 2 (free)
      await ConsumptionService.prepareAndConsume({
        compositeProductId: p2.productId,
        siteId: Number(ENV.DEFAULT_SITE_ID),
        quantityToPrepare: 1,
        consumptionUnitId: Number(ENV.DEFAULT_CONSUMPTION_UNIT_ID),
        rawMaterials: [],
        extraCharges: {},
        consumptionDate,
        saveDetails: true,
        amountIncTax: 0,
        cash: 0,
        upi: 0,
        loyalty: false,
        noBill,
        isWbc: false,
      })

      toast.success("BOGO stock consumed successfully!")
      onSuccess()
    } catch (e) {
      console.error(e)
      toast.error("Failed to consume BOGO stock. Please try again.")
    } finally {
      setIsConfirming(false)
    }
  }

  const isBillingMode = selected.length === 2

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
        className="bg-card w-full max-w-[560px] rounded-xl shadow-[0_20px_50px_rgb(0,0,0,0.3)] flex flex-col max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
          <div>
            <h2 className="text-[20px] font-black text-primary-text">
              {isBillingMode ? "BOGO Billing Info" : "Select BOGO Products"}
            </h2>
            <p className="text-[12px] text-muted-text mt-0.5 font-medium">
              {isBillingMode 
                ? "Verify pricing and payment mode for the selected BOGO offer" 
                : "Select exactly 2 products to apply the Buy 1 Get 1 Free offer"}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-surface text-muted-text hover:text-primary-text transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Conditionally render content */}
        {!isBillingMode ? (
          <>
            {/* Selected indicator */}
            <div className="px-6 pb-3 shrink-0">
              <div className="flex items-center justify-between p-3.5 bg-tab-light border border-border-main rounded-xl">
                <span className="text-[13px] font-black text-primary-text flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full transition-colors bg-amber-500" />
                  Selected ({selected.length}/2)
                </span>
                <div className="flex gap-2">
                  {selected.length === 0 && (
                    <span className="text-[12px] font-medium text-muted-text italic">No products selected yet</span>
                  )}
                  {selected.map(p => (
                    <div
                      key={p.productId}
                      className="flex items-center gap-1 bg-[#f0b44c]/10 border border-[#f0b44c]/20 text-[#d99805] px-2.5 py-1 rounded-lg text-[11px] font-bold"
                    >
                      <span className="max-w-[80px] truncate">{p.productName}</span>
                      <button
                        onClick={() => handleSelect(p)}
                        className="hover:text-red-500 cursor-pointer ml-0.5"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
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

            {/* Product List */}
            <div className="flex-1 overflow-y-auto px-6 pb-4 flex flex-col gap-2">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-16 rounded-xl overflow-hidden">
                    <Skeleton height="100%" borderRadius={12} />
                  </div>
                ))
              ) : products.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertCircle size={24} className="text-muted-text/30 mb-2" />
                  <p className="text-[13px] font-bold text-muted-text">No products found</p>
                </div>
              ) : (
                products.map(product => {
                  const isSelected = !!selected.find(p => p.productId === product.productId)
                  return (
                    <div
                      key={product.productId}
                      onClick={() => handleSelect(product)}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none ${
                        isSelected
                          ? "bg-[#f0b44c]/5 border-[#f0b44c]/60 shadow-sm"
                          : "bg-surface border-border-main/50 hover:bg-card-light"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-card border border-border-main/40 flex items-center justify-center shrink-0">
                          <ProductImage src={product.productImage} name={product.productName} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-bold text-primary-text truncate">
                            {product.productName}
                          </p>
                          <p className="text-[11px] text-muted-text font-medium mt-0.5">
                            {formatIndianCurrency(product.price)} | {product.unit}
                          </p>
                        </div>
                      </div>

                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                        isSelected
                          ? "bg-[#f0b44c] border-[#f0b44c] text-white"
                          : "border-border-main"
                      }`}>
                        {isSelected && <Check size={12} strokeWidth={3} />}
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Footer selection actions */}
            <div className="px-6 pb-6 pt-3 border-t border-border-main/60 grid grid-cols-2 gap-3 shrink-0">
              <button
                onClick={onClose}
                className="py-3 rounded-xl border border-border-main text-[13px] font-black text-primary-text hover:bg-surface transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={true}
                className="py-3 rounded-xl bg-primary-text text-card text-[13px] font-black opacity-50 cursor-not-allowed flex items-center justify-center gap-2"
              >
                Select 2 Products
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Billing Screen */}
            <div className="flex-1 overflow-y-auto px-6 flex flex-col gap-4 pb-4">
              
              {/* Selected Products Grid */}
              <div className="grid grid-cols-2 gap-3 shrink-0">
                <div className="bg-surface border border-border-main/60 rounded-xl p-3.5 flex flex-col gap-2 relative">
                  <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[9px] font-black tracking-wider uppercase">
                    Paid
                  </span>
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-card border border-border-main/40 flex items-center justify-center shrink-0">
                    <ProductImage src={selected[0].productImage} name={selected[0].productName} />
                  </div>
                  <div className="min-w-0 mt-1">
                    <p className="text-[12px] font-black text-primary-text truncate leading-snug">
                      {selected[0].productName}
                    </p>
                    <p className="text-[10px] text-muted-text font-medium mt-0.5">
                      Original: {formatIndianCurrency(selected[0].price)}
                    </p>
                  </div>
                </div>

                <div className="bg-surface border border-border-main/60 rounded-xl p-3.5 flex flex-col gap-2 relative">
                  <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 text-[9px] font-black tracking-wider uppercase">
                    Free
                  </span>
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-card border border-border-main/40 flex items-center justify-center shrink-0">
                    <ProductImage src={selected[1].productImage} name={selected[1].productName} />
                  </div>
                  <div className="min-w-0 mt-1">
                    <p className="text-[12px] font-black text-primary-text truncate leading-snug">
                      {selected[1].productName}
                    </p>
                    <p className="text-[10px] text-muted-text font-medium mt-0.5">
                      Original: {formatIndianCurrency(selected[1].price)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Billing Form Container */}
              <div className="bg-surface rounded-2xl p-4 flex flex-col gap-3.5 border border-border-main/60 shrink-0">
                <div>
                  <p className="text-[10px] text-muted-text font-black uppercase tracking-wider">Item Name</p>
                  <p className="text-[14px] font-black text-[#d99805] uppercase tracking-tight leading-snug mt-1">
                    BOGO ({selected[0].productName} and {selected[1].productName})
                  </p>
                </div>

                {/* Inputs & Toggles */}
                <div className="flex flex-col gap-3">
                  <p className="text-[10px] text-muted-text font-black uppercase tracking-wider leading-none">Billing details</p>
                  
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    {/* Price input */}
                    <input
                      type="number"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      className={`w-full sm:w-24 h-10 px-3 bg-card rounded-xl text-[14px] font-bold text-primary-text outline-none focus:ring-2 border border-border-main focus:border-secondary-text focus:ring-accent/5 transition-all text-center sm:text-left`}
                      placeholder="Amount"
                    />

                    {/* Payment mode select */}
                    <div className="flex items-center gap-2 flex-1">
                      {(['UPI', 'Cash', 'Loyalty'] as const).map(mode => (
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

                    {/* No bill check */}
                    <label className="flex items-center justify-start sm:justify-center gap-2 pt-1 sm:pt-0 pb-1 sm:pb-0 shrink-0 cursor-pointer select-none pl-1 sm:pl-0">
                      <input
                        type="checkbox"
                        checked={noBill}
                        onChange={e => setNoBill(e.target.checked)}
                        className="w-4 h-4 rounded border-border-main cursor-pointer accent-primary-text"
                      />
                      <span className="text-[13px] font-medium text-primary-text">No Bill</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Change Selection Link */}
              <button
                onClick={() => setSelected([])}
                className="text-[12px] text-[#d99805] hover:underline font-bold self-start mt-1 cursor-pointer"
              >
                ← Change selected products
              </button>
            </div>

            {/* Totals Section */}
            <div className="px-6 py-3 border-t border-border-main/60 flex items-center justify-between shrink-0 bg-tab-light">
              <span className="text-[13px] font-medium text-secondary-text">
                Total Items: <span className="font-black text-primary-text">2</span>
              </span>
              <div className="text-right flex flex-col gap-0.5">
                <span className="text-[12px] font-medium text-secondary-text">
                  No Bill Total: <span className="font-black text-rose-500">{formatIndianCurrency(noBill ? (parseFloat(amount) || 0) : 0)}</span>
                </span>
                <span className="text-[13px] font-medium text-secondary-text">
                  Overall Total: <span className="font-black text-primary-text">{formatIndianCurrency(parseFloat(amount) || 0)}</span>
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
                disabled={isConfirming || amount.trim() === "" || isNaN(parseFloat(amount)) || parseFloat(amount) < 0}
                className="py-3 rounded-xl bg-primary-text text-card text-[13px] font-black hover:opacity-90 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isConfirming && (
                  <span className="w-4 h-4 border-2 border-card/40 border-t-card rounded-full animate-spin shrink-0" />
                )}
                {isConfirming ? "Confirming..." : "Confirm & Consume"}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  )
}
