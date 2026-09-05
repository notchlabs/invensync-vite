import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronDown, Clock, TrendingUp, TrendingDown, Sun, Moon, Tag, ShoppingCart, Calendar, ShoppingBag, PieChart, ExternalLink } from 'lucide-react'
import Skeleton from 'react-loading-skeleton'
import { SalesService, type MonthlySummary, type ConsumptionBucket, type DaySaleData } from '../../services/salesService'
import { ConsumptionService, type BucketItem } from '../../services/consumptionService'
import { ENV } from '../../config/env'
import { formatIndianNumber } from '../../utils/numberFormat'

const fmtTime = (iso?: string) => {
  if (!iso) return null
  const match = iso.match(/T(\d{2}):(\d{2})/)
  if (!match) return null
  let h = parseInt(match[1])
  const m = match[2]
  const ampm = h >= 12 ? 'PM' : 'AM'
  h = h % 12 || 12
  return `${h}:${m} ${ampm}`
}

const formatDateBlock = (dateStr: string) => {
  const parts = dateStr.split('-')
  if (parts.length === 3) {
    const year = parts[0]
    const monthIdx = parseInt(parts[1], 10) - 1
    const dayNum = parseInt(parts[2], 10).toString()
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const dateObj = new Date(parseInt(year, 10), monthIdx, parseInt(parts[2], 10))
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    return {
      dayNum,
      monthYear: `${monthNames[monthIdx] || ''}, ${year}`,
      dayName: days[dateObj.getDay()] || ''
    }
  }
  return { dayNum: dateStr, monthYear: '', dayName: '' }
}

const SITE_ID = Number(ENV.DEFAULT_SITE_ID)
const CU_ID   = Number(ENV.DEFAULT_CONSUMPTION_UNIT_ID)

function parseMonthYear(monthYear: string) {
  const [y, m] = monthYear.split('-').map(Number)
  return { year: y, month: m }
}

function monthLabel(year: number, month: number) {
  return new Date(year, month - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' })
}

function lastDayOfMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}

/* ── Sub-components ──────────────────────────────────────── */

