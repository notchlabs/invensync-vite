import { useState, useCallback, useEffect, useRef } from 'react'
import { Search, RotateCw, ExternalLink, Calendar, User, Package, Building2 } from 'lucide-react'
import { InfiniteScrollTable, type Column } from '../../components/common/InfiniteScrollTable'
import { PageHeader } from '../../components/common/PageHeader'
import { StockUploadService, type BatchDetail, type BatchDetailsPayload } from '../../services/stockUploadService'
import { VendorFilter } from '../../components/filters/VendorFilter'
import { SiteFilter } from '../../components/filters/SiteFilter'
import { DateRangePicker } from '../../components/common/DateRangePicker'
import { BillDetailDrawer } from '../../components/stock-upload/BillDetailDrawer'
import type { Site, Vendor } from '../../types/inventory'

export default function BillsPage() {
  // Filter States
  const [searchKey, setSearchKey] = useState('')
  const [selectedVendors, setSelectedVendors] = useState<Vendor[]>([])
  const [selectedSites, setSelectedSites] = useState<Site[]>([])
  
  // Date states (YYYY-MM-DD)
  const [billFrom, setBillFrom] = useState('')
  const [billTo, setBillTo] = useState('')
  const [uploadFrom, setUploadFrom] = useState('')
  const [uploadTo, setUploadTo] = useState('')

  // Table Data State
  const [tableData, setTableData] = useState<BatchDetail[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [totalElements, setTotalElements] = useState(0)

  // Drawer State
  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const pageRef = useRef(0)
  const isLoadingRef = useRef(false)

  const formatIndianCurrency = (num: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(num);
  }

  const getRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffInMs = date.getTime() - now.getTime()
    const diffInHours = Math.round(diffInMs / (1000 * 60 * 60))
    
    if (Math.abs(diffInHours) < 24) {
      if (diffInHours > 0) return `in ${diffInHours} hour${diffInHours > 1 ? 's' : ''}`
      return `${Math.abs(diffInHours)} hour${Math.abs(diffInHours) > 1 ? 's' : ''} ago`
    }
    
    const diffInDays = Math.round(diffInHours / 24)
    if (diffInDays > 0) return `in ${diffInDays} day${diffInDays > 1 ? 's' : ''}`
    return `${Math.abs(diffInDays)} day${Math.abs(diffInDays) > 1 ? 's' : ''} ago`
  }

  const loadData = useCallback(async (reset: boolean = false) => {
    if (isLoadingRef.current) return
    isLoadingRef.current = true
    setIsLoading(true)

    try {
      if (reset) {
        pageRef.current = 0
        setHasMore(true)
      }

      const payload: BatchDetailsPayload = {
        searchKey: searchKey || null,
        vendor: selectedVendors.map(v => v.id),
        site: selectedSites.map(s => s.id),
        startDate: billFrom ? `${billFrom}T00:00:00.000Z` : null,
        endDate: billTo ? `${billTo}T23:59:59.999Z` : null,
        createdStartDate: uploadFrom ? `${uploadFrom}T00:00:00.000Z` : null,
        createdEndDate: uploadTo ? `${uploadTo}T23:59:59.999Z` : null,
      }

      const res = await StockUploadService.fetchBatchDetails(pageRef.current, 12, payload)
      const items = res.data.content || []

      setTableData(prev => reset ? items : [...prev, ...items])
      setTotalElements(res.data.totalElements || 0)
      
      pageRef.current += 1
      setHasMore(res.data.isLast !== undefined ? !res.data.isLast : items.length === 12)
    } catch (e) {
      console.error(e)
    } finally {
      isLoadingRef.current = false
      setIsLoading(false)
    }
  }, [searchKey, selectedVendors, selectedSites, billFrom, billTo, uploadFrom, uploadTo])

  // Initial Load & Filter Change Effect
  useEffect(() => {
    const timer = setTimeout(() => {
      loadData(true)
    }, 400)
    return () => clearTimeout(timer)
  }, [loadData])

  const handleClearFilters = () => {
    setSearchKey('')
    setSelectedVendors([])
    setSelectedSites([])
    setBillFrom('')
    setBillTo('')
    setUploadFrom('')
    setUploadTo('')
  }

  const columns: Column<BatchDetail>[] = [
    {
      header: 'Ref',
      key: 'ref',
      width: '18%',
      render: (row) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-[13px] font-black text-primary-text tracking-tight">{row.refNumber}</span>
          <span className="text-[10px] font-bold text-muted-text/60 flex items-center gap-1">
            <RotateCw size={10} className="animate-spin-slow" /> {getRelativeTime(row.createdAt)}
          </span>
        </div>
      )
    },
    {
      header: 'Vendor',
      key: 'vendor',
      width: '20%',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center text-[11px] font-black text-secondary-text border border-border-main/50">
            {row.supplierName.charAt(0).toUpperCase()}
          </div>
          <span className="text-[13px] font-black text-primary-text">{row.supplierName}</span>
        </div>
      )
    },
    {
      header: 'Sites',
      key: 'sites',
      width: '15%',
      render: (row) => (
        <div className="flex items-center gap-1.5 text-[12px] font-bold text-secondary-text">
          <Building2 size={13} strokeWidth={2.5} />
          <span>{row.siteTransferred?.length || 0} site{row.siteTransferred?.length !== 1 ? 's' : ''}</span>
        </div>
      )
    },
    {
      header: 'Items',
      key: 'items',
      width: '15%',
      render: (row) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-[13px] font-black text-primary-text tracking-tighter">
            {formatIndianCurrency(row.totalAmountIncTax).replace('.00', '').replace('INR', '₹')}
          </span>
          <span className="text-[11px] font-bold text-muted-text/60">{row.totalItems} item{row.totalItems > 1 ? 's' : ''}</span>
        </div>
      )
    },
    {
      header: 'Bill Date',
      key: 'billDate',
      width: '15%',
      render: (row) => (
        <div className="flex items-center gap-1.5 text-[12px] font-bold text-secondary-text">
          <Calendar size={13} strokeWidth={2.5} />
          <span>{new Date(row.billDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric'})}</span>
        </div>
      )
    },
    {
      header: 'Uploaded By',
      key: 'uploadedBy',
      width: '20%',
      render: (row) => (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-primary-text">
             <Calendar size={11} className="text-muted-text" /> 
             {new Date(row.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
          </div>
          <div className="flex items-center gap-1 text-[10px] font-medium text-muted-text italic">
            <User size={10} /> {row.createdBy.split('@')[0]}
          </div>
        </div>
      )
    },
    {
      header: 'Actions',
      key: 'actions',
      width: '10%',
      className: 'text-right',
      render: (row) => (
        <button 
          onClick={() => {
            setSelectedBatchId(row.id)
            setIsDrawerOpen(true)
          }}
          className="text-blue-600 dark:text-blue-500 text-[12px] font-black hover:underline inline-flex items-center gap-1"
        >
          View <ExternalLink size={12} strokeWidth={2.5} />
        </button>
      )
    }
  ]

  const hasAnyFilters = searchKey || selectedVendors.length > 0 || selectedSites.length > 0 || billFrom || uploadFrom

  return (
    <div className="p-4 md:p-6 max-w-[1500px] mx-auto w-full flex flex-col h-full overflow-hidden">
      <PageHeader 
        title="Bills" 
        description="View and manage all vendor bills in one place" 
        className="mb-8"
      />

      {/* Filters Row */}
      <div className="flex flex-wrap items-end gap-3 mb-6 bg-card p-4 rounded-2xl border border-border-main shadow-sm shadow-left">
        {/* Search */}
        <div className="relative group flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-text group-focus-within:text-secondary-text" />
          <input 
            type="text" 
            placeholder="Search by Ref / Key..." 
            value={searchKey}
            onChange={(e) => setSearchKey(e.target.value)}
            className="w-full h-[38px] pl-9 pr-4 bg-surface border border-border-main rounded-lg text-[12px] font-bold text-primary-text outline-none focus:border-secondary-text focus:ring-2 focus:ring-accent/5 transition-all"
          />
        </div>

        {/* Vendors */}
        <VendorFilter 
          selectedItems={selectedVendors} 
          onSelectionChange={setSelectedVendors} 
          className="w-full sm:w-auto min-w-[200px]"
        />

        {/* Sites */}
        <SiteFilter 
          selectedItems={selectedSites} 
          onSelectionChange={setSelectedSites} 
          className="w-full sm:w-auto min-w-[200px]"
        />

        {/* Bill Date Range */}
        <div className="flex flex-col gap-1">
          <span className="text-[9px] font-black text-muted-text uppercase tracking-tighter pl-1">Bill Date Range</span>
          <DateRangePicker 
            from={billFrom} 
            to={billTo} 
            onFromChange={setBillFrom} 
            onToChange={setBillTo} 
          />
        </div>

        {/* Upload Date Range */}
        <div className="flex flex-col gap-1">
          <span className="text-[9px] font-black text-muted-text uppercase tracking-tighter pl-1">Upload Date Range</span>
          <DateRangePicker 
            from={uploadFrom} 
            to={uploadTo} 
            onFromChange={setUploadFrom} 
            onToChange={setUploadTo} 
          />
        </div>

        {/* Clear Filters */}
        {hasAnyFilters && (
          <button 
            onClick={handleClearFilters}
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all h-[38px] mt-auto"
          >
            <RotateCw size={12} /> Clear
          </button>
        )}
      </div>

      {/* Table Section */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <InfiniteScrollTable
          columns={columns}
          data={tableData}
          isLoading={isLoading}
          hasMore={hasMore}
          onLoadMore={() => loadData(false)}
          keyExtractor={(row) => row.id}
          totalElements={totalElements}
          itemName="bills"
        />
      </div>

      <BillDetailDrawer 
        id={selectedBatchId} 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
      />
    </div>
  )
}
