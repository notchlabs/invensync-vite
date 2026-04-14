import { useEffect, useState } from 'react'
import { X, Truck, ExternalLink } from 'lucide-react'
import Skeleton from 'react-loading-skeleton'
import { InventoryService, type PurchaseRecord } from '../../services/inventoryService'
import type { Product } from '../../types/inventory'
import { formatIndianNumber } from '../../utils/numberFormat'
import { ProductImage } from '../inventory-consumption/ProductImage'

function supplierInitial(name: string) {
  return name.trim().charAt(0).toUpperCase()
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('default', { day: '2-digit', month: 'short', year: 'numeric' })
}

/* ── Component ───────────────────────────────────────────── */
export function ProductDetailDialog({
  product,
  onClose,
}: Readonly<{ product: Product; onClose: () => void }>) {
  const [records, setRecords] = useState<PurchaseRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    InventoryService.fetchProductPurchaseHistory(product.id)
      .then(res => setRecords(res.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [product.id])

  const totalStock   = records.reduce((s, r) => s + r.availableQuantity, 0)
  const prices       = records.map(r => r.price).filter(p => p > 0)
  const bestPrice    = prices.length ? Math.min(...prices) : null
  const avgPrice     = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : null

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-border-main w-full max-w-[560px] rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-4 shrink-0">
          <h2 className="text-[14px] font-black text-primary-text tracking-tight leading-snug uppercase">
            "{product.name}"
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-surface text-muted-text hover:text-primary-text transition-colors shrink-0 mt-0.5 cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 pb-4 flex flex-col sm:flex-row gap-5">
          {/* Image */}
          <div className="w-full sm:w-[170px] h-[160px] rounded-xl overflow-hidden bg-amber-50 dark:bg-amber-500/10 border border-border-main flex items-center justify-center shrink-0">
            <ProductImage src={product.imageUrl} name={product.name} size={64} />
          </div>

          {/* Info */}
          <div className="flex flex-col gap-3 flex-1 min-w-0">
            {/* HSN */}
            <div>
              <span className="text-[11px] font-black text-blue-600 dark:text-blue-400 tracking-wide">
                HSN: {product.hsnCode}
              </span>
              {product.hsnName && (
                <p className="text-[12px] text-secondary-text font-medium leading-relaxed mt-1 line-clamp-4">
                  {product.hsnName}
                </p>
              )}
            </div>

            {/* Price + Stock */}
            <div className="grid grid-cols-2 gap-2 mt-auto">
              <div className="bg-surface border border-border-main rounded-xl p-3">
                <p className="text-[10px] font-bold text-muted-text uppercase tracking-wider mb-1">Selling Price</p>
                <p className="text-[18px] font-black text-primary-text tracking-tight leading-none">
                  ₹{formatIndianNumber(product.priceIncTax)}
                </p>
              </div>
              <div className="bg-surface border border-border-main rounded-xl p-3">
                <p className="text-[10px] font-bold text-muted-text uppercase tracking-wider mb-1">Total Stock</p>
                {loading ? (
                  <Skeleton width={40} height={20} borderRadius={4} />
                ) : (
                  <p className="text-[18px] font-black text-primary-text tracking-tight leading-none">
                    {totalStock % 1 === 0 ? totalStock : totalStock.toFixed(2)}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Purchase History */}
        <div className="border-t border-border-main px-5 pt-4 pb-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Truck size={13} className="text-secondary-text" />
              <span className="text-[13px] font-black text-primary-text">Purchase History</span>
            </div>
            {!loading && bestPrice !== null && (
              <span className="text-[11px] font-semibold text-muted-text">
                Best: ₹{formatIndianNumber(bestPrice)} · Avg: ₹{formatIndianNumber(avgPrice!)}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            {loading ? (
              <>
                {['a', 'b', 'c'].map(k => (
                  <div key={k} className="bg-surface rounded-xl p-3 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Skeleton width={32} height={32} borderRadius={99} />
                      <div className="flex-1">
                        <Skeleton width={160} height={12} borderRadius={4} />
                        <Skeleton width={90} height={10} borderRadius={4} className="mt-1" />
                      </div>
                      <Skeleton width={60} height={14} borderRadius={4} />
                    </div>
                  </div>
                ))}
              </>
            ) : records.length === 0 ? (
              <p className="text-[12px] text-muted-text font-medium text-center py-6">No purchase history</p>
            ) : (
              records.map((r, i) => (
                <div key={`${r.refNo}-${i}`} className="bg-surface border border-border-main rounded-xl p-3 flex flex-col gap-2">
                  {/* Row 1: supplier + price */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-500/15 flex items-center justify-center text-[12px] font-black text-blue-600 dark:text-blue-400 shrink-0">
                      {supplierInitial(r.supplierName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-primary-text leading-tight truncate">{r.supplierName}</p>
                      <p className="text-[11px] text-muted-text font-medium mt-0.5">
                        {formatDate(r.purchasedDate)}
                      </p>
                    </div>
                    <span className="text-[14px] font-black text-primary-text shrink-0">
                      ₹{formatIndianNumber(r.price * r.purchasedQty)}
                    </span>
                  </div>

                  {/* Row 2: qty + view bill */}
                  <div className="flex items-center justify-between pt-1 border-t border-border-main/50">
                    <span className="text-[12px] font-semibold text-secondary-text">
                      {r.purchasedQty % 1 === 0 ? r.purchasedQty : r.purchasedQty.toFixed(2)} {r.unit}
                    </span>
                    {r.billUrl && (
                      <a
                        href={r.billUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline transition-colors cursor-pointer"
                      >
                        <ExternalLink size={11} />
                        View Bill
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
