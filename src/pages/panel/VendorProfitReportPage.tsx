import { useState, useEffect, useCallback } from 'react'
import { Search, RotateCw, ArrowUpDown, ArrowUp, ArrowDown, HelpCircle, Store } from 'lucide-react'
import Skeleton from 'react-loading-skeleton'
import { PageHeader } from '../../components/common/PageHeader'
import { SiteFilterSingle } from '../../components/filters/SiteFilterSingle'
import { DateRangePicker } from '../../components/common/DateRangePicker'
import { ReportService, type VendorProfitReportItem } from '../../services/reportService'
import { InventoryService } from '../../services/inventoryService'
import type { Site } from '../../types/inventory'
import { ENV } from '../../config/env'

// Date calculation helper
const getInitialDates = () => {
  const to = new Date()
  const from = new Date()
  from.setMonth(to.getMonth() - 12)

  const formatDate = (d: Date) => {
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  return {
    from: formatDate(from),
    to: formatDate(to)
  }
}

const formatCurrency = (n: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(n)
}

export default function VendorProfitReportPage() {
  const [selectedSite, setSelectedSite] = useState<Site | null>(null)
  
  const [dates, setDates] = useState(getInitialDates)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'PROFIT' | 'SALE_AMOUNT' | 'PURCHASE_AMOUNT'>('PROFIT')
  const [sortDir, setSortDir] = useState<'ASC' | 'DESC'>('DESC')
  
  const [data, setData] = useState<VendorProfitReportItem[]>([])
  const [loading, setLoading] = useState(false)
  const [hydratingSite, setHydratingSite] = useState(true)

  // 1. Hydrate the default site on load
  useEffect(() => {
    const defaultSiteId = Number(ENV.DEFAULT_SITE_ID)
    InventoryService.fetchSitesByIds([defaultSiteId])
      .then(res => {
        const site = res.data.content?.[0] || null
        setSelectedSite(site)
      })
      .catch(console.error)
      .finally(() => setHydratingSite(false))
  }, [])

  // 2. Fetch report data from API
  const fetchReport = useCallback(async () => {
    if (!selectedSite) return
    setLoading(true)
    try {
      const res = await ReportService.fetchVendorWiseProfitReport({
        siteId: selectedSite.id,
        fromDate: dates.from || undefined,
        toDate: dates.to || undefined,
        searchTerm: search || undefined,
        sortBy,
        sortDir
      })
      const rawData = res.data
      let arrayData: VendorProfitReportItem[] = []
      if (rawData) {
        if (Array.isArray(rawData)) {
          arrayData = rawData
        } else if (typeof rawData === 'object') {
          if ('content' in rawData && Array.isArray((rawData as any).content)) {
            arrayData = (rawData as any).content
          } else if ('data' in rawData && Array.isArray((rawData as any).data)) {
            arrayData = (rawData as any).data
          }
        }
      }
      setData(arrayData)
    } catch (e) {
      console.error('Failed to fetch vendor profit report:', e)
      setData([])
    } finally {
      setLoading(false)
    }
  }, [selectedSite, dates, search, sortBy, sortDir])

  // Refetch when dependencies change (debounced search is handled simply via input trigger or effect)
  useEffect(() => {
    const t = setTimeout(() => {
      fetchReport()
    }, 300)
    return () => clearTimeout(t)
  }, [fetchReport])

  const toggleSort = (field: 'PROFIT' | 'SALE_AMOUNT' | 'PURCHASE_AMOUNT') => {
    if (sortBy === field) {
      setSortDir(prev => (prev === 'ASC' ? 'DESC' : 'ASC'))
    } else {
      setSortBy(field)
      setSortDir('DESC') // default sort descending on first click
    }
  }

  const renderSortIcon = (field: 'PROFIT' | 'SALE_AMOUNT' | 'PURCHASE_AMOUNT') => {
    if (sortBy !== field) return <ArrowUpDown size={12} className="text-muted-text ml-1 shrink-0 inline-block opacity-40 group-hover:opacity-100 transition-opacity" />
    return sortDir === 'ASC' ? (
      <ArrowUp size={12} className="text-primary-text ml-1 shrink-0 inline-block" />
    ) : (
      <ArrowDown size={12} className="text-primary-text ml-1 shrink-0 inline-block" />
    )
  }

  // Summary Metrics
  const summaryTotals = data.reduce(
    (acc, cur) => {
      acc.sales += cur.totalSaleAmount
      acc.purchase += cur.totalPurchaseAmount
      acc.profit += cur.totalProfit
      acc.txns += cur.transactionCount
      return acc
    },
    { sales: 0, purchase: 0, profit: 0, txns: 0 }
  )

  const consolidatedMargin = summaryTotals.sales > 0 
    ? (summaryTotals.profit / summaryTotals.sales) * 100 
    : 0

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto w-full flex flex-col gap-6 overflow-y-auto h-full">
      {/* Header */}
      <PageHeader
        title="Vendor-wise Profit Report"
        description="Detailed insights into transaction volumes, purchase expenses, and net profit margins per vendor"
      />

      {/* Summary KPI Dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: 'Total Net Profit',
            val: formatCurrency(summaryTotals.profit),
            color: summaryTotals.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400',
            bg: 'bg-emerald-50/50 dark:bg-emerald-500/5 border-emerald-500/10'
          },
          {
            label: 'Total Sales Revenue',
            val: formatCurrency(summaryTotals.sales),
            color: 'text-primary-text',
            bg: 'bg-card border-border-main'
          },
          {
            label: 'Total Cost of Goods Sold',
            val: formatCurrency(summaryTotals.purchase),
            color: 'text-secondary-text',
            bg: 'bg-card border-border-main'
          },
          {
            label: 'Consolidated Profit Margin',
            val: `${consolidatedMargin.toFixed(2)}%`,
            color: consolidatedMargin >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-500',
            bg: 'bg-blue-50/50 dark:bg-blue-500/5 border-blue-500/10'
          }
        ].map((kpi, idx) => (
          <div key={idx} className={`bg-card border rounded-2xl p-4 shadow-sm flex flex-col justify-center ${kpi.bg}`}>
            <span className="text-[10px] font-bold text-muted-text uppercase tracking-wider mb-1 block">
              {kpi.label}
            </span>
            {loading || hydratingSite ? (
              <Skeleton width="60%" height={22} borderRadius={4} />
            ) : (
              <span className={`text-[18px] md:text-[20px] font-black leading-none tracking-tight ${kpi.color}`}>
                {kpi.val}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Filters Control Bar */}
      <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4">
        {/* Left filters: Search and Date Range */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Site Selector */}
          <div className="w-[200px]">
            {hydratingSite ? (
              <Skeleton height={38} borderRadius={8} />
            ) : (
              <SiteFilterSingle
                value={selectedSite}
                onChange={setSelectedSite}
                placeholder="Select Site"
                className="w-full"
              />
            )}
          </div>

          {/* Date Picker */}
          <DateRangePicker
            from={dates.from}
            to={dates.to}
            onFromChange={val => setDates(prev => ({ ...prev, from: val }))}
            onToChange={val => setDates(prev => ({ ...prev, to: val }))}
          />

          {/* Search bar */}
          <div className="relative group">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-text group-focus-within:text-secondary-text transition-colors" />
            <input
              type="text"
              placeholder="Search vendors..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-[38px] w-[220px] pl-9 pr-8 bg-surface border border-border-main rounded-lg text-[12px] font-bold text-primary-text outline-none focus:border-secondary-text focus:ring-2 focus:ring-accent/5 transition-all placeholder:font-normal placeholder:text-muted-text"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-text hover:text-primary-text transition-colors cursor-pointer"
              >
                <RotateCw size={12} className="animate-spin-once" />
              </button>
            )}
          </div>
        </div>

        {/* Info indicator */}
        <div className="flex items-center gap-2 self-start xl:self-auto text-[11px] font-bold text-muted-text bg-surface border border-border-main rounded-xl px-3 py-1.5">
          <HelpCircle size={13} className="text-secondary-text" />
          <span>Profit = Sales Amount - Purchase Amount</span>
        </div>
      </div>

      {/* Main Table view */}
      <div className="flex-1 min-h-0 bg-card rounded-2xl border border-border-main shadow-sm flex flex-col overflow-hidden">
        <div className="overflow-x-auto w-full h-full">
          <table className="w-full text-left border-collapse table-auto min-w-[900px]">
            <thead className="bg-table-head sticky top-0 z-10 border-b border-border-main">
              <tr>
                <th className="px-5 py-3.5 text-[10px] font-black text-muted-text uppercase tracking-wider w-[35%]">
                  Vendor / Supplier
                </th>
                <th className="px-4 py-3.5 text-[10px] font-black text-muted-text uppercase tracking-wider text-center w-[10%]">
                  Products
                </th>
                <th className="px-4 py-3.5 text-[10px] font-black text-muted-text uppercase tracking-wider text-center w-[12%]">
                  Transactions
                </th>
                <th
                  onClick={() => toggleSort('SALE_AMOUNT')}
                  className="px-4 py-3.5 text-[10px] font-black text-muted-text uppercase tracking-wider text-right w-[14%] cursor-pointer select-none group"
                >
                  Total Sale {renderSortIcon('SALE_AMOUNT')}
                </th>
                <th
                  onClick={() => toggleSort('PURCHASE_AMOUNT')}
                  className="px-4 py-3.5 text-[10px] font-black text-muted-text uppercase tracking-wider text-right w-[14%] cursor-pointer select-none group"
                >
                  Total Purchase {renderSortIcon('PURCHASE_AMOUNT')}
                </th>
                <th
                  onClick={() => toggleSort('PROFIT')}
                  className="px-5 py-3.5 text-[10px] font-black text-muted-text uppercase tracking-wider text-right w-[15%] cursor-pointer select-none group"
                >
                  Profit Margin {renderSortIcon('PROFIT')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Skeleton width={32} height={32} borderRadius={8} />
                        <div className="flex flex-col gap-1.5 flex-1">
                          <Skeleton width="60%" height={12} borderRadius={4} />
                          <Skeleton width="35%" height={9} borderRadius={4} />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <Skeleton width={20} height={12} borderRadius={4} />
                    </td>
                    <td className="px-4 py-4 text-center">
                      <Skeleton width={30} height={12} borderRadius={4} />
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Skeleton width={80} height={12} borderRadius={4} className="ml-auto" />
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Skeleton width={80} height={12} borderRadius={4} className="ml-auto" />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex flex-col gap-1 ml-auto items-end">
                        <Skeleton width={85} height={12} borderRadius={4} />
                        <Skeleton width={45} height={9} borderRadius={4} />
                      </div>
                    </td>
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Store size={36} className="text-muted-text opacity-40 animate-pulse" />
                      <p className="text-[13px] font-bold text-muted-text">
                        No vendor profit metrics found
                      </p>
                      <p className="text-[11px] text-muted-text/80 font-medium">
                        Try adjusting your filters, search term, or date range
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.map(item => {
                  const profitIsPositive = item.totalProfit >= 0
                  return (
                    <tr
                      key={item.supplierId}
                      className="hover:bg-secondary/20 transition-colors group"
                    >
                      {/* Supplier Name & Address */}
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-surface border border-border-main flex items-center justify-center text-muted-text shrink-0">
                            <Store size={14} className="opacity-60" />
                          </div>
                          <div className="min-w-0">
                            <span className="block text-[13px] font-black text-primary-text tracking-tight truncate">
                              {item.supplierName}
                            </span>
                            {item.supplierAddress && (
                              <span className="block text-[10px] font-medium text-muted-text truncate max-w-[300px] mt-0.5">
                                {item.supplierAddress}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Product Count */}
                      <td className="px-4 py-3 text-center text-[13px] font-bold text-secondary-text">
                        {item.productCount}
                      </td>

                      {/* Transaction Count */}
                      <td className="px-4 py-3 text-center text-[13px] font-bold text-secondary-text">
                        {item.transactionCount.toLocaleString()}
                      </td>

                      {/* Sales Amount */}
                      <td className="px-4 py-3 text-right text-[13px] font-bold text-secondary-text">
                        {formatCurrency(item.totalSaleAmount)}
                      </td>

                      {/* Purchase Amount */}
                      <td className="px-4 py-3 text-right text-[13px] font-medium text-muted-text">
                        {formatCurrency(item.totalPurchaseAmount)}
                      </td>

                      {/* Profit & Percentage Margin */}
                      <td className="px-5 py-3 text-right">
                        <span
                          className={`block text-[13px] font-black tracking-tight ${
                            profitIsPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {formatCurrency(item.totalProfit)}
                        </span>
                        <span
                          className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-black tracking-wider uppercase mt-1 ${
                            profitIsPositive
                              ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400'
                          }`}
                        >
                          {profitIsPositive ? '+' : ''}
                          {item.profitPercentage.toFixed(2)}% margin
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
