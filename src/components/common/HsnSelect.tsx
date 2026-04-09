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
}

export function HsnSelect({ value, onChange, disabled, className }: HsnSelectProps) {
  
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
      placeholder="Search HSN Code..."
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
      renderLabel={(item) => (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-bold text-primary-text">{item.hsnCode}</span>
            <span className="text-[10px] px-1.5 py-0.5 bg-accent/10 text-accent rounded uppercase font-black tracking-widest">HSN</span>
          </div>
          <div className="text-[11px] text-muted-text line-clamp-1 italic">
            {item.taxDetails[0]?.description || item.chapterName || 'No description available'}
          </div>
          {item.taxDetails[0] && (
            <div className="text-[10px] font-bold text-emerald-500 mt-1">
              Rate: {item.taxDetails[0].rateOfTax}%
            </div>
          )}
        </div>
      )}
    />
  )
}
