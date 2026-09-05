import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Sun, Moon, LogIn, LayoutDashboard, Calendar, Store, ChevronDown, ShoppingBag, FileText } from 'lucide-react';
import { useMsal } from '@azure/msal-react';
import toast from 'react-hot-toast';

import { ConsumptionService, type BucketItem, type ExistingSales, type Shift } from '../services/consumptionService';
import type { Site } from '../types/inventory';
import { ENV } from '../config/env';
import { useTheme } from '../context/ThemeContext';
import { formatDateToDisplay } from '../utils/dateUtils';

import { type ConsumptionUnit } from '../components/common/ConsumptionUnitSelect';
import { PublicConsumedItemsList } from '../components/public/PublicConsumedItemsList';
import { PublicConsumptionSummary } from '../components/public/PublicConsumptionSummary';

export default function PublicConsumptionPage() {
  const { theme, toggleTheme } = useTheme();
  const { accounts } = useMsal();
  const isLoggedIn = accounts.length > 0;

  const [searchParams, setSearchParams] = useSearchParams();

  // Tab state: 'items' | 'reports'
  const [activeTab, setActiveTab] = useState<'items' | 'reports'>('items');

  // URL state with defaults from ENV
  const siteIdParam = searchParams.get('site') || ENV.DEFAULT_SITE_ID;
  const cuIdParam = searchParams.get('cuId') || ENV.DEFAULT_CONSUMPTION_UNIT_ID;

  // Local component state resolving URL IDs directly without network calls
  const [selectedSite] = useState<Site | null>(() => ({
    id: Number(siteIdParam),
    name: ENV.DEFAULT_SITE_NAME,
  } as Site));
  const dateParam = searchParams.get('date');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    if (dateParam) return dateParam;
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [selectedCu] = useState<ConsumptionUnit | null>(() => ({
    id: Number(cuIdParam),
    label: 'Daily Consumptions',
  }));

  // Data fetching state
  const [isLoadingItems, setIsLoadingItems] = useState(!!siteIdParam && !!cuIdParam);
  const [isLoadingContext, setIsLoadingContext] = useState(false);
  const [items, setItems] = useState<BucketItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const [salesRecord, setSalesRecord] = useState<ExistingSales | null>(null);
  const [shifts, setShifts] = useState<Shift[]>([]);

  // Computed state
  const isConcluded = salesRecord !== null;

  // Sync state to URL params
  useEffect(() => {
    const params: Record<string, string> = { date: selectedDate };

    if (selectedSite) {
      params.site = selectedSite.id.toString();
    } else if (siteIdParam) {
      params.site = siteIdParam;
    }

    if (selectedCu) {
      params.cuId = selectedCu.id.toString();
    } else if (cuIdParam) {
      params.cuId = cuIdParam;
    }

    setSearchParams(params, { replace: true });
  }, [selectedSite, selectedDate, selectedCu, siteIdParam, cuIdParam, setSearchParams]);

  // Fetch sales context and shifts based on Site & Date (with skipAuthRedirect)
  const fetchSalesContext = useCallback(async () => {
    if (!selectedSite || !selectedDate) return;
    setIsLoadingContext(true);
    try {
      const [salesRes, shiftsRes] = await Promise.all([
        ConsumptionService.existsSalesByDateAndSiteId(selectedDate, selectedSite.id, { skipAuthRedirect: true }),
        ConsumptionService.fetchShifts(selectedDate, { skipAuthRedirect: true })
      ]);

      if (salesRes.data) {
        setSalesRecord(salesRes.data);
      } else {
        setSalesRecord(null);
      }

      setShifts(shiftsRes.data || []);
    } catch (e) {
      console.error('Failed to fetch public sales context', e);
    } finally {
      setIsLoadingContext(false);
    }
  }, [selectedSite, selectedDate]);

  useEffect(() => {
    fetchSalesContext();
  }, [fetchSalesContext]);

  // Fetch bucket items based on Context (with skipAuthRedirect)
  const fetchItems = useCallback(async () => {
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
      const res = await ConsumptionService.fetchBucketItems(payload, { skipAuthRedirect: true });
      setItems(res.data || []);
    } catch (e) {
      console.error('Failed to fetch public bucket items', e);
      toast.error('Failed to load daily sales items');
    } finally {
      setIsLoadingItems(false);
    }
  }, [selectedSite, selectedDate, selectedCu, searchQuery]);

  useEffect(() => {
    const debounce = setTimeout(fetchItems, 300);
    return () => clearTimeout(debounce);
  }, [fetchItems]);

  // Calculate day report aggregations
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

    shifts.forEach(shift => {
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
          aggr.wbcSale += sale;
        } else {
          aggr.wStoreSale += sale;
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

  const dayAggr = useMemo(() => getDayReportAggregations(), [getDayReportAggregations]);

  return (
    <div className="min-h-screen bg-bg-app text-primary-text font-body flex flex-col">
      {/* ── Top Header Navigation Bar ────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-card/90 backdrop-blur-md border-b border-border-main transition-colors">
        <div className="w-full max-w-[1400px] mx-auto px-2 sm:px-4 md:px-6 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5 group">
            <img src="/inven_sync_dark.png" alt="InvenSync" className="w-8 h-8 rounded-lg object-contain shrink-0" />
            <span className="text-[19px] sm:text-[20px] font-bold tracking-tight text-primary-text font-display">
              InvenSync
            </span>
          </Link>

          <div className="flex items-center gap-2">
            {/* Dark / Light Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-lg bg-surface hover:bg-card border border-border-main text-secondary-text flex items-center justify-center transition-colors cursor-pointer"
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            {/* Login / App Panel Link */}
            {isLoggedIn ? (
              <Link
                to="/app/panel/inventory/consumption"
                className="w-9 h-9 rounded-lg bg-[#121824] dark:bg-white text-white dark:text-black flex items-center justify-center hover:opacity-90 transition-opacity"
                title="Go to App Panel"
              >
                <LayoutDashboard size={17} />
              </Link>
            ) : (
              <Link
                to="/app/panel/inventory"
                className="w-9 h-9 rounded-lg bg-[#121824] dark:bg-white text-white dark:text-black flex items-center justify-center hover:opacity-90 transition-opacity"
                title="Sign In"
              >
                <LogIn size={17} />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ── Main Content Container ───────────────────────────────── */}
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-2 sm:px-4 md:px-6 py-3.5 sm:py-5 flex flex-col gap-4 pb-20">

        {/* ── Date & Outlet Filter Card ───────────────────────────── */}
        <div className="bg-card border border-border-main p-3 px-3.5 sm:px-5 rounded-xl flex items-center justify-between gap-2 sm:gap-3">
          {/* Left: Date */}
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
                onChange={(e) => setSelectedDate(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
            </div>
          </div>

          {/* Divider */}
          <div className="w-px h-8 bg-border-main shrink-0" />

          {/* Right: Outlet */}
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="flex flex-col items-end sm:items-start min-w-0">
              <span className="text-[10.5px] sm:text-[11px] font-medium text-muted-text leading-tight">Outlet</span>
              <div className="flex items-center gap-1 mt-0.5 whitespace-nowrap">
                <span className="text-[12.5px] sm:text-[14px] font-bold text-primary-text font-display truncate max-w-[110px] sm:max-w-[200px]">
                  {selectedSite?.name || ENV.DEFAULT_SITE_NAME}
                </span>
                <ChevronDown size={13} className="text-muted-text shrink-0" />
              </div>
            </div>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Store size={16} />
            </div>
          </div>
        </div>

        {/* ── Responsive Content Grid (Desktop: Side-by-Side, Mobile: Tabbed/Stacked) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

          {/* Items Sold Section (Left Column on Desktop, Controlled by Tab on Mobile) */}
          <div className={`lg:col-span-7 xl:col-span-8 ${activeTab === 'items' ? 'block' : 'hidden lg:block'}`}>
            <PublicConsumedItemsList
              items={items}
              isLoadingItems={isLoadingItems}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onRefresh={fetchItems}
              totalSaleAmount={dayAggr.totalSale}
            />
          </div>

          {/* Reports Section (Right Column on Desktop, Controlled by Tab on Mobile) */}
          <div className={`lg:col-span-5 xl:col-span-4 lg:sticky lg:top-20 ${activeTab === 'reports' ? 'block' : 'hidden lg:block'}`}>
            <PublicConsumptionSummary
              shifts={shifts}
              selectedDate={selectedDate}
              dayAggr={dayAggr}
              isLoading={isLoadingContext}
              lastUpdated={salesRecord?.createdAt ?? (() => {
                const raw = items[0]?.consumedDate;
                if (!raw) return undefined;
                const m = raw.match(/T(\d{2}):(\d{2})/);
                return m ? `T${m[1]}:${m[2]}` : undefined;
              })()}
              isConcluded={isConcluded}
            />
          </div>
        </div>

        {/* ── Mobile/Tablet Tab Switcher Bar (Hidden on Desktop) ─────── */}
        <div className="lg:hidden bg-card border border-border-main rounded-xl p-1 flex items-center gap-1 mt-3 w-full">
          <button
            onClick={() => setActiveTab('items')}
            className={`py-2 px-3.5 rounded-lg flex-1 flex items-center justify-center gap-2 text-[13px] font-bold transition-all cursor-pointer ${activeTab === 'items'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                : 'text-secondary-text hover:text-primary-text hover:bg-surface'
              }`}
          >
            <ShoppingBag size={15} />
            <span>Items Sold</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`py-2 px-3.5 rounded-lg flex-1 flex items-center justify-center gap-2 text-[13px] font-bold transition-all cursor-pointer ${activeTab === 'reports'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                : 'text-secondary-text hover:text-primary-text hover:bg-surface'
              }`}
          >
            <FileText size={15} />
            <span>Reports</span>
          </button>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-border-main/50 bg-card/50 py-4 mt-auto">
        <div className="w-full max-w-[1400px] mx-auto px-2 sm:px-4 md:px-6 flex items-center justify-between gap-3 text-[11px] text-muted-text font-medium">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-primary-text">InvenSync</span>
            <span>•</span>
            <span>Public Mirror</span>
          </div>
          <div>Powered by Notch Labs</div>
        </div>
      </footer>
    </div>
  );
}
