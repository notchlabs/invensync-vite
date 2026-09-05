import { useState, useEffect, useMemo } from 'react';
import { Search, ChevronDown, RotateCw, TrendingUp, ArrowDown, ArrowUp } from 'lucide-react';
import { PublicConsumedItemRow } from './PublicConsumedItemRow';
import type { BucketItem } from '../../services/consumptionService';
import Skeleton from 'react-loading-skeleton';
import { motion, AnimatePresence } from 'framer-motion';

const formatAmount = (val?: number): string => {
  if (val == null || isNaN(val)) return '0';
  const formatted = val.toFixed(2);
  return formatted.endsWith('.00') ? formatted.slice(0, -3) : formatted;
};

interface PublicConsumedItemsListProps {
  items: BucketItem[];
  isLoadingItems: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onRefresh?: () => void;
  totalSaleAmount?: number;
}

export const PublicConsumedItemsList = ({
  items,
  isLoadingItems,
  searchQuery,
  setSearchQuery,
  onRefresh,
  totalSaleAmount,
}: PublicConsumedItemsListProps) => {
  const [sortOrder, setSortOrder] = useState<'recent' | 'oldest'>('recent');
  const [isAtBottom, setIsAtBottom] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      setIsAtBottom(scrollTop + windowHeight >= documentHeight - 140);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleScrollToggle = () => {
    if (isAtBottom) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }
  };

  const sortedItems = useMemo(() => {
    const sorted = [...items];
    return sorted.sort((a, b) => {
      const timeA = a.consumedDate ? new Date(a.consumedDate).getTime() : 0;
      const timeB = b.consumedDate ? new Date(b.consumedDate).getTime() : 0;
      if (sortOrder === 'recent') {
        return timeB - timeA;
      } else {
        return timeA - timeB;
      }
    });
  }, [items, sortOrder]);

  const totalItemsCount = items.length;
  const totalAmountSum = totalSaleAmount ?? items.reduce((sum, item) => sum + (item.price ?? 0), 0);

  return (
    <div className="flex flex-col gap-3.5">
      {/* ── Search Input Row ────────────────────────────── */}
      <div className="relative w-full">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-text/60" size={16} />
        <input 
          type="text"
          placeholder="Search items, e.g. Sandwich, Tea..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-10 pl-10 pr-3.5 bg-card border border-border-main rounded-xl text-[13px] font-medium text-primary-text placeholder:text-muted-text/50 outline-none focus:ring-1 focus:ring-emerald-500/30 transition-all"
        />
      </div>

      {/* ── Section Header Row: Items Sold & Controls ──────────────── */}
      <div className="flex items-center justify-between pt-0.5">
        <div>
          <h2 className="text-[16px] font-bold text-primary-text font-display tracking-tight leading-none">
            Items Sold
          </h2>
          <span className="text-[11px] font-medium text-muted-text mt-0.5 block">
            {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Sort Dropdown Pill */}
          <button 
            onClick={() => setSortOrder(sortOrder === 'recent' ? 'oldest' : 'recent')}
            className="px-3 py-1.5 rounded-lg bg-card border border-border-main text-[12px] font-medium text-primary-text flex items-center gap-1 cursor-pointer hover:bg-surface transition-colors"
          >
            <span>{sortOrder === 'recent' ? 'Recent' : 'Oldest'}</span>
            <ChevronDown size={13} className="text-muted-text" />
          </button>

          {/* Refresh Button */}
          {onRefresh && (
            <button 
              onClick={onRefresh}
              className="w-8 h-8 rounded-lg bg-card border border-border-main flex items-center justify-center text-primary-text hover:bg-surface transition-colors cursor-pointer"
              title="Refresh sales list"
            >
              <RotateCw size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ── Consumed Items List ───────────────────────────────────── */}
      <div className="flex flex-col gap-2.5">
        <AnimatePresence mode="wait">
          {isLoadingItems ? (
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-2.5"
            >
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="bg-card border border-border-main rounded-xl p-3 flex items-center justify-between gap-3">
                  <Skeleton width={56} height={56} borderRadius={8} />
                  <div className="flex-1 flex flex-col gap-1.5">
                    <Skeleton width="60%" height={16} />
                    <Skeleton width="35%" height={12} />
                  </div>
                  <Skeleton width={65} height={32} borderRadius={8} />
                </div>
              ))}
            </motion.div>
          ) : sortedItems.length > 0 ? (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col gap-2.5"
            >
              {sortedItems.map((item: BucketItem, idx: number) => (
                <PublicConsumedItemRow key={item.cuBillId} item={item} idx={idx} />
              ))}
            </motion.div>
          ) : (
            <div className="bg-card border border-border-main rounded-xl p-8 text-center flex flex-col items-center gap-1">
              <Search size={22} className="text-muted-text/40 mb-1" />
              <span className="text-[14px] font-bold text-primary-text font-display">
                {searchQuery.trim() ? 'No matching items' : 'No items sold'}
              </span>
              <span className="text-[11px] font-medium text-muted-text">
                {searchQuery.trim() ? `No items match "${searchQuery}"` : 'No sales recorded for the selected date.'}
              </span>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Sticky Floating Total Items & Total Amount Summary Bar ────────────────── */}
      {items.length > 0 && (
        <div className="sticky bottom-3 z-20 backdrop-blur-md bg-[#F4FAF6]/95 dark:bg-emerald-950/90 border border-emerald-500/20 rounded-xl p-3 px-3.5 flex items-center justify-between gap-3 shadow-md transition-all">
          {/* Left: Total Items */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <TrendingUp size={16} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-medium text-muted-text uppercase tracking-wider leading-tight">Total Items</span>
              <span className="text-[15px] font-bold text-primary-text font-display leading-tight">{totalItemsCount}</span>
            </div>
          </div>

          {/* Divider & Scroll Arrow Action Button */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-px h-7 bg-emerald-500/20" />
            <button
              onClick={handleScrollToggle}
              className="w-8 h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer"
              title={isAtBottom ? "Scroll to top" : "Scroll to bottom"}
            >
              {isAtBottom ? <ArrowUp size={15} /> : <ArrowDown size={15} />}
            </button>
            <div className="w-px h-7 bg-emerald-500/20" />
          </div>

          {/* Right: Total Amount */}
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-medium text-muted-text uppercase tracking-wider leading-tight text-right">Total Amount</span>
            <span className="text-[16px] font-bold text-emerald-600 dark:text-emerald-400 font-mono tracking-tight text-right">
              ₹{formatAmount(totalAmountSum)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
