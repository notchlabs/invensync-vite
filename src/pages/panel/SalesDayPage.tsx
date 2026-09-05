import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Calendar, Store, ChevronDown, MessageCircle, CheckCircle2, Clock, Terminal } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { ConsumptionService, type BucketItem, type ExistingSales, type Shift } from '../../services/consumptionService';
import { InventoryService } from '../../services/inventoryService';
import type { Site } from '../../types/inventory';
import { ENV } from '../../config/env';
import { formatDateToDisplay } from '../../utils/dateUtils';
import { generateAsciiReport, generateWhatsAppAsciiMessage } from '../../utils/asciiReportGenerator';
import toast from 'react-hot-toast';
import { SalesDayItemsTable } from '../../components/salesDay/SalesDayItemsTable';
import { SalesDaySummary } from '../../components/salesDay/SalesDaySummary';
import type { SalesDayReportData } from '../../components/salesDay/SalesDayReportCard';

export default function SalesDayPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read URL params
  const siteIdParam = searchParams.get('site') || ENV.DEFAULT_SITE_ID;
  const cuIdParam = searchParams.get('cuId') || ENV.DEFAULT_CONSUMPTION_UNIT_ID;
  const dateParam = searchParams.get('date');

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    if (dateParam) return dateParam;
    const d = new Date();
    return d.toISOString().split('T')[0];
  });

  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedCuId] = useState<number | null>(() => {
    return cuIdParam ? Number(cuIdParam) : null;
  });

  const [items, setItems] = useState<BucketItem[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [, setSalesRecord] = useState<ExistingSales | null>(null);
  const [isConcluded, setIsConcluded] = useState<boolean>(false);

  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [isLoadingContext, setIsLoadingContext] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Sync state to URL params cleanly
  const updateUrlParams = useCallback((date: string, siteId?: number, cuId?: number | null) => {
    const params = new URLSearchParams();
    if (date) params.set('date', date);
    if (siteId) params.set('site', String(siteId));
    if (cuId) params.set('cuId', String(cuId));
    setSearchParams(params, { replace: true });
  }, [setSearchParams]);

  // Load sites once
  useEffect(() => {
    InventoryService.fetchSites(0, 100, '', { skipAuthRedirect: true })
      .then((res) => {
        if (res.success && res.data) {
          const list: Site[] = Array.isArray(res.data) ? res.data : (res.data.content || []);
          setSites(list);
          const initial = list.find(s => s.id === Number(siteIdParam)) || list[0];
          if (initial) setSelectedSite(initial);
        }
      })
      .catch((err) => console.error('Failed to load sites:', err));
  }, [siteIdParam]);

  // Core Data Fetching
  const fetchData = useCallback(async () => {
    const sId = selectedSite?.id || Number(siteIdParam);
    if (!sId || !selectedDate) return;

    setIsLoadingItems(true);
    setIsLoadingContext(true);

    try {
      const [itemsRes, shiftsRes, salesRes] = await Promise.all([
        ConsumptionService.fetchBucketItems({
          siteId: sId,
          consumptionUnitId: selectedCuId || 0,
          fromDate: selectedDate,
          toDate: selectedDate,
          sortDir: 'DESC',
          productName: searchQuery.trim() || '',
        }, { skipAuthRedirect: true }).catch(() => ({ success: false, data: [] })),

        ConsumptionService.fetchShifts(selectedDate, { skipAuthRedirect: true }).catch(() => ({ success: false, data: [] })),

        ConsumptionService.existsSalesByDateAndSiteId(selectedDate, sId, { skipAuthRedirect: true }).catch(() => ({ success: false, data: null })),
      ]);

      if (itemsRes.success && itemsRes.data) {
        setItems(itemsRes.data);
      } else {
        setItems([]);
      }

      if (shiftsRes.success && shiftsRes.data) {
        setShifts(shiftsRes.data);
      } else {
        setShifts([]);
      }

      if (salesRes.success && salesRes.data) {
        setSalesRecord(salesRes.data);
        setIsConcluded(true);
      } else {
        setSalesRecord(null);
        setIsConcluded(false);
      }
    } catch (err) {
      console.error('Error fetching sales day data:', err);
    } finally {
      setIsLoadingItems(false);
      setIsLoadingContext(false);
    }
  }, [selectedSite, selectedDate, selectedCuId, siteIdParam, searchQuery]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Aggregation computations for Day Report directly from fetch-consumption-lite items
  const getDayReportAggregations = useCallback((): SalesDayReportData => {
    const aggr: SalesDayReportData = {
      wbcSale: 0,
      wStoreSale: 0,
      totalSale: 0,
      billedAmount: 0,
      nonBilledAmount: 0,
      upiAndCardAmount: 0,
      cashAmount: 0,
      loyalty: 0,
      totalCost: 0,
      totalProfit: 0,
      margin: 0,
    };

    let itemsTotalCost = 0;
    let itemsTotalSale = 0;

    items.forEach((item) => {
      const saleVal = item.total ?? (item.price ? item.price * (item.qty || 1) : 0);
      const costVal = item.amountIncTax ?? 0;
      itemsTotalSale += saleVal;
      itemsTotalCost += costVal;

      const isWbc = Boolean(
        item.vendorNames?.toLowerCase().includes('wild bean') || 
        item.vendorNames?.toLowerCase().includes('wbc') ||
        item.vendorIds === '-1' || 
        item.vendorIds?.includes('-1')
      );
      if (isWbc) aggr.wbcSale! += saleVal;
      else aggr.wStoreSale! += saleVal;

      if (item.noBill) {
        aggr.nonBilledAmount! += saleVal;
      } else {
        aggr.billedAmount! += saleVal;
        if (item.upi > 0) aggr.upiAndCardAmount! += item.upi;
        else if (item.cash > 0) aggr.cashAmount! += item.cash;
        else if (item.loyalty > 0) aggr.loyalty! += item.loyalty;
      }
    });

    aggr.totalSale = itemsTotalSale;
    aggr.totalCost = itemsTotalCost;
    aggr.totalProfit = itemsTotalSale - itemsTotalCost;
    aggr.margin = itemsTotalSale > 0 ? (aggr.totalProfit / itemsTotalSale) * 100 : 0;

    return aggr;
  }, [items]);

  const dayAggr = useMemo(() => getDayReportAggregations(), [getDayReportAggregations]);

  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    updateUrlParams(newDate, selectedSite?.id, selectedCuId);
  };

  const handleSiteChange = (siteId: number) => {
    const found = sites.find(s => s.id === siteId);
    if (found) {
      setSelectedSite(found);
      updateUrlParams(selectedDate, found.id, selectedCuId);
    }
  };

  const dayShift = shifts.find(s => s.shiftType === 'DAY');
  const nightShift = shifts.find(s => s.shiftType === 'NIGHT');
  const dayShiftSale = dayShift?.totalSale || 0;
  const nightShiftSale = nightShift?.totalSale || 0;

  const handleSendWhatsAppAlert = () => {
    const formattedDate = formatDateToDisplay(selectedDate);
    const siteDisplayName = 'WildBean Cafe Rengali';

    const message = generateWhatsAppAsciiMessage({
      title: 'DAILY SALES',
      outletName: siteDisplayName,
      dateStr: formattedDate,
      isConcluded,
      totalSale: dayAggr.totalSale,
      wbcSale: dayAggr.wbcSale,
      wStoreSale: dayAggr.wStoreSale,
      dayShiftSale,
      nightShiftSale,
      billedAmount: dayAggr.billedAmount,
      nonBilledAmount: dayAggr.nonBilledAmount,
      upiAndCardAmount: dayAggr.upiAndCardAmount,
      cashAmount: dayAggr.cashAmount,
      loyalty: dayAggr.loyalty,
      includeShiftSection: true,
    });

    // Copy formatted text to clipboard
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(message).catch((e) => console.error('Clipboard error:', e));
    }

    // Open WhatsApp prefilled message
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');

    toast.success('Report copied to clipboard & opening WhatsApp!', { duration: 4000 });
  };

  const handleCopyPlainReport = () => {
    const formattedDate = formatDateToDisplay(selectedDate);
    const siteDisplayName = 'WildBean Cafe Rengali';

    const plainText = generateAsciiReport({
      title: 'DAILY SALES',
      outletName: siteDisplayName,
      dateStr: formattedDate,
      isConcluded,
      totalSale: dayAggr.totalSale,
      wbcSale: dayAggr.wbcSale,
      wStoreSale: dayAggr.wStoreSale,
      dayShiftSale,
      nightShiftSale,
      billedAmount: dayAggr.billedAmount,
      nonBilledAmount: dayAggr.nonBilledAmount,
      upiAndCardAmount: dayAggr.upiAndCardAmount,
      cashAmount: dayAggr.cashAmount,
      loyalty: dayAggr.loyalty,
      includeShiftSection: true,
    });

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(plainText).then(() => {
        toast.success('Plain text ASCII report copied to clipboard!');
      }).catch((e) => console.error('Clipboard error:', e));
    }
  };

  return (
    <div className="space-y-5 p-3.5 sm:p-5 md:p-6 pb-24 w-full max-w-full min-w-0 overflow-x-hidden">
      <PageHeader
        title="Sales Day Report"
        description="Detailed daily sales, shift reports, and itemized consumption breakup."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyPlainReport}
              className="flex items-center gap-1.5 bg-surface hover:bg-surface/80 active:scale-95 text-secondary-text font-bold text-xs px-3 py-2.5 rounded-xl border border-border-main shadow-sm transition-all cursor-pointer"
              title="Copy ASCII plain text report"
            >
              <Terminal size={14} />
              <span className="hidden sm:inline">Plain Text</span>
            </button>
            <button
              onClick={handleSendWhatsAppAlert}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl border border-emerald-500/30 shadow-md transition-all cursor-pointer hover:scale-[1.02]"
              title="Copy report & open WhatsApp"
            >
              <MessageCircle size={16} />
              <span>Send WhatsApp Alert</span>
            </button>
          </div>
        }
      />



      {/* ── Date & Outlet Filter Card ───────────────────────────── */}
      <div className="bg-card border border-border-main p-3 px-3.5 sm:px-5 rounded-xl flex items-center justify-between gap-2 sm:gap-3 w-full min-w-0">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Calendar size={16} />
          </div>
          <div className="flex flex-col relative min-w-0">
            <span className="text-[10.5px] sm:text-[11px] font-medium text-muted-text leading-tight">Date</span>
            <div className="flex items-center gap-1 cursor-pointer mt-0.5 whitespace-nowrap">
              <span className="text-[12.5px] sm:text-[14px] font-bold text-primary-text font-display whitespace-nowrap">
                {formatDateToDisplay(selectedDate)}
              </span>
              <ChevronDown size={13} className="text-muted-text shrink-0" />
            </div>
            <input 
              type="date"
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
          </div>
        </div>

        <div className="w-px h-8 bg-border-main shrink-0" />

        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="flex flex-col items-end sm:items-start min-w-0 relative">
            <span className="text-[10.5px] sm:text-[11px] font-medium text-muted-text leading-tight">Outlet</span>
            <div className="flex items-center gap-1 mt-0.5 whitespace-nowrap cursor-pointer">
              <span className="text-[12.5px] sm:text-[14px] font-bold text-primary-text font-display truncate max-w-[110px] sm:max-w-[220px]">
                {selectedSite?.name || ENV.DEFAULT_SITE_NAME}
              </span>
              <ChevronDown size={13} className="text-muted-text shrink-0" />
            </div>
            {sites.length > 0 && (
              <select
                value={selectedSite?.id || ''}
                onChange={(e) => handleSiteChange(Number(e.target.value))}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              >
                {sites.map(site => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Store size={16} />
          </div>
        </div>
      </div>

      {/* ── Shift Status & WhatsApp Report Cards ───────────────────── */}
      <div className="flex flex-col gap-2.5 w-full">
        {/* Status Card */}
        <div className="bg-card border border-border-main p-3 sm:p-4 rounded-xl flex items-center justify-between gap-3 shadow-sm min-w-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
              isConcluded 
                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
            }`}>
              {isConcluded ? <CheckCircle2 size={16} /> : <Clock size={16} />}
            </div>
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="font-bold text-primary-text text-[13.5px] truncate">
                {isConcluded ? 'Shift Concluded' : 'Shift Active / Open'}
              </span>
              <span className="text-[11.5px] text-muted-text font-normal truncate">
                {isConcluded 
                  ? 'Sales data recorded and locked.' 
                  : 'Shift is active and accepting updates.'}
              </span>
            </div>
          </div>

          <div className="flex items-center shrink-0">
            <span className={`whitespace-nowrap px-2.5 py-1 text-[11px] font-semibold rounded-full border ${
              isConcluded
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
            }`}>
              {isConcluded ? 'Closed & Locked' : 'Open / Unlocked'}
            </span>
          </div>
        </div>

        {/* WhatsApp Daily Report Card (when concluded) */}
        {isConcluded && (
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

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCopyPlainReport}
                className="px-3 py-1.5 bg-surface hover:bg-surface/80 border border-border-main text-secondary-text font-semibold text-[11.5px] rounded-lg transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                title="Copy ASCII Plain Text report"
              >
                <Terminal size={13} />
                <span className="hidden sm:inline">Plain Text</span>
              </button>
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
      </div>

      {/* ── Content Grid ── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start w-full min-w-0">
        <div className="xl:col-span-7 w-full min-w-0">
          <SalesDayItemsTable
            items={items}
            isLoadingItems={isLoadingItems}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onRefresh={fetchData}
          />
        </div>

        <div className="xl:col-span-5 w-full min-w-0">
          <SalesDaySummary
            shifts={shifts}
            selectedDate={selectedDate}
            dayAggr={dayAggr}
            isLoading={isLoadingContext}
            isConcluded={isConcluded}
          />
        </div>
      </div>
    </div>
  );
}
