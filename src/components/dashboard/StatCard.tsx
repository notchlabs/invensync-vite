import Skeleton from "react-loading-skeleton"
import { formatIndianNumber } from "../../utils/numberFormat"
import { ArrowDownRight, ArrowUpRight } from "lucide-react"
import type { InventoryStats } from "../../services/reportService"

export function StatCard({
    label, icon: Icon, item, isLoading,
  }: {
    label: string
    icon: React.ElementType
    item: InventoryStats[keyof InventoryStats] | undefined
    isLoading: boolean
  }) {
    const isUp   = item?.trend === 'UP'
    const isDown = item?.trend === 'DOWN'
  
    return (
      <div className="bg-card border border-border-main rounded-2xl px-5 py-4 flex-1 min-w-[180px] flex flex-col gap-2">
        <div className="flex items-start justify-between">
          <span className="text-[11px] font-bold text-muted-text">{label}</span>
          <Icon size={15} className="text-muted-text/50 shrink-0 mt-0.5" />
        </div>
  
        {isLoading || !item ? (
          <>
            <Skeleton height={30} width={120} borderRadius={6} />
            <Skeleton height={12} width={160} borderRadius={4} />
          </>
        ) : (
          <>
            <p className="text-[26px] font-black text-primary-text tracking-tight leading-none">
              {formatIndianNumber(item.amount)}
            </p>
            <div className={`flex items-center gap-1 text-[12px] font-bold ${isUp ? 'text-emerald-600 dark:text-emerald-400' : isDown ? 'text-rose-500' : 'text-muted-text'}`}>
              {isUp ? <ArrowUpRight size={13} /> : isDown ? <ArrowDownRight size={13} /> : null}
              <span>{item.percentageChange}%</span>
              <span className="font-medium text-muted-text">
                {item.comparisonType === 'YESTERDAY' ? 'than yesterday' : 'than last month'}
              </span>
            </div>
          </>
        )}
      </div>
    )
  }