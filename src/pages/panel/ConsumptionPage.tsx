import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, Package, ShoppingBag, ChevronRight, LineChartIcon } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import toast from 'react-hot-toast'
import Skeleton from 'react-loading-skeleton'
import { InventoryService, type PreparationProduct } from '../../services/inventoryService'
import { ConsumptionService } from '../../services/consumptionService'
import type { InventoryItem, Site } from '../../types/inventory'
import { ENV } from '../../config/env'
import type { CartEntry, ItemSettings } from '../../components/inventory-consumption/types'
import { ProductCard } from '../../components/inventory-consumption/ProductCard'
import { ConfirmConsumptionModal } from '../../components/inventory-consumption/ConfirmConsumptionModal'
import { useNavigate } from 'react-router-dom'
import type { ApiResponse } from '../../types/api'
import type { PaginatedResponse } from '../../services/common/common.types'

// ── constants ─────────────────────────────────────────────────────────────────

const SITE_ID  = Number(ENV.DEFAULT_SITE_ID)
const PAGE_SIZE = 12

// ── types ─────────────────────────────────────────────────────────────────────

type Tab = 'inventory' | 'preparation'

// ── ConsumptionPage ───────────────────────────────────────────────────────────

export default function ConsumptionPage() {
  const [siteName, setSiteName]   = useState('')
  const [tab, setTab]             = useState<Tab>('inventory')
  const [search, setSearch]       = useState('')
  const [showModal, setShowModal] = useState(false)

  // Cart
  const [cart, setCart] = useState<Map<number, CartEntry>>(new Map())

  // Inventory tab
  const [invItems, setInvItems]     = useState<InventoryItem[]>([])
  const [invLoading, setInvLoading] = useState(true)
  const [invHasMore, setInvHasMore] = useState(true)
  const invPage     = useRef(0)
  const invLoading$ = useRef(false)
  const invSentinel = useRef<HTMLDivElement | null>(null)

  // Preparation tab
  const [prepItems, setPrepItems]     = useState<PreparationProduct[]>([])
  const [prepLoading, setPrepLoading] = useState(false)
  const navigate = useNavigate()

  // ── Site name
  useEffect(() => {
    InventoryService.fetchSitesByIds([SITE_ID])
      .then((res: ApiResponse<PaginatedResponse<Site>>) => {
        const sites = res.data?.content ?? []
        const site  = sites.find((s: Site) => s.id === SITE_ID)
        if (site?.name) setSiteName(site.name)
      })
      .catch(() => {})
  }, [])

  // ── Inventory load
  const loadInventory = useCallback(async (reset = false) => {
    if (invLoading$.current) return
    invLoading$.current = true
    if (reset) setInvLoading(true)
    try {
      if (reset) { invPage.current = 0; setInvHasMore(true) }
      const res = await InventoryService.fetchInventory(invPage.current, PAGE_SIZE, {
        site: [SITE_ID], product: [], vendor: [],
        searchByProductName: search.trim() || null,
        searchByBillNo: null,
        searchBySupplierName: null,
        showZeroStock: true,
      })
      const items = res.data.content ?? []
      setInvItems(prev => reset ? items : [...prev, ...items])
      invPage.current += 1
      setInvHasMore(!res.data.last)
    } catch (e) { console.error(e) }
    finally { invLoading$.current = false; setInvLoading(false) }
  }, [search])

  useEffect(() => {
    if (tab !== 'inventory') return
    const t = setTimeout(() => loadInventory(true), 300)
    return () => clearTimeout(t)
  }, [loadInventory, tab])

  useEffect(() => {
    if (tab !== 'inventory') return
    const el = invSentinel.current
    if (!el) return
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && invHasMore && !invLoading$.current) loadInventory(false)
    }, { threshold: 0.1 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [tab, invHasMore, loadInventory])

  // ── Preparation load
  const loadPrep = useCallback((term: string) => {
    setPrepLoading(true)
    InventoryService.searchPreparationProducts(term)
      .then(res => setPrepItems(res.data.content ?? []))
      .catch(console.error)
      .finally(() => setPrepLoading(false))
  }, [])

  useEffect(() => {
    if (tab !== 'preparation') return
    loadPrep('')
  }, [tab, loadPrep])

  useEffect(() => {
    if (tab !== 'preparation') return
    const t = setTimeout(() => loadPrep(search.trim()), 300)
    return () => clearTimeout(t)
  }, [search, tab, loadPrep])

  // ── Cart helpers
  const addToCart = (entry: Omit<CartEntry, 'qty'>) => {
    setCart(prev => {
      const next = new Map(prev)
      const ex   = next.get(entry.productId)
      next.set(entry.productId, { ...entry, qty: ex ? ex.qty + 1 : 1 })
      return next
    })
  }

  const removeFromCart = (productId: number) => {
    setCart(prev => {
      const next = new Map(prev)
      const ex   = next.get(productId)
      if (!ex || ex.qty <= 1) next.delete(productId)
      else next.set(productId, { ...ex, qty: ex.qty - 1 })
      return next
    })
  }

  const removeEntireFromCart = (productId: number) => {
    setCart(prev => { const next = new Map(prev); next.delete(productId); return next })
  }

  const handleConfirm = async (settings: Map<number, ItemSettings>) => {
    try {
      const now = new Date()
      const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

      const records = Array.from(cart.values()).map(e => {
        const s = settings.get(e.productId)
        const amount = parseFloat(s?.amount || '0')
        return {
          sourceSiteId: SITE_ID,
          productId: e.productId,
          productName: e.productName,
          quantity: e.qty,
          amountIncTax: amount,
          upi: s?.paymentMode === 'UPI' ? amount : 0,
          cash: s?.paymentMode === 'Cash' ? amount : 0,
          noBill: s?.noBill ?? false,
          loyalty: s?.paymentMode === 'Loyalty'
        }
      })

      const payload = {
        consumptionUnitId: Number(ENV.DEFAULT_CONSUMPTION_UNIT_ID),
        consumptionDate: formattedDate,
        saveDetails: true,
        records
      }

      await ConsumptionService.consumeStock(payload)

      toast.success('Stock consumed successfully!')
      setCart(new Map())
      setShowModal(false)
      
      // Optionally refresh current view based on tab
      if (tab === 'inventory') {
        loadInventory(true)
      } else {
        loadPrep('')
      }
    } catch (error) {
      console.error('Failed to consume stock', error)
      toast.error('Failed to consume stock. Please try again.')
    }
  }

  const cartEntries = Array.from(cart.values())
  const cartTotal   = cartEntries.reduce((s, e) => s + e.qty, 0)
  const previewImgs = cartEntries.slice(0, 3)
  const imgOverflow = cartEntries.length - 3

  const SkeletonGrid = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {Array.from({ length: 9 }).map((_, i) => <Skeleton key={i} height={116} borderRadius={16} />)}
    </div>
  )

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <div className="px-5 md:px-8 pt-6 pb-4 shrink-0 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] md:text-[26px] font-black text-primary-text tracking-tight leading-tight">
            {siteName || 'Inventory Consumption'}
          </h1>
          <p className="text-[12px] text-muted-text font-medium mt-0.5">Track and manage your stock across site</p>
        </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
          <button 
            onClick={() => {
              navigate(`/app/panel/inventory/consumption?siteId=${SITE_ID}`)
            }}
            className="flex-1 sm:flex-none flex items-center justify-center cursor-pointer gap-1.5 px-4 py-2 bg-btn-primary hover:opacity-90 text-btn-primary-fg text-[13px] font-semibold rounded-lg border border-border-main/50 transition-all shadow-sm tracking-wide"
          >
            <LineChartIcon />
            View Consumption
          </button>
        </div>
      </div>

      {/* ── Search ───────────────────────────────────────────────── */}
      <div className="px-5 md:px-8 pb-3 shrink-0">
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-text" />
          <input
            type="text"
            placeholder="Search products"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-[42px] pl-10 pr-4 bg-card border border-border-main rounded-xl text-[13px] font-medium text-primary-text outline-none focus:border-secondary-text transition-all"
          />
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────── */}
      <div className="px-5 md:px-8 pb-3 shrink-0">
        <div className="grid grid-cols-2 bg-tab-light border border-border-main rounded-xl p-1">
          {(['inventory', 'preparation'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setSearch('') }}
              className={`py-2 text-[13px] font-black rounded-lg transition-all cursor-pointer ${
                tab === t ? 'bg-card-light shadow-sm' : 'text-muted-text hover:text-secondary-text'
              }`}
            >
              {t === 'inventory' ? 'Inventory' : 'Preparation'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Product grid ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-5 md:px-8 pb-24">

        {tab === 'inventory' && (
          <>
            {invLoading && invItems.length === 0 ? <SkeletonGrid /> : invItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Package size={32} className="text-muted-text/30 mb-3" />
                <p className="text-[13px] font-bold text-muted-text">No inventory found</p>
              </div>
            ) : (
              <>
                {/* IN STOCK */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {invItems.filter(i => i.quantity > 0).map(item => {
                    const cartEntry = cart.get(item.productId)
                    return (
                      <ProductCard
                        key={`${item.productId}-${item.siteId}`}
                        productName={item.productName}
                        vendorName={item.vendorNames}
                        price={item.mrp}
                        unit={item.unit}
                        imageUrl={item.imageUrl}
                        cartQty={cartEntry?.qty ?? 0}
                        onAdd={() => addToCart({ productId: item.productId, productName: item.productName, unit: item.unit, price: item.mrp, imageUrl: item.imageUrl, source: 'inventory' })}
                        onRemove={() => removeFromCart(item.productId)}
                        isOutOfStock={false}
                      />
                    )
                  })}
                </div>

                {/* OUT OF STOCK SEPARATOR & GRID */}
                {invItems.some(i => i.quantity <= 0) && (
                  <>
                    <div className="flex items-center gap-4 my-8 max-w-[800px] mx-auto opacity-80">
                      <hr className="flex-1 border-border-main" />
                      <div className="px-4 py-1.5 rounded-full border border-rose-500/20 bg-rose-500/5 text-rose-600 text-[11px] font-black tracking-wide flex items-center gap-1.5 shrink-0 shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        Out of Stock • {invItems.filter(i => i.quantity <= 0).length} items
                      </div>
                      <hr className="flex-1 border-border-main" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {invItems.filter(i => i.quantity <= 0).map(item => {
                        const cartEntry = cart.get(item.productId)
                        return (
                          <ProductCard
                            key={`${item.productId}-${item.siteId}`}
                            productName={item.productName}
                            vendorName={item.vendorNames}
                            price={item.mrp}
                            unit={item.unit}
                            imageUrl={item.imageUrl}
                            cartQty={cartEntry?.qty ?? 0}
                            onAdd={() => addToCart({ productId: item.productId, productName: item.productName, unit: item.unit, price: item.mrp, imageUrl: item.imageUrl, source: 'inventory' })}
                            onRemove={() => removeFromCart(item.productId)}
                            isOutOfStock={true}
                          />
                        )
                      })}
                    </div>
                  </>
                )}
              </>
            )}
            <div ref={invSentinel} className="h-4" />
            {invLoading && invItems.length > 0 && (
              <div className="py-4 flex justify-center">
                <Skeleton height={40} width={120} borderRadius={8} />
              </div>
            )}
          </>
        )}

        {tab === 'preparation' && (
          prepLoading ? <SkeletonGrid /> : prepItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Package size={32} className="text-muted-text/30 mb-3" />
              <p className="text-[13px] font-bold text-muted-text">No preparation items found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {prepItems.map(item => {
                const cartEntry = cart.get(item.productId)
                return (
                  <ProductCard
                    key={item.productId}
                    productName={item.productName}
                    vendorName={null}
                    price={item.price}
                    unit={item.unit}
                    imageUrl={item.productImage}
                    cartQty={cartEntry?.qty ?? 0}
                    onAdd={() => addToCart({ productId: item.productId, productName: item.productName, unit: item.unit, price: item.price, imageUrl: item.productImage, source: 'preparation' })}
                    onRemove={() => removeFromCart(item.productId)}
                  />
                )
              })}
            </div>
          )
        )}
      </div>

      {/* ── Floating cart button ──────────────────────────────────── */}
      <AnimatePresence>
        {cartTotal > 0 && (
          <motion.button
            onClick={() => setShowModal(true)}
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
            className="fixed bottom-6 right-6 z-[100] flex items-center gap-3 bg-[#f0b44c] text-black pl-3 pr-3 py-3 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] cursor-pointer hover:opacity-95 transition-opacity"
          >
            {/* Stacked product images */}
            <div className="flex items-center shrink-0">
              {previewImgs.map((entry, i) => (
                <div
                  key={entry.productId}
                  className="w-10 h-10 rounded-full border-2 border-[#392502] overflow-hidden bg-white flex items-center justify-center shrink-0"
                  style={{ marginLeft: i > 0 ? '-10px' : '0', zIndex: previewImgs.length - i }}
                >
                  {entry.imageUrl
                    ? <img src={entry.imageUrl} alt={entry.productName} className="w-full h-full object-cover" />
                    : <ShoppingBag size={14} className="text-amber-400" />
                  }
                </div>
              ))}
              {imgOverflow > 0 && (
                <div
                  className="w-10 h-10 rounded-full border-2 border-white bg-amber-600 flex items-center justify-center text-white text-[11px] font-black shrink-0"
                  style={{ marginLeft: '-10px' }}
                >
                  +{imgOverflow}
                </div>
              )}
            </div>

            {/* Text */}
            <div className="text-left px-1">
              <p className="text-[14px] font-black leading-none whitespace-nowrap">View Consumption</p>
              <p className="text-[11px] font-medium opacity-80 mt-0.5">{cartTotal} item{cartTotal !== 1 ? 's' : ''}</p>
            </div>

            {/* Chevron circle */}
            <div className="w-9 h-9 rounded-full bg-[#d99805] flex items-center justify-center shrink-0">
              <ChevronRight size={16} className="text-white" />
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Confirm modal ────────────────────────────────────────── */}
      <AnimatePresence>
        {showModal && cart.size > 0 && (
          <ConfirmConsumptionModal
            cart={cart}
            onClose={() => setShowModal(false)}
            onRemove={removeEntireFromCart}
            onConfirm={handleConfirm}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
