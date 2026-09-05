import { PublicReportCard } from './PublicReportCard';
import type { Shift } from '../../services/consumptionService';

const DAY_SHIFT_END_TIME = 'T14:30';

interface PublicConsumptionSummaryProps {
  shifts: Shift[];
  selectedDate: string;
  dayAggr: {
    wbcSale: number;
    wStoreSale: number;
    totalSale: number;
  };
  isLoading?: boolean;
  lastUpdated?: string;
  isConcluded?: boolean;
}

export const PublicConsumptionSummary = ({
  shifts,
  selectedDate,
  dayAggr,
  isLoading,
  lastUpdated,
  isConcluded,
}: PublicConsumptionSummaryProps) => {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <PublicReportCard type="shift" title="Shift DAY" date="" data={{}} isLoading={true} />
        <PublicReportCard type="day" title="Day Report" date="" data={{}} isLoading={true} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      {/* Shift cards */}
      {shifts.map(shift => (
        <PublicReportCard
          key={shift.id}
          type="shift"
          title={`Shift ${shift.shiftType}`}
          date={selectedDate}
          data={{
            wbcSale: shift.wbcSale,
            wStoreSale: shift.wstoreSale,
            totalSale: shift.totalSale,
          }}
          isLoading={isLoading}
          lastUpdated={shift.shiftType === 'DAY' ? DAY_SHIFT_END_TIME : lastUpdated}
        />
      ))}

      {/* Day Report */}
      <PublicReportCard
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
