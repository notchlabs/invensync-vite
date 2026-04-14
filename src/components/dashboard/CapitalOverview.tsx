import { useEffect, useState } from "react";
import {
  Landmark,
  Wallet,
  Flame,
  TrendingDown,
  ShieldCheck,
  Clock,
} from "lucide-react";
import { fmtShort } from "../../utils/numberFormat";
import {
  ReportService,
  type FinancialSummary,
} from "../../services/reportService";
import Skeleton from "react-loading-skeleton";

/* ── Helpers ────────────────────────────────────────────── */
const RADIUS = 40;
const CIRCUM = 2 * Math.PI * RADIUS;
const SITE_ID = Number(import.meta.env.VITE_DEFAULT_SITE_ID);

/* ── Skeleton ───────────────────────────────────────────── */
function CapitalOverviewSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-[16px] font-black text-primary-text tracking-tight">
          Capital &amp; Recovery
        </h2>
        <p className="text-[12px] text-muted-text font-medium mt-0.5">
          Investment breakdown and break-even tracking
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Card 1 skeleton */}
        <div className="bg-card border border-border-main rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Skeleton width={32} height={32} borderRadius={8} />
            <Skeleton width={110} height={11} borderRadius={4} />
          </div>
          <Skeleton width={120} height={28} borderRadius={6} />
          <div className="flex flex-col gap-2">
            <Skeleton height={10} borderRadius={99} />
            <div className="flex justify-between">
              <Skeleton width={80} height={11} borderRadius={4} />
              <Skeleton width={80} height={11} borderRadius={4} />
            </div>
          </div>
        </div>

        {/* Card 2 skeleton */}
        <div className="bg-card border border-border-main rounded-2xl p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Skeleton width={32} height={32} borderRadius={8} />
            <Skeleton width={120} height={11} borderRadius={4} />
          </div>
          <Skeleton width={100} height={24} borderRadius={6} />
          <Skeleton height={1} />
          <div className="flex items-center gap-2">
            <Skeleton width={32} height={32} borderRadius={8} />
            <Skeleton width={100} height={11} borderRadius={4} />
          </div>
          <Skeleton width={100} height={24} borderRadius={6} />
        </div>

        {/* Card 3 skeleton */}
        <div className="bg-card border border-border-main rounded-2xl p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Skeleton width={32} height={32} borderRadius={8} />
            <Skeleton width={80} height={11} borderRadius={4} />
          </div>
          <div className="flex items-center gap-5 flex-1">
            <Skeleton width={96} height={96} borderRadius={99} />
            <div className="flex flex-col gap-2.5 flex-1">
              <Skeleton width={60} height={11} borderRadius={4} />
              <Skeleton width={90} height={18} borderRadius={4} />
              <Skeleton width={130} height={11} borderRadius={4} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between">
              <Skeleton width={100} height={10} borderRadius={4} />
              <Skeleton width={80} height={10} borderRadius={4} />
            </div>
            <Skeleton height={8} borderRadius={99} />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Component ──────────────────────────────────────────── */
