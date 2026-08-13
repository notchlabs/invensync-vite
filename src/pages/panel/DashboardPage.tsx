import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity, Database, TrendingUp, Target, BarChart2, Store } from 'lucide-react'
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
  const navigate = useNavigate()
  const [stats, setStats]             = useState<InventoryStats | null>(null)
  const [isLoadingStats, setIsLoadingStats] = useState(true)

  const [plData, setPlData]           = useState<ProfitLossMonth[]>([])
  const [isLoadingPL, setIsLoadingPL] = useState(true)

  const [activeReportRows, setActiveReportRows] = useState<ProfitLossMonth[] | null>(null)
  const [selectedMonthsForReport, setSelectedMonthsForReport] = useState<ProfitLossMonth[]>([])

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
                onClick={() => setActiveReportRows([row])}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Custom Reports ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-[16px] font-black text-primary-text tracking-tight">Custom Reports</h2>
          <p className="text-[12px] text-muted-text font-medium mt-0.5">Select multiple months to generate a consolidated statement</p>
        </div>
        
        {isLoadingPL ? (
          <Skeleton height={60} borderRadius={12} />
        ) : plData.length === 0 ? (
          <p className="text-[13px] text-muted-text font-medium py-4 text-center">No data available for custom reports</p>
        ) : (
          <div className="bg-card border border-border-main rounded-xl p-4 flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              {plData.map(row => {
                const isSelected = selectedMonthsForReport.some(m => m.month === row.month && m.year === row.year);
                return (
                  <button
                    key={`custom-${row.year}-${row.month}`}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedMonthsForReport(prev => prev.filter(m => !(m.month === row.month && m.year === row.year)));
                      } else {
                        setSelectedMonthsForReport(prev => [...prev, row]);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg text-[13px] font-bold transition-colors border ${
                      isSelected 
                        ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 border-transparent' 
                        : 'bg-surface text-secondary-text hover:text-primary-text border-border-main'
                    } cursor-pointer`}
                  >
                    {row.monthLabel}
                  </button>
                )
              })}
            </div>
            
            <button
              onClick={() => {
                if (selectedMonthsForReport.length > 0) {
                  setActiveReportRows(selectedMonthsForReport);
                }
              }}
              disabled={selectedMonthsForReport.length < 2}
              className="w-full sm:w-auto self-start px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white text-[13px] font-black rounded-xl transition-colors cursor-pointer"
            >
              Generate Consolidated Report
            </button>
          </div>
        )}
      </div>

      {/* ── View Reports ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-[16px] font-black text-primary-text tracking-tight">View Reports</h2>
          <p className="text-[12px] text-muted-text font-medium mt-0.5">Detailed breakdown reports for business analysis</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-card border border-border-main rounded-2xl p-5 flex flex-col justify-between hover:border-secondary-text transition-all group">
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-3 group-hover:scale-105 transition-transform">
                <BarChart2 size={20} />
              </div>
              <h3 className="text-[14px] font-black text-primary-text mb-1">Product-wise Profit Report</h3>
              <p className="text-[12px] text-muted-text font-medium leading-relaxed">
                Analyze total sales, purchase costs, transaction volume, and overall net profit margins for each product.
              </p>
            </div>
            <button
              onClick={() => navigate('/app/panel/reports/product-wise-profit')}
              className="mt-4 px-4 py-2 bg-surface hover:bg-neutral-900 hover:text-white dark:hover:bg-neutral-100 dark:hover:text-neutral-900 border border-border-main rounded-xl text-[12px] font-black text-secondary-text transition-all self-start cursor-pointer"
            >
              Open Report
            </button>
          </div>

          <div className="bg-card border border-border-main rounded-2xl p-5 flex flex-col justify-between hover:border-secondary-text transition-all group">
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-3 group-hover:scale-105 transition-transform">
                <Store size={20} />
              </div>
              <h3 className="text-[14px] font-black text-primary-text mb-1">Vendor-wise Profit Report</h3>
              <p className="text-[12px] text-muted-text font-medium leading-relaxed">
                Analyze total sales, purchase costs, transaction volume, and overall net profit margins for each vendor.
              </p>
            </div>
            <button
              onClick={() => navigate('/app/panel/reports/vendor-wise-profit')}
              className="mt-4 px-4 py-2 bg-surface hover:bg-neutral-900 hover:text-white dark:hover:bg-neutral-100 dark:hover:text-neutral-900 border border-border-main rounded-xl text-[12px] font-black text-secondary-text transition-all self-start cursor-pointer"
            >
              Open Report
            </button>
          </div>
        </div>
      </div>

      {/* ── P&L Dialog ───────────────────────────────────────────── */}
      {activeReportRows && (
        <PLStatementDialog rows={activeReportRows} onClose={() => setActiveReportRows(null)} />
      )}
    </div>
  )
}
