
import { ReportCard } from './ReportCard';
import type { Shift } from '../../services/consumptionService';

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
}

export const ConsumptionSummary = ({
  shifts,
  selectedDate,
  dayAggr,
  isLoading,
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
      {shifts.map(shift => (
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
        />
      ))}
      
      <ReportCard 
        type="day"
        title="Day Report"
        date={selectedDate}
        data={dayAggr}
        isLoading={isLoading}
      />
    </div>
  );
};