export function CapitalOverview() {
  const [data, setData] = useState<FinancialSummary | null>(null);

  useEffect(() => {
    ReportService.fetchFinancialSummary(SITE_ID).then((res) => {
      if (res.data) setData(res.data);
    });
  }, []);

  if (!data) return <CapitalOverviewSkeleton />;

  const pct = data.breakEven.percentRecovered;
  const offset = CIRCUM - (pct / 100) * CIRCUM;

  return (
    <div className="flex flex-col gap-4">
      {/* Section heading */}
      <div>
        <h2 className="text-[16px] font-black text-primary-text tracking-tight">
          Capital &amp; Recovery
        </h2>
        <p className="text-[12px] text-muted-text font-medium mt-0.5">
          Investment breakdown and break-even tracking
        </p>
      </div>

      {/* ── Main grid ──────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* ─── Card 1: Capital breakdown ──────────────── */}
        <div className="bg-card border border-border-main rounded-2xl p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-500/15 flex items-center justify-center">
              <Landmark
                size={16}
                className="text-violet-600 dark:text-violet-400"
              />
            </div>
            <span className="text-[11px] font-bold text-muted-text uppercase tracking-wider">
              Capital Invested
            </span>
          </div>

          <p className="text-[28px] font-black text-primary-text tracking-tight leading-none">
            {fmtShort(data.capital.total)}
          </p>

          {/* Stacked bar */}
          <div className="flex flex-col gap-2">
            <div className="h-2.5 rounded-full overflow-hidden flex bg-secondary">
              <div
                className="bg-violet-500 dark:bg-violet-400 rounded-l-full transition-all"
                style={{
                  width: `${(data.capital.fixed / data.capital.total) * 100}%`,
                }}
              />
              <div
                className="bg-indigo-400 dark:bg-indigo-400/70 rounded-r-full transition-all"
                style={{
                  width: `${
                    (data.capital.working / data.capital.total) * 100
                  }%`,
                }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-violet-500 dark:bg-violet-400" />
                <span className="font-semibold text-secondary-text">Fixed</span>
                <span className="font-black text-primary-text">
                  {fmtShort(data.capital.fixed)}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-400 dark:bg-indigo-400/70" />
                <span className="font-semibold text-secondary-text">
                  Working
                </span>
                <span className="font-black text-primary-text">
                  {fmtShort(data.capital.working)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Card 2: Running + Burn ────────────────── */}
        <div className="bg-card border border-border-main rounded-2xl p-5 flex flex-col gap-3">
          {/* Running expense */}
          <div className="flex-1 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center">
                <Wallet
                  size={16}
                  className="text-amber-600 dark:text-amber-400"
                />
              </div>
              <span className="text-[11px] font-bold text-muted-text uppercase tracking-wider">
                This Month Expense
              </span>
            </div>
            <p className="text-[24px] font-black text-primary-text tracking-tight leading-none">
              {fmtShort(data.running.currentMonthExpense)}
            </p>
          </div>

          <div className="border-t border-border-main" />

          {/* Burn rate */}
          <div className="flex-1 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-500/15 flex items-center justify-center">
                <Flame size={16} className="text-rose-500 dark:text-rose-400" />
              </div>
              <span className="text-[11px] font-bold text-muted-text uppercase tracking-wider">
                Avg Burn / Month
              </span>
            </div>
            <div className="flex items-end gap-2">
              <p className="text-[24px] font-black text-primary-text tracking-tight leading-none">
                {fmtShort(data.burn.monthlyAverage)}
              </p>
              {data.running.currentMonthExpense > data.burn.monthlyAverage && (
                <span className="text-[10px] font-bold text-rose-500 flex items-center gap-0.5 mb-1">
                  <TrendingDown size={11} className="rotate-180" />
                  Above avg
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ─── Card 3: Recovery + Break-even (ring) ──── */}
        <div className="bg-card border border-border-main rounded-2xl p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center">
              <ShieldCheck
                size={16}
                className="text-emerald-600 dark:text-emerald-400"
              />
            </div>
            <span className="text-[11px] font-bold text-muted-text uppercase tracking-wider">
              Recovery
            </span>
          </div>

          <div className="flex items-center gap-5 flex-1">
            {/* SVG ring */}
            <div className="relative shrink-0">
              <svg
                width="96"
                height="96"
                viewBox="0 0 96 96"
                className="transform -rotate-90"
              >
                {/* Background ring */}
                <circle
                  cx="48"
                  cy="48"
                  r={RADIUS}
                  fill="none"
                  strokeWidth="7"
                  className="stroke-secondary"
                />
                {/* Progress ring */}
                <circle
                  cx="48"
                  cy="48"
                  r={RADIUS}
                  fill="none"
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={CIRCUM}
                  strokeDashoffset={offset}
                  className="stroke-emerald-500 dark:stroke-emerald-400 transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[20px] font-black text-primary-text leading-none">
                  {pct}%
                </span>
              </div>
            </div>

            {/* Text block */}
            <div className="flex flex-col gap-2.5">
              <div>
                <p className="text-[11px] font-bold text-muted-text">
                  Recovered
                </p>
                <p className="text-[18px] font-black text-emerald-600 dark:text-emerald-400 tracking-tight leading-none">
                  {fmtShort(data.recovery.recoveredAmount)}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock size={12} className="text-muted-text" />
                <p className="text-[11px] font-semibold text-secondary-text">
                  ~{data.breakEven.monthsRemaining} months to break-even
                </p>
              </div>
            </div>
          </div>

          {/* Bottom break-even bar */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[10px] font-bold text-muted-text">
              <span>Break-even progress</span>
              <span className="text-primary-text">
                {fmtShort(data.recovery.recoveredAmount)} /{" "}
                {fmtShort(data.capital.total)}
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden bg-secondary">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 dark:from-emerald-400 dark:to-teal-300 transition-all duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
