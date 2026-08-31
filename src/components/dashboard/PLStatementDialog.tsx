// ── PLStatementDialog ─────────────────────────────────────────────────────────

import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ReportService, type ProfitLossMonth } from "../../services/reportService";
import { ENV } from "../../config/env";
import { formatIndianCurrency, formatIndianNumber } from "../../utils/numberFormat";
import Skeleton from "react-loading-skeleton";
import { X, AlertTriangle, CheckCircle2, Loader2, ExternalLink, Download, TrendingUp, TrendingDown, Minus } from "lucide-react";
import html2canvas from "html2canvas-pro";


const SITE_ID = Number(ENV.DEFAULT_SITE_ID)
const SITE_NAME = ENV.DEFAULT_SITE_NAME
const FIXED_COST_KEYS = new Set(['Electricity', 'Cleaning'])

export function PLStatementDialog({ rows, onClose }: Readonly<{ rows: ProfitLossMonth[]; onClose: () => void }>) {
    const navigate = useNavigate()
    const [expenses, setExpenses] = useState<Record<string, number> | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [confirmMode, setConfirmMode] = useState(false)
    const [finalizing, setFinalizing] = useState(false)
    const [finalized, setFinalized] = useState(false)
    const [isDownloading, setIsDownloading] = useState(false)
    const statementRef = useRef<HTMLDivElement>(null)

    const isMultiple = rows.length > 1;
    const sortedRows = [...rows].sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });

    const totalAmount = rows.reduce((sum, r) => sum + (r.profit ? Math.abs(r.amount) : -Math.abs(r.amount)), 0);

    const row: ProfitLossMonth = {
      monthLabel: isMultiple ? `Consolidated (${rows.length} Months)` : rows[0].monthLabel,
      year: sortedRows[0].year,
      month: sortedRows[0].month,
      consumption: rows.reduce((sum, r) => sum + r.consumption, 0),
      sales: rows.reduce((sum, r) => sum + r.sales, 0),
      toleranceValue: rows.reduce((sum, r) => sum + r.toleranceValue, 0),
      amount: Math.abs(totalAmount),
      profit: totalAmount >= 0,
      finalized: isMultiple ? false : rows[0].finalized,
      cash: rows.reduce((sum, r) => sum + (r.cash ?? 0), 0),
      cashCollectedByManager: rows.reduce((sum, r) => sum + (r.cashCollectedByManager ?? 0), 0),
      paytm: rows.reduce((sum, r) => sum + (r.paytm ?? 0), 0),
      paytmCheckedByManager: rows.reduce((sum, r) => sum + (r.paytmCheckedByManager ?? 0), 0),
    };

    const rowsKey = rows.map(r => `${r.year}-${r.month}`).join(',');

    useEffect(() => {
      setIsLoading(true);
      Promise.all(
        rows.map(r => ReportService.fetchMonthlyExpenses(SITE_ID, r.month, r.year))
      )
        .then(responses => {
          const combinedExpenses: Record<string, number> = {};
          responses.forEach(res => {
            const exp = res.data?.expenses ?? {};
            Object.entries(exp).forEach(([key, val]) => {
              combinedExpenses[key] = (combinedExpenses[key] || 0) + val;
            });
          });
          setExpenses(combinedExpenses);
        })
        .catch(console.error)
        .finally(() => setIsLoading(false))
    }, [rowsKey])

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

    const handleDownload = useCallback(async () => {
      if (!statementRef.current || isDownloading) return
      setIsDownloading(true)
      try {
        const canvas = await html2canvas(statementRef.current, {
          backgroundColor: null,
          scale: 3,
          useCORS: true,
          logging: false,
        })
        const link = document.createElement('a')
        link.download = `PL_Statement_${row.monthLabel.replace(/\s+/g, '_')}.png`
        link.href = canvas.toDataURL('image/png')
        link.click()
      } catch (err) {
        console.error('Download failed:', err)
      } finally {
        setIsDownloading(false)
      }
    }, [row.monthLabel, isDownloading])
  
    const now = new Date()
    const isCurrentMonth = !isMultiple && row.year === now.getFullYear() && row.month === now.getMonth() + 1

    const grossMargin   = row.sales - row.consumption
    const grossMarginPct = row.sales > 0 ? ((grossMargin / row.sales) * 100) : 0
    const fixedEntries  = Object.entries(expenses ?? {}).filter(([k]) => FIXED_COST_KEYS.has(k))
    const otherEntries  = Object.entries(expenses ?? {}).filter(([k]) => !FIXED_COST_KEYS.has(k))
    const totalExpenses = Object.values(expenses ?? {}).reduce((s, v) => s + v, 0)
    const fixedTotal    = fixedEntries.reduce((s, [, v]) => s + v, 0)
    const otherTotal    = otherEntries.reduce((s, [, v]) => s + v, 0)
    const isNetLoss     = !row.profit && row.amount !== 0
    const isNetProfit   = row.profit  && row.amount !== 0
    const netMarginPct  = row.sales > 0 ? ((row.amount / row.sales) * 100) : 0

    const systemCollections = (row.cash ?? 0) + (row.paytm ?? 0)
    const verifiedCollections = (row.cashCollectedByManager ?? 0) + (row.paytmCheckedByManager ?? 0)
    const collectionsDiff = verifiedCollections - systemCollections
    const signedNetProfit = row.profit ? row.amount : -row.amount
    const realizedAmount = signedNetProfit + collectionsDiff
    const isRealizedLoss = realizedAmount < 0
    const isRealizedProfit = realizedAmount > 0
  
    return (
      <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-card border border-border-main w-full max-w-[460px] rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
  
          {/* ── Top Action Bar (excluded from download) ── */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-border-main shrink-0">
            <div className="flex items-center gap-2">
              <button 
                onClick={handleDownload}
                disabled={isDownloading || isLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-secondary-text hover:text-primary-text bg-surface hover:bg-surface/80 border border-border-main transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                title="Download as image"
              >
                {isDownloading ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                {isDownloading ? 'Saving…' : 'Download'}
              </button>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface text-muted-text hover:text-primary-text transition-colors cursor-pointer">
              <X size={16} />
            </button>
          </div>

          {/* ── Scrollable Content ── */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">

            {/* ── Downloadable Statement Area ── */}
            <div ref={statementRef} className="bg-card">

              {/* ── Header ── */}
              <div className="px-5 pt-5 pb-4">
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <p className="text-[10px] font-bold text-muted-text uppercase tracking-[0.15em]">Profit & Loss Statement</p>
                    <h2 className="text-[22px] font-black text-primary-text tracking-tight leading-tight mt-0.5">{row.monthLabel}</h2>
                    {isMultiple && (
                      <p className="text-[10px] text-muted-text font-medium mt-0.5 leading-snug max-w-[200px]">
                        {sortedRows.map(r => r.monthLabel).join(', ')}
                      </p>
                    )}
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black ${
                      isNetProfit ? 'bg-green-500/10 text-green-700 dark:text-emerald-400' 
                      : isNetLoss ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' 
                      : 'bg-surface text-muted-text'
                    }`}>
                      {isNetProfit ? <TrendingUp size={10} /> : isNetLoss ? <TrendingDown size={10} /> : <Minus size={10} />}
                      {isNetProfit ? 'Profit' : isNetLoss ? 'Loss' : 'Break Even'}
                    </span>
                    {isCurrentMonth && (
                      <span className="text-[9px] font-black text-blue-500 dark:text-blue-400 uppercase tracking-widest bg-blue-500/10 px-1.5 py-0.5 rounded">
                        Current
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-muted-text font-medium">{SITE_NAME}</p>
              </div>

              {/* ── Divider ── */}
              <div className="mx-5 border-t border-border-main" />
    
              {/* ── Revenue Section ── */}
              <div className="px-5 py-4 flex flex-col gap-2.5">
                <p className="text-[9px] font-black text-muted-text uppercase tracking-[0.2em]">Revenue</p>
                
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-semibold text-primary-text">Sales Revenue (exc Loyalty )</span>
                  <span className="text-[13px] font-black text-green-700 dark:text-emerald-400 tabular-nums shrink-0 text-right">₹{formatIndianNumber(row.sales)}</span>
                </div>
    
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-semibold text-secondary-text">Less: Inventory Consumption</span>
                  <span className="text-[13px] font-bold text-secondary-text tabular-nums shrink-0 text-right">– ₹{formatIndianNumber(row.consumption)}</span>
                </div>
    
                {/* Gross Margin highlight */}
                <div className="flex items-center justify-between bg-surface border border-border-main/60 rounded-xl px-3 py-2.5 mt-0.5 -mx-3">
                  <div className="flex flex-col">
                    <span className="text-[13px] font-black text-primary-text">Gross Margin</span>
                    <span className="text-[10px] font-bold text-muted-text">{grossMarginPct.toFixed(1)}% of revenue</span>
                  </div>
                  <span className={`text-[15px] font-black tabular-nums ${grossMargin >= 0 ? 'text-green-700 dark:text-emerald-400' : 'text-rose-500'}`}>
                    {grossMargin < 0 ? '– ' : ''}{formatIndianCurrency(Math.abs(grossMargin))}
                  </span>
                </div>
              </div>

              {/* ── Divider ── */}
              <div className="mx-5 border-t border-dashed border-border-main/60" />


    
              {/* ── Expenses Section ── */}
              <div className="px-5 py-4 flex flex-col gap-2.5">
                {isLoading ? (
                  <div className="flex flex-col gap-2">
                    <Skeleton height={11} width={90} borderRadius={4} />
                    <Skeleton height={18} borderRadius={4} />
                    <Skeleton height={18} borderRadius={4} />
                    <Skeleton height={18} borderRadius={4} />
                    <Skeleton height={11} width={110} borderRadius={4} className="mt-1" />
                    <Skeleton height={18} borderRadius={4} />
                    <Skeleton height={18} borderRadius={4} />
                  </div>
                ) : expenses && (
                  <>
                    {fixedEntries.length > 0 && (
                      <>
                        <div className="flex items-center justify-between">
                          <p className="text-[9px] font-black text-muted-text uppercase tracking-[0.2em]">Fixed Costs</p>
                          <p className="text-[9px] font-bold text-muted-text tabular-nums">₹{formatIndianNumber(fixedTotal)}</p>
                        </div>
                        {fixedEntries.map(([name, value]) => {
                          return (
                            <div key={name} className="flex items-center justify-between group">
                              <span className="text-[13px] font-medium text-secondary-text truncate pr-4">{name}</span>
                              <span className="text-[13px] font-bold text-primary-text tabular-nums shrink-0 text-right">– ₹{formatIndianNumber(value)}</span>
                            </div>
                          )
                        })}
                      </>
                    )}
                    {otherEntries.length > 0 && (
                      <>
                        <div className="flex items-center justify-between mt-1.5">
                          <p className="text-[9px] font-black text-muted-text uppercase tracking-[0.2em]">Other Expenses</p>
                          <p className="text-[9px] font-bold text-muted-text tabular-nums">₹{formatIndianNumber(otherTotal)}</p>
                        </div>
                        {otherEntries.map(([name, value]) => {
                          const month = `${row.year}-${String(row.month).padStart(2, '0')}`
                          const href = `/app/panel/sites/${encodeURIComponent(SITE_NAME)}/consumption/${encodeURIComponent(name)}?month=${month}`
                          return (
                            <button
                              key={name}
                              onClick={() => { navigate(href); onClose() }}
                              className="flex items-center justify-between group hover:bg-surface rounded-lg px-2 -mx-2 py-0.5 transition-colors cursor-pointer"
                            >
                              <span className="text-[13px] font-medium text-secondary-text flex items-center gap-1.5 group-hover:text-primary-text transition-colors truncate pr-4">
                                {name}
                                <ExternalLink size={9} className="opacity-0 group-hover:opacity-60 transition-opacity shrink-0" />
                              </span>
                              <span className="text-[13px] font-bold text-primary-text tabular-nums shrink-0 text-right">– ₹{formatIndianNumber(value)}</span>
                            </button>
                          )
                        })}
                      </>
                    )}

                    {/* Total Expenses */}
                    <div className="flex items-center justify-between pt-2.5 mt-1 border-t border-border-main/60">
                      <span className="text-[13px] font-black text-primary-text">Total Expenses</span>
                      <span className="text-[13px] font-black text-rose-500 tabular-nums shrink-0 text-right">– ₹{formatIndianNumber(totalExpenses)}</span>
                    </div>
                  </>
                )}
              </div>

              {/* ── Divider ── */}
              <div className="mx-5 border-t border-border-main" />
    
              {/* ── Net Profit / Loss ── */}
              {!isLoading && (
                <div className="px-5 py-4">
                  <div className={`flex items-center justify-between rounded-xl px-3 py-3.5 -mx-3 ${
                    isNetLoss ? 'bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20' 
                    : isNetProfit ? 'bg-green-50 dark:bg-emerald-500/10 border border-green-300 dark:border-emerald-500/20' 
                    : 'bg-surface border border-border-main'
                  }`}>
                    <div className="flex flex-col">
                      <span className={`text-[14px] font-black ${isNetLoss ? 'text-rose-600 dark:text-rose-400' : isNetProfit ? 'text-green-800 dark:text-emerald-400' : 'text-primary-text'}`}>
                        {isNetLoss ? 'Net Loss' : isNetProfit ? 'Net Profit' : 'Break Even'}
                      </span>
                      {row.sales > 0 && (
                        <span className={`text-[10px] font-bold ${isNetLoss ? 'text-rose-500/60' : isNetProfit ? 'text-green-700/60 dark:text-emerald-400/60' : 'text-muted-text'}`}>
                          {isNetLoss ? '-' : ''}{Math.abs(netMarginPct).toFixed(1)}% net margin
                        </span>
                      )}
                    </div>
                    <span className={`text-[22px] font-black tracking-tight tabular-nums ${isNetLoss ? 'text-rose-600 dark:text-rose-400' : isNetProfit ? 'text-green-800 dark:text-emerald-400' : 'text-primary-text'}`}>
                      {isNetLoss ? '-' : ''}₹{formatIndianNumber(Math.abs(row.amount))}
                    </span>
                  </div>
                </div>
              )}
              {/* ── Divider ── */}
              <div className="mx-5 border-t border-dashed border-border-main/60" />

              {/* ── Collections Overview ── */}
              <div className="px-5 py-4 flex flex-col gap-2.5">
                <p className="text-[9px] font-black text-muted-text uppercase tracking-[0.2em]">Collections Match</p>
                
                <div className="flex flex-col gap-3 mt-1">
                  {/* Cash */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500/80"></div>
                      <div className="flex flex-col">
                        <span className="text-[13px] font-semibold text-primary-text">Cash</span>
                        <span className="text-[10px] text-muted-text font-medium">System: ₹{formatIndianNumber(row.cash ?? 0)}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                       <span className={`text-[13px] font-black tabular-nums text-right ${(row.cashCollectedByManager ?? 0) < (row.cash ?? 0) ? 'text-rose-600 dark:text-rose-400' : 'text-primary-text'}`}>
                         <span className="text-[9px] font-bold text-muted-text/60 mr-1.5 uppercase tracking-wider">Collected</span>
                         ₹{formatIndianNumber(row.cashCollectedByManager ?? 0)}
                       </span>
                       {(row.cash ?? 0) !== (row.cashCollectedByManager ?? 0) && (
                         <span className={`text-[10px] font-bold tabular-nums mt-0.5 text-right ${(row.cashCollectedByManager ?? 0) < (row.cash ?? 0) ? 'text-rose-500/80' : 'text-green-600/80 dark:text-emerald-400/80'}`}>
                           <span className="text-[8px] font-bold opacity-60 mr-1.5 uppercase tracking-wider">Diff</span>
                           {(row.cashCollectedByManager ?? 0) < (row.cash ?? 0) ? '– ' : '+ '}₹{formatIndianNumber(Math.abs((row.cashCollectedByManager ?? 0) - (row.cash ?? 0)))}
                         </span>
                       )}
                    </div>
                  </div>

                  {/* Paytm */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500/80"></div>
                      <div className="flex flex-col">
                        <span className="text-[13px] font-semibold text-primary-text">UPI / Paytm</span>
                        <span className="text-[10px] text-muted-text font-medium">System: ₹{formatIndianNumber(row.paytm ?? 0)}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                       <span className={`text-[13px] font-black tabular-nums text-right ${(row.paytmCheckedByManager ?? 0) < (row.paytm ?? 0) ? 'text-rose-600 dark:text-rose-400' : 'text-primary-text'}`}>
                         <span className="text-[9px] font-bold text-muted-text/60 mr-1.5 uppercase tracking-wider">Verified</span>
                         ₹{formatIndianNumber(row.paytmCheckedByManager ?? 0)}
                       </span>
                       {(row.paytm ?? 0) !== (row.paytmCheckedByManager ?? 0) && (
                         <span className={`text-[10px] font-bold tabular-nums mt-0.5 text-right ${(row.paytmCheckedByManager ?? 0) < (row.paytm ?? 0) ? 'text-rose-500/80' : 'text-green-600/80 dark:text-emerald-400/80'}`}>
                           <span className="text-[8px] font-bold opacity-60 mr-1.5 uppercase tracking-wider">Diff</span>
                           {(row.paytmCheckedByManager ?? 0) < (row.paytm ?? 0) ? '– ' : '+ '}₹{formatIndianNumber(Math.abs((row.paytmCheckedByManager ?? 0) - (row.paytm ?? 0)))}
                         </span>
                       )}
                    </div>
                  </div>

                  {/* Total Collections */}
                  <div className="flex items-center justify-between pt-2.5 mt-1 border-t border-border-main/60">
                    <div className="flex flex-col">
                      <span className="text-[13px] font-black text-primary-text">Total Collections</span>
                      <span className="text-[10px] text-muted-text font-medium">System Total: ₹{formatIndianNumber((row.cash ?? 0) + (row.paytm ?? 0))}</span>
                    </div>
                    <div className="flex flex-col items-end">
                       <span className={`text-[13px] font-black tabular-nums text-right ${((row.cashCollectedByManager ?? 0) + (row.paytmCheckedByManager ?? 0)) < ((row.cash ?? 0) + (row.paytm ?? 0)) ? 'text-rose-600 dark:text-rose-400' : 'text-primary-text'}`}>
                         <span className="text-[9px] font-bold text-muted-text/60 mr-1.5 uppercase tracking-wider">Total</span>
                         ₹{formatIndianNumber((row.cashCollectedByManager ?? 0) + (row.paytmCheckedByManager ?? 0))}
                       </span>
                       {((row.cash ?? 0) + (row.paytm ?? 0)) !== ((row.cashCollectedByManager ?? 0) + (row.paytmCheckedByManager ?? 0)) && (
                         <span className={`text-[10px] font-bold tabular-nums mt-0.5 text-right ${((row.cashCollectedByManager ?? 0) + (row.paytmCheckedByManager ?? 0)) < ((row.cash ?? 0) + (row.paytm ?? 0)) ? 'text-rose-500/80' : 'text-green-600/80 dark:text-emerald-400/80'}`}>
                           <span className="text-[8px] font-bold opacity-60 mr-1.5 uppercase tracking-wider">Diff</span>
                           {((row.cashCollectedByManager ?? 0) + (row.paytmCheckedByManager ?? 0)) < ((row.cash ?? 0) + (row.paytm ?? 0)) ? '– ' : '+ '}₹{formatIndianNumber(Math.abs((((row.cashCollectedByManager ?? 0) + (row.paytmCheckedByManager ?? 0))) - (((row.cash ?? 0) + (row.paytm ?? 0)))))}
                         </span>
                       )}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Divider ── */}
              <div className="mx-5 border-t border-dashed border-border-main/60" />

              {/* ── Realized Net Profit ── */}
              {!isLoading && (
                <div className="px-5 py-4 pb-6">
                  <div className={`flex items-center justify-between rounded-xl px-3 py-3.5 -mx-3 ${
                    isRealizedLoss ? 'bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20' 
                    : isRealizedProfit ? 'bg-green-50 dark:bg-emerald-500/10 border border-green-300 dark:border-emerald-500/20' 
                    : 'bg-surface border border-border-main'
                  }`}>
                    <div className="flex flex-col">
                      <span className={`text-[14px] font-black ${isRealizedLoss ? 'text-rose-600 dark:text-rose-400' : isRealizedProfit ? 'text-green-800 dark:text-emerald-400' : 'text-primary-text'}`}>
                        {isRealizedLoss ? 'Realized Net Loss' : isRealizedProfit ? 'Realized Net Profit' : 'Realized Break Even'}
                      </span>
                      <span className={`text-[10px] font-bold ${isRealizedLoss ? 'text-rose-500/60' : isRealizedProfit ? 'text-green-700/60 dark:text-emerald-400/60' : 'text-muted-text'}`}>
                        After collections variance
                      </span>
                    </div>
                    <span className={`text-[22px] font-black tracking-tight tabular-nums text-right ${isRealizedLoss ? 'text-rose-600 dark:text-rose-400' : isRealizedProfit ? 'text-green-800 dark:text-emerald-400' : 'text-primary-text'}`}>
                      {isRealizedLoss ? '-' : ''}₹{formatIndianNumber(Math.abs(realizedAmount))}
                    </span>
                  </div>
                </div>
              )}

              {/* ── Footer: Powered by Invensync ── */}
              <div className="px-5 pb-4 pt-1 flex items-center justify-between">
                <p className="text-[9px] text-muted-text/50 font-medium">
                  Generated on {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
                <p className="text-[9px] text-muted-text/50 font-bold tracking-wide">
                  Powered by <span className="text-primary-text/30 font-black">Invensync.in</span>
                </p>
              </div>
            </div>

          </div>

          {/* ── Bottom Actions (excluded from download) ── */}
          {!isMultiple && (
            <div className="px-5 py-4 shrink-0 flex flex-col gap-2 border-t border-border-main">

              {/* Finalize section — hidden for current month */}
              {!isCurrentMonth && (
                (row.finalized || finalized) ? (
                  <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-green-50 dark:bg-emerald-500/10 text-green-700 dark:text-emerald-400">
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
          )}
        </div>
      </div>
    )
  }