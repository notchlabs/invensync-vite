import { useState, useEffect, useCallback } from 'react'
import { ChevronRight, ChevronDown, Home, Layers, TrendingUp, ArrowRight } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import Skeleton from 'react-loading-skeleton'
import { useNavigate } from 'react-router-dom'
import { ApiService } from '../../services/common/apiService'
import { InventoryService } from '../../services/inventoryService'
import { HSN_CHAPTERS } from './hsnType'
import type { InventoryItem } from '../../types/inventory'

const HSN_CHAPTER_MAP = new Map(HSN_CHAPTERS.map(c => [c.code, c.name]))

const PALETTE = [
  '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B',
  '#EF4444', '#06B6D4', '#F97316', '#6366F1',
  '#EC4899', '#14B8A6', '#84CC16', '#A855F7',
]

const LEVEL_LABELS = ['Chapters', 'Headings', 'Sub-headings']
const INITIAL_VISIBLE = 5

interface HsnRaw {
  code: string
  name: string
  data: { count: number; valueExcTax: number; tax: number }
}

interface HsnNode {
  code: string
  description: string
  totalValue: number
  tax: number
  count: number
  percentage: number
}

interface BreadcrumbItem {
  label: string
  type: number  // 1 | 2 | 3
  selected: { code: string; type: number } | null
  colorIdx: number
}

interface HsnBreakupChartProps {
  siteId: number
}

const sentenceCase = (s: string) =>
  s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s

const fmt = (v: number) => {
  if (v >= 100_000) return `₹${(v / 100_000).toFixed(2)} L`
  if (v >= 1_000)   return `₹${(v / 1_000).toFixed(2)} K`
  return `₹${Math.round(v)}`
}

async function enrichDescriptions(nodes: HsnNode[]): Promise<HsnNode[]> {
  const results = await Promise.allSettled(
    nodes.map(async node => {
      try {
        const res = await InventoryService.searchHsn(node.code, 0, 1)
        const match = res.results?.[0]
        const desc = match?.taxDetails?.[0]?.description ?? match?.metaTitle
        return { code: node.code, description: desc ?? node.description }
      } catch {
        return { code: node.code, description: node.description }
      }
    })
  )
  const descMap = new Map(
    results.map((r, i) =>
      r.status === 'fulfilled'
        ? [r.value.code, r.value.description]
        : [nodes[i].code, nodes[i].description]
    )
  )
  return nodes.map(n => ({ ...n, description: descMap.get(n.code) ?? n.description }))
}

