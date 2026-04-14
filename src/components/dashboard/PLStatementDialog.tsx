// ── PLStatementDialog ─────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ReportService, type ProfitLossMonth } from "../../services/reportService";
import { ENV } from "../../config/env";
import { fmtShort, formatIndianNumber } from "../../utils/numberFormat";
import Skeleton from "react-loading-skeleton";
import { X, AlertTriangle, CheckCircle2, Loader2, ExternalLink } from "lucide-react";


const SITE_ID = Number(ENV.DEFAULT_SITE_ID)
const SITE_NAME = ENV.DEFAULT_SITE_NAME
const FIXED_COST_KEYS = new Set(['Salary', 'Electricity', 'Cleaning'])

export function PLStatementDialog({ row, onClose }: Readonly<{ row: ProfitLossMonth; onClose: () => void }>) {
    const navigate = useNavigate()
    const [expenses, setExpenses] = useState<Record<string, number> | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [confirmMode, setConfirmMode] = useState(false)
    const [finalizing, setFinalizing] = useState(false)
    const [finalized, setFinalized] = useState(false)

    useEffect(() => {
      ReportService.fetchMonthlyExpenses(SITE_ID, row.month, row.year)
        .then(res => setExpenses(res.data.expenses))
        .catch(console.error)
        .finally(() => setIsLoading(false))
    }, [row.month, row.year])

    async function handleFinalize() {
      setFinalizing(true)
      try {
        await ReportService.finalizeMonth(SITE_ID, row.year, row.month)
        setFinalized(true)
        setConfirmMode(false)
      } catch (err) {
        console.error(err)
      } finally {
        setFinalizing(false)
      }
    }
  
    const now = new Date()
    const isCurrentMonth = row.year === now.getFullYear() && row.month === now.getMonth() + 1

    const grossMargin   = row.sales - row.consumption
    const fixedEntries  = Object.entries(expenses ?? {}).filter(([k]) => FIXED_COST_KEYS.has(k))
    const otherEntries  = Object.entries(expenses ?? {}).filter(([k]) => !FIXED_COST_KEYS.has(k))
    const totalExpenses = Object.values(expenses ?? {}).reduce((s, v) => s + v, 0)
    const isNetLoss     = !row.profit && row.amount !== 0
    const isNetProfit   = row.profit  && row.amount !== 0
  
    return (
      <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-card border border-border-main w-full max-w-[420px] rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
  
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border-main shrink-0">
            <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[11px] font-black">
              {row.monthLabel}
            </span>
            <h2 className="text-[15px] font-black text-primary-text flex-1">P&L Statement</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface text-muted-text hover:text-primary-text transition-colors">
              <X size={16} />
            </button>
          </div>
  
          <div className="px-5 py-4 flex flex-col gap-3">
            {/* Sales Revenue */}
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-bold text-primary-text">Sales Revenue</span>
              <span className="text-[13px] font-black text-emerald-600 dark:text-emerald-400">₹{formatIndianNumber(row.sales)}</span>
            </div>
  
            {/* Inventory Consumption */}
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-bold text-primary-text">Inventory Consumption</span>
              <span className="text-[13px] font-bold text-primary-text">– ₹{formatIndianNumber(row.consumption)}</span>
            </div>
  
            {/* Gross Margin */}
            <div className="flex items-center justify-between bg-surface border border-border-main rounded-xl px-4 py-2.5">
              <span className="text-[13px] font-black text-primary-text">Gross Margin</span>
              <span className={`text-[13px] font-black ${grossMargin >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                {grossMargin < 0 ? '– ' : ''}{fmtShort(Math.abs(grossMargin))}
              </span>
            </div>
  
            {isLoading ? (
              <div className="flex flex-col gap-2 mt-1">
                <Skeleton height={11} width={90} borderRadius={4} />
                <Skeleton height={16} borderRadius={4} />
                <Skeleton height={16} borderRadius={4} />
                <Skeleton height={16} borderRadius={4} />
                <Skeleton height={11} width={110} borderRadius={4} className="mt-1" />
                <Skeleton height={16} borderRadius={4} />
                <Skeleton height={16} borderRadius={4} />
              </div>
            ) : expenses && (
              <>
                {fixedEntries.length > 0 && (
                  <>
                    <p className="text-[10px] font-black text-muted-text uppercase tracking-widest mt-1">Fixed Costs</p>
                    {fixedEntries.map(([name, value]) => (
                      <div key={name} className="flex items-center justify-between">
                        <span className="text-[13px] font-medium text-secondary-text">{name}</span>
                        <span className="text-[13px] font-bold text-primary-text">– ₹{formatIndianNumber(value)}</span>
                      </div>
                    ))}
                  </>
                )}
                {otherEntries.length > 0 && (
                  <>
                    <p className="text-[10px] font-black text-muted-text uppercase tracking-widest mt-1">Other Expenses</p>
                    {otherEntries.map(([name, value]) => {
                      const month = `${row.year}-${String(row.month).padStart(2, '0')}`
                      const href = `/app/panel/sites/${encodeURIComponent(SITE_NAME)}/consumption/${encodeURIComponent(name)}?month=${month}`
                      return (
                        <button
                          key={name}
                          onClick={() => { navigate(href); onClose() }}
                          className="flex items-center justify-between w-full group hover:bg-surface rounded-lg px-2 -mx-2 py-0.5 transition-colors cursor-pointer"
                        >
                          <span className="text-[13px] font-medium text-secondary-text flex items-center gap-1.5 group-hover:text-primary-text transition-colors">
                            {name}
                            <ExternalLink size={10} className="opacity-0 group-hover:opacity-60 transition-opacity" />
                          </span>
                          <span className="text-[13px] font-bold text-primary-text">– ₹{formatIndianNumber(value)}</span>
                        </button>
                      )
                    })}
                  </>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-border-main/60">
                  <span className="text-[13px] font-black text-primary-text">Total Expenses</span>
                  <span className="text-[13px] font-black text-rose-500">– ₹{formatIndianNumber(totalExpenses)}</span>
                </div>
              </>
            )}
  
            {!isLoading && (
              <div className={`flex items-center justify-between rounded-xl px-4 py-3 mt-1 ${
                isNetLoss ? 'bg-rose-50 dark:bg-rose-500/10' : isNetProfit ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-surface'
              }`}>
                <span className={`text-[14px] font-black ${isNetLoss ? 'text-rose-600 dark:text-rose-400' : isNetProfit ? 'text-emerald-700 dark:text-emerald-400' : 'text-primary-text'}`}>
                  {isNetLoss ? 'Net Loss' : isNetProfit ? 'Net Profit' : 'Break Even'}
                </span>
                <span className={`text-[20px] font-black tracking-tight ${isNetLoss ? 'text-rose-600 dark:text-rose-400' : isNetProfit ? 'text-emerald-700 dark:text-emerald-400' : 'text-primary-text'}`}>
                  ₹{formatIndianNumber(row.amount)}
                </span>
              </div>
            )}
          </div>
  
          <div className="px-5 pb-5 shrink-0 flex flex-col gap-2">

            {/* Finalize section — hidden for current month */}
            {!isCurrentMonth && (
              finalized ? (
                <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 size={15} />
                  <span className="text-[13px] font-black">{row.monthLabel} finalized</span>
                </div>
              ) : confirmMode ? (
                <div className="flex flex-col gap-2 rounded-xl border border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/10 p-3.5">
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={14} className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                    <p className="text-[12px] font-semibold text-amber-700 dark:text-amber-300 leading-snug">
                      This will lock <span className="font-black">{row.monthLabel}</span>. Once finalized, it cannot be undone.
                    </p>
                  </div>
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={() => setConfirmMode(false)}
                      disabled={finalizing}
                      className="flex-1 py-2.5 rounded-xl border border-border-main text-[13px] font-bold text-secondary-text hover:bg-surface transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleFinalize}
                      disabled={finalizing}
                      className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[13px] font-black transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {finalizing ? <Loader2 size={13} className="animate-spin" /> : null}
                      {finalizing ? 'Finalizing…' : 'Yes, Finalize'}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmMode(true)}
                  className="w-full py-3 rounded-xl border border-amber-300 dark:border-amber-500/40 text-amber-600 dark:text-amber-400 text-[13px] font-black hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors cursor-pointer"
                >
                  Finalize {row.monthLabel}
                </button>
              )
            )}

            <button
              onClick={() => {
                const monthYear = `${row.year}-${String(row.month).padStart(2, '0')}`
                navigate(`/app/panel/dashboard/${monthYear}`)
                onClose()
              }}
              className="w-full py-3 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-[13px] font-black rounded-xl hover:opacity-90 transition-opacity cursor-pointer"
            >
              View Full Report →
            </button>
          </div>
        </div>
      </div>
    )
  }