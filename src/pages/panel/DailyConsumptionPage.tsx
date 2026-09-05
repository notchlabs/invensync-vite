import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2, Unlock, MessageCircle } from 'lucide-react';
import { useMsal } from '@azure/msal-react';
import toast from 'react-hot-toast';

import { PageHeader } from '../../components/common/PageHeader';
import { ConsumptionService, type BucketItem, type ExistingSales, type Shift } from '../../services/consumptionService';
import type { Site } from '../../types/inventory';
import { InventoryService } from '../../services/inventoryService';
import { formatDateToDisplay } from '../../utils/dateUtils';

import { ENV } from '../../config/env';
import { generateWhatsAppAsciiMessage } from '../../utils/asciiReportGenerator';

import { ConsumptionFilters } from '../../components/consumption/ConsumptionFilters';
import { type ConsumptionUnit } from '../../components/common/ConsumptionUnitSelect';
import { ConsumedItemsList } from '../../components/consumption/ConsumedItemsList';
import { ConsumptionSummary } from '../../components/consumption/ConsumptionSummary';
import { ManagerAuditForm } from '../../components/consumption/ManagerAuditForm';
import { EndShiftModal } from '../../components/consumption/EndShiftModal';

export default function DailyConsumptionPage() {
  const { accounts } = useMsal();
  const claims = accounts[0]?.idTokenClaims ?? {};
  const tokenRoles: string[] = Array.isArray(claims['roles']) ? (claims['roles'] as string[]) : [];
  const isAdmin = tokenRoles.includes('ADMIN');

  const [searchParams, setSearchParams] = useSearchParams();

  // URL state with defaults from ENV
  const siteIdParam = searchParams.get('site') || ENV.DEFAULT_SITE_ID;
  const cuIdParam = searchParams.get('cuId') || ENV.DEFAULT_CONSUMPTION_UNIT_ID;

  // Local component state resolving URL IDs
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const dateParam = searchParams.get('date');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    if (dateParam) return dateParam;
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
  const [isOpenShiftLoading, setIsOpenShiftLoading] = useState(false);

  const handleOpenShift = async () => {
    if (!selectedSite || !selectedDate) return;

    if (!window.confirm('Are you sure you want to open this shift again? This will allow edits to daily consumption & sales.')) {
      return;
    }

    setIsOpenShiftLoading(true);
    try {
      const res = await ConsumptionService.openShift({
        siteId: selectedSite.id,
        date: selectedDate,
        consumptionUnitId: selectedCu?.id,
      });

      if (res.success) {
        toast.success('Shift opened successfully! You can now edit consumption & sales.');
        setSalesRecord(null);
        const [salesRes, shiftsRes] = await Promise.all([
          ConsumptionService.existsSalesByDateAndSiteId(selectedDate, selectedSite.id),
          ConsumptionService.fetchShifts(selectedDate)
        ]);
        setSalesRecord(salesRes.data);
        setShifts(shiftsRes.data || []);
      } else {
        toast.error(res.message || 'Failed to open shift');
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || 'Failed to open shift');
    } finally {
      setIsOpenShiftLoading(false);
    }
  };

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

    // When consumption sales are concluded, use the authoritative server data
    if (isConcluded && salesRecord) {
      aggr.wbcSale = salesRecord.wbcSale || 0;
      aggr.wStoreSale = salesRecord.wstoreSale || 0;
      aggr.totalSale = salesRecord.totalSales || 0;
      aggr.billedMop = salesRecord.invoicedSales || 0;
      aggr.nonBilled = salesRecord.nonInvoicedSales || 0;
      aggr.upiTotal = salesRecord.upiAmount || 0;
      aggr.cashTotal = salesRecord.cashAmount || 0;
      aggr.loyaltyTotal = salesRecord.loyalty || 0;
      return aggr;
    }

    // 1. Sum up shifts from the API (for shifts belonging to other CUs)
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
        const isWbc = Boolean(
          item.vendorNames?.toLowerCase().includes('wild bean') || 
          item.vendorNames?.toLowerCase().includes('wbc') ||
          item.vendorIds === '-1' || 
          item.vendorIds?.includes('-1')
        );
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
  }, [items, shifts, isConcluded, salesRecord, selectedCu]);

  const handleSave = (concludeShift: boolean, readings?: { mop: number; pos: number }): Promise<boolean> => {
    if (!selectedSite || !selectedCu || !selectedDate) {
      toast.error('Missing site or consumption unit Context');
      return Promise.resolve(false);
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
      return new Promise<boolean>((resolve) => {
        ConsumptionService.endShift(payload)
          .then(async (res) => {
            if (res.success) {
              toast.success('Shift ended successfully', { id: loader });

              try {
                const [existsRes, shiftsRes] = await Promise.all([
                  ConsumptionService.existsSalesByDateAndSiteId(payload.date, payload.siteId),
                  ConsumptionService.fetchShifts(payload.date)
                ]);

                if (existsRes.success && existsRes.data) {
                  setSalesRecord(existsRes.data);
                  if (readings) {
                    await ConsumptionService.saveSalesAudit(existsRes.data.id, {
                      recordedBilledAmountByManager: readings.mop,
                      recordedPosAmountByManager: readings.pos,
                      cashCollectedByManager: 0,
                      upiCollectedByManager: 0
                    }).catch(auditErr => console.error('Audit save error:', auditErr));
                  }
                }

                setShifts(shiftsRes.data || []);
              } catch (e) {
                console.error('Fetch after shift end failed:', e);
              } finally {
                setIsSaving(false);
                resolve(true);
              }
            } else {
              toast.error(res.message || 'Failed to end shift', { id: loader });
              setIsSaving(false);
              resolve(false);
            }
          })
          .catch(err => {
            console.error('End shift error:', err);
            toast.error('Failed to end shift', { id: loader });
            setIsSaving(false);
            resolve(false);
          });
      });
    } else {
      return ConsumptionService.saveSales(payload)
        .then(() => {
          toast.success('Progress saved', { id: loader });
          return true;
        })
        .catch((err: Error) => {
          toast.error(err.message || 'Failed to save', { id: loader });
          return false;
        })
        .finally(() => {
          setIsSaving(false);
        });
    }
  };

  const handleConfirmEndShift = (mop: number, pos: number): Promise<boolean> => {
    return handleSave(true, { mop, pos });
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

  const handleSendWhatsAppAlert = () => {
    const formattedDate = formatDateToDisplay(selectedDate);

    const dayShift = shifts.find(s => s.shiftType === 'DAY');
    const nightShift = shifts.find(s => s.shiftType === 'NIGHT');
    const dayShiftSale = dayShift?.totalSale || 0;
    const nightShiftSale = nightShift?.totalSale || 0;

    const message = generateWhatsAppAsciiMessage({
      title: 'DAILY SALES',
      outletName: 'WildBean Cafe Rengali',
      dateStr: formattedDate,
      isConcluded,
      totalSale: dayAggr.totalSale,
      wbcSale: dayAggr.wbcSale,
      wStoreSale: dayAggr.wStoreSale,
      dayShiftSale,
      nightShiftSale,
      billedAmount: dayAggr.billedMop,
      nonBilledAmount: dayAggr.nonBilled,
      upiAndCardAmount: dayAggr.upiTotal,
      cashAmount: dayAggr.cashTotal,
      loyalty: dayAggr.loyaltyTotal,
      includeShiftSection: true,
    });

    // Copy formatted text to clipboard
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(message).catch((e) => console.error('Clipboard error:', e));
    }

    // Open WhatsApp with prefilled message
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');

    toast.success('Report copied to clipboard & opening WhatsApp!', { duration: 4000 });
  };

  return (
    <div className="w-full h-full overflow-y-auto overflow-x-hidden custom-scrollbar">
      <div className="p-4 md:p-6 max-w-[1400px] mx-auto w-full flex flex-col gap-6 pb-20">
        <PageHeader
          title="Daily Consumption & Sales"
          description="Track item-wise sales by payment mode for the selected site and date"
        />

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
          <div className="flex flex-col gap-2.5">
            {/* Shift Concluded Status Card */}
            <div className="bg-card border border-border-main p-3 sm:p-4 rounded-xl flex items-center justify-between gap-3 shadow-sm min-w-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={16} />
                </div>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="font-bold text-primary-text text-[13.5px] truncate">
                    Shift Concluded
                  </span>
                  <span className="text-[11.5px] text-muted-text font-normal truncate">
                    Sales data recorded and locked.
                  </span>
                </div>
              </div>

              {isAdmin && (
                <button
                  disabled={isOpenShiftLoading}
                  onClick={handleOpenShift}
                  className="whitespace-nowrap px-3 py-1.5 bg-secondary hover:bg-secondary/80 border border-border-main text-muted-text hover:text-primary-text text-[11px] font-semibold rounded-lg transition-all shadow-sm shrink-0 flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <Unlock size={13} />
                  {isOpenShiftLoading ? 'Opening...' : 'Open Shift'}
                </button>
              )}
            </div>

            {/* Separate WhatsApp Report Card */}
            <div className="bg-card border border-border-main p-3 sm:p-3.5 rounded-xl flex items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center shrink-0">
                  <MessageCircle size={15} />
                </div>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="font-bold text-primary-text text-[13px] truncate">
                    WhatsApp Report
                  </span>
                  <span className="text-[11px] text-muted-text truncate">
                    Send report update to group <strong className="text-primary-text font-medium">"Rengali Wildbean Cafe"</strong>
                  </span>
                </div>
              </div>

              <button
                onClick={handleSendWhatsAppAlert}
                className="px-3.5 py-1.5 bg-secondary hover:bg-secondary/80 border border-border-main text-emerald-600 dark:text-emerald-400 font-semibold text-[11.5px] rounded-lg transition-all shadow-sm shrink-0 flex items-center gap-1.5 cursor-pointer"
              >
                <MessageCircle size={13} />
                <span>Send WhatsApp</span>
              </button>
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
          lastUpdated={salesRecord?.createdAt ?? (() => {
            const raw = items[0]?.consumedDate
            if (!raw) return undefined
            const m = raw.match(/T(\d{2}):(\d{2})/)
            return m ? `T${m[1]}:${m[2]}` : undefined
          })()}
          isConcluded={isConcluded}
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
              className="w-full sm:w-auto px-8 py-3 bg-red-600 text-white text-[14px] font-bold rounded-lg hover:bg-red-700 transition-all shadow-sm disabled:opacity-50 cursor-pointer"
            >
              End Shift
            </button>
            <button
              disabled={isSaving}
              onClick={() => handleSave(false)}
              className="w-full sm:w-auto px-8 py-3 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-[14px] font-bold rounded-lg hover:opacity-90 transition-all shadow-sm disabled:opacity-50 cursor-pointer"
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
        onSendWhatsApp={handleSendWhatsAppAlert}
        isLoading={isSaving}
        selectedDate={selectedDate}
      />
    </div>
  );
}
