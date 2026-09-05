import { useState, useMemo } from 'react';
import { Package, ChevronDown, Search, X, User } from 'lucide-react';
import type { BucketItem } from '../../services/consumptionService';
import Skeleton from 'react-loading-skeleton';
import { motion, AnimatePresence } from 'framer-motion';

const formatCurrency = (val?: number): string => {
  if (val == null || isNaN(val)) return '₹0.00';
  return `₹${val.toFixed(2)}`;
};

// Extract first name from email (e.g. "bibek.yadev@invensync.in" -> "Bibek")
const getFirstName = (email?: string): string => {
  if (!email) return '';
  const local = email.split('@')[0];
  const first = local.split('.')[0] || local;
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
};

// Calculate item cost, profit & margin from fetch-consumption response
const getItemCostAndMargin = (item: BucketItem) => {
  const salePrice = item.total ?? item.price ?? 0;
  const costPrice = item.amountIncTax ?? 0;
  const profit = salePrice - costPrice;
  const margin = salePrice > 0 ? (profit / salePrice) * 100 : 0;
  return { salePrice, costPrice, profit, margin };
};

interface SalesDayItemsTableProps {
  items: BucketItem[];
  isLoadingItems: boolean;
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
  onRefresh?: () => void;
}

export const SalesDayItemsTable = ({
  items,
  isLoadingItems,
  searchQuery = '',
  setSearchQuery,
}: SalesDayItemsTableProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // Instant real-time search filtering
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase().trim();
    return items.filter(
      (item) =>
        item.productName?.toLowerCase().includes(q) ||
        (item.vendorNames && item.vendorNames.toLowerCase().includes(q)) ||
        (item.consumedByEmail && item.consumedByEmail.toLowerCase().includes(q))
    );
  }, [items, searchQuery]);

  return (
    <div className="bg-card border border-border-main rounded-2xl p-4 sm:p-5 flex flex-col gap-3 shadow-sm w-full min-w-0">
      
      {/* ── Accordion Header Toggle ── */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-3 min-w-0 w-full cursor-pointer group text-left select-none"
      >
        <div className="flex items-center gap-2.5">
          <h3 className="text-[17px] font-bold text-primary-text font-display group-hover:text-emerald-500 transition-colors">
            Items Sold
          </h3>
          <span className="bg-surface border border-border-main text-muted-text text-[11.5px] font-bold px-2.5 py-0.5 rounded-full">
            {filteredItems.length} items
          </span>
        </div>

        <div className="w-8 h-8 rounded-lg bg-surface border border-border-main flex items-center justify-center text-muted-text group-hover:text-primary-text group-hover:border-secondary-text/50 transition-all shrink-0">
          <ChevronDown
            size={16}
            className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* ── Collapsible Content Container ── */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden flex flex-col gap-3.5"
          >
            {/* ── Search Input Field ── */}
            {setSearchQuery && (
              <div className="relative w-full pt-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-text/60" size={16} />
                <input
                  type="text"
                  placeholder="Search items, e.g. Pizza, Coffee, Cold Drink..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pl-10 pr-9 bg-surface border border-border-main/70 rounded-xl text-[13px] font-medium text-primary-text placeholder:text-muted-text/50 outline-none focus:ring-1 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-text/60 hover:text-primary-text transition-colors p-0.5 cursor-pointer"
                    title="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            )}

            {/* ── Compact Item Cards List ── */}
            <div className="flex flex-col gap-2.5 w-full min-w-0 pt-0.5">
              {isLoadingItems ? (
                Array.from({ length: 8 }).map((_, idx) => (
                  <div key={idx} className="bg-surface/50 border border-border-main/50 rounded-xl p-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Skeleton width={36} height={36} borderRadius={8} />
                      <div className="flex flex-col gap-1">
                        <Skeleton width={130} height={14} />
                        <Skeleton width={50} height={10} />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-end gap-1">
                        <Skeleton width={50} height={14} />
                        <Skeleton width={40} height={12} />
                      </div>
                      <Skeleton width={48} height={22} borderRadius={6} />
                    </div>
                  </div>
                ))
              ) : filteredItems.length === 0 ? (
                <div className="py-8 text-center text-muted-text text-[13px] border border-border-main/40 rounded-xl">
                  {searchQuery ? `No items matching "${searchQuery}"` : 'No items found.'}
                </div>
              ) : (
                filteredItems.map((item, idx) => {
                  const { salePrice, profit, margin } = getItemCostAndMargin(item);
                  const unitStr = item.unit || 'Ea';
                  const firstName = getFirstName(item.consumedByEmail);
                  const isWbc = Boolean(
                    item.vendorNames?.toLowerCase().includes('wild bean') || 
                    item.vendorNames?.toLowerCase().includes('wbc') || 
                    item.vendorIds === '-1' || 
                    item.vendorIds?.includes('-1')
                  );

                  return (
                    <div
                      key={item.cuBillId || idx}
                      className="bg-surface/60 hover:bg-surface border border-border-main/60 rounded-xl p-3 flex flex-col gap-2.5 transition-all min-w-0"
                    >
                      {/* Top Row: Thumbnail Image & FULL Product Name */}
                      <div className="flex items-start gap-2.5 min-w-0 w-full">
                        <div className="w-9 h-9 rounded-lg bg-card border border-border-main flex items-center justify-center overflow-hidden shrink-0 mt-0.5">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                          ) : (
                            <Package size={16} className="text-muted-text" />
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 flex-1 min-w-0 flex-wrap">
                          <span className="font-bold text-[13.5px] text-primary-text font-display leading-snug break-words">
                            {item.productName}
                          </span>
                          {isWbc ? (
                            <span className="text-[9px] font-black tracking-wider bg-black dark:bg-white text-white dark:text-black px-1.5 py-0.5 rounded uppercase shrink-0">WBC</span>
                          ) : (
                            <span className="text-[9px] font-black tracking-wider bg-secondary text-secondary-text border border-border-main px-1.5 py-0.5 rounded uppercase shrink-0">W STORE</span>
                          )}
                        </div>
                      </div>

                      {/* Bottom Row: Qty & Consumed By Badge on Left | Sale Price, Profit & Margin Pill on Right */}
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-border-main/40 w-full">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="bg-card border border-border-main/80 text-muted-text text-[11px] font-semibold px-2 py-0.5 rounded-md">
                            Qty: {item.qty || 1} {unitStr}
                          </span>
                          {firstName && (
                            <span
                              className="bg-card border border-border-main/80 text-secondary-text text-[11px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1"
                              title={`Consumed by: ${item.consumedByEmail}`}
                            >
                              <User size={11} className="text-muted-text" />
                              <span>{firstName}</span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                          <div className="flex items-center gap-1.5 font-mono">
                            <span className="text-[12.5px] font-bold text-primary-text">
                              {formatCurrency(salePrice)}
                            </span>
                            <span className="text-[11.5px] font-bold text-emerald-600 dark:text-emerald-400">
                              (+₹{profit.toFixed(2)})
                            </span>
                          </div>

                          <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-bold px-2 py-0.5 rounded-md font-mono shrink-0">
                            {margin.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* ── Footer ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-border-main/50 text-[11.5px]">
              <span className="text-muted-text font-medium">All values are inclusive of taxes</span>
              <span className="text-muted-text font-medium font-mono">
                Showing {filteredItems.length} of {items.length} items
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
