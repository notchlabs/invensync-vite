import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, Loader2, ChevronDown, Check, X } from 'lucide-react'

interface SearchableSingleSelectProps<T> {
  placeholder: string
  fetchData: (query: string) => Promise<T[]>
  keyExtractor: (item: T) => string | number
  renderLabel: (item: T) => React.ReactNode
  value: T | null
  onChange: (item: T | null) => void
  onInputChange?: (value: string) => void
  disabled?: boolean
  className?: string
  displayValue?: (item: T) => string
}

export function SearchableSingleSelect<T>({
  placeholder,
  fetchData,
  keyExtractor,
  renderLabel,
  value,
  onChange,
  onInputChange,
  disabled = false,
  className = '',
  displayValue
}: SearchableSingleSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [items, setItems] = useState<T[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const loadItems = useCallback(async (query: string) => {
    setIsLoading(true)
    try {
      const results = await fetchData(query)
      setItems(results || [])
    } catch (error) {
      console.error('Failed to fetch items:', error)
      setItems([])
    } finally {
      setIsLoading(false)
    }
  }, [fetchData])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isOpen) {
        loadItems(search)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [search, isOpen, loadItems])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (item: T) => {
    onChange(item)
    setIsOpen(false)
    setSearch('')
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(null)
    setSearch('')
  }

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full min-h-[42px] px-3.5 bg-surface border border-border-main rounded-lg text-[13px] font-medium flex items-center justify-between cursor-pointer transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-secondary-text'} ${isOpen ? 'ring-2 ring-accent/5 border-secondary-text' : ''}`}
      >
        <div className="flex-1 truncate py-2">
          {value ? (
            <span className="text-primary-text">{displayValue ? displayValue(value) : String(keyExtractor(value))}</span>
          ) : (
            <span className="text-muted-text">{placeholder}</span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0 ml-2">
          {value && !disabled && (
            <X 
              size={14} 
              className="text-muted-text hover:text-red-500 transition-colors" 
              onClick={handleClear}
            />
          ) || (
            <ChevronDown size={14} className={`text-muted-text transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          )}
        </div>
      </div>

      {isOpen && (
        <div className="absolute top-[calc(100%+6px)] left-0 w-full bg-card border border-border-main shadow-lg rounded-xl overflow-hidden z-[110] animate-[fadeInUp_0.15s_ease-out_both] flex flex-col max-h-[250px]">
          <div className="p-2 border-b border-border-main/50 shrink-0">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-text" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={e => {
                  setSearch(e.target.value)
                  onInputChange?.(e.target.value)
                }}
                autoFocus
                className="w-full pl-8 pr-3 py-1.5 bg-surface border border-border-main rounded-md text-[13px] text-primary-text placeholder:text-muted-text focus:outline-none focus:ring-1 focus:ring-border-main"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-1 custom-scrollbar">
            {isLoading ? (
              <div className="py-8 flex flex-col items-center justify-center gap-2">
                <Loader2 size={20} className="animate-spin text-accent" />
                <span className="text-[12px] text-muted-text">Searching...</span>
              </div>
            ) : items.length > 0 ? (
              items.map(item => {
                const isSelected = value && keyExtractor(value) === keyExtractor(item)
                return (
                  <button
                    key={keyExtractor(item)}
                    onClick={() => handleSelect(item)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-surface rounded-lg text-left transition-colors group ${isSelected ? 'bg-accent/5' : ''}`}
                  >
                    <div className="flex-1 min-w-0">
                      {renderLabel(item)}
                    </div>
                    {isSelected && <Check size={14} className="text-accent" strokeWidth={3} />}
                  </button>
                )
              })
            ) : (
              <div className="py-8 text-center">
                <span className="text-[12px] text-muted-text">{search ? 'No results found' : 'Type to search...'}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
