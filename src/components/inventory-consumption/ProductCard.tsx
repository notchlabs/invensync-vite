// ── ProductCard ───────────────────────────────────────────────────────────────

import { Minus, Plus } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { ProductImage } from "./ProductImage"
import { formatIndianCurrency } from "../../utils/numberFormat"

export function ProductCard({
  productId, productName, vendorName, price, unit, imageUrl,
  cartQty, onAdd, onRemove, isOutOfStock,
}: {
  productId: number
  productName: string
  vendorName?: string | null
  price: number
  unit: string
  imageUrl: string | null
  cartQty: number
  onAdd: () => void
  onRemove: () => void
  isOutOfStock?: boolean
}) {
  return (
    <div className={`bg-card border ${isOutOfStock ? 'border-dashed border-border-main opacity-[0.85]' : 'border-border-main shadow-sm'} rounded-2xl p-3.5 flex flex-col gap-3 relative transition-all`}>

      {/* ── Top: image + name ────────────────── */}
      <div className="flex items-center gap-3">
        <div className="w-[50px] h-[50px] rounded-xl overflow-hidden bg-surface border border-border-main/40 flex items-center justify-center shrink-0">
          <ProductImage src={imageUrl} name={productName} />
        </div>
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[13px] font-bold text-primary-text leading-snug line-clamp-2">
              {productName}
            </p>
            {isOutOfStock && (
              <div className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 font-bold text-[9px] flex items-center gap-1 shrink-0 whitespace-nowrap mt-0.5 ring-1 ring-inset ring-rose-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                Out of stock
              </div>
            )}
          </div>
          {vendorName && (
            <p className="text-[11px] text-muted-text font-medium mt-0.5 line-clamp-1">
              {vendorName}
            </p>
          )}
        </div>
      </div>

      {/* ── Bottom: price + action ───────────── */}
      <div className="flex items-center justify-between gap-2 p-2 -mx-2 rounded-[14px] bg-card-light h-14 overflow-hidden">
        <div className="flex items-baseline gap-1.5 min-w-0">
          {price > 0 ? (
            <span className="text-[15px] font-black text-primary-text tracking-tight">
              {formatIndianCurrency(price)}
            </span>
          ) : (
            <span className="text-[11px] text-muted-text italic">No MRP</span>
          )}
          <span className="text-[12px] text-muted-text font-medium">| {unit}</span>
        </div>

        <div className="relative flex items-center justify-end h-full">
          <AnimatePresence mode="wait">
            {cartQty > 0 ? (
              <motion.div
                key="qty-controls"
                initial={{ opacity: 0, scale: 0.8, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8, x: 20 }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                className="flex items-center rounded-xl overflow-hidden shrink-0 border border-border-main/60 shadow-sm"
              >
                <button
                  onClick={onRemove}
                  className="w-9 h-9 bg-gray-900 dark:bg-gray-700 text-white flex items-center justify-center hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <Minus size={14} />
                </button>
                <span className="text-[14px] font-black text-primary-text w-9 text-center bg-card tabular-nums">
                  {cartQty}
                </span>
                <button
                  onClick={onAdd}
                  className="w-9 h-9 bg-[#f0b44c] text-white flex items-center justify-center hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <Plus size={14} />
                </button>
              </motion.div>
            ) : (
              <motion.button
                key="add-btn"
                initial={{ opacity: 0, scale: 0.8, x: -20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8, x: -20 }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                onClick={onAdd}
                className={`h-9 px-5 bg-card text-primary-text text-[12px] font-black rounded-xl border ${isOutOfStock ? 'border-dashed border-border-main' : 'border-border-main shadow-sm'} hover:bg-surface transition-all cursor-pointer shrink-0 active:scale-[0.97]`}
              >
                ADD
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
