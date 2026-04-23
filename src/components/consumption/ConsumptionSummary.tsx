
import { ReportCard } from './ReportCard';
import type { Shift } from '../../services/consumptionService';

const DAY_SHIFT_END_TIME = 'T14:30'

interface ConsumptionSummaryProps {
  shifts: Shift[];
  selectedDate: string;
  dayAggr: {
    wbcSale: number;
    wStoreSale: number;
    totalSale: number;
    billedMop: number;
    nonBilled: number;
    upiTotal: number;
    cashTotal: number;
    loyaltyTotal: number;
  };
  isLoading?: boolean;
  lastUpdated?: string;
  isConcluded?: boolean;
}

export const ConsumptionSummary = ({
  shifts,
  selectedDate,
  dayAggr,
  isLoading,
  lastUpdated,
  isConcluded,
}: ConsumptionSummaryProps) => {
  const gridClasses = `grid grid-cols-1 gap-6 ${shifts.length <= 1 ? 'md:grid-cols-2' : 'md:grid-cols-3 lg:grid-cols-3'}`;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ReportCard type="shift" title="Shift" date="" data={{}} isLoading={true} />
        <ReportCard type="shift" title="Shift" date="" data={{}} isLoading={true} />
        <ReportCard type="day" title="Day Report" date="" data={{}} isLoading={true} />
      </div>
    );
  }

  return (
    <div className={gridClasses}>
      {shifts.map(shift => {
        return (
          <ReportCard
            key={shift.id}
            type="shift"
            title={`Shift ${shift.shiftType}`}
            date={selectedDate}
            data={{
              wbcSale: shift.wbcSale,
              wStoreSale: shift.wstoreSale,
              totalSale: shift.totalSale,
              billedMop: shift.billedAmount,
              nonBilled: shift.nonBilledAmount,
              upiTotal: shift.upiAndCardAmount,
              cashTotal: shift.cashAmount,
              loyaltyTotal: shift.loyalty,
            }}
            isLoading={isLoading}
            lastUpdated={shift.shiftType === 'DAY' ? DAY_SHIFT_END_TIME : lastUpdated}
          />
        )
      })}

      <ReportCard
        type="day"
        title="Day Report"
        date={selectedDate}
        data={dayAggr}
        isLoading={isLoading}
        lastUpdated={lastUpdated}
        isConcluded={isConcluded}
      />
    </div>
  );
};