function StatChip({ value, up }: { value: number; up: boolean }) {
  const abs = Math.abs(value).toFixed(2)
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-black px-1.5 py-0.5 rounded-md ${
      up ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
    }`}>
      {up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
      {up ? '+' : '-'}{abs}%
    </span>
  )
}


/* ── Day Sale card ──────────────────────────────────────── */
function DaySaleCard({ loading, data, variant }: Readonly<{ loading: boolean; data: DaySaleData | undefined; variant: 'highest' | 'lowest' }>) {
  const isHigh = variant === 'highest'
  const accent = isHigh
    ? { dot: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', badge: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300', bar: 'bg-emerald-500' }
    : { dot: 'bg-rose-500',   text: 'text-rose-600 dark:text-rose-400',       badge: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300',           bar: 'bg-rose-400' }

  const label = isHigh ? 'Best Day' : 'Lowest Day'
  const Icon  = isHigh ? TrendingUp : TrendingDown

  const dateLabel = data?.date
    ? new Date(data.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—'

  const rows: { label: string; dot: string; value: number }[] = data ? [
    { label: 'WBC Sale', dot: 'bg-amber-400',  value: data.wbcSale },
    { label: 'W Store',  dot: 'bg-indigo-400', value: data.wstoreSale },
  ] : []

  return (
    <div className="bg-card border border-border-main rounded-2xl p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isHigh ? 'bg-emerald-50 dark:bg-emerald-500/15' : 'bg-rose-50 dark:bg-rose-500/15'}`}>
            <Icon size={14} className={accent.text} />
          </div>
          <span className="text-[13px] font-black text-primary-text">{label}</span>
        </div>
        {loading ? (
          <Skeleton width={80} height={20} borderRadius={6} />
        ) : (
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${accent.badge}`}>{dateLabel}</span>
        )}
      </div>

      {/* Total sale hero */}
      {loading ? (
        <Skeleton height={32} borderRadius={6} />
      ) : data ? (
        <div>
          <p className="text-[10px] font-black text-muted-text uppercase tracking-widest mb-0.5">Total Sale</p>
          <p className={`text-[26px] font-black leading-none tracking-tight ${accent.text}`}>
            ₹{formatIndianNumber(data.totalSale)}
          </p>
        </div>
      ) : null}

      {/* Breakdown rows */}
      <div className="flex flex-col gap-1.5 pt-2 border-t border-border-main/60">
        {loading ? (
          <>
            <Skeleton height={14} borderRadius={4} />
            <Skeleton height={14} borderRadius={4} />
            <Skeleton height={14} borderRadius={4} />
          </>
        ) : rows.map(r => (
          <div key={r.label} className="flex items-center justify-between">
            <span className={`flex items-center gap-1.5 text-[12px] font-medium text-secondary-text`}>
              <span className={`w-1.5 h-1.5 rounded-full ${r.dot}`} />{r.label}
            </span>
            <span className="text-[12px] font-bold text-primary-text">₹{formatIndianNumber(r.value)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Main page ───────────────────────────────────────────── */
export default function DashboardMonthPage() {
  const navigate = useNavigate()
  const { monthYear = '' } = useParams<{ monthYear: string }>()
  const { year, month } = parseMonthYear(monthYear)

  const [summary, setSummary] = useState<MonthlySummary | null>(null)
  const [buckets, setBuckets] = useState<ConsumptionBucket[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedDate, setExpandedDate] = useState<string | null>(null)
  const [dayItems, setDayItems] = useState<Record<string, BucketItem[]>>({})
  const [dayItemsLoading, setDayItemsLoading] = useState<Record<string, boolean>>({})

  const handleToggleDate = (date: string) => {
    if (expandedDate === date) {
      setExpandedDate(null)
      return
    }
    setExpandedDate(date)
    if (dayItems[date] !== undefined) return
    setDayItemsLoading(prev => ({ ...prev, [date]: true }))
    ConsumptionService.fetchBucketItems({
      siteId: SITE_ID,
      consumptionUnitId: CU_ID,
      fromDate: date,
      toDate: date,
      sortDir: 'ASC',
      productName: '',
    })
      .then(res => {
        setDayItems(prev => ({ ...prev, [date]: res.data ?? [] }))
      })
      .catch(() => {
        setDayItems(prev => ({ ...prev, [date]: [] }))
      })
      .finally(() => {
        setDayItemsLoading(prev => ({ ...prev, [date]: false }))
      })
  }

  // Adjusting state during render to avoid cascading renders in useEffect
  const [prevMonthYear, setPrevMonthYear] = useState(monthYear)
  if (monthYear !== prevMonthYear) {
    setPrevMonthYear(monthYear)
    setLoading(true)
  }

  useEffect(() => {
    if (!year || !month) return

    const lastDay = lastDayOfMonth(year, month)
    const fromDate = `${year}-${String(month).padStart(2, '0')}-01T00:00:00.000Z`
    const toDate   = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}T23:59:59.999Z`

    Promise.all([
      SalesService.fetchMonthlySummary(SITE_ID, year, month),
      SalesService.fetchConsumptionBuckets(SITE_ID, CU_ID, fromDate, toDate),
    ])
      .then(([sumRes, bucketsRes]) => {
        if (sumRes.data) setSummary(sumRes.data)
        if (bucketsRes.data) setBuckets(bucketsRes.data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [year, month])

  const ms = summary?.monthlySummary

  return (
    <div className="p-4 md:p-6 max-w-[1500px] mx-auto w-full flex flex-col gap-6 overflow-y-auto h-full">

      {/* ── Monthly Sales Summary (feature card) ───────────── */}
      <div className="rounded-2xl bg-card border border-stats-card-border p-5 flex flex-col gap-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-stats-muted" />
            <span className="text-[13px] font-black text-stats-text tracking-tight">Monthly Sales Summary</span>
          </div>
          <span className="text-[12px] font-semibold text-stats-muted">
            {monthLabel(year, month)}
          </span>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-stats-card-border">
          {loading ? (
            (['total', 'avg', 'wbc', 'wstore'] as const).map((k) => (
              <div key={k} className="flex flex-col gap-2 px-4 first:pl-0 last:pr-0 py-3 md:py-0">
                <Skeleton width={64} height={9} borderRadius={3} baseColor="var(--border-stats-card)" highlightColor="var(--text-stats-label)" />
                <Skeleton width={120} height={24} borderRadius={5} baseColor="var(--border-stats-card)" highlightColor="var(--text-stats-label)" />
                <Skeleton width={52} height={18} borderRadius={5} baseColor="var(--border-stats-card)" highlightColor="var(--text-stats-label)" />
              </div>
            ))
          ) : ms ? (
            <>
              <div className="flex flex-col gap-1.5 px-4 first:pl-0 py-3 md:py-0">
                <span className="text-[10px] font-black text-stats-muted uppercase tracking-widest">Total Sale</span>
                <p className="text-[22px] font-black text-stats-text leading-none tracking-tight">₹{formatIndianNumber(ms.totalSale)}</p>
                <StatChip value={ms.totalSalePercentageChange} up={ms.totalSalePercentageChange >= 0} />
              </div>
              <div className="flex flex-col gap-1.5 px-4 py-3 md:py-0">
                <span className="text-[10px] font-black text-stats-muted uppercase tracking-widest">Avg / Day</span>
                <p className="text-[22px] font-black text-stats-text leading-none tracking-tight">₹{formatIndianNumber(ms.avgPerDay)}</p>
                <StatChip value={ms.avgPerDayPercentageChange} up={ms.avgPerDayPercentageChange >= 0} />
              </div>
              <div className="flex flex-col gap-1.5 px-4 py-3 md:py-0">
                <span className="text-[10px] font-black text-stats-muted uppercase tracking-widest">WBC Total</span>
                <p className="text-[22px] font-black text-amber-500 leading-none tracking-tight">₹{formatIndianNumber(ms.wbcSale)}</p>
              </div>
              <div className="flex flex-col gap-1.5 px-4 last:pr-0 py-3 md:py-0">
                <span className="text-[10px] font-black text-stats-muted uppercase tracking-widest">W Store Total</span>
                <p className="text-[22px] font-black text-indigo-500 leading-none tracking-tight">₹{formatIndianNumber(ms.wstoreSale)}</p>
              </div>
            </>
          ) : null}
        </div>
      </div>

      {/* ── Shift Performance ───────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <p className="text-[10px] font-black text-muted-text uppercase tracking-widest">Shift Performance</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {loading ? (
            <>
              <Skeleton height={110} borderRadius={16} />
              <Skeleton height={110} borderRadius={16} />
            </>
          ) : summary ? (() => {
              const combined = summary.shiftASummary.totalSale + summary.shiftBSummary.totalSale
              const aPct = combined > 0 ? (summary.shiftASummary.totalSale / combined) * 100 : 50

              return (
                <>
                  {/* Shift A */}
                  <div className="relative bg-card border border-border-main rounded-2xl overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent pointer-events-none" />
                    <div className="relative p-5 flex flex-col gap-4">
                      {/* Header row */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 border border-amber-200 dark:border-amber-500/30 flex items-center justify-center shrink-0">
                            <Sun size={18} className="text-amber-600 dark:text-amber-400" />
                          </div>
                          <div>
                            <p className="text-[15px] font-black text-primary-text leading-none">Shift A</p>
                            <p className="text-[11px] font-semibold text-muted-text mt-0.5">Day Shift</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-muted-text uppercase tracking-widest mb-0.5">Total Sale</p>
                          <p className="text-[22px] font-black text-amber-600 dark:text-amber-400 leading-none tracking-tight">
                            ₹{formatIndianNumber(summary.shiftASummary.totalSale)}
                          </p>
                        </div>
                      </div>

                      {/* Share bar */}
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-[10px] font-bold text-muted-text uppercase tracking-wider">
                          <span>Share of combined</span>
                          <span className="text-amber-600 dark:text-amber-400">{aPct.toFixed(1)}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-border-main overflow-hidden">
                          <div className="h-full rounded-full bg-amber-400 transition-all duration-700" style={{ width: `${aPct}%` }} />
                        </div>
                      </div>

                      {/* Sub-rows */}
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border-main/50">
                        <div className="flex flex-col gap-0.5">
                          <span className="flex items-center gap-1 text-[10px] font-bold text-muted-text uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />WBC
                          </span>
                          <span className="text-[14px] font-black text-primary-text">₹{formatIndianNumber(summary.shiftASummary.wbcSale)}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="flex items-center gap-1 text-[10px] font-bold text-muted-text uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />W Store
                          </span>
                          <span className="text-[14px] font-black text-primary-text">₹{formatIndianNumber(summary.shiftASummary.wstoreSale)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Shift B */}
                  <div className="relative bg-card border border-border-main rounded-2xl overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent pointer-events-none" />
                    <div className="relative p-5 flex flex-col gap-4">
                      {/* Header row */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/20 border border-blue-200 dark:border-blue-500/30 flex items-center justify-center shrink-0">
                            <Moon size={18} className="text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <p className="text-[15px] font-black text-primary-text leading-none">Shift B</p>
                            <p className="text-[11px] font-semibold text-muted-text mt-0.5">Night Shift</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-muted-text uppercase tracking-widest mb-0.5">Total Sale</p>
                          <p className="text-[22px] font-black text-blue-600 dark:text-blue-400 leading-none tracking-tight">
                            ₹{formatIndianNumber(summary.shiftBSummary.totalSale)}
                          </p>
                        </div>
                      </div>

                      {/* Share bar */}
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-[10px] font-bold text-muted-text uppercase tracking-wider">
                          <span>Share of combined</span>
                          <span className="text-blue-600 dark:text-blue-400">{(100 - aPct).toFixed(1)}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-border-main overflow-hidden">
                          <div className="h-full rounded-full bg-blue-400 transition-all duration-700" style={{ width: `${100 - aPct}%` }} />
                        </div>
                      </div>

                      {/* Sub-rows */}
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border-main/50">
                        <div className="flex flex-col gap-0.5">
                          <span className="flex items-center gap-1 text-[10px] font-bold text-muted-text uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />WBC
                          </span>
                          <span className="text-[14px] font-black text-primary-text">₹{formatIndianNumber(summary.shiftBSummary.wbcSale)}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="flex items-center gap-1 text-[10px] font-bold text-muted-text uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />W Store
                          </span>
                          <span className="text-[14px] font-black text-primary-text">₹{formatIndianNumber(summary.shiftBSummary.wstoreSale)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )
            })()
          : null}
        </div>
      </div>

      {/* ── Best & Lowest Day ───────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <DaySaleCard loading={loading} data={summary?.highestDaySale} variant="highest" />
        <DaySaleCard loading={loading} data={summary?.lowestDaySale}  variant="lowest"  />
      </div>

      {/* ── Daily Sales ─────────────────────────────────────── */}
      <div className="flex flex-col gap-4">
        {/* Header Title + Stats Pills */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <TrendingUp size={20} />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-primary-text tracking-tight">Daily Sales</h2>
              <p className="text-xs text-muted-text font-medium">Overview of your daily sales performance and profitability.</p>
            </div>
          </div>

          {/* Quick summary stat badges */}
          {!loading && buckets.length > 0 && (() => {
            const totalPurchases = buckets.reduce((sum, b) => sum + (b.totalAmountIncTax || 0), 0);
            const totalProfits = buckets.reduce((sum, b) => sum + ((b.totalSales || 0) - (b.totalAmountIncTax || 0)), 0);
            const totalSales = buckets.reduce((sum, b) => sum + (b.totalSales || 0), 0);
            const avgProfitPct = totalSales > 0 ? (totalProfits / totalSales) * 100 : 0;

            return (
              <div className="flex items-center gap-2 flex-wrap">
                <div className="bg-card border border-border-main rounded-xl px-3 py-1.5 flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                    <ShoppingBag size={13} />
                  </div>
                  <div>
                    <p className="text-[9.5px] font-bold text-muted-text uppercase tracking-wider">Total Purchase</p>
                    <p className="text-[12px] font-black text-primary-text">₹{formatIndianNumber(totalPurchases)}</p>
                  </div>
                </div>

                <div className="bg-card border border-border-main rounded-xl px-3 py-1.5 flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <TrendingUp size={13} />
                  </div>
                  <div>
                    <p className="text-[9.5px] font-bold text-muted-text uppercase tracking-wider">Total Profit</p>
                    <p className="text-[12px] font-black text-emerald-400">₹{formatIndianNumber(totalProfits)}</p>
                  </div>
                </div>

                <div className="bg-card border border-border-main rounded-xl px-3 py-1.5 flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                    <PieChart size={13} />
                  </div>
                  <div>
                    <p className="text-[9.5px] font-bold text-muted-text uppercase tracking-wider">Avg Profit %</p>
                    <p className="text-[12px] font-black text-purple-400">+{avgProfitPct.toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Bucket List Cards */}
        <div className="flex flex-col gap-2.5">
          {loading ? (
            (['d1','d2','d3','d4','d5','d6','d7'] as const).map((k) => (
              <div key={k} className="bg-card border border-border-main rounded-2xl px-4 py-3.5 flex items-center gap-4">
                <div className="min-w-[130px] flex flex-col gap-1.5">
                  <Skeleton width={100} height={13} borderRadius={4} />
                  <Skeleton width={60} height={11} borderRadius={4} />
                </div>
                <div className="flex-1 grid grid-cols-4 gap-2">
                  {(['sale','purchase','profit','diff'] as const).map((col) => (
                    <div key={col} className="flex flex-col gap-1">
                      <Skeleton width={44} height={10} borderRadius={3} />
                      <Skeleton width={80} height={13} borderRadius={4} />
                    </div>
                  ))}
                </div>
                <Skeleton width={15} height={15} borderRadius={4} />
              </div>
            ))
          ) : buckets.length === 0 ? (
            <p className="text-[13px] text-muted-text font-medium py-8 text-center">No daily data available</p>
          ) : (
            buckets.map((b) => {
              const profit    = b.totalSales - b.totalAmountIncTax
              const profitPct = b.totalSales > 0 ? (profit / b.totalSales) * 100 : 0
              const isOpen    = expandedDate === b.consumptionDate
              const isProfit  = profit >= 0
              const { dayNum, monthYear, dayName } = formatDateBlock(b.consumptionDate)

              const billedDiff = b.billedDiff ?? (b.recordedBilledAmountByManager != null && b.invoicedSales != null ? b.recordedBilledAmountByManager - b.invoicedSales : 0);
              const posDiff = b.posDiff ?? (b.recordedPosAmountByManager != null && b.upiAmount != null ? b.recordedPosAmountByManager - b.upiAmount : 0);

              const bPos = billedDiff > 0;
              const bNeg = billedDiff < 0;
              const pPos = posDiff > 0;
              const pNeg = posDiff < 0;

              return (
                <div key={b.consumptionDate} className="bg-card border border-border-main rounded-2xl overflow-hidden shadow-xs">
                  <button
                    onClick={() => handleToggleDate(b.consumptionDate)}
                    className="w-full flex flex-col md:flex-row md:items-center justify-between gap-3 px-4 py-3.5 hover:bg-surface/50 transition-colors cursor-pointer text-left"
                  >
                    {/* Date Block (Left) */}
                    <div className="flex items-center justify-between md:justify-start gap-3 min-w-[135px]">
                      <div className="bg-surface/80 border border-border-main/60 rounded-xl px-3 py-1.5 flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                          <Calendar size={15} />
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-baseline gap-1">
                            <span className="text-base font-black text-primary-text leading-none">{dayNum}</span>
                            <span className="text-[10px] font-bold text-muted-text">{monthYear}</span>
                          </div>
                          <span className="text-[9.5px] font-medium text-muted-text/70">{dayName}</span>
                        </div>
                      </div>

                      <div className="w-8 h-8 rounded-lg bg-surface border border-border-main md:hidden flex items-center justify-center text-muted-text">
                        <ChevronDown size={15} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                      </div>
                    </div>

                    {/* 4 Stats Columns */}
                    <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3 items-center md:px-3">
                      {/* Sale Column */}
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-surface border border-border-main flex items-center justify-center text-muted-text shrink-0">
                          <Tag size={14} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-muted-text uppercase tracking-wider">Sale</p>
                          <p className="text-[12.5px] sm:text-[13.5px] font-black text-primary-text">₹{formatIndianNumber(b.totalSales)}</p>
                        </div>
                      </div>

                      {/* Purchase Column */}
                      <div className="flex items-center gap-2.5 md:border-l md:border-border-main/40 md:pl-4">
                        <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                          <ShoppingCart size={14} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-muted-text uppercase tracking-wider">Purchase</p>
                          <p className="text-[12.5px] sm:text-[13.5px] font-black text-primary-text">₹{formatIndianNumber(b.totalAmountIncTax)}</p>
                        </div>
                      </div>

                      {/* Profit Column */}
                      <div className="flex items-center gap-2.5 md:border-l md:border-border-main/40 md:pl-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          isProfit ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border border-rose-500/20 text-rose-500'
                        }`}>
                          {isProfit ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-muted-text uppercase tracking-wider">Profit</p>
                          <p className={`text-[12.5px] sm:text-[13.5px] font-black ${isProfit ? 'text-emerald-400' : 'text-rose-500'}`}>
                            ₹{formatIndianNumber(Math.abs(profit))}
                          </p>
                          <p className={`text-[9.5px] font-bold ${isProfit ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {isProfit ? '+' : '-'}{Math.abs(profitPct).toFixed(0)}%
                          </p>
                        </div>
                      </div>

                      {/* Difference Column */}
                      <div className="md:border-l md:border-border-main/40 md:pl-4">
                        <p className="text-[10px] font-bold text-muted-text uppercase tracking-wider">Difference</p>
                        <div className="flex flex-col gap-0.5 mt-0.5">
                          <p className={`text-[11px] sm:text-[12px] font-black leading-tight ${
                            bPos ? 'text-emerald-400' : bNeg ? 'text-rose-500' : 'text-muted-text'
                          }`}>
                            Bill: {bPos ? '+' : bNeg ? '– ' : ''}₹{formatIndianNumber(Math.abs(billedDiff))}
                          </p>
                          <p className={`text-[11px] sm:text-[12px] font-black leading-tight ${
                            pPos ? 'text-emerald-400' : pNeg ? 'text-rose-500' : 'text-muted-text'
                          }`}>
                            POS: {pPos ? '+' : pNeg ? '– ' : ''}₹{formatIndianNumber(Math.abs(posDiff))}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Desktop & Mobile Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          const target = `/app/panel/inventory/consumption?date=${b.consumptionDate}&site=${SITE_ID}&cuId=${CU_ID}`
                          navigate(target)
                        }}
                        className="w-8 h-8 rounded-lg bg-surface border border-border-main flex items-center justify-center text-muted-text hover:text-white hover:border-secondary-text/50 transition-all cursor-pointer"
                        title="View Day Sales / Consumption"
                      >
                        <ExternalLink size={14} />
                      </button>

                      <div className="hidden md:flex items-center justify-center w-8 h-8 rounded-lg bg-surface border border-border-main text-muted-text hover:text-primary-text transition-colors shrink-0">
                        <ChevronDown size={15} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                      </div>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="border-t border-border-main/60">
                      <div className="px-4 py-3 flex items-center justify-between">
                        <span className="text-[11px] font-black text-muted-text uppercase tracking-widest">
                          Products Sold ({dayItemsLoading[b.consumptionDate] ? '…' : (dayItems[b.consumptionDate]?.length ?? b.itemsCount)})
                        </span>
                      </div>
                      {dayItemsLoading[b.consumptionDate] ? (
                        <div className="px-4 pb-4 flex flex-col gap-2">
                          <Skeleton height={56} borderRadius={12} />
                          <Skeleton height={56} borderRadius={12} />
                        </div>
                      ) : (dayItems[b.consumptionDate] ?? []).length === 0 ? (
                        <p className="px-4 pb-4 text-[13px] text-muted-text font-medium text-center">No items found</p>
                      ) : (
                        <div className="flex flex-col">
                          {(dayItems[b.consumptionDate] ?? []).map((item, idx) => {
                            const saleTotal = item.cash + item.upi + item.noBill + item.loyalty
                            const purchaseTotal = item.amountIncTax ?? 0
                            const itemProfit = saleTotal - purchaseTotal
                            const itemProfitPct = saleTotal > 0 ? (itemProfit / saleTotal) * 100 : (purchaseTotal > 0 ? -100 : 0)
                            const isItemProfit = itemProfit >= 0
                            const time = fmtTime(item.consumedDate)

                            return (
                              <div
                                key={item.cuBillId}
                                className={`flex items-center gap-3 px-4 py-2.5 ${idx % 2 === 0 ? 'bg-transparent' : 'bg-surface/40'}`}
                              >
                                {/* Thumbnail */}
                                <div className="relative shrink-0">
                                  <div className="w-9 h-9 rounded-lg border border-border-main bg-surface flex items-center justify-center overflow-hidden">
                                    {item.imageUrl ? (
                                      <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-contain" />
                                    ) : (
                                      <span className="text-[11px] font-bold text-muted-text">{item.productName.charAt(0)}</span>
                                    )}
                                  </div>
                                  {item.qty > 1 && (
                                    <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-0.5 rounded-full bg-primary-text text-card text-[8px] font-black flex items-center justify-center">
                                      {item.qty}
                                    </span>
                                  )}
                                </div>

                                {/* Product Info */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <p className="text-[13px] font-bold text-primary-text truncate">{item.productName}</p>
                                  </div>
                                  <div className="flex items-center gap-3 mt-0.5">
                                    <span className="text-[11px] text-muted-text font-medium">
                                      ₹{purchaseTotal.toFixed(2)} <span className="text-muted-text/40 mx-0.5">→</span> ₹{formatIndianNumber(saleTotal)}
                                    </span>
                                    {time && (
                                      <span className="text-[10px] text-muted-text/60 font-medium flex items-center gap-0.5">
                                        <Clock size={9} />{time}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Profit / Loss */}
                                <div className="shrink-0 text-right">
                                  <p className={`text-[13px] font-black tabular-nums ${isItemProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                                    {isItemProfit ? '+' : '-'}₹{formatIndianNumber(Math.abs(itemProfit))}
                                  </p>
                                  <p className={`text-[10px] font-bold ${isItemProfit ? 'text-emerald-500/80' : 'text-rose-400/80'}`}>
                                    {isItemProfit ? '+' : ''}{itemProfitPct.toFixed(0)}%
                                  </p>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
