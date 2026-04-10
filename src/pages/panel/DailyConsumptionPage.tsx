import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

import { PageHeader } from '../../components/common/PageHeader';
import { ConsumptionService, type BucketItem, type ExistingSales, type Shift } from '../../services/consumptionService';
import type { Site } from '../../types/inventory';
import { InventoryService } from '../../services/inventoryService';

// Sub-components
import { ConsumptionFilters } from '../../components/consumption/ConsumptionFilters';
import { ConsumedItemsList } from '../../components/consumption/ConsumedItemsList';
import { ConsumptionSummary } from '../../components/consumption/ConsumptionSummary';
import { ManagerAuditForm } from '../../components/consumption/ManagerAuditForm';

export default function DailyConsumptionPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL state
  const siteIdParam = searchParams.get('site');
  const dateParam = searchParams.get('date');
  const cuIdParam = searchParams.get('cuId');

  // Local component state resolving URL IDs
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    dateParam || new Date().toISOString().split('T')[0]
  );
  const [selectedCu, setSelectedCu] = useState<any | null>(null);

  // Data fetching state
  const [isLoadingItems, setIsLoadingItems] = useState(!!siteIdParam && !!cuIdParam);
  const [isLoadingContext, setIsLoadingContext] = useState(false);
  const [items, setItems] = useState<BucketItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [salesRecord, setSalesRecord] = useState<ExistingSales | null>(null);
  const [shifts, setShifts] = useState<Shift[]>([]);
  
  // Manager Audit Form
  const [mopReading, setMopReading] = useState<number>(0);
  const [posReading, setPosReading] = useState<number>(0);
  const [cashCollected, setCashCollected] = useState<number>(0);
  const [upiCollected, setUpiCollected] = useState<number>(0);

  // Computed state
  const isConcluded = salesRecord !== null;

  // Sync params to state on init
  useEffect(() => {
    const hydrateSite = async () => {
      if (siteIdParam) {
        const res = await InventoryService.fetchSitesByIds([Number(siteIdParam)]);
        if (res.data.content.length > 0) setSelectedSite(res.data.content[0]);
      }
    };
    hydrateSite();
  }, [siteIdParam]);

  // Sync state to params
  useEffect(() => {
    const params: Record<string, string> = { date: selectedDate };
    
    // Preserve site from param if state is not yet set (hydration phase)
    if (selectedSite) {
      params.site = selectedSite.id.toString();
    } else if (siteIdParam) {
      params.site = siteIdParam;
    }

    // Preserve cuId from param if state is not yet set (hydration phase)
    if (selectedCu) {
      params.cuId = selectedCu.id.toString();
    } else if (cuIdParam) {
      params.cuId = cuIdParam;
    }

    setSearchParams(params, { replace: true });
  }, [selectedSite, selectedDate, selectedCu, siteIdParam, cuIdParam, setSearchParams]);

  // Fetch sales context and shifts based on Site & Date
  useEffect(() => {
    if (!selectedSite || !selectedDate) return;

    const fetchSalesContext = async () => {
      setIsLoadingContext(true);
      try {
        const [salesRes, shiftsRes] = await Promise.all([
          ConsumptionService.existsSalesByDateAndSiteId(selectedDate, selectedSite.id),
          ConsumptionService.fetchShifts(selectedDate)
        ]);

        if (salesRes.data) {
          setSalesRecord(salesRes.data);
          setMopReading(salesRes.data.recordedBilledAmountByManager || 0);
          setPosReading(salesRes.data.recordedPosAmountByManager || 0);
          setCashCollected(salesRes.data.cashCollectedByManager || 0);
          setUpiCollected(salesRes.data.upiCollectedByManager || 0);
        } else {
          setSalesRecord(null);
        }

        setShifts(shiftsRes.data || []);
      } catch (err) {
        console.error('Failed to fetch sales context', err);
      } finally {
        setIsLoadingContext(false);
      }
    };

    fetchSalesContext();
  }, [selectedSite, selectedDate]);

  // Fetch bucket items based on Context
  useEffect(() => {
    const fetchItems = async () => {
      if (!selectedSite || !selectedDate || !selectedCu) {
        setItems([]);
        return;
      }
      
      setIsLoadingItems(true);
      try {
        const payload = {
          siteId: selectedSite.id,
          consumptionUnitId: selectedCu.id,
          fromDate: selectedDate,
          toDate: selectedDate,
          sortDir: 'DESC',
          productName: searchQuery
        };
        const res = await ConsumptionService.fetchBucketItems(payload);
        setItems(res.data || []);
      } catch (err) {
        console.error('Failed to fetch bucket items', err);
        toast.error('Failed to load consumption items');
      } finally {
        setIsLoadingItems(false);
      }
    };

    const debounce = setTimeout(fetchItems, 300);
    return () => clearTimeout(debounce);
  }, [selectedSite, selectedDate, selectedCu, searchQuery]);

  const updateItem = (index: number, field: keyof BucketItem, value: number) => {
    if (isConcluded) return;
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    setItems(newItems);
  };

  const handleRevertItem = async (cuBillId: number) => {
    if (!selectedSite || isConcluded) return;
    
    if (!window.confirm('Are you sure you want to revert this consumed item back into inventory?')) {
      return;
    }

    try {
      await ConsumptionService.revertConsumedItem({
        consumptionUnitId: cuBillId,
        siteId: selectedSite.id
      });
      toast.success('Item reverted successfully');
      setItems(items.filter(i => i.cuBillId !== cuBillId));
    } catch (err) {
      toast.error('Failed to revert item');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isPos: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const loader = toast.loading(`Extracting ${isPos ? 'POS' : 'MOP'} reading...`);
    try {
      const res = await ConsumptionService.extractMposReceipt(file);
      toast.success('Extracted successfully', { id: loader });
      if (isPos) {
        setPosReading(res.data.value);
      } else {
        setMopReading(res.data.value);
      }
    } catch (err) {
      toast.error('Extraction failed. Please type manually.', { id: loader });
    }
    // reset input
    e.target.value = '';
  };

  const getDayReportAggregations = () => {
    const aggr = {
      wbcSale: 0,
      wStoreSale: 0,
      totalSale: 0,
      billedMop: 0,
      nonBilled: 0,
      upiTotal: 0,
      cashTotal: 0,
      loyaltyTotal: 0,
    };

    // 1. Sum up all finalized shifts returned by the API
    shifts.forEach(shift => {
      aggr.wbcSale += shift.wbcSale || 0;
      aggr.wStoreSale += shift.wstoreSale || 0;
      aggr.totalSale += shift.totalSale || 0;
      aggr.billedMop += shift.billedAmount || 0;
      aggr.nonBilled += shift.nonBilledAmount || 0;
      aggr.upiTotal += shift.upiAndCardAmount || 0;
      aggr.cashTotal += shift.cashAmount || 0;
      aggr.loyaltyTotal += shift.loyalty || 0;
    });

    // 2. If the current viewing unit is not finalized yet, its data is only in 'items'
    // We add it to the aggregation to show a real-time "Day Projection"
    const isCurrentCuFinalized = shifts.some(s => s.consumptionUnitId === selectedCu?.id);
    
    if (!isCurrentCuFinalized && items.length > 0) {
      items.forEach(item => {
        const vNames = item.vendorNames?.toLowerCase() || '';
        if (vNames.includes('wild bean')) {
          aggr.wbcSale += item.amountIncTax;
        } else {
          aggr.wStoreSale += item.amountIncTax;
        }
        aggr.totalSale += item.amountIncTax;
        aggr.billedMop += (item.cash + item.upi + item.loyalty);
        aggr.nonBilled += item.noBill || 0;
        aggr.upiTotal += item.upi || 0;
        aggr.cashTotal += item.cash || 0;
        aggr.loyaltyTotal += item.loyalty || 0;
      });
    }

    return aggr;
  };

  const handleSave = async (concludeShift: boolean) => {
    if (!selectedSite || !selectedCu || !selectedDate) {
      toast.error('Missing site or consumption unit Context');
      return;
    }

    const payload = {
      siteId: selectedSite.id,
      consumptionUnitId: selectedCu.id,
      date: selectedDate,
      productDetails: items.map(item => ({
        itemId: item.cuBillId,
        productId: item.productId,
        amountIncTax: item.amountIncTax,
        isWbc: item.vendorNames?.toLowerCase().includes('wild bean cafe') || false,
        qty: item.qty,
        cash: item.cash,
        upi: item.upi,
        noBill: item.noBill,
        loyalty: item.loyalty,
        total: item.amountIncTax
      }))
    };

    const loader = toast.loading('Saving sales data...');
    try {
      if (concludeShift) {
        await ConsumptionService.endShift(payload);
        
        if (salesRecord) {
          await ConsumptionService.saveSalesAudit(salesRecord.id, {
            recordedBilledAmountByManager: mopReading,
            recordedPosAmountByManager: posReading,
            cashCollectedByManager: cashCollected,
            upiCollectedByManager: upiCollected
          });
        }
        toast.success('Shift ended successfully', { id: loader });
        window.location.reload();
      } else {
        await ConsumptionService.saveSales(payload);
        toast.success('Progress saved', { id: loader });
      }
    } catch (err) {
      toast.error('Failed to save', { id: loader });
    }
  };

  const handleSaveAudit = async () => {
    if (!salesRecord) {
      toast.error('No sales record exists to audit. Please submit sales first.');
      return;
    }
    const loader = toast.loading('Saving manager audit...');
    try {
      await ConsumptionService.saveSalesAudit(salesRecord.id, {
        recordedBilledAmountByManager: mopReading,
        recordedPosAmountByManager: posReading,
        cashCollectedByManager: cashCollected,
        upiCollectedByManager: upiCollected
      });
      toast.success('Audit saved', { id: loader });
    } catch (err) {
      toast.error('Failed to save audit', { id: loader });
    }
  };

  const dayAggr = useMemo(() => getDayReportAggregations(), [items]);

  return (
    <div className="w-full h-full overflow-y-auto overflow-x-hidden custom-scrollbar">
      <div className="p-4 md:p-6 max-w-[1400px] mx-auto w-full flex flex-col gap-6 pb-20">
        <div className="flex items-center justify-between">
          <PageHeader 
            title="Daily Consumption & Sales" 
            description="Track item-wise sales by payment mode for the selected site and date" 
          />
        </div>

        <ConsumptionFilters 
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          selectedSite={selectedSite}
          setSelectedSite={setSelectedSite}
          selectedCu={selectedCu}
          setSelectedCu={setSelectedCu}
          initialCuId={cuIdParam ? Number(cuIdParam) : null}
        />

        {isConcluded && (
          <div className="bg-[#065f46]/10 border border-[#065f46]/20 p-4 rounded-xl flex items-start gap-3">
            <CheckCircle2 className="text-[#065f46] mt-0.5" size={20} />
            <div className="flex flex-col">
              <span className="font-bold text-[#065f46]">Sales already recorded</span>
              <span className="text-[13px] text-[#065f46]">Sales for this consumption date have been successfully concluded. No further changes are allowed.</span>
            </div>
          </div>
        )}

        <ConsumedItemsList 
          items={items}
          isLoadingItems={isLoadingItems}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isConcluded={isConcluded}
          updateItem={updateItem}
          handleRevertItem={handleRevertItem}
          selectedSite={selectedSite}
          selectedCu={selectedCu}
        />

        <ConsumptionSummary 
          shifts={shifts}
          selectedDate={selectedDate}
          dayAggr={dayAggr}
          isLoading={isLoadingContext}
        />

        <ManagerAuditForm 
          isConcluded={isConcluded}
          salesRecord={salesRecord}
          mopReading={mopReading}
          setMopReading={setMopReading}
          posReading={posReading}
          setPosReading={setPosReading}
          cashCollected={cashCollected}
          setCashCollected={setCashCollected}
          upiCollected={upiCollected}
          setUpiCollected={setUpiCollected}
          dayAggr={dayAggr}
          handleFileUpload={handleFileUpload}
          handleSave={handleSave}
          handleSaveAudit={handleSaveAudit}
        />

        <div className="flex justify-end gap-3 pb-8">
          <button 
            disabled={isConcluded}
            onClick={() => handleSave(true)}
            className="px-8 py-2.5 bg-red-600 text-white text-[14px] font-bold rounded-lg hover:bg-red-700 transition-all shadow-sm disabled:opacity-50"
          >
            End Shift
          </button>
          <button 
            disabled={isConcluded}
            onClick={() => handleSave(false)}
            className="px-8 py-2.5 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-[14px] font-bold rounded-lg hover:opacity-90 transition-all shadow-sm disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
