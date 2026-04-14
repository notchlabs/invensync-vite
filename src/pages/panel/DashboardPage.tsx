import { useState, useEffect } from 'react'
import { Activity, Database, TrendingUp, Target, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import Skeleton from 'react-loading-skeleton'
import { ReportService, type InventoryStats, type ProfitLossMonth } from '../../services/reportService'
import { ENV } from '../../config/env'
import { StatCard } from '../../components/dashboard/StatCard'
import { MonthCard } from '../../components/dashboard/MonthCard'
import { PLStatementDialog } from '../../components/dashboard/PLStatementDialog'
import { CapitalOverview } from '../../components/dashboard/CapitalOverview'

const SITE_ID = Number(ENV.DEFAULT_SITE_ID)
const CU_ID   = Number(ENV.DEFAULT_CONSUMPTION_UNIT_ID)


const STAT_META = [
  { key: 'todayConsumption'     as const, label: "Today's Consumption",  icon: Activity   },
  { key: 'consumptionTillDate'  as const, label: 'Consumption till date', icon: Database   },
  { key: 'projectedConsumption' as const, label: 'Projected Consumption', icon: TrendingUp },
  { key: 'projectedSales'       as const, label: 'Projected Sales',       icon: Target     },
]


export default function DashboardPage() {
  const [stats, setStats]             = useState<InventoryStats | null>(null)
  const [isLoadingStats, setIsLoadingStats] = useState(true)

  const [plData, setPlData]           = useState<ProfitLossMonth[]>([])
  const [isLoadingPL, setIsLoadingPL] = useState(true)

  const [selectedMonth, setSelectedMonth] = useState<ProfitLossMonth | null>(null)

  useEffect(() => {
    ReportService.fetchInventoryStats(SITE_ID, CU_ID)
      .then(res => setStats(res.data))
      .catch(console.error)
      .finally(() => setIsLoadingStats(false))
  }, [])

  useEffect(() => {
    ReportService.fetchProfitLossOverview(SITE_ID)
      .then(res => setPlData(res.data ?? []))
      .catch(console.error)
      .finally(() => setIsLoadingPL(false))
  }, [])

  return (
    <div className="p-4 md:p-6 max-w-[1500px] mx-auto w-full flex flex-col gap-6 overflow-y-auto h-full">

      {/* ── Header ───────────────────────────────────────────────── */}
      <div>
        <h1 className="text-[22px] font-black text-primary-text tracking-tight">Dashboard</h1>
        <p className="text-[12px] text-muted-text font-medium mt-0.5">Site performance at a glance</p>
      </div>

      {/* ── Stats row ────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3">
        {STAT_META.map(m => (
          <StatCard key={m.key} label={m.label} icon={m.icon} item={stats?.[m.key]} isLoading={isLoadingStats} />
        ))}
      </div>

      {/* ── Capital & Recovery ────────────────────────────────────── */}
      <CapitalOverview />

      {/* ── P&L Overview ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-[16px] font-black text-primary-text tracking-tight">Profit / Loss Overview</h2>
          <p className="text-[12px] text-muted-text font-medium mt-0.5">Monthly profit and loss breakdown</p>
        </div>

        {isLoadingPL ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} height={82} borderRadius={12} />
            ))}
          </div>
        ) : plData.length === 0 ? (
          <p className="text-[13px] text-muted-text font-medium py-8 text-center">No P&L data available</p>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-3">
            {plData.map(row => (
              <MonthCard
                key={`${row.year}-${row.month}`}
                row={row}
                onClick={() => setSelectedMonth(row)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── P&L Dialog ───────────────────────────────────────────── */}
      {selectedMonth && (
        <PLStatementDialog row={selectedMonth} onClose={() => setSelectedMonth(null)} />
      )}
    </div>
  )
}
