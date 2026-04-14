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

  return (
    <SearchableSingleSelect<HsnItem>
      placeholder="HSN Code..."
      fetchData={async (query) => {
        if (!query || query.length < 2) return []
        const res = await InventoryService.searchHsn(query)
        return res.results || []
      }}
      keyExtractor={(item) => item.hsnCode}
      displayValue={(item) => item.hsnCode}
      value={value ? ({ hsnCode: value.code, taxDetails: [] } as HsnItem) : null}
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
