import { useState, useCallback, useEffect, useRef } from 'react'
import { Search, RotateCw, Package, TrendingDown, AlertTriangle, Flame } from 'lucide-react'
import Skeleton from 'react-loading-skeleton'
import {
  ReportService,
  type ConsumptionReportItem,
  type ConsumptionReportSummary,
  type StockStatus,
} from '../../services/reportService'
import { VendorFilter } from '../../components/filters/VendorFilter'
import { PageHeader } from '../../components/common/PageHeader'
import type { Vendor } from '../../types/inventory'
import { InfiniteScrollTable, type Column } from '../../components/common/InfiniteScrollTable'

const PAGE_SIZE = 20

const TABS: { label: string; value: StockStatus }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Safe', value: 'SAFE' },
  { label: 'Order Soon', value: 'ORDER_SOON' },
  { label: 'Critical', value: 'CRITICAL' },
]

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  safe:       { label: 'Safe',       className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400' },
  warning:    { label: 'Order Soon', className: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400' },
  danger:     { label: 'Critical',   className: 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400' },
  SAFE:       { label: 'Safe',       className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400' },
  ORDER_SOON: { label: 'Order Soon', className: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400' },
  CRITICAL:   { label: 'Critical',   className: 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400' },
  NO_STOCK:   { label: 'No Stock',   className: 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400' },
}

const SK_CARDS = ['a', 'b', 'c', 'd'] as const

/* ── Summary stat cards ──────────────────────────────────── */
function SummaryCards({
  summary,
  loading,
}: Readonly<{ summary: ConsumptionReportSummary | null; loading: boolean }>) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {SK_CARDS.map(k => (
          <div key={k} className="bg-card border border-border-main rounded-2xl p-4 flex items-center gap-3">
            <Skeleton width={36} height={36} borderRadius={12} />
            <div className="flex flex-col gap-1.5 flex-1">
              <Skeleton width="70%" height={10} borderRadius={4} />
              <Skeleton width="45%" height={18} borderRadius={4} />
            </div>
          </div>
        ))}
      </div>
    )
  }

  const cards = [
    {
      key: 'total',
      icon: <Package size={15} />,
      label: 'Products Shown',
      value: summary?.productsShown ?? 0,
      suffix: '',
      color: 'text-secondary-text',
      iconBg: 'bg-surface',
    },
    {
      key: 'avg',
      icon: <TrendingDown size={15} />,
      label: 'Avg Daily Consumption',
      value: summary?.avgDaily ?? 0,
      suffix: ' / day',
      color: 'text-secondary-text',
      iconBg: 'bg-surface',
    },
    {
      key: 'reorder',
      icon: <AlertTriangle size={15} />,
      label: 'Below Reorder Level',
      value: summary?.belowReorder ?? 0,
      suffix: '',
      color: 'text-amber-600 dark:text-amber-400',
      iconBg: 'bg-amber-50 dark:bg-amber-500/10',
    },
    {
      key: 'critical',
      icon: <Flame size={15} />,
      label: 'Critical ≤3 days',
      value: summary?.critical ?? 0,
      suffix: '',
      color: 'text-red-600 dark:text-red-400',
      iconBg: 'bg-red-50 dark:bg-red-500/10',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map(c => (
        <div key={c.key} className="bg-card border border-border-main rounded-2xl p-4 flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl ${c.iconBg} flex items-center justify-center ${c.color} shrink-0`}>
            {c.icon}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-muted-text uppercase tracking-wider mb-0.5">{c.label}</p>
            <p className={`text-[18px] font-black leading-none tracking-tight ${c.color}`}>
              {c.value.toLocaleString()}{c.suffix}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ── Page ───────────────────────────────────────────────── */
export default function ReportsPage() {
  const [search, setSearch]           = useState('')
  const [tab, setTab]                 = useState<StockStatus>('ALL')
  const [vendors, setVendors]         = useState<Vendor[]>([])
  const [data, setData]               = useState<ConsumptionReportItem[]>([])
  const [summary, setSummary]         = useState<ConsumptionReportSummary | null>(null)
  const [loading, setLoading]         = useState(false)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [hasMore, setHasMore]         = useState(true)

  const pageRef      = useRef(0)
  const loadingRef   = useRef(false)

  const loadData = useCallback(async (reset = false) => {
    if (loadingRef.current) return
    loadingRef.current = true
    setLoading(true)
    if (reset) setSummaryLoading(true)

    try {
      const page = reset ? 0 : pageRef.current
      if (reset) pageRef.current = 0

      const payload = {
        searchTerm: search,
        stockStatus: tab,
        sortBy: 'daysLeft',
        sortDir: 'ASC' as const,
        vendorIds: vendors.length ? vendors.map(v => v.id) : undefined,
      }

      const res = await ReportService.fetchConsumptionReport(page, PAGE_SIZE, payload)
      
      const payloadData = res.data.data
      const summaryData = res.data?.summary || null
      const content = payloadData?.content ?? []

      setData(prev => reset ? content : [...prev, ...content])
      pageRef.current = page + 1
      setHasMore(!payloadData?.last)

      if (reset) {
        setSummary(summaryData)
        setSummaryLoading(false)
      }
    } catch (e) {
      console.error(e)
      if (reset) setSummaryLoading(false)
    } finally {
      loadingRef.current = false
      setLoading(false)
    }
  }, [search, tab, vendors])

  // Debounced reset on filter change
  useEffect(() => {
    const t = setTimeout(() => loadData(true), 350)
    return () => clearTimeout(t)
  }, [loadData])

  const columns: Column<ConsumptionReportItem>[] = [
    {
      header: 'Product',
      key: 'product',
      cellType: 'product',
      dataMap: {
        title: 'productName',
        subtitle: 'supplierName',
        image: 'imageUrl'
      },
      width: '40%'
    },
    {
      header: 'Avg Daily',
      key: 'avgDaily',
      render: (item) => (
        <span className="text-[13px] font-semibold text-secondary-text">
          {item.consumptionRate % 1 === 0 ? item.consumptionRate : item.consumptionRate.toFixed(2)}{' '}
          {item.unit} / day
        </span>
      )
    },
    {
      header: 'Stock',
      key: 'stock',
      render: (item) => (
        <span className="text-[13px] font-semibold text-secondary-text">
          {item.stock % 1 === 0 ? item.stock : item.stock.toFixed(2)}{' '}
          {item.unit}
        </span>
      )
    },
    {
      header: 'Days Left',
      key: 'daysLeft',
      render: (item) => {
        const badge = STATUS_BADGE[item.stockStatus]
        return (
          <div className="flex items-center gap-2">
            {item.daysLeft !== null && (
              <span className="text-[13px] font-bold text-primary-text">{item.daysLeft}d</span>
            )}
            {badge && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${badge.className}`}>
                {badge.label}
              </span>
            )}
          </div>
        )
      }
    }
  ]

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto w-full flex flex-col gap-6 overflow-y-auto h-full">

      {/* Header */}
      <PageHeader
        title="Product Consumption Report"
        description="Consumption, stock status, and reorder indicators"
      />

      {/* Summary cards */}
      <SummaryCards summary={summary} loading={summaryLoading} />

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Left: search + vendor filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative group">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-text group-focus-within:text-secondary-text transition-colors" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-[38px] w-[220px] pl-9 pr-8 bg-surface border border-border-main rounded-lg text-[12px] font-bold text-primary-text outline-none focus:border-secondary-text focus:ring-2 focus:ring-accent/5 transition-all placeholder:font-normal placeholder:text-muted-text"
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
          <VendorFilter selectedItems={vendors} onSelectionChange={setVendors} />
        </div>

        {/* Right: status tabs */}
        <div className="flex items-center gap-1 bg-surface border border-border-main rounded-xl p-1">
          {TABS.map(t => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                tab === t.value
                  ? 'bg-primary-text text-card shadow-sm'
                  : 'text-muted-text hover:text-secondary-text'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0 bg-card rounded-2xl border border-border-main shadow-sm flex flex-col overflow-hidden">
        <InfiniteScrollTable
          columns={columns}
          data={data}
          isLoading={loading}
          hasMore={hasMore}
          onLoadMore={() => loadData(false)}
          keyExtractor={item => item.productId}
          minWidth="800px"
        />
      </div>
    </div>
  )
}
