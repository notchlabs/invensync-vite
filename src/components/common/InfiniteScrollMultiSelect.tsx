import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, Loader2, ChevronDown, Check } from 'lucide-react'
import type { PaginatedResponse } from '../../services/common/common.types'

interface InfiniteScrollMultiSelectProps<T> {
  placeholder: string
  fetchData: (page: number, size: number, search: string) => Promise<{ data: PaginatedResponse<T> }>
  keyExtractor: (item: T) => string | number
  renderLabel: (item: T) => React.ReactNode
  selectedItems: T[]
  onChange: (items: T[]) => void
  popoverAlign?: 'left' | 'right'
  className?: string
}

export function InfiniteScrollMultiSelect<T>({
  placeholder,
  fetchData,
  keyExtractor,
  renderLabel,
  selectedItems,
  onChange,
  popoverAlign = 'left',
  className = 'w-[220px]'
}: InfiniteScrollMultiSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [items, setItems] = useState<T[]>([])
  
  // Use refs for fetch state to prevent IntersectionObserver infinite loops
  const pageRef = useRef(0)
  const hasMoreRef = useRef(true)
  const isLoadingRef = useRef(false)
  const searchRef = useRef('')

  const [uiLoading, setUiLoading] = useState(false)
  const [hasMoreUI, setHasMoreUI] = useState(true)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const observerTarget = useRef<HTMLDivElement>(null)

  // Stable Fetch logic
  const loadItems = useCallback(async (reset: boolean = false) => {
    if (isLoadingRef.current) return;

    try {
      isLoadingRef.current = true
      setUiLoading(true)

      if (reset) {
        pageRef.current = 0
        hasMoreRef.current = true
      }

      if (!hasMoreRef.current) {
        isLoadingRef.current = false
        setUiLoading(false)
        return
      }

      // Default fetch 5 items per request 
      const res = await fetchData(pageRef.current, 5, searchRef.current)
      
      const newItems = res.data.content || []
      
      setItems(prev => reset ? newItems : [...prev, ...newItems])
      pageRef.current += 1
      
      if (res.data.last !== undefined) {
        hasMoreRef.current = !res.data.last
      } else {
        hasMoreRef.current = newItems.length === 5
      }
      setHasMoreUI(hasMoreRef.current)
    } catch (error) {
      console.error('Failed to fetch items:', error)
    } finally {
      isLoadingRef.current = false
      setUiLoading(false)
    }
  }, [fetchData])

  // Handle search with debounce and minimum 3 characters
  useEffect(() => {
    // Wait for at least 3 characters before triggering a network search
    if (search.length > 0 && search.length < 3) {
      return
    }

    const timer = setTimeout(() => {
      // Only fetch if the search actually changed and dropdown is open
      if (isOpen && searchRef.current !== search) {
        searchRef.current = search
        loadItems(true)
      }
    }, 300)
    
    return () => clearTimeout(timer)
  }, [search, isOpen, loadItems])

  // Fetch initial on open
  useEffect(() => {
    if (isOpen && items.length === 0 && searchRef.current === '') {
      loadItems(true)
    }
  }, [isOpen, items.length, loadItems])

  // Handle infinite scroll intersection cleanly without state thrashing
  useEffect(() => {
    if (!isOpen) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          loadItems(false)
        }
      },
      { threshold: 0.1 }
    )

    if (observerTarget.current) {
      observer.observe(observerTarget.current)
    }

    return () => observer.disconnect()
  }, [isOpen, loadItems])

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleToggle = (item: T) => {
    const isSelected = selectedItems.some(i => keyExtractor(i) === keyExtractor(item))
    if (isSelected) {
      onChange(selectedItems.filter(i => keyExtractor(i) !== keyExtractor(item)))
    } else {
      onChange([...selectedItems, item])
    }
  }

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-[38px] px-3.5 bg-surface hover:bg-header border border-border-main rounded-lg text-[13px] font-medium text-left focus:outline-none transition-all flex items-center justify-between ${isOpen ? 'ring-2 ring-accent/5 border-border-main' : ''}`}
      >
        <span className="truncate text-secondary-text">
          {selectedItems.length > 0 
            ? `${selectedItems.length} selected`
            : placeholder}
        </span>
        <ChevronDown size={14} className={`text-muted-text transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Popover */}
      {isOpen && (
        <div className={`absolute top-[calc(100%+8px)] ${popoverAlign === 'right' ? 'right-0' : 'left-0'} w-[280px] bg-card border border-border-main shadow-md rounded-xl overflow-hidden z-50 animate-[fadeInUp_0.15s_ease-out_both] flex flex-col max-h-[320px]`}>
          {/* Search Input */}
          <div className="p-2 border-b border-border-main/50 shrink-0">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-text" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoFocus
                className="w-full pl-8 pr-3 py-1.5 bg-surface border border-border-main rounded-md text-[13px] text-primary-text placeholder:text-muted-text focus:outline-none focus:ring-1 focus:ring-border-main transition-shadow"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-1 scrollbar-hide">
            {items.map(item => {
              const isSelected = selectedItems.some(i => keyExtractor(i) === keyExtractor(item))
              return (
                <button
                  key={keyExtractor(item)}
                  onClick={() => handleToggle(item)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-surface rounded-lg text-left transition-colors group"
                >
                  <div className={`w-4 h-4 rounded-[4px] border flex items-center justify-center transition-all shrink-0 ${isSelected ? 'bg-accent border-accent' : 'border-border-main group-hover:border-secondary-text bg-card'}`}>
                    {isSelected && <Check size={12} className="text-accent-fg" strokeWidth={4} />}
                  </div>
                  <div className={`flex flex-col min-w-0 flex-1 truncate ${isSelected ? 'text-primary-text' : 'text-secondary-text'}`}>
                    {renderLabel(item)}
                  </div>
                </button>
              )
            })}
            
            {/* Observer Target / Loader */}
            <div ref={observerTarget} className="h-10 flex items-center justify-center mt-1">
              {uiLoading && <Loader2 size={16} className="animate-spin text-muted-text" />}
              {!uiLoading && !hasMoreUI && items.length > 0 && (
                <span className="text-[12px] text-muted-text">No more options</span>
              )}
              {!uiLoading && items.length === 0 && search && search.length >= 3 && (
                <span className="text-[12px] text-muted-text">No results found</span>
              )}
              {!uiLoading && items.length === 0 && search && search.length < 3 && (
                <span className="text-[12px] text-muted-text">Type 3 or more characters</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
