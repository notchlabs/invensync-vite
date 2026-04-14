
import { InfiniteScrollMultiSelect } from '../common/InfiniteScrollMultiSelect'
import { InventoryService } from '../../services/inventoryService'
import type { Vendor } from '../../types/inventory'

interface VendorFilterProps {
  selectedItems: Vendor[]
  onSelectionChange: (selectedVendors: Vendor[]) => void
  className?: string
}

export function VendorFilter({ selectedItems, onSelectionChange, className }: VendorFilterProps) {
  const handleChange = (items: Vendor[]) => {
    onSelectionChange(items)
  }

  return (
    <InfiniteScrollMultiSelect<Vendor>
      placeholder="Select Vendor(s)"
      fetchData={(page, size, search) => InventoryService.fetchVendors(page, size, search)}
      keyExtractor={(vendor) => vendor.id}
      renderLabel={(vendor) => vendor.name}
      selectedItems={selectedItems}
      onChange={handleChange}
      popoverAlign="right"
      className={className}
    />
  )
}
