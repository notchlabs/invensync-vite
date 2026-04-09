import { useState } from 'react'
import { InfiniteScrollMultiSelect } from '../common/InfiniteScrollMultiSelect'
import { InventoryService } from '../../services/inventoryService'
import type { Product } from '../../types/inventory'

interface ProductFilterProps {
  selectedItems: Product[]
  onSelectionChange: (selectedProducts: Product[]) => void
  className?: string
}

export function ProductFilter({ selectedItems, onSelectionChange, className }: ProductFilterProps) {
  const handleChange = (items: Product[]) => {
    onSelectionChange(items)
  }

  return (
    <InfiniteScrollMultiSelect<Product>
      placeholder="Select Product(s)"
      fetchData={(page, size, search) => InventoryService.fetchProducts(page, size, search)}
      keyExtractor={(product) => product.id}
      renderLabel={(product) => product.name}
      selectedItems={selectedItems}
      onChange={handleChange}
      className={className}
    />
  )
}
