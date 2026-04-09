import { useState, useCallback, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PackagePlus, LayoutGrid, ArrowRightLeft, PackageMinus, RotateCw } from 'lucide-react'
import { SiteFilter } from '../../components/filters/SiteFilter'
import { ProductFilter } from '../../components/filters/ProductFilter'
import { VendorFilter } from '../../components/filters/VendorFilter'
import { InfiniteScrollTable, type Column } from '../../components/common/InfiniteScrollTable'
import { CustomSelect } from '../../components/common/CustomSelect'
import { PageHeader } from '../../components/common/PageHeader'
import { InventoryService } from '../../services/inventoryService'
import { InventoryDetailModal } from '../../components/inventory/InventoryDetailModal'
import { EditProductModal } from '../../components/inventory/EditProductModal'
import type { Site, Product, Vendor, InventoryItem, InventoryFetchPayload } from '../../types/inventory'

const LineChartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3v18h18"/>
    <path d="m19 9-5 5-4-4-3 3"/>
  </svg>
)

export default function InventoryPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  
  // States
  const [selectedSites, setSelectedSites] = useState<Site[]>([])
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([])
  const [selectedVendors, setSelectedVendors] = useState<Vendor[]>([])
  const [search, setSearch] = useState(searchParams.get('q') || '')
  const [searchType, setSearchType] = useState(searchParams.get('st') || 'Product Name')
  
  // Table state
  const [tableData, setTableData] = useState<InventoryItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [totalElements, setTotalElements] = useState(0)
  const [selectedKeys, setSelectedKeys] = useState<Set<string | number>>(new Set())
  const [isHydrated, setIsHydrated] = useState(false)
  
  // Detail Modal State
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [detailItem, setDetailItem] = useState<InventoryItem | null>(null)

  // Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editItem, setEditItem] = useState<InventoryItem | null>(null)

  const getItemKey = (item: InventoryItem) => `${item.productId}-${item.siteId}`

  const pageRef = useRef(0)
  const isLoadingRef = useRef(false)

  // 1. URL Sync Effect: Update browser URL when state changes
  useEffect(() => {
    const params: Record<string, string> = {}
    if (search) params.q = search
    if (searchType !== 'Product Name') params.st = searchType
    if (selectedSites.length > 0) params.sites = selectedSites.map(s => s.id).join(',')
    if (selectedProducts.length > 0) params.products = selectedProducts.map(p => p.id).join(',')
    if (selectedVendors.length > 0) params.vendors = selectedVendors.map(v => v.id).join(',')
    
    setSearchParams(params, { replace: true })
  }, [search, searchType, selectedSites, selectedProducts, selectedVendors, setSearchParams])

  // 2. Hydration Effect: Fetch full objects for IDs found in URL
  useEffect(() => {
    const hydrate = async () => {
      const siteIds = searchParams.get('sites')?.split(',').map(Number).filter(Boolean) || []
      const productIds = searchParams.get('products')?.split(',').map(Number).filter(Boolean) || []
      const vendorIds = searchParams.get('vendors')?.split(',').map(Number).filter(Boolean) || []

      if (siteIds.length === 0 && productIds.length === 0 && vendorIds.length === 0) {
        setIsHydrated(true)
        return
      }

      try {
        if (siteIds.length > 0) {
          const res = await InventoryService.fetchSitesByIds(siteIds)
          setSelectedSites(res.data.content || [])
        }
        if (productIds.length > 0) {
          const res = await InventoryService.fetchProductsByIds(productIds)
          setSelectedProducts(res.data.content || [])
        }
        if (vendorIds.length > 0) {
          const res = await InventoryService.fetchVendorsByIds(vendorIds)
          setSelectedVendors(res.data.content || [])
        }
      } catch (e) {
        console.error('Hydration failed', e)
      } finally {
        setIsHydrated(true)
      }
    }
    
    if (!isHydrated) {
      hydrate()
    }
  }, [searchParams, isHydrated])

  const loadData = useCallback(async (reset: boolean = false) => {
    if (isLoadingRef.current) return
    isLoadingRef.current = true
    setIsLoading(true)

    try {
      if (reset) {
        pageRef.current = 0
        setHasMore(true)
      }

      const payload: InventoryFetchPayload = {
        site: selectedSites.map(s => s.id),
        product: selectedProducts.map(p => p.id),
        vendor: selectedVendors.map(v => v.id),
        searchByProductName: searchType === 'Product Name' && search.length >= 3 ? search : null,
        searchByBillNo: searchType === 'Invoice No' && search.length >= 3 ? search : null,
        searchBySupplierName: searchType === 'Vendor Name' && search.length >= 3 ? search : null,
      }

      const res = await InventoryService.fetchInventory(pageRef.current, 10, payload)
      const items = res.data.content || []

      setTableData(prev => reset ? items : [...prev, ...items])
      setTotalElements(res.data.totalElements || 0)
      
      pageRef.current += 1
      setHasMore(res.data.last !== undefined ? !res.data.last : items.length === 10)
    } catch (e) {
      console.error(e)
    } finally {
      isLoadingRef.current = false
      setIsLoading(false)
    }
  }, [selectedSites, selectedProducts, selectedVendors, search, searchType])

  // Filter change effect
  useEffect(() => {
    if (!isHydrated) return

    const timer = setTimeout(() => {
      loadData(true)
    }, 500)
    return () => clearTimeout(timer)
  }, [loadData, isHydrated])

  const handleLoadMore = useCallback(() => {
    if (hasMore && !isLoadingRef.current) {
      loadData(false)
    }
  }, [hasMore, loadData])

  const handleClearFilters = () => {
    setSearch('')
    setSelectedSites([])
    setSelectedProducts([])
    setSelectedVendors([])
    setSearchType('Product Name')
  }

  const handleQtyClick = useCallback((item: InventoryItem) => {
    setDetailItem(item)
    setIsDetailOpen(true)
  }, [])

  const handleEditClick = useCallback((item: InventoryItem) => {
    setEditItem(item)
    setIsEditOpen(true)
  }, [])

  const hasActiveFilters = search.length > 0 || selectedSites.length > 0 || selectedProducts.length > 0 || selectedVendors.length > 0

  const toggleSelect = (key: string | number) => {
    const newSet = new Set(selectedKeys)
    if (newSet.has(key)) newSet.delete(key)
    else newSet.add(key)
    setSelectedKeys(newSet)
  }

  const toggleSelectAll = (selectAll: boolean) => {
    if (selectAll) setSelectedKeys(new Set(tableData.map(getItemKey)))
    else setSelectedKeys(new Set())
  }

  const columns: Column<InventoryItem>[] = [
    {
      header: 'Product Name',
      key: 'productName',
      width: '40%',
      cellType: 'product',
      dataMap: { image: 'imageUrl', title: 'productName', subtitle: 'vendorNames' }
    },
    {
      header: 'Site',
      key: 'site',
      width: '15%',
      cellType: 'location',
      dataMap: { title: 'site', subtitle: 'siteCity' }
    },
    {
      header: 'Available Qty',
      key: 'quantity',
      width: '16%',
      className: 'text-right',
      cellType: 'quantity',
      dataMap: { value: 'quantity', unit: 'unit' },
      onCellClick: handleQtyClick
    },
    {
      header: 'Price / unit',
      key: 'price',
      width: '18%',
      className: 'text-right',
      cellType: 'currency',
      dataMap: { 
        value: 'price', 
        unit: 'unit', 
        computedTax: (row) => row.mrp ? (row.mrp - row.price) : 0 
      }
    },
    {
      header: 'Net Amount',
      key: 'netAmount',
      width: '15%',
      className: 'text-right',
      cellType: 'currency-net',
      dataMap: { 
        value: 'totalExcludingTax', 
        computedTax: (row) => row.totalIncludingTax - row.totalExcludingTax 
      }
    }
  ]

  const selectionActions = [
    {
      label: 'Consume',
      icon: PackageMinus,
      onClick: (keys: Set<string | number>) => console.log('Consume', keys)
    },
    {
      label: 'Add Composite',
      icon: LayoutGrid,
      onClick: (keys: Set<string | number>) => console.log('Add Composite', keys)
    },
    {
      label: 'Transfer',
      icon: ArrowRightLeft,
      onClick: (keys: Set<string | number>) => console.log('Transfer', keys)
    }
  ]

  return (
    <div className="p-4 md:p-6 max-w-[1400px] mx-auto w-full flex flex-col h-full transition-all">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <PageHeader 
          title="Inventory Management" 
          description="Track and manage your stock across all sites" 
        />
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-btn-primary hover:opacity-90 text-btn-primary-fg text-[13px] font-semibold rounded-lg border border-border-main/50 transition-all shadow-sm tracking-wide">
            <LineChartIcon />
            Consumption
          </button>
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-btn-primary hover:opacity-90 text-btn-primary-fg text-[13px] font-semibold rounded-lg border border-border-main/50 transition-all shadow-sm tracking-wide">
            <PackagePlus size={14} strokeWidth={2.5} />
            Prepare Product
          </button>
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex flex-row flex-wrap items-center gap-3 mb-5 w-full bg-card p-3 rounded-xl border border-border-main">
        {/* Search Input with Prefix Select */}
        <div className="flex items-center bg-card border border-border-main rounded-lg h-[38px] w-full md:flex-[1.5] md:min-w-[320px] shadow-sm relative z-20">
          <div className="h-full border-r border-border-main w-[110px] sm:w-[140px] shrink-0 font-medium">
            <CustomSelect
              placeholder="Search by"
              options={[
                { label: 'Product Name', value: 'Product Name' },
                { label: 'Invoice No', value: 'Invoice No' },
                { label: 'Vendor Name', value: 'Vendor Name' }
              ]}
              value={searchType}
              onChange={(val) => setSearchType(val)}
            />
          </div>
          <input 
            type="text" 
            placeholder="Search..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 h-full px-3 text-[13px] text-primary-text placeholder:text-muted-text outline-none rounded-r-lg bg-transparent"
          />
        </div>

        {/* Multi-Select Filters */}
        <div className="flex items-center gap-3 w-full md:w-auto md:flex-1">
          <SiteFilter selectedItems={selectedSites} onSelectionChange={setSelectedSites} className="w-full sm:w-[calc(50%-6px)] md:w-auto flex-1 md:min-w-[200px]" />
          <ProductFilter selectedItems={selectedProducts} onSelectionChange={setSelectedProducts} className="w-full sm:w-[calc(50%-6px)] md:w-auto flex-1 md:min-w-[200px]" />
        </div>
        <VendorFilter selectedItems={selectedVendors} onSelectionChange={setSelectedVendors} className="w-full sm:w-[calc(50%-6px)] md:w-auto flex-1 md:min-w-[200px]" />
        
        {hasActiveFilters && (
          <button 
            onClick={handleClearFilters}
            className="flex items-center gap-2 px-3 py-1.5 text-[12px] font-bold text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all active:scale-95 ml-auto"
          >
            <RotateCw size={14} />
            Clear
          </button>
        )}
      </div>

      {/* Table Area */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <InfiniteScrollTable
          data={tableData}
          columns={columns}
          isLoading={isLoading}
          hasMore={hasMore}
          onLoadMore={handleLoadMore}
          onClearFilters={handleClearFilters}
          keyExtractor={getItemKey}
          selectable={true}
          selectedKeys={selectedKeys}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={toggleSelectAll}
          totalElements={totalElements}
          itemName="products"
          selectionActions={selectionActions}
          onEdit={handleEditClick}
        />
      </div>

      <InventoryDetailModal 
        isOpen={isDetailOpen} 
        onClose={() => setIsDetailOpen(false)} 
        item={detailItem} 
      />

      <EditProductModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        item={editItem}
        onSuccess={() => {
          setTableData([])
          pageRef.current = 0
          loadData(true)
        }}
      />
    </div>
  )
}
