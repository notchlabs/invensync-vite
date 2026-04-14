// ── MonthCard ─────────────────────────────────────────────────────────────────

import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { ProfitLossMonth } from "../../services/reportService";
import { formatIndianCurrency } from "../../utils/numberFormat";


const CURRENT_YEAR  = new Date().getFullYear()
const CURRENT_MONTH = new Date().getMonth() + 1

export function MonthCard({ row, onClick }: { row: ProfitLossMonth; onClick: () => void }) {
  const isZero    = row.amount === 0
  const isProfit  = !isZero && row.profit
  const isLoss    = !isZero && !row.profit
  const isCurrent = row.year === CURRENT_YEAR && row.month === CURRENT_MONTH

  const bg = isLoss
    ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20'
    : isProfit
    ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20'
    : 'bg-card border-border-main'

  const amtColor = isLoss
    ? 'text-rose-600 dark:text-rose-400'
    : isProfit
    ? 'text-emerald-700 dark:text-emerald-400'
    : 'text-muted-text'

  return (
    <button
      onClick={onClick}
      className={`relative rounded-xl border p-3 flex flex-col gap-1.5 text-left transition-all hover:shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${bg} ${isCurrent ? 'ring-2 ring-offset-1 ring-primary-text/20' : ''}`}
    >
      <div className="flex items-center justify-between">
        {isLoss    ? <ArrowDownRight size={14} className="text-rose-500" />
         : isProfit ? <ArrowUpRight  size={14} className="text-emerald-600" />
         : <span className="w-[14px]" />}
        {isCurrent && (
          <span className="text-[9px] font-black text-muted-text uppercase tracking-widest bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded">NOW</span>
        )}
      </div>
      <p className="text-[11px] font-bold text-secondary-text">{row.monthLabel}</p>
      <p className={`text-[13px] font-black tracking-tight leading-none ${amtColor}`}>
        {isZero ? '₹0' : `${row.profit ? '' : '-'}${formatIndianCurrency(Math.abs(row.amount))}`}
      </p>
    </button>
  )
}