import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { format } from 'date-fns'
import { ChevronDown, ChevronLeft, ChevronRight, Search, Undo2, Building2, User, Box, Loader2 } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import toast from 'react-hot-toast'
import Skeleton from 'react-loading-skeleton'
import { SalesService, type ConsumptionBucket } from '../../services/salesService'
import { ConsumptionService, type BucketItem, type ConsumptionUnitInfo } from '../../services/consumptionService'
import { formatIndianCurrency } from '../../utils/numberFormat'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const getDayInfo = (dateStr: string) => {
  const d = new Date(dateStr + 'T00:00:00')
  return {
    day: format(d, 'EEE').toUpperCase(),
    display: format(d, 'dd MMM, yyyy'),
  }
}

const formatCompactCurrency = (v: number) => {
  if (!v) return '₹0'
  if (v >= 100_000) {
    const stringVal = (v / 100_000).toFixed(2)
    return `₹${stringVal.replace(/\.00$/, '')} L`
  }
  if (v >= 1_000) {
    const stringVal = (v / 1_000).toFixed(2)
    return `₹${stringVal.replace(/\.00$/, '')} K`
  }
  return `₹${v.toFixed(2)}`
}

export default function ConsumptionLogsPage() {
  const { siteName: rawSiteName = '', unitLabel: rawUnitLabel = '' } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()

  const siteName = decodeURIComponent(rawSiteName)
  const unitLabel = decodeURIComponent(rawUnitLabel)

  // Resolved from API
  const [unitInfo, setUnitInfo] = useState<ConsumptionUnitInfo | null>(null)
  const [isLoadingInfo, setIsLoadingInfo] = useState(true)

  // Derived IDs (set once unitInfo loads)
  const siteId = unitInfo?.siteId ?? 0
  const cuId = unitInfo?.unitId ?? 0

  // State
  const [buckets, setBuckets] = useState<ConsumptionBucket[]>([])
  const [isLoadingBuckets, setIsLoadingBuckets] = useState(true)
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set())
  const [expandedItems, setExpandedItems] = useState<Map<string, BucketItem[]>>(new Map())
  const [loadingDates, setLoadingDates] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')

  // Month picker init
  const now = new Date()
  let initialYear = now.getFullYear()
  let initialMonth = now.getMonth()

  const monthParam = searchParams.get('month')
  if (monthParam) {
    const [y, m] = monthParam.split('-').map(Number)
    if (!isNaN(y) && !isNaN(m)) {
      initialYear = y
      initialMonth = m - 1
    }
  }

  const [selectedYear, setSelectedYear] = useState(initialYear)
  const [selectedMonth, setSelectedMonth] = useState(initialMonth)
  
  // Custom Date Picker State
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const [pickerYear, setPickerYear] = useState(selectedYear)
  const [monthlyBuckets, setMonthlyBuckets] = useState<Record<string, { items: number; total: number }>>({})
  const [isLoadingMonthlyBuckets, setIsLoadingMonthlyBuckets] = useState(false)
  const monthPickerRef = useRef<HTMLDivElement>(null)

  // Close Date Picker on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (monthPickerRef.current && !monthPickerRef.current.contains(event.target as Node)) {
        setIsDatePickerOpen(false)
      }
    }
    if (isDatePickerOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isDatePickerOpen])

  // Resolve siteId & cuId from URL path params via API
  useEffect(() => {
    if (!siteName || !unitLabel) return
    setIsLoadingInfo(true)
    ConsumptionService.fetchBySiteNameAndDsr(siteName, unitLabel)
      .then(res => setUnitInfo(res.data))
      .catch(err => {
        console.error(err)
        toast.error('Failed to load unit info')
      })
      .finally(() => setIsLoadingInfo(false))
  }, [siteName, unitLabel])

  // Fetch monthly buckets stats for popover when pickerYear changes
  useEffect(() => {
    if (!siteId || !cuId || !isDatePickerOpen) return
    setIsLoadingMonthlyBuckets(true)
    SalesService.fetchMonthlyBuckets(siteId, cuId, pickerYear)
      .then(res => setMonthlyBuckets(res.data || {}))
      .catch(err => {
        console.error(err)
      })
      .finally(() => setIsLoadingMonthlyBuckets(false))
  }, [siteId, cuId, pickerYear, isDatePickerOpen])

  // Fetch buckets once IDs are resolved
  useEffect(() => {
    if (!siteId || !cuId) return
    setIsLoadingBuckets(true)
    const from = new Date(selectedYear, selectedMonth, 1)
    const to = new Date(selectedYear, selectedMonth + 1, 0)
    const fromDate = format(from, 'yyyy-MM-dd')
    const toDate = format(to, 'yyyy-MM-dd')

    SalesService.fetchConsumptionBuckets(siteId, cuId, fromDate, toDate)
      .then(res => {
        setBuckets(res.data || [])
        setExpandedDates(new Set())
        setExpandedItems(new Map())
      })
      .catch(err => {
        console.error(err)
        toast.error('Failed to load consumption data')
      })
      .finally(() => setIsLoadingBuckets(false))
  }, [siteId, cuId, selectedYear, selectedMonth])

  // Toggle accordion
  const toggleDate = useCallback(async (date: string) => {
    setExpandedDates(prev => {
      const next = new Set(prev)
      if (next.has(date)) {
        next.delete(date)
        return next
      }
      next.add(date)
      return next
    })

    // Fetch items if not already loaded
    if (!expandedItems.has(date)) {
      setLoadingDates(prev => new Set(prev).add(date))
      try {
        const res = await ConsumptionService.fetchBucketItems({
          siteId,
          consumptionUnitId: cuId,
          fromDate: date,
          toDate: date,
          sortDir: 'DESC',
          productName: searchTerm,
        })
        setExpandedItems(prev => new Map(prev).set(date, res.data || []))
      } catch {
        toast.error('Failed to load items')
      } finally {
        setLoadingDates(prev => {
          const s = new Set(prev)
          s.delete(date)
          return s
        })
      }
    }
  }, [siteId, cuId, searchTerm, expandedItems])

  // Refetch expanded items when search changes
  useEffect(() => {
    if (expandedDates.size === 0) return
    const timer = setTimeout(() => {
      expandedDates.forEach(async date => {
        setLoadingDates(prev => new Set(prev).add(date))
        try {
          const res = await ConsumptionService.fetchBucketItems({
            siteId,
            consumptionUnitId: cuId,
            fromDate: date,
            toDate: date,
            sortDir: 'DESC',
            productName: searchTerm,
          })
          setExpandedItems(prev => new Map(prev).set(date, res.data || []))
        } catch {
          /* silently fail for search refresh */
        } finally {
          setLoadingDates(prev => {
            const s = new Set(prev)
            s.delete(date)
            return s
          })
        }
      })
    }, 400)
    return () => clearTimeout(timer)
  }, [searchTerm]) // eslint-disable-line react-hooks/exhaustive-deps

  // Revert item
  const handleRevert = async (cuBillId: number, date: string) => {
    if (!window.confirm('Revert this item back to inventory?')) return
    try {
      await ConsumptionService.revertConsumedItem({ consumptionUnitId: cuBillId, siteId })
      toast.success('Item reverted to inventory')
      setExpandedItems(prev => {
        const m = new Map(prev)
        const items = m.get(date) || []
        m.set(date, items.filter(i => i.cuBillId !== cuBillId))
        return m
      })
      setBuckets(prev =>
        prev.map(b =>
          b.consumptionDate === date
            ? { ...b, itemsCount: Math.max(0, b.itemsCount - 1) }
            : b
        )
      )
    } catch {
      toast.error('Failed to revert item')
    }
  }

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* ── Info Header Card ─────────────────────────────────────── */}
      <div className="shrink-0 bg-card border-b border-border-main px-4 md:px-6 py-5">
        <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h1 className="text-[22px] font-black text-primary-text tracking-tight leading-tight uppercase">
              {unitInfo?.description || unitLabel}
            </h1>
            <p className="text-[13px] font-medium text-muted-text mt-0.5">
              Type: {unitInfo?.name || unitLabel}
            </p>
          </div>
          <div className="flex flex-col items-start sm:items-end gap-1.5">
            <div className="flex items-center gap-2 text-[13px] font-semibold text-secondary-text">
              <Building2 size={13} className="text-muted-text shrink-0" />
              <span>
                Site :: <span className="text-primary-text font-bold">{unitInfo?.siteName || siteName}</span>
              </span>
            </div>
            {isLoadingInfo ? (
              <Skeleton width={200} height={14} borderRadius={4} />
            ) : unitInfo?.managerName ? (
              <div className="flex items-center gap-2 text-[13px] font-semibold text-secondary-text">
                <User size={13} className="text-muted-text shrink-0" />
                <span>
                  Manager ::{' '}
                  <span className="text-primary-text font-bold">
                    {unitInfo.managerName}
                  </span>
                </span>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* ── Search + Month Picker ────────────────────────────────── */}
      <div className="shrink-0 px-4 md:px-6 py-4 z-20 relative">
        <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-4">
          <div className="relative group w-full sm:max-w-[280px]">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-text group-focus-within:text-secondary-text"
            />
            <input
              type="text"
              placeholder="Search product name"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full h-[38px] pl-9 pr-4 bg-card border border-border-main rounded-lg text-[12px] font-bold text-primary-text outline-none focus:border-secondary-text transition-all"
            />
          </div>
          
          <div className="relative w-full sm:w-auto" ref={monthPickerRef}>
            <button
              onClick={() => {
                if (!isDatePickerOpen) {
                  setPickerYear(selectedYear)
                }
                setIsDatePickerOpen(!isDatePickerOpen)
              }}
              className="h-[38px] px-4 flex items-center justify-between gap-3 bg-card border border-border-main rounded-lg text-[13px] font-bold text-primary-text hover:border-secondary-text transition-all w-full sm:w-[160px]"
            >
              <span>{MONTHS[selectedMonth]} {selectedYear}</span>
              <ChevronDown size={14} className={`text-muted-text transition-transform duration-200 ${isDatePickerOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isDatePickerOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 top-[calc(100%+8px)] w-[calc(100vw-32px)] sm:w-[400px] md:w-[480px] bg-card rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-border-main p-4 md:p-5 z-50 origin-top-right dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] flex flex-col max-h-[65vh] sm:max-h-[calc(100vh-220px)]"
                >
                  {/* Fixed Header */}
                  <div className="flex items-center justify-center gap-6 mb-4 shrink-0">
                    <button
                      onClick={() => setPickerYear(y => y - 1)}
                      className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface text-secondary-text hover:text-primary-text transition-colors bg-card border border-border-main shadow-sm"
                    >
                      <ChevronLeft size={16} strokeWidth={2.5} />
                    </button>
                    <span className="text-[22px] font-black text-primary-text w-20 text-center tracking-tight">{pickerYear}</span>
                    <button
                      onClick={() => setPickerYear(y => y + 1)}
                      className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface text-secondary-text hover:text-primary-text transition-colors disabled:opacity-30 disabled:hover:bg-transparent bg-card border border-border-main shadow-sm"
                      disabled={pickerYear >= new Date().getFullYear() + 1}
                    >
                      <ChevronRight size={16} strokeWidth={2.5} />
                    </button>
                  </div>

                  {/* Scrollable Grid */}
                  <div className="overflow-y-auto px-1 py-1 -mx-1 flex-1 min-h-0 customized-scrollbar">
                    <div className="grid grid-cols-1 min-[420px]:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 relative">
                      {isLoadingMonthlyBuckets ? (
                        Array.from({ length: 12 }).map((_, idx) => (
                          <div
                            key={idx}
                            className="flex flex-col p-3 md:p-4 rounded-[20px] transition-all text-left border bg-card border-border-main opacity-80"
                          >
                            <div className="flex items-start justify-between w-full mb-3">
                              <div className="flex flex-col">
                                <Skeleton width={28} height={15} className="mb-1" borderRadius={4} />
                                <Skeleton width={22} height={10} borderRadius={2} />
                              </div>
                              <Skeleton width={42} height={18} borderRadius={10} />
                            </div>
                            
                            <div className="flex flex-col w-full mb-3 gap-1.5">
                              <Skeleton width={80} height={22} borderRadius={4} />
                              <Skeleton width={50} height={9} borderRadius={2} />
                            </div>
                            
                            <div className="flex items-center gap-1.5 mt-auto">
                              <Skeleton width={6} height={6} borderRadius={3} inline className="mb-0.5" />
                              <Skeleton width={60} height={9} borderRadius={2} inline />
                            </div>
                          </div>
                        ))
                      ) : (
                        MONTHS.map((monthName, idx) => {
                          const data = monthlyBuckets[idx]
                          const isSelected = selectedYear === pickerYear && selectedMonth === idx
                          const hasData = !!data && data.items > 0
                          
                          const total = data?.total || 0
                          const items = data?.items || 0
                          
                          const bgClass = isSelected 
                            ? 'bg-[#111827] border-[#111827] dark:bg-zinc-100 dark:border-zinc-100 shadow-md transform scale-[1.02]' 
                            : 'bg-card border-border-main hover:border-secondary-text hover:shadow-sm'
                          
                          const textPri = isSelected ? 'text-white dark:text-zinc-900' : 'text-primary-text'
                          const textSec = isSelected ? 'text-zinc-400 dark:text-zinc-500' : 'text-muted-text'
                          
                          return (
                            <button
                              key={idx}
                              onClick={() => {
                                if (!hasData && !isSelected) return
                                setSelectedYear(pickerYear)
                                setSelectedMonth(idx)
                                setIsDatePickerOpen(false)

                                const newParams = new URLSearchParams(searchParams)
                                const paddedMonth = String(idx + 1).padStart(2, '0')
                                newParams.set('month', `${pickerYear}-${paddedMonth}`)
                                setSearchParams(newParams, { replace: true })
                              }}
                              disabled={!hasData && !isSelected}
                              className={`flex flex-col p-3 md:p-4 rounded-[20px] transition-all text-left pointer-events-auto border ${bgClass} ${(!hasData && !isSelected) ? 'opacity-60 hover:border-border-main hover:shadow-none' : 'cursor-pointer group'}`}
                            >
                              <div className="flex items-start justify-between w-full mb-3">
                                <div className="flex flex-col leading-none">
                                  <span className={`text-[15px] font-black tracking-tight mb-0.5 ${textPri}`}>{monthName.slice(0, 3)}</span>
                                  <span className={`text-[10px] font-bold ${textSec}`}>{pickerYear}</span>
                                </div>
                                <div className={`px-2 py-0.5 rounded-full text-[9px] font-bold whitespace-nowrap leading-tight flex items-center justify-center ${
                                  isSelected 
                                    ? 'bg-zinc-800 text-zinc-300 dark:bg-zinc-200 dark:text-zinc-600'
                                    : hasData 
                                      ? 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' 
                                      : 'bg-surface text-muted-text'
                                }`}>
                                  {hasData ? `${items} items` : 'No items'}
                                </div>
                              </div>
                              
                              <div className="flex flex-col w-full mb-3">
                                <span className={`text-[18px] md:text-[22px] font-black tracking-tight leading-none mb-1 ${textPri}`}>
                                  {formatCompactCurrency(total)}
                                </span>
                                <span className={`text-[9px] font-black uppercase tracking-widest ${textSec}`}>
                                  Total Value
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-1.5 mt-auto">
                                <div className={`w-1.5 h-1.5 shrink-0 rounded-full ${
                                  isSelected ? 'bg-blue-400' : hasData ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-zinc-600'
                                }`} />
                                <span className={`text-[9px] font-bold ${textSec}`}>
                                  {hasData ? 'Active month' : 'No activity recorded'}
                                </span>
                              </div>
                            </button>
                          )
                        })
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── Accordion List ───────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-8">
        <div className="max-w-[1200px] mx-auto flex flex-col gap-2">
          {isLoadingBuckets ? (
            Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="bg-card border border-border-main rounded-xl px-5 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton width={40} height={22} borderRadius={6} />
                    <Skeleton width={120} height={16} borderRadius={4} />
                  </div>
                  <Skeleton width={100} height={16} borderRadius={4} />
                </div>
              </div>
            ))
          ) : buckets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mb-4 shadow-inner">
                <Box size={32} className="text-muted-text opacity-50" />
              </div>
              <h3 className="text-[16px] font-bold text-primary-text mb-1 tracking-tight">
                No consumption data
              </h3>
              <p className="text-[13px] text-secondary-text max-w-[280px] leading-relaxed">
                No consumption records found for {MONTHS[selectedMonth]} {selectedYear}.
              </p>
            </div>
          ) : (
            buckets.map(bucket => {
              const { day, display } = getDayInfo(bucket.consumptionDate)
              const isExpanded = expandedDates.has(bucket.consumptionDate)
              const items = expandedItems.get(bucket.consumptionDate) || []
              const isLoadingItems = loadingDates.has(bucket.consumptionDate)

              return (
                <div
                  key={bucket.consumptionDate}
                  className="bg-card border border-border-main rounded-xl overflow-hidden shadow-sm"
                >
                  {/* ── Accordion Header ──────────────────────────── */}
                  <button
                    onClick={() => toggleDate(bucket.consumptionDate)}
                    className="w-full px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-surface/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <ChevronDown
                        size={16}
                        className={`text-muted-text transition-transform duration-200 ${isExpanded ? '' : '-rotate-90'}`}
                      />
                      <span className="inline-flex items-center px-2.5 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[11px] font-black rounded-md tracking-wide">
                        {day}
                      </span>
                      <span className="text-[14px] font-bold text-primary-text">
                        {display}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-right">
                      <span className="text-[12px] font-medium text-muted-text">
                        {bucket.itemsCount} items
                      </span>
                      <span className="text-[12px] text-muted-text">|</span>
                      <span className="text-[14px] font-black text-emerald-600">
                        {formatIndianCurrency(bucket.totalAmountIncTax)}
                      </span>
                    </div>
                  </button>

                  {/* ── Expanded Content ──────────────────────────── */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-border-main/50">
                          {isLoadingItems ? (
                            <div className="px-5 py-8 flex items-center justify-center gap-3 text-muted-text">
                              <Loader2 size={16} className="animate-spin" />
                              <span className="text-[13px] font-medium italic">
                                Loading items...
                              </span>
                            </div>
                          ) : items.length === 0 ? (
                            <div className="px-5 py-8 text-center text-[13px] font-medium text-muted-text">
                              No items found for this date.
                            </div>
                          ) : (
                            <div className="overflow-x-auto">
                              <table
                                className="w-full text-left border-collapse table-fixed"
                                style={{ minWidth: '820px' }}
                              >
                                <colgroup>
                                  <col style={{ width: '50px' }} />
                                  <col style={{ width: '30%' }} />
                                  <col style={{ width: '20%' }} />
                                  <col style={{ width: '80px' }} />
                                  <col style={{ width: '120px' }} />
                                  <col style={{ width: '180px' }} />
                                </colgroup>
                                <thead>
                                  <tr className="bg-surface/60">
                                    <th className="px-4 py-3 text-[11px] font-black text-muted-text uppercase tracking-wider">
                                      S. No
                                    </th>
                                    <th className="px-4 py-3 text-[11px] font-black text-muted-text uppercase tracking-wider">
                                      Item
                                    </th>
                                    <th className="px-4 py-3 text-[11px] font-black text-muted-text uppercase tracking-wider">
                                      Consumed by
                                    </th>
                                    <th className="px-4 py-3 text-[11px] font-black text-muted-text uppercase tracking-wider text-center">
                                      Quantity
                                    </th>
                                    <th className="px-4 py-3 text-[11px] font-black text-muted-text uppercase tracking-wider">
                                      Amount ↑↓
                                    </th>
                                    <th className="px-4 py-3 text-[11px] font-black text-muted-text uppercase tracking-wider text-right">
                                      Action
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-border-main/30">
                                  {items.map((item, idx) => {
                                    const baseAmount = item.price * item.qty
                                    const tax = Math.max(0, item.amountIncTax - baseAmount)
                                    const emailName =
                                      item.consumedByEmail?.split('@')[0] || 'Unknown'

                                    return (
                                      <tr
                                        key={item.cuBillId}
                                        className="hover:bg-surface/30 transition-colors"
                                      >
                                        <td className="px-4 py-3.5 text-[13px] font-bold text-muted-text align-middle">
                                          {idx + 1}
                                        </td>
                                        <td className="px-4 py-3.5 align-middle">
                                          <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-card border border-border-main rounded-lg shrink-0 overflow-hidden flex items-center justify-center p-0.5">
                                              {item.imageUrl ? (
                                                <img
                                                  src={item.imageUrl}
                                                  alt=""
                                                  className="w-full h-full object-contain"
                                                />
                                              ) : (
                                                <Box className="text-muted-text w-5 h-5" />
                                              )}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                              <span className="text-[13px] font-bold text-primary-text leading-tight truncate">
                                                {item.productName}
                                              </span>
                                              <span className="text-[11px] font-medium text-muted-text mt-0.5 truncate">
                                                {item.vendorNames || 'No vendor'}
                                              </span>
                                            </div>
                                          </div>
                                        </td>
                                        <td className="px-4 py-3.5 align-middle">
                                          <div className="flex flex-col min-w-0">
                                            <span className="text-[13px] font-bold text-primary-text capitalize truncate">
                                              {emailName}
                                            </span>
                                            <span className="text-[11px] font-medium text-muted-text truncate">
                                              {item.consumedByEmail}
                                            </span>
                                          </div>
                                        </td>
                                        <td className="px-4 py-3.5 text-center align-middle">
                                          <div className="flex flex-col items-center">
                                            <span className="text-[13px] font-bold text-primary-text">
                                              {item.qty}
                                            </span>
                                            <span className="text-[11px] font-medium text-muted-text">
                                              {item.unit}
                                            </span>
                                          </div>
                                        </td>
                                        <td className="px-4 py-3.5 align-middle">
                                          <div className="flex flex-col">
                                            <span className="text-[14px] font-black text-primary-text">
                                              ₹{baseAmount.toFixed(2)}
                                            </span>
                                            {tax > 0 && (
                                              <span className="text-[11px] font-medium text-emerald-600 mt-0.5">
                                                + ₹{tax.toFixed(2)} tax
                                              </span>
                                            )}
                                          </div>
                                        </td>
                                        <td className="px-4 py-3.5 text-right align-middle">
                                          <button
                                            onClick={() =>
                                              handleRevert(item.cuBillId, bucket.consumptionDate)
                                            }
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-emerald-500/30 text-emerald-500 text-[12px] font-bold rounded-full hover:bg-emerald-500/10 transition-colors cursor-pointer whitespace-nowrap"
                                          >
                                            Revert to Inventory <Undo2 size={11} />
                                          </button>
                                        </td>
                                      </tr>
                                    )
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
