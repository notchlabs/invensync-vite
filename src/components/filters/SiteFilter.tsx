
import { InfiniteScrollMultiSelect } from '../common/InfiniteScrollMultiSelect'
import { InventoryService } from '../../services/inventoryService'
import type { Site } from '../../types/inventory'

interface SiteFilterProps {
  selectedItems: Site[]
  onSelectionChange: (selectedSites: Site[]) => void
  className?: string
}

export function SiteFilter({ selectedItems, onSelectionChange, className }: SiteFilterProps) {
  const handleChange = (items: Site[]) => {
    onSelectionChange(items)
  }

  return (
    <InfiniteScrollMultiSelect<Site>
      placeholder="Select Site(s)"
      fetchData={(page, size, search) => InventoryService.fetchSites(page, size, search)}
      keyExtractor={(site) => site.id}
      renderLabel={(site) => (
        <>
          <span className="text-[13px] font-semibold">{site.name}</span>
          <span className="text-[11px] text-neutral-400 mt-0.5 truncate">
            {site.city}, {site.state}
          </span>
        </>
      )}
      selectedItems={selectedItems}
      onChange={handleChange}
      className={className}
    />
  )
}
