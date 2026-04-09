import { Loader2, Building2, Box, RotateCw, LayoutGrid, ArrowRightLeft, X, Check } from 'lucide-react'
import { useEffect, useRef } from 'react'

// SVG icons natively integrated so we don't need to pass JSX
const EditPencilIcon = ({ onClick }: { onClick?: (e: React.MouseEvent) => void }) => (
  <svg 
    onClick={onClick}
    xmlns="http://www.w3.org/2000/svg" 
    width="12" 
    height="12" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className="text-primary-text cursor-pointer opacity-40 hover:opacity-100 transition-opacity"
  >
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    <path d="m15 5 4 4" />
  </svg>
)

export interface Column<T> {
  header: React.ReactNode
  key: string
  render?: (row: T) => React.ReactNode

  // Declarative JSON-based config
  cellType?: 'product' | 'location' | 'quantity' | 'currency' | 'currency-net'
  dataMap?: {
    title?: keyof T
    subtitle?: keyof T
    image?: keyof T
    value?: keyof T
    unit?: keyof T
    taxValue?: keyof T
    computedTax?: (row: T) => number
  }

  className?: string
  width?: string | number
  onCellClick?: (row: T) => void
}

interface InfiniteScrollTableProps<T> {
  columns: Column<T>[]
  data: T[]
  isLoading: boolean
  hasMore: boolean
  onLoadMore: () => void
  keyExtractor: (row: T, index: number) => string | number
  selectable?: boolean
  selectedKeys?: Set<string | number>
  onToggleSelect?: (key: string | number) => void
  onToggleSelectAll?: (selectAll: boolean) => void
  totalElements?: number
  itemName?: string
  selectionActions?: {
    label: string
    icon: React.ElementType
    onClick: (selectedKeys: Set<string | number>) => void
  }[]
  onClearFilters?: () => void
  onEdit?: (row: T) => void
  minWidth?: string
}

