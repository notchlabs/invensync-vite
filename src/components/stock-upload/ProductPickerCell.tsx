import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronDown, Check, Loader2, Search } from 'lucide-react';
import { InventoryService } from '../../services/inventoryService';
import type { Product } from '../../types/inventory';
import type { UploadQueueItem } from './UploadArea';

interface ProductPickerCellProps {
  product: NonNullable<UploadQueueItem['extractedData']>['products'][number];
  index: number;
  onUpdate: (index: number, fields: Record<string, string | number | null>) => void;
  disabled?: boolean;
}

export function ProductPickerCell({ product, index, onUpdate, disabled }: ProductPickerCellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef(0);
  const searchRef = useRef('');
  const observerTarget = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);
  const hasMoreRef = useRef(true);

  const isNew = !product._cacheId;

  // Position dropdown using fixed coords relative to trigger
  const updatePosition = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 4,
        left: rect.left,
        width: Math.max(rect.width, 300),
      });
    }
  }, []);

  const loadItems = useCallback(async (reset: boolean = false) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setIsLoading(true);
    try {
      if (reset) { pageRef.current = 0; hasMoreRef.current = true; setHasMore(true); }
      if (!hasMoreRef.current && !reset) { loadingRef.current = false; setIsLoading(false); return; }
      const res = await InventoryService.fetchProducts(pageRef.current, 10, searchRef.current);
      const newItems = res.data?.content || [];
      setItems(prev => reset ? newItems : [...prev, ...newItems]);
      pageRef.current += 1;
      const last = res.data?.last !== undefined ? res.data.last : newItems.length < 10;
      hasMoreRef.current = !last;
      setHasMore(!last);
    } catch {
      // ignore
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
    }
  }, []);

  // Toggle open + position
  const handleOpen = () => {
    if (disabled) return;
    if (!isOpen) {
      updatePosition();
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  // Debounced search
  useEffect(() => {
    if (!isOpen) return;
    if (search.length > 0 && search.length < 2) return;
    const t = setTimeout(() => {
      if (searchRef.current !== search) {
        searchRef.current = search;
        loadItems(true);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [search, isOpen, loadItems]);

  // Initial load on open
  useEffect(() => {
    if (isOpen && items.length === 0) {
      searchRef.current = '';
      loadItems(true);
    }
  }, [isOpen, items.length, loadItems]);

  // Infinite scroll
  useEffect(() => {
    if (!isOpen) return;
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMoreRef.current && !loadingRef.current) loadItems(false);
    }, { threshold: 0.1 });
    if (observerTarget.current) obs.observe(observerTarget.current);
    return () => obs.disconnect();
  }, [isOpen, loadItems]);

  // Click outside — check both wrapper and dropdown
  useEffect(() => {
    if (!isOpen) return;
    const h = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        wrapperRef.current && !wrapperRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [isOpen]);

  // Close on scroll of parent container
  useEffect(() => {
    if (!isOpen) return;
    const scrollParent = wrapperRef.current?.closest('.overflow-y-auto');
    if (scrollParent) {
      const onScroll = () => setIsOpen(false);
      scrollParent.addEventListener('scroll', onScroll, { passive: true });
      return () => scrollParent.removeEventListener('scroll', onScroll);
    }
  }, [isOpen]);

  const handleSelect = (p: Product) => {
    onUpdate(index, {
      name: p.name,
      imageUrl: p.imageUrl ?? product.imageUrl ?? null,
      _cacheId: p.id,
    });
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="w-full">
      {/* Trigger */}
      <button
        ref={triggerRef}
        onClick={handleOpen}
        disabled={disabled}
        className={`w-full text-left bg-card border ${isNew ? 'border-amber-400/40' : 'border-border-main'} ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-secondary-text/40'} rounded-md px-2 py-1 text-[12px] font-bold text-primary-text transition-all outline-none flex items-center gap-1.5 min-w-0`}
        title={product.name}
      >
        <div className="w-5 h-5 bg-white border border-border-main/30 rounded shrink-0 overflow-hidden flex items-center justify-center">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt="" className="w-full h-full object-contain" />
          ) : (
            <span className="text-[6px] text-muted-text/30 font-black">IMG</span>
          )}
        </div>
        <span className="truncate flex-1 leading-tight min-w-0">{product.name || 'Select product'}</span>
        {isNew && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" title="New product" />}
        <ChevronDown size={10} className={`text-muted-text/40 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Fixed-position dropdown (portalled above everything) */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="fixed bg-card border border-border-main rounded-lg shadow-2xl z-[200] overflow-hidden animate-[fadeIn_0.1s_ease-out] flex flex-col"
          style={{
            top: dropdownPos.top,
            left: dropdownPos.left,
            width: dropdownPos.width,
            maxHeight: 260,
          }}
        >
          {/* Search */}
          <div className="p-1.5 border-b border-border-main/30 shrink-0">
            <div className="relative">
              <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-text/50" />
              <input
                autoFocus
                placeholder="Search products..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-6 pr-2 py-1.5 bg-surface border border-border-main rounded text-[11px] text-primary-text placeholder:text-muted-text/50 focus:outline-none"
              />
            </div>
          </div>
          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {items.map(item => {
              const isSelected = product._cacheId === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-left transition-colors border-b border-border-main/10 last:border-0 ${isSelected ? 'bg-surface' : 'hover:bg-surface/60'}`}
                >
                  <div className="w-5 h-5 bg-white border border-border-main/30 rounded shrink-0 overflow-hidden flex items-center justify-center">
                    {item.imageUrl ? <img src={item.imageUrl} alt="" className="w-full h-full object-contain" /> : <Search size={8} className="text-muted-text/20" />}
                  </div>
                  <span className="text-[11px] font-bold text-primary-text truncate flex-1 min-w-0">{item.name}</span>
                  <span className="text-[9px] text-muted-text/50 shrink-0">{item.unit}</span>
                  {isSelected && <Check size={12} className="text-[#1a7a4a] shrink-0" strokeWidth={3} />}
                </button>
              );
            })}
            <div ref={observerTarget} className="h-6 flex items-center justify-center">
              {isLoading && <Loader2 size={12} className="animate-spin text-muted-text/40" />}
              {!isLoading && !hasMore && items.length > 0 && <span className="text-[9px] text-muted-text/40">End of list</span>}
              {!isLoading && items.length === 0 && search.length >= 2 && <span className="text-[9px] text-muted-text/40">No results</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
