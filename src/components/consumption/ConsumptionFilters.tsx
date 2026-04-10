import { SiteFilterSingle } from '../filters/SiteFilterSingle';
import { ConsumptionUnitSelect } from '../common/ConsumptionUnitSelect';
import type { Site } from '../../types/inventory';

interface ConsumptionFiltersProps {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  selectedSite: Site | null;
  setSelectedSite: (site: Site | null) => void;
  selectedCu: any | null;
  setSelectedCu: (cu: any | null) => void;
  initialCuId?: number | null;
}

export const ConsumptionFilters = ({
  selectedDate,
  setSelectedDate,
  selectedSite,
  setSelectedSite,
  selectedCu,
  setSelectedCu,
  initialCuId,
}: ConsumptionFiltersProps) => {
  return (
    <div className="bg-card border border-border-main p-4 rounded-xl shadow-sm flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
      <div className="relative flex-1 min-w-0 w-full sm:w-auto">
        <input 
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-full h-10 px-4 bg-surface border border-border-main rounded-lg text-[14px] text-primary-text outline-none focus:ring-2 focus:ring-btn-primary/20 appearance-none"
        />
      </div>
      <SiteFilterSingle 
        value={selectedSite} 
        onChange={setSelectedSite} 
        className="flex-1 min-w-0 w-full sm:w-auto"
      />
      {selectedSite && (
        <ConsumptionUnitSelect
          siteId={selectedSite.id}
          value={selectedCu}
          onChange={setSelectedCu}
          initialCuId={initialCuId}
          className="flex-1 min-w-0 w-full sm:w-auto"
        />
      )}
    </div>
  );
};