export function InfiniteScrollTable<T>({
  columns,
  data,
  isLoading,
  hasMore,
  onLoadMore,
  keyExtractor,
  selectable = false,
  selectedKeys = new Set(),
  onToggleSelect,
  onToggleSelectAll,
  totalElements,
  itemName = 'items',
  selectionActions = [],
  onClearFilters,
  onEdit,
  minWidth = '900px'
}: InfiniteScrollTableProps<T>) {
  const observerTarget = useRef<HTMLTableRowElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          onLoadMore()
        }
      },
      { threshold: 1.0, rootMargin: '0px 0px 100px 0px' }
    )

    if (observerTarget.current) {
      observer.observe(observerTarget.current)
    }

    return () => observer.disconnect()
  }, [hasMore, isLoading, onLoadMore])

  const allSelected = data.length > 0 && data.every((row, index) => selectedKeys.has(keyExtractor(row, index)))

  return (
    <div className="w-full h-full flex flex-col min-h-0 relative">
      {totalElements !== undefined && (
        <div className="text-[13px] font-medium text-secondary-text mb-3 px-1 shrink-0">
          Showing <span className="text-primary-text font-bold font-display">{data.length}</span> of <span className="font-bold text-secondary-text">{totalElements}</span> available {itemName}
        </div>
      )}
      <div className="flex-1 w-full bg-card border border-border-main rounded-2xl overflow-hidden shadow-md flex flex-col min-h-0 relative">
        {/* Selection Bar Overlay */}
        {selectedKeys.size > 0 && (
          <div className="absolute top-0 left-0 right-0 z-20 h-[52px] bg-selection-bar text-selection-bar-fg flex items-center justify-between animate-in slide-in-from-top duration-200 shadow-md">
            <div className="flex items-center h-full shrink-0">
              <div className="w-12 flex items-center justify-center border-r border-selection-bar-fg/10">
                <button
                  onClick={() => onToggleSelectAll?.(false)}
                  className="w-5 h-5 rounded border border-selection-bar-fg/20 bg-selection-bar-fg/10 flex items-center justify-center hover:bg-selection-bar-fg/20 transition-colors"
                  title="Deselect All"
                >
                  <X size={12} className="text-selection-bar-fg" strokeWidth={3} />
                </button>
              </div>
              <span className="text-[13px] sm:text-[14px] font-semibold pl-4">
                {selectedKeys.size} <span className="hidden xs:inline">item{selectedKeys.size > 1 ? 's' : ''}</span> selected
              </span>
            </div>

            <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto no-scrollbar py-1 px-4 sm:px-6 justify-end flex-1 min-w-0">
              {selectionActions.map((action, idx) => {
                const Icon = action.icon
                return (
                  <button
                    key={idx}
                    onClick={() => action.onClick(selectedKeys)}
                    className="flex items-center gap-2 text-[13px] font-medium text-selection-bar-fg/90 hover:text-selection-bar-fg transition-colors group shrink-0"
                    title={action.label}
                  >
                    <Icon size={16} className="text-selection-bar-fg/60 group-hover:text-selection-bar-fg" />
                    <span className="hidden sm:inline text-nowrap">{action.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-auto min-h-0">
          <table 
            className="w-full text-left border-collapse relative table-fixed" 
            style={{ minWidth }}
          >
            <thead className="sticky top-0 bg-table-head z-10 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
              <tr className="text-secondary-text bg-table-head">
                {selectable && (
                  <th className="px-4 py-3.5 w-12 text-center">
                    <div
                      onClick={() => onToggleSelectAll?.(!allSelected)}
                      className={`w-4 h-4 rounded-[4px] border flex items-center justify-center transition-all cursor-pointer mx-auto ${allSelected ? 'bg-accent' : 'border-accent bg-card hover:border-secondary-text'}`}
                    >
                      {allSelected && <Check size={12} className="text-accent-fg" strokeWidth={4} />}
                    </div>
                  </th>
                )}
                {columns.map((col) => (
                  <th key={col.key} className={`px-4 py-3.5 text-[12px] font-bold tracking-tight ${col.className || ''}`} style={{ width: col.width }}>
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main/50">
              {data.map((row, index) => (
                <tr
                  key={keyExtractor(row, index)}
                  className={`group hover:bg-surface transition-colors cursor-default ${selectedKeys.has(keyExtractor(row, index)) ? 'bg-accent/5' : ''}`}
                >
                  {selectable && (
                    <td className="px-4 py-4 w-12 text-center align-top pt-5">
                      <div
                        onClick={() => onToggleSelect?.(keyExtractor(row, index))}
                        className={`w-4 h-4 rounded-[4px] border flex items-center justify-center transition-all cursor-pointer mx-auto ${selectedKeys.has(keyExtractor(row, index)) ? 'bg-accent border-accent-border' : 'border-accent bg-card hover:border-secondary-text'}`}
                      >
                        {selectedKeys.has(keyExtractor(row, index)) && <Check size={12} className="text-accent-fg" strokeWidth={4} />}
                      </div>
                    </td>
                  )}
                  {columns.map((col) => {
                    let content: React.ReactNode = null;

                    if (col.render) {
                      content = col.render(row)
                    } else if (col.cellType && col.dataMap) {
                      const { title, subtitle, image, value, unit } = col.dataMap
                      const r = row as any

                      if (col.cellType === 'product') {
                        content = (
                          <div className="flex gap-3">
                            <div className="w-10 h-10 bg-card border border-border-main rounded shrink-0 overflow-hidden flex items-center justify-center p-1">
                              {r[image as string] ? (
                                <img src={r[image as string]} alt="" className="w-full h-full object-contain" />
                              ) : (
                                <Box className="text-muted-text w-full h-full p-1" />
                              )}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-[13px] font-bold text-primary-text truncate">{r[title as string]}</span>
                                {onEdit && (
                                  <EditPencilIcon 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onEdit(row);
                                    }} 
                                  />
                                )}
                              </div>
                              <span className="text-[11px] text-secondary-text truncate mt-0.5">{r[subtitle as string] || 'No Vendor'}</span>
                            </div>
                          </div>
                        )
                      } else if (col.cellType === 'location') {
                        content = (
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5 text-[12px] font-bold text-primary-text">
                              <Building2 size={12} className="text-secondary-text" />
                              <span className="truncate">{r[title as string]}</span>
                            </div>
                            <span className="text-[11px] text-secondary-text truncate mt-0.5">{r[subtitle as string]}</span>
                          </div>
                        )
                      } else if (col.cellType === 'quantity') {
                        content = (
                          <div className="flex items-center justify-end gap-1.5 text-[13px] font-bold text-emerald-600">
                            <Box size={14} className="text-emerald-500" />
                            <span>{r[value as string]}</span>
                            <span className="text-[11px] text-emerald-500 font-medium">{r[unit as string]}</span>
                          </div>
                        )
                      } else if (col.cellType === 'currency' || col.cellType === 'currency-net') {
                        const taxAmt = col.dataMap.computedTax ? col.dataMap.computedTax(row) : (r[col.dataMap.taxValue as string] || 0);
                        const baseVal = r[value as string];
                        const displayVal = col.cellType === 'currency-net' ? (baseVal / 1000).toFixed(2) + ' K' : Number(baseVal).toFixed(2);
                        const unitStr = r[unit as string] ? ` / ${r[unit as string]}` : '';

                        content = (
                          <div className="flex flex-col items-end">
                            <div className="text-[13px] font-bold text-primary-text">
                              ₹{displayVal} <span className="text-[11px] text-secondary-text font-medium">{unitStr}</span>
                            </div>
                            <span className="text-[10px] text-muted-text mt-0.5">+ ₹{taxAmt.toFixed(2)} tax</span>
                          </div>
                        )
                      }
                    }

                    return (
                      <td 
                        key={col.key} 
                        className={`px-4 py-4 align-top ${col.className || ''} ${col.onCellClick ? 'cursor-pointer group/cell' : ''}`} 
                        style={{ width: col.width }}
                        onClick={() => col.onCellClick?.(row)}
                      >
                        <div className={col.onCellClick ? 'hover:scale-[1.02] active:scale-95 transition-transform origin-left' : ''}>
                          {content}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}

              {/* Skeletons on Initial Load */}
              {isLoading && data.length === 0 && Array.from({ length: 8 }).map((_, i) => (
                <tr key={`skeleton-${i}`} className="animate-pulse border-b border-border-main/30">
                  {selectable && (
                    <td className="px-4 py-4 w-12 text-center align-top pt-5">
                      <div className="w-4 h-4 rounded bg-muted-text/10 mx-auto" />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key} className={`px-4 py-4 align-top ${col.className || ''}`}>
                      {col.cellType === 'product' ? (
                        <div className="flex gap-3">
                          <div className="w-10 h-10 bg-muted-text/10 rounded shrink-0" />
                          <div className="flex flex-col gap-2 flex-1 pt-1">
                            <div className="h-3 w-2/3 bg-muted-text/10 rounded" />
                            <div className="h-2 w-1/3 bg-muted-text/10 rounded" />
                          </div>
                        </div>
                      ) : col.cellType === 'currency' || col.cellType === 'currency-net' ? (
                        <div className="flex flex-col items-end gap-2 pt-1">
                          <div className="h-3 w-16 bg-muted-text/10 rounded" />
                          <div className="h-2 w-12 bg-muted-text/10 rounded" />
                        </div>
                      ) : (
                        <div className={`h-3 w-20 bg-muted-text/10 rounded mt-1 ${col.className?.includes('justify-end') ? 'ml-auto' : ''}`} />
                      )}
                    </td>
                  ))}
                </tr>
              ))}

              {/* Observer + Loading More Skeletons */}
              <tr ref={observerTarget}>
                <td colSpan={selectable ? columns.length + 1 : columns.length} className="p-0">
                  {isLoading && data.length > 0 && (
                    <div className="px-4 py-4 border-t border-border-main animate-pulse flex items-center justify-center gap-3 text-muted-text bg-surface/30">
                      <Loader2 size={16} className="animate-spin" />
                      <span className="text-[13px] font-medium italic">Fetching more products...</span>
                    </div>
                  )}

                  {!isLoading && data.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-24 text-center px-4 animate-in fade-in zoom-in duration-300">
                      <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mb-4 shadow-inner">
                        <Box size={32} className="text-muted-text opacity-50" />
                      </div>
                      <h3 className="text-[16px] font-bold text-primary-text mb-1 tracking-tight">No results found</h3>
                      <p className="text-[13px] text-secondary-text max-w-[280px] leading-relaxed mb-6">
                        We couldn't find any items matching your current filters. Try adjusting your search query.
                      </p>
                      {onClearFilters && (
                        <button 
                          onClick={onClearFilters}
                          className="flex items-center gap-2 px-4 py-2 bg-surface hover:bg-header border border-border-main rounded-lg text-[13px] font-semibold text-primary-text transition-all active:scale-95"
                        >
                          <RotateCw size={14} className="text-secondary-text" />
                          Clear all filters
                        </button>
                      )}
                    </div>
                  )}

                  {!isLoading && !hasMore && data.length > 0 && (
                    <div className="text-[12px] text-muted-text py-6 text-center italic tracking-wide border-t border-border-main/30 bg-surface/10">
                      You've reached the end of the inventory
                    </div>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
