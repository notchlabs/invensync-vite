import { SearchableSingleSelect } from './SearchableSingleSelect'
import { InventoryService } from '../../services/inventoryService'

interface HsnResult {
  hsnCode: string
  taxDetails: Array<{
    rateOfTax: string
    effectiveDate: string
    description: string
  }>
  chapterName?: string
}

interface HsnSelectProps {
  value: { code: string; name: string } | null
  onChange: (data: { code: string; name: string; cgst: number; sgst: number }) => void
  disabled?: boolean
  className?: string
  alignDropdown?: 'left' | 'right'
  dropdownWidth?: string
}

export function HsnSelect({ value, onChange, disabled, className, alignDropdown, dropdownWidth }: HsnSelectProps) {
  
  const parseDate = (dateStr: string) => {
    if (!dateStr) return new Date(0)
    const [day, month, year] = dateStr.split('/').map(Number)
    return new Date(year, month - 1, day)
  }

  const handleSelect = (hsn: HsnResult | null) => {
    if (!hsn) return

    // Find the most recent tax detail
    const latestTax = [...hsn.taxDetails].sort((a, b) => 
      parseDate(b.effectiveDate).getTime() - parseDate(a.effectiveDate).getTime()
    )[0]

    if (latestTax) {
      const totalRate = parseFloat(latestTax.rateOfTax) || 0
      onChange({
        code: hsn.hsnCode,
        name: latestTax.description,
        cgst: totalRate / 2,
        sgst: totalRate / 2
      })
    } else {
      onChange({
        code: hsn.hsnCode,
        name: '',
        cgst: 0,
        sgst: 0
      })
    }
  }

  return (
    <SearchableSingleSelect<HsnResult>
      placeholder="HSN Code..."
      fetchData={async (query) => {
        if (!query || query.length < 2) return []
        const res = await InventoryService.searchHsn(query)
        return res.results || []
      }}
      keyExtractor={(item) => item.hsnCode}
      displayValue={(item) => item.hsnCode}
      value={value ? { hsnCode: value.code } as any : null}
      onChange={handleSelect}
      disabled={disabled}
      className={className}
      alignDropdown={alignDropdown}
      dropdownWidth={dropdownWidth}
      renderLabel={(item) => (
        <div className="flex flex-col gap-0.5 py-0.5">
          <div className="text-[12px] sm:text-[13px] font-black text-primary-text  tracking-tight line-clamp-1 leading-snug">
            {item.taxDetails[0]?.description || item.chapterName || 'No Name Found'}
          </div>
          <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-muted-text font-bold  tracking-wider">
            <span className="text-primary-text/60">{item.hsnCode}</span>
            <div className="w-1 h-1 rounded-full bg-border-main" />
            <span className="text-emerald-500">{item.taxDetails[0]?.rateOfTax || 0}% TAX</span>
          </div>
        </div>
      )}
    />
  )
}
