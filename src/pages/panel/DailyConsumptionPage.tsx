import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

import { PageHeader } from '../../components/common/PageHeader';
import { ConsumptionService, type BucketItem, type ExistingSales, type Shift } from '../../services/consumptionService';
import type { Site } from '../../types/inventory';
import { InventoryService } from '../../services/inventoryService';

import { ENV } from '../../config/env';

import { ConsumptionFilters } from '../../components/consumption/ConsumptionFilters';
import { type ConsumptionUnit } from '../../components/common/ConsumptionUnitSelect';
import { ConsumedItemsList } from '../../components/consumption/ConsumedItemsList';
import { ConsumptionSummary } from '../../components/consumption/ConsumptionSummary';
import { ManagerAuditForm } from '../../components/consumption/ManagerAuditForm';
import { EndShiftModal } from '../../components/consumption/EndShiftModal';

export default function DailyConsumptionPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL state with defaults from ENV
  const siteIdParam = searchParams.get('site') || ENV.DEFAULT_SITE_ID;
  const cuIdParam = searchParams.get('cuId') || ENV.DEFAULT_CONSUMPTION_UNIT_ID;

  // Local component state resolving URL IDs
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [selectedCu, setSelectedCu] = useState<ConsumptionUnit | null>(null);

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

  // Modal State
  const [isEndShiftModalOpen, setIsEndShiftModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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
      } catch {
        console.error('Failed to fetch sales context');
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
      } catch {
        console.error('Failed to fetch bucket items');
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
    const item = newItems[index];
    if (field in item) {
      const typedItem = item as unknown as Record<string, unknown>;
      typedItem[field] = value;
    }
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
    } catch {
      toast.error('Failed to revert item');
    }
  };


  const getDayReportAggregations = useCallback(() => {
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

    // 1. Sum up shifts from the API
    shifts.forEach(shift => {
      // If we are currently editing this unit (not concluded), we skip its API total
      // and use the live 'items' total below instead to ensure real-time accuracy.
      if (!isConcluded && shift.consumptionUnitId === selectedCu?.id) return;

      aggr.wbcSale += shift.wbcSale || 0;
      aggr.wStoreSale += shift.wstoreSale || 0;
      aggr.totalSale += shift.totalSale || 0;
      aggr.billedMop += shift.billedAmount || 0;
      aggr.nonBilled += shift.nonBilledAmount || 0;
      aggr.upiTotal += shift.upiAndCardAmount || 0;
      aggr.cashTotal += shift.cashAmount || 0;
      aggr.loyaltyTotal += shift.loyalty || 0;
    });

    // 2. Add real-time totals from the current list of items if not concluded
    if (!isConcluded && items.length > 0) {
      items.forEach(item => {
        const sale = item.cash + item.upi + item.loyalty;
        const isWbc = item.vendorIds === '-1';
        if (isWbc) {
          aggr.wbcSale += sale
        } else {
          aggr.wStoreSale += sale
        }
        aggr.totalSale += sale;
        aggr.billedMop += sale - item.noBill;
        aggr.nonBilled += item.noBill || 0;
        aggr.upiTotal += item.upi || 0;
        aggr.cashTotal += item.cash || 0;
        aggr.loyaltyTotal += item.loyalty || 0;
      });
    }

    return aggr;
  }, [items, shifts, isConcluded, selectedCu]);

  const handleSave = (concludeShift: boolean, readings?: { mop: number; pos: number }) => {
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
        total: item.loyalty + item.upi + item.cash
      }))
    };

    setIsSaving(true);
    const loader = toast.loading(concludeShift ? 'Ending shift...' : 'Saving sales data...');

    if (concludeShift) {
      ConsumptionService.endShift(payload)
        .then(res => {
          if (res.success) {
            // Verify and retrieve the correct salesId after shift end
            ConsumptionService.existsSalesByDateAndSiteId(payload.date, payload.siteId)
              .then(existsRes => {
                if (existsRes.success && existsRes.data && readings) {
                  ConsumptionService.saveSalesAudit(existsRes.data.id, {
                    recordedBilledAmountByManager: readings.mop,
                    recordedPosAmountByManager: readings.pos,
                    cashCollectedByManager: 0,
                    upiCollectedByManager: 0
                  })
                    .then(() => {
                      toast.success('Audit data synchronized');
                    })
                    .catch(auditErr => {
                      console.error('Failed to auto-save audit:', auditErr);
                      toast.error('Shift ended, but audit sync failed.');
                    })
                    .finally(() => {
                      toast.success('Shift ended successfully', { id: loader });
                      window.location.reload();
                    });
                } else {
                  toast.success('Shift ended successfully', { id: loader });
                  window.location.reload();
                }
              })
              .catch(verifyErr => {
                console.error('Verification error after shift end:', verifyErr);
                toast.success('Shift ended successfully', { id: loader });
                window.location.reload();
              });
          } else {
            toast.error(res.message || 'Failed to end shift', { id: loader });
            setIsSaving(false);
          }
        })
        .catch(err => {
          console.error('End shift error:', err);
          toast.error('Failed to end shift', { id: loader });
          setIsSaving(false);
        });
    } else {
      ConsumptionService.saveSales(payload)
        .then(() => {
          toast.success('Progress saved', { id: loader });
        })
        .catch((err: Error) => {
          toast.error(err.message || 'Failed to save', { id: loader });
        })
        .finally(() => {
          setIsSaving(false);
        });
    }
  };

  const handleConfirmEndShift = (mop: number, pos: number) => {
    setIsEndShiftModalOpen(false);
    handleSave(true, { mop, pos });
  };

  const handleSaveAudit = () => {
    if (!salesRecord) {
      toast.error('No sales record exists to audit. Please submit sales first.');
      return;
    }
    const loader = toast.loading('Saving manager audit...');
    console.log("sales", salesRecord);
    ConsumptionService.saveSalesAudit(salesRecord.id, {
      recordedBilledAmountByManager: mopReading,
      recordedPosAmountByManager: posReading,
      cashCollectedByManager: cashCollected,
      upiCollectedByManager: upiCollected
    })
      .then(() => {
        toast.success('Audit saved', { id: loader });
      })
      .catch((err: Error) => {
        toast.error(err.message || 'Failed to save audit', { id: loader });
      });
  };

  const dayAggr = useMemo(() => getDayReportAggregations(), [getDayReportAggregations]);

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

        {isConcluded && (
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
            handleSave={handleSave}
            handleSaveAudit={handleSaveAudit}
          />
        )}

        {!isConcluded && (
          <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pb-8 px-1 sm:px-0">
            <button
              disabled={isSaving}
              onClick={() => setIsEndShiftModalOpen(true)}
              className="w-full sm:w-auto px-8 py-3 bg-red-600 text-white text-[14px] font-bold rounded-lg hover:bg-red-700 transition-all shadow-sm disabled:opacity-50"
            >
              End Shift
            </button>
            <button
              disabled={isSaving}
              onClick={() => handleSave(false)}
              className="w-full sm:w-auto px-8 py-3 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-[14px] font-bold rounded-lg hover:opacity-90 transition-all shadow-sm disabled:opacity-50"
            >
              Save
            </button>
          </div>
        )}
      </div>

      <EndShiftModal
        isOpen={isEndShiftModalOpen}
        onClose={() => setIsEndShiftModalOpen(false)}
        onConfirm={handleConfirmEndShift}
        isLoading={isSaving}
      />
    </div>
  );
}
