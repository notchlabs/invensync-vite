import { SearchableSingleSelect } from '../common/SearchableSingleSelect'
import { InventoryService } from '../../services/inventoryService'
import type { Site } from '../../types/inventory'

interface SiteFilterSingleProps {
  value: Site | null
  onChange: (site: Site | null) => void
  placeholder?: string
  className?: string
  alignDropdown?: 'left' | 'right'
  openUpwards?: boolean
}

export function SiteFilterSingle({ 
  value, 
  onChange, 
  placeholder = "Select Destination Site", 
  className = "",
  alignDropdown = "left",
  openUpwards = false
}: SiteFilterSingleProps) {
  
  const handleFetch = async (query: string) => {
    const res = await InventoryService.fetchSites(0, 50, query)
    return res.data.content || []
  }

  return (
    <SearchableSingleSelect<Site>
      placeholder={placeholder}
      fetchData={handleFetch}
      keyExtractor={(site) => site.id}
      value={value}
      onChange={onChange}
      className={className}
      alignDropdown={alignDropdown}
      openUpwards={openUpwards}
      displayValue={(site) => site.name}
      renderLabel={(site) => (
        <div className="flex flex-col gap-0.5 py-0.5">
          <div className="text-[13px] font-black text-primary-text  tracking-tight leading-snug">
            {site.name}
          </div>
          <div className="text-[11px] text-muted-text font-bold  tracking-wider">
            {site.city}, {site.state}
          </div>
        </div>
      )}
      renderValue={(site) => (
        <div className="flex flex-col">
          <span className="text-primary-text font-black  text-[12px] tracking-tight">{site.name}</span>
          <span className="text-muted-text text-[10px] font-bold  tracking-widest">{site.city}</span>
        </div>
      )}
    />
  )
}