export function HsnBreakupChart({ siteId }: HsnBreakupChartProps) {
  const navigate = useNavigate()
  const [data,        setData]        = useState<HsnNode[]>([])
  const [isLoading,   setIsLoading]   = useState(true)
  const [isEnriching, setIsEnriching] = useState(false)
  const [hovered,     setHovered]     = useState<string | null>(null)
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE)
  const [expandedCode, setExpandedCode] = useState<string | null>(null)
  const [itemsCache,  setItemsCache]  = useState<Map<string, InventoryItem[] | 'loading'>>(new Map())
  const [breadcrumb,  setBreadcrumb]  = useState<BreadcrumbItem[]>([
    { label: 'All Categories', type: 1, selected: null, colorIdx: 0 },
  ])

  const current = breadcrumb[breadcrumb.length - 1]
  const accentColor = breadcrumb.length > 1
    ? PALETTE[breadcrumb[breadcrumb.length - 1].colorIdx % PALETTE.length]
    : undefined

  const load = useCallback(async (crumb: BreadcrumbItem) => {
    setIsLoading(true)
    setHovered(null)
    setVisibleCount(INITIAL_VISIBLE)
    setExpandedCode(null)
    setItemsCache(new Map())
    try {
      const res = await ApiService.post<HsnRaw[]>('/report/hsn-breakup', {
        type: crumb.type,
        siteId,
        selected: crumb.selected,
      })
      const raw: HsnRaw[] = (res as unknown as { data: HsnRaw[] }).data ?? []
      const total = raw.reduce((s, n) => s + (n.data?.valueExcTax ?? 0), 0)
      const nodes: HsnNode[] = raw
        .map(n => ({
          code:        n.code,
          description: HSN_CHAPTER_MAP.get(n.code) ?? n.name,
          totalValue:  n.data?.valueExcTax ?? 0,
          tax:         n.data?.tax ?? 0,
          count:       n.data?.count ?? 0,
          percentage:  total > 0 ? ((n.data?.valueExcTax ?? 0) / total) * 100 : 0,
        }))
        .sort((a, b) => b.totalValue - a.totalValue)
      setData(nodes)

      // For headings and sub-headings, enrich with ClearTax names in background
      if (crumb.type >= 2 && nodes.length > 0) {
        setIsEnriching(true)
        enrichDescriptions(nodes)
          .then(enriched => setData(enriched))
          .catch(() => {/* keep original names on failure */})
          .finally(() => setIsEnriching(false))
      }
    } catch {
      setData([])
    } finally {
      setIsLoading(false)
    }
  }, [siteId])

  useEffect(() => { load(current) }, [current, load])

  const drillDown = (node: HsnNode, colorIdx: number) => {
    if (current.type >= 3) return
    setBreadcrumb(prev => [...prev, {
      label: `${node.code} · ${sentenceCase(node.description.length > 28 ? node.description.slice(0, 28) + '…' : node.description)}`,
      type: current.type + 1,
      selected: { code: node.code, type: current.type },
      colorIdx,
    }])
  }

  const navigateTo = (idx: number) => setBreadcrumb(prev => prev.slice(0, idx + 1))

  const toggleExpanded = useCallback(async (code: string) => {
    if (expandedCode === code) { setExpandedCode(null); return }
    setExpandedCode(code)
    if (itemsCache.has(code)) return
    setItemsCache(prev => new Map(prev).set(code, 'loading'))
    try {
      const res = await InventoryService.fetchInventory(0, 5, {
        site: [siteId],
        product: [],
        vendor: [],
        searchByProductName: null,
        searchByBillNo: null,
        searchBySupplierName: null,
        showZeroStock: false,
        hsnSubHeading: code,
      })
      setItemsCache(prev => new Map(prev).set(code, res.data.content || []))
    } catch {
      setItemsCache(prev => { const n = new Map(prev); n.delete(code); return n })
    }
  }, [expandedCode, itemsCache, siteId])

  const totalValue   = data.reduce((s, n) => s + n.totalValue, 0)
  const totalTax     = data.reduce((s, n) => s + n.tax, 0)
  const canDrill     = current.type < 3
  const visibleData  = data.slice(0, visibleCount)
  const hiddenCount  = data.length - visibleCount

  return (
    <div className="bg-card border border-border-main rounded-2xl overflow-hidden shadow-sm">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="px-5 py-4 border-b border-border-main/50 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: accentColor ? `${accentColor}20` : undefined }}
          >
            <Layers
              size={18}
              style={{ color: accentColor ?? undefined }}
              className={!accentColor ? 'text-muted-text' : ''}
            />
          </div>
          <div className="min-w-0">
            <h2 className="text-[14px] font-black text-primary-text leading-none">
              Available Inventory Breapup
            </h2>
            <p className="text-[11px] font-medium text-muted-text mt-0.5">
              HSN-based breakdown · {LEVEL_LABELS[(current.type - 1)]}
            </p>
          </div>
        </div>
        {!isLoading && totalValue > 0 && (
          <div className="text-right shrink-0">
            <p className="text-[9px] font-black text-muted-text uppercase tracking-wider mb-0.5">Total Value</p>
            <p className="text-[20px] font-black text-primary-text leading-none">{fmt(totalValue)}</p>
            <p className="text-[10px] font-semibold text-muted-text mt-0.5">+{fmt(totalTax)} tax</p>
          </div>
        )}
      </div>

      {/* ── Breadcrumb ─────────────────────────────────────────── */}
      {breadcrumb.length > 1 && (
        <div className="px-5 py-2 border-b border-border-main/50 bg-surface/40 flex items-center gap-1 flex-wrap">
          {breadcrumb.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <ChevronRight size={11} className="text-muted-text" />}
              <button
                onClick={() => navigateTo(i)}
                className={`flex items-center gap-1 text-[11px] font-bold transition-colors rounded px-1 py-0.5 ${
                  i === breadcrumb.length - 1
                    ? 'text-primary-text cursor-default'
                    : 'text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10'
                }`}
              >
                {i === 0 ? <Home size={11} /> : crumb.label}
              </button>
            </span>
          ))}
        </div>
      )}

      {/* ── Body ───────────────────────────────────────────────── */}
      <div className="p-5">
        {isLoading ? (
          <LoadingSkeleton />
        ) : data.length === 0 ? (
          <EmptyState />
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={breadcrumb.length + '-' + current.type}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="flex flex-col gap-5"
            >
              {/* ── Mosaic bar ─────────────────────────────────── */}
              <div>
                <div className="flex h-11 rounded-xl overflow-hidden gap-[2px]">
                  {data.map((node, i) => {
                    const pct   = Math.max(node.percentage, 0.4)
                    const color = PALETTE[i % PALETTE.length]
                    const dim   = hovered !== null && hovered !== node.code
                    return (
                      <motion.div
                        key={node.code}
                        layout
                        style={{ flex: `0 0 ${pct}%`, backgroundColor: color }}
                        animate={{ opacity: dim ? 0.35 : 1 }}
                        transition={{ duration: 0.15 }}
                        className={`relative flex items-center justify-center overflow-hidden ${canDrill ? 'cursor-pointer' : 'cursor-default'}`}
                        onMouseEnter={() => setHovered(node.code)}
                        onMouseLeave={() => setHovered(null)}
                        onClick={() => canDrill && drillDown(node, i)}
                        title={`${node.code} — ${node.description}\n${fmt(node.totalValue)} · ${node.percentage.toFixed(1)}%`}
                      >
                        {pct > 5 && (
                          <span className="text-[9px] font-black text-white drop-shadow-sm select-none truncate px-1">
                            {node.code}
                          </span>
                        )}
                      </motion.div>
                    )
                  })}
                </div>
                {/* Tick labels */}
                <div className="flex mt-1.5 relative h-3">
                  {data.slice(0, 6).map((node, i) => {
                    const left = data.slice(0, i).reduce((s, n) => s + Math.max(n.percentage, 0.4), 0)
                    return (
                      <span
                        key={node.code}
                        className="absolute text-[9px] font-bold text-muted-text"
                        style={{ left: `${left}%`, transform: 'translateX(-50%)' }}
                      >
                        {node.code}
                      </span>
                    )
                  })}
                </div>
              </div>

              {/* ── Ranked list ────────────────────────────────── */}
              <div className="flex flex-col gap-1.5">
                {visibleData.map((node, i) => {
                  const color     = PALETTE[i % PALETTE.length]
                  const isHov     = hovered === node.code
                  const isExpanded = expandedCode === node.code
                  const cachedItems = itemsCache.get(node.code)
                  return (
                    <div key={node.code}>
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: hovered && !isHov ? 0.55 : 1, y: 0 }}
                        transition={{ duration: 0.12, delay: i >= INITIAL_VISIBLE ? (i - INITIAL_VISIBLE) * 0.03 : 0 }}
                        onMouseEnter={() => setHovered(node.code)}
                        onMouseLeave={() => setHovered(null)}
                        onClick={() => canDrill ? drillDown(node, i) : toggleExpanded(node.code)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all duration-150 cursor-pointer ${
                          isHov || isExpanded
                            ? 'bg-surface border-border-main shadow-sm'
                            : 'border-transparent'
                        }`}
                      >
                        {/* Rank badge */}
                        <div
                          className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-[11px] font-black text-white select-none"
                          style={{ backgroundColor: color }}
                        >
                          {i + 1}
                        </div>

                        {/* Code + name + bar */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span
                              className="text-[9px] font-black text-white px-1.5 py-0.5 rounded-md shrink-0"
                              style={{ backgroundColor: color }}
                            >
                              {node.code}
                            </span>
                            {isEnriching
                              ? <Skeleton width={120} height={11} borderRadius={4} />
                              : <span className="text-[12px] font-semibold text-primary-text truncate leading-none">
                                  {sentenceCase(node.description)}
                                </span>
                            }
                          </div>
                          <div className="w-full h-1.5 bg-border-main rounded-full overflow-hidden">
                            <motion.div
                              className="h-full rounded-full"
                              style={{ backgroundColor: color }}
                              initial={{ width: 0 }}
                              animate={{ width: `${node.percentage}%` }}
                              transition={{ duration: 0.6, delay: i * 0.04, ease: 'easeOut' }}
                            />
                          </div>
                        </div>

                        {/* Value + % */}
                        <div className="text-right shrink-0 min-w-[72px]">
                          <p className="text-[13px] font-black text-primary-text leading-none">{fmt(node.totalValue)}</p>
                          <p className="text-[10px] font-semibold text-muted-text mt-0.5">+{fmt(node.tax)} tax</p>
                          <p className="text-[9px] font-bold mt-0.5" style={{ color }}>{node.percentage.toFixed(1)}% · {node.count} item{node.count !== 1 ? 's' : ''}</p>
                        </div>

                        {canDrill
                          ? <ChevronRight size={13} className="text-muted-text shrink-0" />
                          : <ChevronDown size={13} className={`shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-primary-text' : 'text-muted-text'}`} />
                        }
                      </motion.div>

                      {/* ── Inline items (sub-heading only) ──────── */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                            className="overflow-hidden"
                          >
                            <div className="ml-11 mr-1 mb-2 mt-1 rounded-xl border border-border-main/60 overflow-hidden">
                              {cachedItems === 'loading' ? (
                                <div className="flex flex-col divide-y divide-border-main/30">
                                  {[0,1,2].map(k => (
                                    <div key={k} className="flex items-center gap-3 px-3 py-2.5">
                                      <Skeleton width={28} height={28} borderRadius={6} />
                                      <div className="flex-1"><Skeleton height={11} width="60%" borderRadius={3} /><Skeleton height={8} width="35%" borderRadius={3} style={{ marginTop: 4 }} /></div>
                                      <Skeleton width={48} height={14} borderRadius={3} />
                                    </div>
                                  ))}
                                </div>
                              ) : !cachedItems || cachedItems.length === 0 ? (
                                <p className="px-4 py-3 text-[11px] text-muted-text text-center">No items found</p>
                              ) : (
                                <div className="flex flex-col divide-y divide-border-main/30">
                                  {cachedItems.map(item => (
                                    <div key={`${item.productId}-${item.siteId}`} className="flex items-center gap-3 px-3 py-2.5">
                                      <div className="w-7 h-7 rounded-md bg-surface border border-border-main/60 shrink-0 overflow-hidden flex items-center justify-center">
                                        {item.imageUrl
                                          ? <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                                          : <span className="text-[9px] font-black text-muted-text">{item.productName.charAt(0)}</span>
                                        }
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-[12px] font-semibold text-primary-text truncate leading-none">{item.productName}</p>
                                        <p className="text-[10px] text-muted-text mt-0.5">{item.quantity} {item.unit}</p>
                                      </div>
                                      <p className="text-[12px] font-bold text-primary-text shrink-0">{fmt(item.totalExcludingTax)}</p>
                                    </div>
                                  ))}
                                  <div className="px-3 py-2">
                                    <button
                                      onClick={() => navigate(`/app/panel/inventory?sites=${siteId}&hsnSubHeading=${node.code}`)}
                                      className="flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                                    >
                                      View all in inventory <ArrowRight size={10} />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })}

                {/* ── Show more / collapse ───────────────────── */}
                {hiddenCount > 0 && (
                  <button
                    onClick={() => setVisibleCount(data.length)}
                    className="mt-1 w-full py-2 rounded-xl border border-dashed border-border-main text-[11px] font-bold text-muted-text hover:text-primary-text hover:border-border-main/80 hover:bg-surface/50 transition-all duration-150 flex items-center justify-center gap-1.5"
                  >
                    <span>Show {hiddenCount} more</span>
                    <ChevronRight size={11} className="rotate-90" />
                  </button>
                )}
                {visibleCount > INITIAL_VISIBLE && data.length > INITIAL_VISIBLE && (
                  <button
                    onClick={() => setVisibleCount(INITIAL_VISIBLE)}
                    className="mt-1 w-full py-2 rounded-xl border border-dashed border-border-main text-[11px] font-bold text-muted-text hover:text-primary-text hover:border-border-main/80 hover:bg-surface/50 transition-all duration-150 flex items-center justify-center gap-1.5"
                  >
                    <span>Show less</span>
                    <ChevronRight size={11} className="-rotate-90" />
                  </button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <Skeleton height={44} borderRadius={12} />
      <div className="flex flex-col gap-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2">
            <Skeleton width={32} height={32} borderRadius={8} />
            <div className="flex-1">
              <Skeleton height={12} width="55%" borderRadius={4} />
              <Skeleton height={6} borderRadius={4} style={{ marginTop: 8 }} />
            </div>
            <Skeleton width={56} height={20} borderRadius={4} />
          </div>
        ))}
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-14 gap-3">
      <div className="w-14 h-14 rounded-2xl bg-surface border border-border-main flex items-center justify-center">
        <TrendingUp size={24} className="text-muted-text/50" />
      </div>
      <div className="text-center">
        <p className="text-[13px] font-bold text-primary-text">No data available</p>
        <p className="text-[11px] text-muted-text mt-0.5">No HSN inventory records for this site</p>
      </div>
    </div>
  )
}
