import { useCallback } from 'react'
import { SearchableSingleSelect } from './SearchableSingleSelect'
import { InventoryService, type HsnItem } from '../../services/inventoryService'

interface HsnSelectProps {
  value: { code: string; name: string } | null
  onChange: (data: { code: string; name: string; cgst: number; sgst: number }) => void
  disabled?: boolean
  className?: string
  alignDropdown?: 'left' | 'right'
  dropdownWidth?: string
}

export function HsnSelect({ value, onChange, disabled, className, alignDropdown, dropdownWidth }: HsnSelectProps) {
  
  const handleSelect = (hsn: HsnItem | null) => {
    if (!hsn) return

    const latestTax = hsn.taxDetails?.[0]
    const totalRate = parseFloat(latestTax?.rateOfTax || '0')

    onChange({
      code: hsn.hsnCode,
      name: latestTax?.description || hsn.metaTitle,
      cgst: totalRate / 2,
      sgst: totalRate / 2
    })
  }

  const fetchHsnItems = useCallback(async (query: string) => {
    const trimmed = query.trim()
    if (!trimmed || trimmed.length < 2) return []

    let rawResults: HsnItem[] = []
    try {
      const res = await InventoryService.searchHsn(trimmed)
      rawResults = res?.results || []
    } catch (err) {
      console.error('HSN search error:', err)
    }

    // Sort results: exact match on hsnCode first, then prefix match, then description
    const sorted = [...rawResults].sort((a, b) => {
      const aExact = a.hsnCode === trimmed
      const bExact = b.hsnCode === trimmed
      if (aExact && !bExact) return -1
      if (!aExact && bExact) return 1

      const aStarts = a.hsnCode.startsWith(trimmed)
      const bStarts = b.hsnCode.startsWith(trimmed)
      if (aStarts && !bStarts) return -1
      if (!aStarts && bStarts) return 1

      return 0
    })

    // If query is digits (e.g. 6815) and not in results, allow selecting it directly
    if (/^\d{2,8}$/.test(trimmed) && !sorted.some(r => r.hsnCode === trimmed)) {
      sorted.unshift({
        hsnCode: trimmed,
        metaTitle: `Custom HSN Code: ${trimmed}`,
        taxDetails: [{
          rateOfTax: '18',
          description: `HSN ${trimmed}`,
          cgstRate: '9',
          sgstRate: '9',
          igstRate: '18',
          cessRate: '0',
          effectiveDate: ''
        }]
      })
    }

    return sorted
  }, [])

  return (
    <SearchableSingleSelect<HsnItem>
      placeholder="HSN Code..."
      fetchData={fetchHsnItems}
      keyExtractor={(item) => item.hsnCode}
      displayValue={(item) => item.hsnCode}
      value={value ? ({ hsnCode: value.code, metaTitle: '', taxDetails: [] } as HsnItem) : null}
      onChange={handleSelect}
      disabled={disabled}
      className={className}
      alignDropdown={alignDropdown}
      dropdownWidth={dropdownWidth}
      renderLabel={(item) => {
        const tax = item.taxDetails?.[0]
        const rate = parseFloat(tax?.rateOfTax || '0')
        
        return (
          <div className="flex flex-col gap-0.5 py-0.5">
            <div className="text-[12px] sm:text-[13px] font-black text-primary-text tracking-tight line-clamp-1 leading-snug">
              {tax?.description || item.metaTitle || 'No Description'}
            </div>
            <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-muted-text font-bold tracking-wider">
              <span className="text-primary-text/60">{item.hsnCode}</span>
              <div className="w-1 h-1 rounded-full bg-border-main" />
              <span className="text-emerald-500">{rate.toFixed(1)}% TAX</span>
            </div>
          </div>
        )
      }}
    />
  )
}
