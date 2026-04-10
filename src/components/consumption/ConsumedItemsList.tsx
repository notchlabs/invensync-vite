import React, { useState } from 'react';
import { Search, ChevronDown, ChevronRight } from 'lucide-react';
import { ConsumedItemRow } from './ConsumedItemRow';
import type { BucketItem } from '../../services/consumptionService';
import Skeleton from 'react-loading-skeleton';
import { motion, AnimatePresence } from 'framer-motion';

interface ConsumedItemsListProps {
  items: BucketItem[];
  isLoadingItems: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isConcluded: boolean;
  updateItem: (index: number, field: keyof BucketItem, value: number) => void;
  handleRevertItem: (cuBillId: number) => void;
  selectedSite?: any | null;
  selectedCu?: any | null;
}

export const ConsumedItemsList = ({
  items,
  isLoadingItems,
  searchQuery,
  setSearchQuery,
  isConcluded,
  updateItem,
  handleRevertItem,
  selectedSite,
  selectedCu,
}: ConsumedItemsListProps) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="bg-card border border-border-main rounded-xl shadow-sm overflow-hidden mt-4">
      {/* Header */}
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-bold text-primary-text font-display">Consumed Items</span>
        </div>
        {isExpanded ? <ChevronDown size={20} className="text-muted-text" /> : <ChevronRight size={20} className="text-muted-text" />}
      </button>

      <div className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
          <div className="p-4 pt-0">
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-text" size={18} />
              <input 
                type="text"
                placeholder="Search item by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 pl-10 pr-4 bg-transparent border border-border-main rounded-xl text-[14px] text-primary-text outline-none focus:ring-2 focus:ring-btn-primary/20 transition-all shadow-sm"
              />
            </div>

            <div className="flex flex-col border border-border-main rounded-xl overflow-hidden divide-y divide-border-main scroll-smooth">
              <AnimatePresence mode="wait">
                {isLoadingItems ? (
                  <motion.div
                    key="items-skeleton"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <div key={idx} className="flex flex-col lg:flex-row items-center gap-4 lg:gap-6 p-4">
                        <div className="flex items-center gap-4 flex-1 w-full lg:w-auto">
                          <Skeleton width={32} height={32} borderRadius={8} />
                          <Skeleton width={40} height={40} borderRadius={6} />
                          <div className="flex flex-col flex-1 gap-1">
                            <Skeleton width="60%" height={16} />
                            <Skeleton width="40%" height={12} />
                            <Skeleton width="30%" height={10} />
                          </div>
                        </div>
                        <div className="flex items-center gap-4 lg:gap-6 w-full lg:w-auto">
                          <div className="flex flex-col gap-1 items-end min-w-[70px]">
                            <Skeleton width={50} height={12} />
                            <Skeleton width={70} height={20} borderRadius={20} />
                          </div>
                          <div className="flex items-start gap-3">
                            {[1, 2, 3, 4].map(i => (
                              <div key={i} className="flex flex-col gap-1.5 w-[80px]">
                                <Skeleton width={30} height={10} />
                                <Skeleton width="100%" height={32} borderRadius={6} />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    key="items-content"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {items.length > 0 ? (
                      items.map((item, idx) => (
                        <ConsumedItemRow 
                          key={item.cuBillId}
                          item={item}
                          idx={idx}
                          isConcluded={isConcluded}
                          updateItem={updateItem}
                          handleRevertItem={handleRevertItem}
                        />
                      ))
                    ) : (
                      <div className="p-10 text-center flex flex-col items-center gap-2">
                        <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-full mb-2">
                          <Search size={24} className="text-muted-text" />
                        </div>
                        {!selectedSite || !selectedCu ? (
                          <>
                            <span className="text-[15px] font-bold text-primary-text">Context not selected</span>
                            <span className="text-[13px] text-muted-text">Please select a Site and Consumption Unit to view items</span>
                          </>
                        ) : (
                          <>
                            <span className="text-[15px] font-bold text-primary-text">No items found</span>
                            <span className="text-[13px] text-muted-text">Try adjusting your filters or search query</span>
                          </>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

