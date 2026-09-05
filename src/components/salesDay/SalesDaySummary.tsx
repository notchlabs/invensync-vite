import type { Shift } from '../../services/consumptionService';
import { SalesDayReportCard, type SalesDayReportData } from './SalesDayReportCard';

interface SalesDaySummaryProps {
  shifts: Shift[];
  selectedDate: string;
  dayAggr: SalesDayReportData;
  isLoading?: boolean;
  lastUpdated?: string;
  isConcluded?: boolean;
}

export const SalesDaySummary = ({
  shifts,
  selectedDate,
  dayAggr,
  isLoading,
  lastUpdated,
  isConcluded,
}: SalesDaySummaryProps) => {
  const dayShift = shifts.find(s => s.shiftType === 'DAY');
  const nightShift = shifts.find(s => s.shiftType === 'NIGHT');

  const costRatio = dayAggr.totalSale && dayAggr.totalSale > 0 ? ((dayAggr.totalCost || 0) / dayAggr.totalSale) : 0;

  // Day Shift Metrics
  const dayShiftSale = dayShift?.totalSale || 0;
  const dayShiftCost = (dayShift?.purchaseValue && dayShift.purchaseValue > 0) ? dayShift.purchaseValue : dayShiftSale * costRatio;
  const dayShiftProfit = dayShiftSale - dayShiftCost;
  const dayShiftMargin = dayShiftSale > 0 ? (dayShiftProfit / dayShiftSale) * 100 : 0;

  // Night Shift Metrics
  const nightShiftSale = nightShift?.totalSale || 0;
  const nightShiftCost = (nightShift?.purchaseValue && nightShift.purchaseValue > 0) ? nightShift.purchaseValue : nightShiftSale * costRatio;
  const nightShiftProfit = nightShiftSale - nightShiftCost;
  const nightShiftMargin = nightShiftSale > 0 ? (nightShiftProfit / nightShiftSale) * 100 : 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Day Report Card (FIRST) */}
      <SalesDayReportCard
        variant="dayReport"
        title="Day Report"
        date={selectedDate}
        data={dayAggr}
        isLoading={isLoading}
        lastUpdated={lastUpdated}
        isConcluded={isConcluded}
        shifts={shifts}
      />

      {/* Shift DAY Card (SECOND) */}
      {dayShift && (
        <SalesDayReportCard
          variant="dayShift"
          title="Shift DAY"
          date={selectedDate}
          data={{
            wbcSale: dayShift.wbcSale,
            wStoreSale: dayShift.wstoreSale,
            totalSale: dayShift.totalSale,
            billedAmount: dayShift.billedAmount,
            nonBilledAmount: dayShift.nonBilledAmount,
            upiAndCardAmount: dayShift.upiAndCardAmount,
            cashAmount: dayShift.cashAmount,
            loyalty: dayShift.loyalty,
            totalCost: dayShiftCost,
            totalProfit: dayShiftProfit,
            margin: dayShiftMargin,
          }}
          isLoading={isLoading}
          lastUpdated={dayShift.endTime}
        />
      )}

      {/* Shift NIGHT Card (THIRD) */}
      {nightShift && (
        <SalesDayReportCard
          variant="nightShift"
          title="Shift NIGHT"
          date={selectedDate}
          data={{
            wbcSale: nightShift.wbcSale,
            wStoreSale: nightShift.wstoreSale,
            totalSale: nightShift.totalSale,
            billedAmount: nightShift.billedAmount,
            nonBilledAmount: nightShift.nonBilledAmount,
            upiAndCardAmount: nightShift.upiAndCardAmount,
            cashAmount: nightShift.cashAmount,
            loyalty: nightShift.loyalty,
            totalCost: nightShiftCost,
            totalProfit: nightShiftProfit,
            margin: nightShiftMargin,
          }}
          isLoading={isLoading}
          lastUpdated={nightShift.endTime}
        />
      )}
    </div>
  );
};
