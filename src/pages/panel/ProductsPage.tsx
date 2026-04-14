import { useState, useCallback, useEffect, useRef } from 'react'
import { Search, RotateCw, Users } from 'lucide-react'
import Skeleton from 'react-loading-skeleton'
import { InventoryService } from '../../services/inventoryService'
import type { Product } from '../../types/inventory'
import { PageHeader } from '../../components/common/PageHeader'
import { formatIndianNumber } from '../../utils/numberFormat'
import { ProductDetailDialog } from '../../components/products/ProductDetailDialog'

const PAGE_SIZE = 20

/* ── Product image with fallback ────────────────────────── */
function ProductImg({ src, name }: Readonly<{ src: string | null; name: string }>) {
  const [errored, setErrored] = useState(false)
  if (src && !errored) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setErrored(true)}
        className="w-full h-full object-contain"
      />
    )
  }
  return (
    <span className="text-[11px] font-bold text-muted-text text-center px-2 leading-tight">
      {name.slice(0, 2).toUpperCase()}
    </span>
  )
}

/* ── Single product card ────────────────────────────────── */
function ProductCard({ product, onViewSuppliers }: Readonly<{ product: Product; onViewSuppliers: () => void }>) {
  const taxLabel = [
    product.cgstInPerc ? `CGST ${product.cgstInPerc}%` : '',
    product.sgstInPerc ? `SGST ${product.sgstInPerc}%` : '',
  ].filter(Boolean).join(' · ')

  return (
    <div className="bg-card border border-border-main rounded-2xl flex flex-col overflow-hidden hover:shadow-md transition-shadow">
      {/* Image */}
      <div className="h-[130px] bg-surface border-b border-border-main flex items-center justify-center shrink-0 overflow-hidden">
        <ProductImg src={product.imageUrl} name={product.name} />
      </div>

      {/* Body */}
      <div className="flex flex-col gap-2 p-4 flex-1">
        <p className="text-[13px] font-bold text-primary-text leading-snug line-clamp-2">
          {product.name}
        </p>
        {product.hsnName && (
          <p className="text-[11px] text-muted-text font-medium leading-relaxed line-clamp-3">
            {product.hsnName}
          </p>
        )}

        {/* Price */}
        <div className="mt-auto pt-2">
          <div className="flex items-baseline gap-1">
            <span className="text-[15px] font-black text-primary-text tracking-tight">
              ₹{formatIndianNumber(product.priceIncTax)}
            </span>
            <span className="text-[11px] text-muted-text font-medium">/ {product.unit}</span>
          </div>
          {taxLabel && (
            <p className="text-[10px] text-muted-text font-medium mt-0.5">{taxLabel}</p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 pb-4">
        <button
          onClick={onViewSuppliers}
          className="flex items-center gap-1.5 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline transition-colors cursor-pointer"
        >
          <Users size={11} />
          view suppliers
        </button>
      </div>
    </div>
  )
}

/* ── Skeleton card ──────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="bg-card border border-border-main rounded-2xl overflow-hidden">
      <Skeleton height={130} borderRadius={0} />
      <div className="p-4 flex flex-col gap-2">
        <Skeleton height={13} borderRadius={4} />
        <Skeleton height={11} borderRadius={4} />
        <Skeleton height={11} width="70%" borderRadius={4} />
        <Skeleton height={11} width="50%" borderRadius={4} />
        <div className="pt-2">
          <Skeleton height={18} width={90} borderRadius={4} />
          <Skeleton height={10} width={110} borderRadius={3} className="mt-1" />
        </div>
      </div>
      <div className="px-4 pb-4">
        <Skeleton height={11} width={80} borderRadius={3} />
      </div>
    </div>
  )
}

/* ── Page ───────────────────────────────────────────────── */
const SK_KEYS = Array.from({ length: PAGE_SIZE }, (_, i) => `sk-${i}`)

export default function ProductsPage() {
  const [search, setSearch] = useState('')
  const [data, setData] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  const pageRef = useRef(0)
  const loadingRef = useRef(false)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const loadData = useCallback(async (reset = false) => {
    if (loadingRef.current) return
    loadingRef.current = true
    setLoading(true)
    try {
      const page = reset ? 0 : pageRef.current
      if (reset) pageRef.current = 0
      const res = await InventoryService.fetchProducts(page, PAGE_SIZE, search)
      const items = res.data?.content ?? []
      setData(prev => reset ? items : [...prev, ...items])
      pageRef.current = page + 1
      setHasMore(!res.data?.last)
    } catch (e) {
      console.error(e)
    } finally {
      loadingRef.current = false
      setLoading(false)
    }
  }, [search])

  // Debounced search reset
  useEffect(() => {
    const t = setTimeout(() => loadData(true), 350)
    return () => clearTimeout(t)
  }, [loadData])

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && hasMore && !loadingRef.current) loadData(false) },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, loadData])

  return (
    <div className="p-4 md:p-6 max-w-[1500px] mx-auto w-full flex flex-col gap-6 overflow-y-auto h-full">

      {/* Header */}
      <PageHeader
        title="Product Discovery"
        description="Manage your products and suppliers"
      />

      {/* Search */}
      <div className="relative group w-full max-w-[360px]">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-text group-focus-within:text-secondary-text transition-colors" />
        <input
          type="text"
          placeholder="Search products, HSN, price..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full h-[38px] pl-9 pr-9 bg-surface border border-border-main rounded-lg text-[12px] font-bold text-primary-text outline-none focus:border-secondary-text focus:ring-2 focus:ring-accent/5 transition-all placeholder:font-normal placeholder:text-muted-text"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-text hover:text-primary-text transition-colors cursor-pointer"
          >
            <RotateCw size={12} />
          </button>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {data.map(p => (
          <ProductCard key={p.id} product={p} onViewSuppliers={() => setSelectedProduct(p)} />
        ))}
        {loading && SK_KEYS.map(k => <SkeletonCard key={k} />)}
      </div>

      {!loading && data.length === 0 && (
        <p className="text-[13px] text-muted-text font-medium text-center py-16">
          No products found
        </p>
      )}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-1" />

      {/* Product detail dialog */}
      {selectedProduct && (
        <ProductDetailDialog
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  )
}
