import { useState, useId } from 'react'
import {
  X,
  FileSpreadsheet,
  Download,
  Loader2,
  AlertCircle,
  Filter,
  CheckSquare,
  Square,
  Info
} from 'lucide-react'
import toast from 'react-hot-toast'
import { InventoryService } from '../../services/inventoryService'
import {
  exportInventoryToExcel,
  DEFAULT_EXPORT_COLUMNS,
  type ExportMetadata,
} from '../../utils/inventoryExcelExporter'
import type { InventoryFetchPayload, InventoryItem } from '../../types/inventory'

const MAX_EXPORT_LIMIT = 1000

interface ExportInventoryModalProps {
  isOpen: boolean
  onClose: () => void
  totalElements: number
  activePayload: InventoryFetchPayload
  canSeeFinancials: boolean
  metadata?: ExportMetadata
  selectedItemsMap?: Map<string, InventoryItem>
}

export function ExportInventoryModal({
  isOpen,
  onClose,
  totalElements,
  activePayload,
  canSeeFinancials,
  metadata,
  selectedItemsMap,
}: ExportInventoryModalProps) {
  const selectedCount = selectedItemsMap ? selectedItemsMap.size : 0
  const defaultMode = selectedCount > 0 ? 'selected' : 'filtered'
  const rowCountId = useId()

  const [exportMode, setExportMode] = useState<'filtered' | 'selected'>(defaultMode)

  // Default row count: min(totalElements, 1000), or 1000 if totalElements is 0/unknown
  const initialRowCount = Math.min(
    totalElements > 0 ? totalElements : MAX_EXPORT_LIMIT,
    MAX_EXPORT_LIMIT
  )
  const [rowCount, setRowCount] = useState<number>(initialRowCount)

  // Columns selection
  const [selectedColIds, setSelectedColIds] = useState<Set<string>>(() => {
    return new Set(
      DEFAULT_EXPORT_COLUMNS
        .filter(c => c.enabled && (!c.isFinancial || canSeeFinancials))
        .map(c => c.id)
    )
  })

  // Loading & status
  const [isExporting, setIsExporting] = useState(false)
  const [exportStep, setExportStep] = useState<string>('')

  if (!isOpen) return null

  // Validations
  const isRowCountExceeded = exportMode === 'filtered' && rowCount > MAX_EXPORT_LIMIT
  const isRowCountInvalid = exportMode === 'filtered' && (isNaN(rowCount) || rowCount <= 0)
  const isSelectedCountExceeded = exportMode === 'selected' && selectedCount > MAX_EXPORT_LIMIT
  const isSelectedEmpty = exportMode === 'selected' && selectedCount === 0

  const hasError = isRowCountExceeded || isRowCountInvalid || isSelectedCountExceeded || isSelectedEmpty || selectedColIds.size === 0

  const handleToggleCol = (colId: string) => {
    setSelectedColIds(prev => {
      const next = new Set(prev)
      if (next.has(colId)) {
        next.delete(colId)
      } else {
        next.add(colId)
      }
      return next
    })
  }

  const handleSelectAllCols = () => {
    setSelectedColIds(
      new Set(
        DEFAULT_EXPORT_COLUMNS
          .filter(c => !c.isFinancial || canSeeFinancials)
          .map(c => c.id)
      )
    )
  }

  const handleDeselectAllCols = () => {
    setSelectedColIds(new Set())
  }

  const handleExport = async () => {
    if (hasError || isExporting) return

    setIsExporting(true)

    try {
      let itemsToExport: InventoryItem[] = []

      if (exportMode === 'selected' && selectedItemsMap) {
        setExportStep('Preparing selected items...')
        itemsToExport = Array.from(selectedItemsMap.values())
      } else {
        // Fetch all filtered data up to requested rowCount (max 1000)
        setExportStep(`Fetching ${rowCount.toLocaleString()} records from server...`)
        const fetchSize = Math.min(rowCount, MAX_EXPORT_LIMIT)

        const res = await InventoryService.fetchInventory(0, fetchSize, activePayload)
        itemsToExport = res.data?.content || []

        if (itemsToExport.length === 0) {
          toast.error('No inventory items found matching your filters.')
          setIsExporting(false)
          return
        }
      }

      setExportStep('Generating Excel (.xlsx) workbook...')
      const filename = `inventory-report-${new Date().toISOString().slice(0, 10)}.xlsx`

      await exportInventoryToExcel(
        itemsToExport,
        selectedColIds,
        canSeeFinancials,
        metadata,
        filename
      )

      toast.success(`Successfully exported ${itemsToExport.length.toLocaleString()} items to Excel!`, {
        icon: '📊',
        duration: 4000,
      })
      onClose()
    } catch (err: unknown) {
      console.error('Export failed:', err)
      const errorMsg = err instanceof Error ? err.message : 'Failed to export inventory data. Please try again.'
      toast.error(errorMsg)
    } finally {
      setIsExporting(false)
      setExportStep('')
    }
  }

  const visibleColumns = DEFAULT_EXPORT_COLUMNS.filter(
    c => !c.isFinancial || canSeeFinancials
  )

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
        onClick={!isExporting ? onClose : undefined}
      />

      {/* Modal Card */}
      <div className="relative bg-card border border-border-main shadow-2xl rounded-2xl w-full max-w-[620px] overflow-hidden flex flex-col animate-[fadeInUp_0.25s_ease-out] max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-header border-b border-border-main flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h2 className="text-[17px] sm:text-[18px] font-bold text-primary-text leading-tight">
                Export Inventory to Excel
              </h2>
              <p className="text-[12px] text-secondary-text mt-0.5">
                Download filtered records in .xlsx format (max 1,000 rows)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isExporting}
            className="p-2 hover:bg-surface border border-transparent hover:border-border-main rounded-xl text-muted-text hover:text-primary-text transition-all disabled:opacity-40"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 custom-scrollbar">

          {/* Active Filter Overview */}
          <div className="p-3 bg-surface/60 border border-border-main rounded-xl flex items-start gap-3">
            <Filter size={16} className="text-muted-text mt-0.5 shrink-0" />
            <div className="flex-1 text-[12px] leading-relaxed">
              <div className="font-semibold text-primary-text flex items-center gap-1.5">
                <span>Matching Filtered Items:</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-black bg-accent/10 text-accent">
                  {totalElements.toLocaleString()} available
                </span>
              </div>
              <div className="text-secondary-text text-[11px] mt-1 space-x-1">
                {metadata?.siteNames && metadata.siteNames.length > 0 && (
                  <span><strong>Sites:</strong> {metadata.siteNames.join(', ')} •</span>
                )}
                {metadata?.vendorNames && metadata.vendorNames.length > 0 && (
                  <span><strong>Vendors:</strong> {metadata.vendorNames.join(', ')} •</span>
                )}
                {metadata?.searchTerm && (
                  <span><strong>Search:</strong> &quot;{metadata.searchTerm}&quot; •</span>
                )}
                <span>Matches active filter criteria</span>
              </div>
            </div>
          </div>

          {/* Section 1: Choose Rows */}
          <div>
            <label className="text-[12px] font-bold text-secondary-text tracking-wider uppercase block mb-2.5">
              1. Select Rows to Export
            </label>

            <div className="space-y-2.5">
              {/* Option A: Filtered Data */}
              <div
                onClick={() => setExportMode('filtered')}
                className={`p-3.5 border rounded-xl cursor-pointer transition-all ${
                  exportMode === 'filtered'
                    ? 'border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500/20'
                    : 'border-border-main bg-card hover:bg-surface'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="exportMode"
                      checked={exportMode === 'filtered'}
                      onChange={() => setExportMode('filtered')}
                      className="accent-emerald-600 w-4 h-4 cursor-pointer mt-0.5"
                    />
                    <div>
                      <span className="text-[13px] font-bold text-primary-text block">
                        All Filtered Records
                      </span>
                      <span className="text-[11px] text-muted-text">
                        Extracts data from the server matching active filters (max 1,000 rows).
                      </span>
                    </div>
                  </div>
                </div>

                {exportMode === 'filtered' && (
                  <div className="mt-3.5 pt-3 border-t border-border-main/60 pl-6">
                    <div className="flex items-center justify-between gap-3">
                      <label htmlFor={rowCountId} className="text-[12px] font-medium text-secondary-text">
                        Number of rows to export:
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          id={rowCountId}
                          type="number"
                          min={1}
                          max={MAX_EXPORT_LIMIT}
                          value={isNaN(rowCount) ? '' : rowCount}
                          onChange={(e) => setRowCount(parseInt(e.target.value, 10))}
                          className={`w-28 px-3 py-1.5 bg-surface border rounded-lg text-[13px] font-bold text-right outline-none transition-all ${
                            isRowCountExceeded || isRowCountInvalid
                              ? 'border-red-500 ring-2 ring-red-500/10 text-red-600'
                              : 'border-border-main focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10'
                          }`}
                        />
                        <span className="text-[12px] text-muted-text">/ 1,000</span>
                      </div>
                    </div>

                    {/* Quick presets chips */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                      <span className="text-[10px] font-bold text-muted-text uppercase tracking-wider mr-1">
                        Presets:
                      </span>
                      {[50, 100, 250, 500, 1000].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setRowCount(preset)}
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition-all cursor-pointer ${
                            rowCount === preset
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-surface hover:bg-header text-secondary-text border-border-main'
                          }`}
                        >
                          {preset}
                        </button>
                      ))}
                      {totalElements > 0 && totalElements <= MAX_EXPORT_LIMIT && (
                        <button
                          type="button"
                          onClick={() => setRowCount(totalElements)}
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition-all cursor-pointer ${
                            rowCount === totalElements
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-surface hover:bg-header text-secondary-text border-border-main'
                          }`}
                        >
                          All ({totalElements})
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Option B: Selected rows only (if any checked in table) */}
              {selectedCount > 0 && (
                <div
                  onClick={() => setExportMode('selected')}
                  className={`p-3.5 border rounded-xl cursor-pointer transition-all ${
                    exportMode === 'selected'
                      ? 'border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500/20'
                      : 'border-border-main bg-card hover:bg-surface'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="exportMode"
                      checked={exportMode === 'selected'}
                      onChange={() => setExportMode('selected')}
                      className="accent-emerald-600 w-4 h-4 cursor-pointer"
                    />
                    <div>
                      <span className="text-[13px] font-bold text-primary-text block">
                        Selected Rows Only ({selectedCount.toLocaleString()} items)
                      </span>
                      <span className="text-[11px] text-muted-text">
                        Export only the items you checked on the table.
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Error alerts */}
            {isRowCountExceeded && (
              <div className="mt-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-[12px] flex items-center gap-2 animate-in fade-in">
                <AlertCircle size={15} className="shrink-0" />
                <span>
                  <strong>Error:</strong> Maximum allowed rows is <strong>1,000</strong>. You entered {rowCount}. Please enter 1,000 or fewer.
                </span>
              </div>
            )}

            {isRowCountInvalid && (
              <div className="mt-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-[12px] flex items-center gap-2 animate-in fade-in">
                <AlertCircle size={15} className="shrink-0" />
                <span>Please enter a valid number of rows (1 to 1,000).</span>
              </div>
            )}

            {isSelectedCountExceeded && (
              <div className="mt-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-[12px] flex items-center gap-2 animate-in fade-in">
                <AlertCircle size={15} className="shrink-0" />
                <span>
                  <strong>Error:</strong> You selected {selectedCount} items, which exceeds the 1,000 row maximum.
                </span>
              </div>
            )}

            {/* Informative notice if total items > 1000 */}
            {!isRowCountExceeded && !isRowCountInvalid && exportMode === 'filtered' && totalElements > MAX_EXPORT_LIMIT && (
              <div className="mt-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-[11px] flex items-center gap-2">
                <Info size={14} className="shrink-0" />
                <span>
                  Total filtered products ({totalElements.toLocaleString()}) exceed the 1,000 row export limit. The file will contain the top {rowCount} rows.
                </span>
              </div>
            )}
          </div>

          {/* Section 2: Choose Columns */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-[12px] font-bold text-secondary-text tracking-wider uppercase">
                2. Choose Columns ({selectedColIds.size} of {visibleColumns.length})
              </label>
              <div className="flex items-center gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={handleSelectAllCols}
                  className="text-accent hover:underline font-semibold cursor-pointer"
                >
                  Select All
                </button>
                <span className="text-muted-text">•</span>
                <button
                  type="button"
                  onClick={handleDeselectAllCols}
                  className="text-secondary-text hover:underline cursor-pointer"
                >
                  Deselect All
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-surface/50 border border-border-main rounded-xl max-h-[160px] overflow-y-auto custom-scrollbar">
              {visibleColumns.map((col) => {
                const isChecked = selectedColIds.has(col.id)
                return (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => handleToggleCol(col.id)}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-[12px] transition-all cursor-pointer border ${
                      isChecked
                        ? 'bg-card border-border-main text-primary-text font-medium shadow-xs'
                        : 'bg-transparent border-transparent text-muted-text hover:bg-card/50'
                    }`}
                  >
                    {isChecked ? (
                      <CheckSquare size={14} className="text-accent shrink-0" />
                    ) : (
                      <Square size={14} className="text-muted-text shrink-0" />
                    )}
                    <span className="truncate">{col.label}</span>
                  </button>
                )
              })}
            </div>

            {selectedColIds.size === 0 && (
              <p className="text-[11px] text-red-500 mt-1.5">
                Please select at least one column to include in the spreadsheet.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-header border-t border-border-main flex items-center justify-between gap-3 shrink-0">
          <div className="text-[12px] text-muted-text">
            {isExporting ? (
              <span className="flex items-center gap-1.5 text-accent font-medium">
                <Loader2 size={13} className="animate-spin" />
                {exportStep}
              </span>
            ) : (
              <span>
                Ready to export <strong>{exportMode === 'selected' ? selectedCount : rowCount}</strong> rows
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isExporting}
              className="px-4 py-2 bg-surface hover:bg-header border border-border-main rounded-xl text-[13px] font-semibold text-secondary-text hover:text-primary-text transition-all cursor-pointer disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={hasError || isExporting}
              className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[13px] font-bold transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              {isExporting ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download size={15} />
                  Download Excel (.xlsx)
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
