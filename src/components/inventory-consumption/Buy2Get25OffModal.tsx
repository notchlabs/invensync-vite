import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { X, Search, AlertCircle, Percent, CreditCard, Plus, Minus } from "lucide-react"
import Skeleton from "react-loading-skeleton"
import { InventoryService, type PreparationProduct } from "../../services/inventoryService"
import { ConsumptionService } from "../../services/consumptionService"
import { ProductImage } from "./ProductImage"
import { CompactCustomSelect } from "./CompactCustomSelect"
import { formatIndianCurrency } from "../../utils/numberFormat"
import { ENV } from "../../config/env"
import toast from "react-hot-toast"

interface Buy2Get25OffModalProps {
  onClose: () => void
  onSuccess: () => void
}

export function Buy2Get25OffModal({ onClose, onSuccess }: Buy2Get25OffModalProps) {
  const [search, setSearch] = useState("")
  const [products, setProducts] = useState<PreparationProduct[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<PreparationProduct[]>([])

  // Discount selection: 0 = 25% off on item 1, 1 = 25% off on item 2
  const [discountTarget, setDiscountTarget] = useState<0 | 1>(0)

  // Billing states
  const [paymentMode, setPaymentMode] = useState<"UPI" | "Cash" | "Loyalty">("UPI")
  const [noBill, setNoBill] = useState(false)
  const [driverOfferSale, setDriverOfferSale] = useState(false)
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

  // Compute calculated total based on discountTarget
  const computeDiscountedTotal = (
    items: PreparationProduct[],
    target: 0 | 1
  ): { item1Amt: number; item2Amt: number; totalAmt: number; savings: number } => {
    if (items.length < 2) {
      return { item1Amt: 0, item2Amt: 0, totalAmt: 0, savings: 0 }
    }
    const p1 = items[0].price || 0
    const p2 = items[1].price || 0
    const isSame = items[0].productId === items[1].productId

    let item1Amt = p1
    let item2Amt = p2

    if (isSame || target === 0) {
      // Exactly 1 item out of 2 gets 25% off, other is full price
      item1Amt = Math.round(p1 * 0.75 * 100) / 100
      item2Amt = p2
    } else {
      item1Amt = p1
      item2Amt = Math.round(p2 * 0.75 * 100) / 100
    }

    const totalAmt = Math.round((item1Amt + item2Amt) * 100) / 100
    const originalTotal = Math.round((p1 + p2) * 100) / 100
    const savings = Math.round((originalTotal - totalAmt) * 100) / 100

    return { item1Amt, item2Amt, totalAmt, savings }
  }

  // Auto-reset discountTarget when same product selected
  useEffect(() => {
    if (selected.length === 2) {
      const isSame = selected[0].productId === selected[1].productId
      if (isSame && discountTarget !== 0) {
        setDiscountTarget(0)
      }
    }
  }, [selected, discountTarget])

  const handleSelect = (product: PreparationProduct) => {
    setSelected(prev => {
      if (prev.length < 2) {
        return [...prev, product]
      }
      return prev
    })
  }

  const handleRowClick = (product: PreparationProduct) => {
    const count = selected.filter(p => p.productId === product.productId).length
    if (count >= 2) {
      handleRemoveProduct(product.productId)
    } else if (selected.length < 2) {
      handleSelect(product)
    }
  }

  const handleRemoveProduct = (productId: number) => {
    setSelected(prev => {
      const idx = prev.findIndex(p => p.productId === productId)
      if (idx >= 0) {
        return prev.filter((_, i) => i !== idx)
      }
      return prev
    })
  }

  const handleRemoveByIndex = (index: number) => {
    setSelected(prev => prev.filter((_, i) => i !== index))
  }

  const handleConfirmConsume = async () => {
    if (isConfirming || selected.length !== 2) return

    setIsConfirming(true)
    try {
      const now = new Date()
      const consumptionDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

      const [p1, p2] = selected
      const isSame = p1.productId === p2.productId
      const effectiveTarget = isSame ? 0 : discountTarget
      const computed = computeDiscountedTotal(selected, effectiveTarget)
      
      const amt1 = computed.item1Amt
      const amt2 = computed.item2Amt

      // Item 1
      const cash1 = paymentMode === 'Cash' ? amt1 : 0
      const upi1 = (paymentMode === 'UPI' || paymentMode === 'Loyalty') ? amt1 : 0
      const loyalty1 = paymentMode === 'Loyalty'

      await ConsumptionService.prepareAndConsume({
        compositeProductId: p1.productId,
        siteId: Number(ENV.DEFAULT_SITE_ID),
        quantityToPrepare: 1,
        consumptionUnitId: Number(ENV.DEFAULT_CONSUMPTION_UNIT_ID),
        rawMaterials: [],
        extraCharges: {},
        consumptionDate,
        saveDetails: true,
        amountIncTax: amt1,
        cash: cash1,
        upi: upi1,
        loyalty: loyalty1,
        noBill,
        isWbc: false,
        driverOfferSale,
      })

      // Item 2
      const cash2 = paymentMode === 'Cash' ? amt2 : 0
      const upi2 = (paymentMode === 'UPI' || paymentMode === 'Loyalty') ? amt2 : 0
      const loyalty2 = paymentMode === 'Loyalty'

      await ConsumptionService.prepareAndConsume({
        compositeProductId: p2.productId,
        siteId: Number(ENV.DEFAULT_SITE_ID),
        quantityToPrepare: 1,
        consumptionUnitId: Number(ENV.DEFAULT_CONSUMPTION_UNIT_ID),
        rawMaterials: [],
        extraCharges: {},
        consumptionDate,
        saveDetails: true,
        amountIncTax: amt2,
        cash: cash2,
        upi: upi2,
        loyalty: loyalty2,
        noBill,
        isWbc: false,
        driverOfferSale,
      })

      toast.success("Buy 2 & Get 25% Off stock consumed successfully!")
      onSuccess()
    } catch (e) {
      console.error(e)
      toast.error("Failed to consume offer stock. Please try again.")
    } finally {
      setIsConfirming(false)
    }
  }

  const isBillingMode = selected.length === 2
  const isSameProduct = selected.length === 2 && selected[0].productId === selected[1].productId
  const computedStats = selected.length === 2 ? computeDiscountedTotal(selected, isSameProduct ? 0 : discountTarget) : null

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
        <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0 border-b border-border-main/50">
          <div>
            <h2 className="text-[19px] font-black text-primary-text flex items-center gap-2">
              <Percent size={18} className="text-[#d99805]" />
              {isBillingMode ? "Buy 2 & Get 25% Off Billing" : "Select 2 Products for 25% Off"}
            </h2>
            <p className="text-[12px] text-muted-text mt-0.5 font-medium">
              {isBillingMode 
                ? "Choose which item gets 25% off and select payment details" 
                : "Select any 2 products to apply the 25% discount offer"}
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
            <div className="px-6 pt-4 pb-3 shrink-0">
              <div className="flex items-center justify-between p-3.5 bg-tab-light border border-border-main rounded-xl">
                <span className="text-[13px] font-black text-primary-text flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full transition-colors bg-amber-500" />
                  Selected ({selected.length}/2)
                </span>
                <div className="flex gap-2">
                  {selected.length === 0 && (
                    <span className="text-[12px] font-medium text-muted-text italic">No products selected yet</span>
                  )}
                  {selected.map((p, idx) => (
                    <div
                      key={`${p.productId}-${idx}`}
                      className="flex items-center gap-1 bg-[#f0b44c]/10 border border-[#f0b44c]/20 text-[#d99805] px-2.5 py-1 rounded-lg text-[11px] font-bold"
                    >
                      <span className="max-w-[80px] truncate">{p.productName}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveByIndex(idx)}
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
                  const selectedCount = selected.filter(p => p.productId === product.productId).length
                  const isSelected = selectedCount > 0
                  return (
                    <div
                      key={product.productId}
                      onClick={() => handleRowClick(product)}
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

                      <div className="flex items-center shrink-0">
                        {selectedCount > 0 ? (
                          <div 
                            className="flex items-center gap-1.5 bg-card border border-border-main rounded-xl p-1 shadow-sm"
                            onClick={e => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => handleRemoveProduct(product.productId)}
                              className="w-7 h-7 rounded-lg bg-surface hover:bg-red-500/15 hover:border-red-500/30 hover:text-red-500 text-muted-text flex items-center justify-center transition-colors cursor-pointer border border-border-main/50"
                              title="Decrease quantity"
                            >
                              <Minus size={13} strokeWidth={2.5} />
                            </button>

                            <span className="w-5 text-center text-[12px] font-black text-primary-text select-none">
                              {selectedCount}
                            </span>

                            <button
                              type="button"
                              onClick={() => handleSelect(product)}
                              disabled={selected.length >= 2}
                              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                                selected.length < 2
                                  ? "bg-[#f0b44c] hover:bg-[#e0a238] text-white shadow-sm cursor-pointer"
                                  : "bg-surface border border-border-main/40 text-muted-text/40 cursor-not-allowed opacity-50"
                              }`}
                              title={selected.length < 2 ? "Add second item" : "Max 2 items reached"}
                            >
                              <Plus size={13} strokeWidth={2.5} />
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={(e) => {
                              e.stopPropagation()
                              handleSelect(product)
                            }}
                            className="w-7 h-7 rounded-lg border border-border-main bg-card hover:border-[#f0b44c] hover:bg-[#f0b44c]/10 text-muted-text hover:text-[#d99805] flex items-center justify-center transition-all cursor-pointer shadow-sm"
                            title="Add to offer"
                          >
                            <Plus size={14} strokeWidth={2.5} />
                          </div>
                        )}
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
            <div className="flex-1 overflow-y-auto px-6 pt-4 flex flex-col gap-4 pb-4">
              
              {/* Product Cards Grid (Clickable to select which gets 25% off) */}
              {!isSameProduct ? (
                <div className="flex flex-col gap-2">
                  <p className="text-[11px] font-black uppercase tracking-wider text-muted-text">
                    Select product for 25%
                  </p>

                  <div className="grid grid-cols-2 gap-3 shrink-0">
                    {/* Product Card 1 */}
                    <div
                      onClick={() => setDiscountTarget(0)}
                      className={`rounded-xl p-3.5 flex flex-col gap-1.5 relative transition-all cursor-pointer select-none border ${
                        discountTarget === 0
                          ? "bg-[#f0b44c]/10 border-[#f0b44c] shadow-sm ring-1 ring-[#f0b44c]/40"
                          : "bg-surface border-border-main/60 hover:bg-card-light hover:border-border-main"
                      }`}
                    >
                      <span className={`absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md text-[9px] font-black tracking-wider uppercase transition-all ${
                        discountTarget === 0
                          ? "bg-[#f0b44c] text-white shadow-sm"
                          : "bg-card border border-border-main text-muted-text font-bold"
                      }`}>
                        {discountTarget === 0 ? "25% OFF" : "FULL PRICE"}
                      </span>
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-card border border-border-main/40 flex items-center justify-center shrink-0">
                        <ProductImage src={selected[0].productImage} name={selected[0].productName} />
                      </div>
                      <div className="min-w-0 mt-0.5">
                        <p className="text-[12px] font-black text-primary-text truncate leading-snug">
                          {selected[0].productName}
                        </p>
                        <p className="text-[10.5px] text-muted-text font-medium mt-0.5">
                          Original: {formatIndianCurrency(selected[0].price)}
                        </p>
                        <p className={`text-[11.5px] font-bold mt-0.5 transition-colors ${
                          discountTarget === 0 ? "text-emerald-600 dark:text-emerald-400 font-black" : "text-secondary-text"
                        }`}>
                          Final: {formatIndianCurrency(computedStats?.item1Amt || 0)}
                        </p>
                      </div>
                    </div>

                    {/* Product Card 2 */}
                    <div
                      onClick={() => setDiscountTarget(1)}
                      className={`rounded-xl p-3.5 flex flex-col gap-1.5 relative transition-all cursor-pointer select-none border ${
                        discountTarget === 1
                          ? "bg-[#f0b44c]/10 border-[#f0b44c] shadow-sm ring-1 ring-[#f0b44c]/40"
                          : "bg-surface border-border-main/60 hover:bg-card-light hover:border-border-main"
                      }`}
                    >
                      <span className={`absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md text-[9px] font-black tracking-wider uppercase transition-all ${
                        discountTarget === 1
                          ? "bg-[#f0b44c] text-white shadow-sm"
                          : "bg-card border border-border-main text-muted-text font-bold"
                      }`}>
                        {discountTarget === 1 ? "25% OFF" : "FULL PRICE"}
                      </span>
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-card border border-border-main/40 flex items-center justify-center shrink-0">
                        <ProductImage src={selected[1].productImage} name={selected[1].productName} />
                      </div>
                      <div className="min-w-0 mt-0.5">
                        <p className="text-[12px] font-black text-primary-text truncate leading-snug">
                          {selected[1].productName}
                        </p>
                        <p className="text-[10.5px] text-muted-text font-medium mt-0.5">
                          Original: {formatIndianCurrency(selected[1].price)}
                        </p>
                        <p className={`text-[11.5px] font-bold mt-0.5 transition-colors ${
                          discountTarget === 1 ? "text-emerald-600 dark:text-emerald-400 font-black" : "text-secondary-text"
                        }`}>
                          Final: {formatIndianCurrency(computedStats?.item2Amt || 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-3 bg-[#f0b44c]/10 border border-[#f0b44c]/30 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-[#f0b44c]/20 flex items-center justify-center shrink-0">
                        <Percent size={14} className="text-[#d99805]" />
                      </div>
                      <div>
                        <p className="text-[12.5px] font-black text-primary-text">
                          1 of 2 Items 25% Off Applied
                        </p>
                        <p className="text-[11px] text-muted-text font-medium">
                          1 item at 25% off ({formatIndianCurrency(computedStats?.item1Amt || 0)}) + 1 item at full price ({formatIndianCurrency(computedStats?.item2Amt || 0)})
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-black text-[#d99805] bg-[#f0b44c]/20 px-2 py-1 rounded-md shrink-0">
                      Save {formatIndianCurrency(computedStats?.savings || 0)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 shrink-0">
                    <div className="bg-surface border border-[#f0b44c]/60 rounded-xl p-3.5 flex flex-col gap-1.5 relative">
                      <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-[#f0b44c] text-white text-[9px] font-black tracking-wider uppercase shadow-sm">
                        25% OFF
                      </span>
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-card border border-border-main/40 flex items-center justify-center shrink-0">
                        <ProductImage src={selected[0].productImage} name={selected[0].productName} />
                      </div>
                      <div className="min-w-0 mt-0.5">
                        <p className="text-[12px] font-black text-primary-text truncate leading-snug">
                          {selected[0].productName} (1)
                        </p>
                        <p className="text-[10.5px] text-muted-text font-medium mt-0.5">
                          Original: {formatIndianCurrency(selected[0].price)}
                        </p>
                        <p className="text-[11.5px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                          Final: {formatIndianCurrency(computedStats?.item1Amt || 0)}
                        </p>
                      </div>
                    </div>

                    <div className="bg-surface border border-border-main/60 rounded-xl p-3.5 flex flex-col gap-1.5 relative">
                      <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-card border border-border-main text-muted-text text-[9px] font-bold tracking-wider uppercase">
                        FULL PRICE
                      </span>
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-card border border-border-main/40 flex items-center justify-center shrink-0">
                        <ProductImage src={selected[1].productImage} name={selected[1].productName} />
                      </div>
                      <div className="min-w-0 mt-0.5">
                        <p className="text-[12px] font-black text-primary-text truncate leading-snug">
                          {selected[1].productName} (2)
                        </p>
                        <p className="text-[10.5px] text-muted-text font-medium mt-0.5">
                          Original: {formatIndianCurrency(selected[1].price)}
                        </p>
                        <p className="text-[11.5px] font-bold text-secondary-text mt-0.5">
                          Final: {formatIndianCurrency(computedStats?.item2Amt || 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Billing Form Container */}
              <div className="bg-surface rounded-2xl p-4 flex flex-col gap-3.5 border border-border-main/60 shrink-0">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-text font-bold uppercase tracking-wider">Offer Title</p>
                    <p 
                      className="text-[12px] font-bold text-[#d99805] tracking-tight mt-0.5 truncate"
                      title={isSameProduct
                        ? `Buy 2 & Get 25% Off (2 × ${selected[0].productName})`
                        : `Buy 2 & Get 25% Off (${selected[0].productName} + ${selected[1].productName})`}
                    >
                      {isSameProduct
                        ? `Buy 2 & Get 25% Off (2 × ${selected[0].productName})`
                        : `Buy 2 & Get 25% Off (${selected[0].productName} + ${selected[1].productName})`}
                    </p>
                  </div>
                  <div className="flex items-center shrink-0">
                    <span className="text-[19px] sm:text-[21px] font-black text-primary-text font-mono tracking-tight leading-none">
                      {formatIndianCurrency(computedStats?.totalAmt || 0)}
                    </span>
                  </div>
                </div>

                <div className="border-t border-border-main/60 pt-3 flex items-center justify-between gap-2 flex-wrap">
                  {/* Payment Mode Selector Dropdown */}
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="w-4 h-4 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <CreditCard className="w-3 h-3" />
                    </div>
                    <span className="text-[11px] font-medium text-secondary-text shrink-0">Payment:</span>
                    <CompactCustomSelect
                      value={paymentMode}
                      onChange={val => setPaymentMode(val as "UPI" | "Cash" | "Loyalty")}
                      options={[
                        { label: 'UPI', value: 'UPI' },
                        { label: 'Cash', value: 'Cash' },
                        { label: 'Loyalty', value: 'Loyalty' },
                      ]}
                    />
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    {/* Driver Offer Checkbox */}
                    <label className="flex items-center gap-1.5 cursor-pointer select-none group">
                      <input
                        type="checkbox"
                        checked={driverOfferSale}
                        onChange={e => setDriverOfferSale(e.target.checked)}
                        className="w-3.5 h-3.5 rounded border-border-main accent-amber-600 cursor-pointer"
                      />
                      <span className={`text-[11px] font-medium transition-colors ${
                        driverOfferSale ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-secondary-text group-hover:text-primary-text'
                      }`}>
                        Driver Offer
                      </span>
                    </label>

                    {/* No Bill Checkbox */}
                    <label className="flex items-center gap-1.5 cursor-pointer select-none group">
                      <input
                        type="checkbox"
                        checked={noBill}
                        onChange={e => setNoBill(e.target.checked)}
                        className="w-3.5 h-3.5 rounded border-border-main accent-emerald-600 cursor-pointer"
                      />
                      <span className={`text-[11px] font-medium transition-colors ${
                        noBill ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-secondary-text group-hover:text-primary-text'
                      }`}>
                        No Bill
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Change Selection Link */}
              <button
                onClick={() => setSelected([])}
                className="text-[12px] text-[#d99805] hover:underline font-bold self-start mt-0.5 cursor-pointer"
              >
                ← Change selected products
              </button>
            </div>

            {/* Totals Section */}
            <div className="px-6 py-3 border-t border-border-main/60 flex items-center justify-between shrink-0 bg-tab-light">
              <span className="text-[12px] font-medium text-secondary-text">
                Savings: <span className="font-black text-emerald-600 dark:text-emerald-400">-{formatIndianCurrency(computedStats?.savings || 0)}</span>
              </span>
              <div className="text-right flex flex-col gap-0.5">
                <span className="text-[12px] font-medium text-secondary-text">
                  No Bill Total: <span className="font-black text-rose-500">{formatIndianCurrency(noBill ? (computedStats?.totalAmt || 0) : 0)}</span>
                </span>
                <span className="text-[13px] font-medium text-secondary-text">
                  Overall Total: <span className="font-black text-primary-text">{formatIndianCurrency(computedStats?.totalAmt || 0)}</span>
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
                disabled={isConfirming || !computedStats || computedStats.totalAmt <= 0}
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
