import { useState, useCallback, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, RotateCw, ExternalLink, Calendar, User, Package, Building2 } from 'lucide-react'
import { InfiniteScrollTable, type Column } from '../../components/common/InfiniteScrollTable'
import { PageHeader } from '../../components/common/PageHeader'
import { StockUploadService, type BatchDetail, type BatchDetailsPayload } from '../../services/stockUploadService'
import { VendorFilter } from '../../components/filters/VendorFilter'
import { SiteFilter } from '../../components/filters/SiteFilter'
import { AdvancedDateRangePicker } from '../../components/common/AdvancedDateRangePicker'
import { BillDetailDrawer } from '../../components/stock-upload/BillDetailDrawer'
import type { Site, Vendor } from '../../types/inventory'
import type { DateRange } from 'react-day-picker'
import { format } from 'date-fns'

function parseDate(val: string | null): Date | undefined {
  if (!val) return undefined
  const d = new Date(val)
  return isNaN(d.getTime()) ? undefined : d
}

export default function BillsPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  // Parse initial filter values from URL params
  const [searchKey, setSearchKey] = useState(() => searchParams.get('q') || '')
  const [selectedVendors, setSelectedVendors] = useState<Vendor[]>(() => {
    try {
      return (JSON.parse(searchParams.get('vendors') || '[]') as { id: number; name: string }[]).map(v => ({
        id: v.id, name: v.name, contactEmail: '', contactPhone: '', gstNumber: '', address: '',
      }))
    } catch { return [] }
  })
  const [selectedSites, setSelectedSites] = useState<Site[]>(() => {
    try {
      return (JSON.parse(searchParams.get('sites') || '[]') as { id: number; name: string; city: string; state: string }[]).map(s => ({
        id: s.id, name: s.name, city: s.city, state: s.state,
        address: '', country: '', zipCode: 0, gpsLat: 0, gpsLng: 0,
        startDate: null, endDate: null, projectType: '', status: '', searchKey: '',
      }))
    } catch { return [] }
  })

  // Date states
  const [billRange, setBillRange] = useState<DateRange | undefined>(() => {
    const from = parseDate(searchParams.get('billFrom'))
    const to = parseDate(searchParams.get('billTo'))
    return from ? { from, to } : undefined
  })
  const [uploadRange, setUploadRange] = useState<DateRange | undefined>(() => {
    const from = parseDate(searchParams.get('uploadFrom'))
    const to = parseDate(searchParams.get('uploadTo'))
    return from ? { from, to } : undefined
  })

  // Sync filters → URL params
  useEffect(() => {
    const params: Record<string, string> = {}
    if (searchKey) params.q = searchKey
    if (selectedVendors.length > 0)
      params.vendors = JSON.stringify(selectedVendors.map(v => ({ id: v.id, name: v.name })))
    if (selectedSites.length > 0)
      params.sites = JSON.stringify(selectedSites.map(s => ({ id: s.id, name: s.name, city: s.city, state: s.state })))
    if (billRange?.from) params.billFrom = format(billRange.from, 'yyyy-MM-dd')
    if (billRange?.to) params.billTo = format(billRange.to, 'yyyy-MM-dd')
    if (uploadRange?.from) params.uploadFrom = format(uploadRange.from, 'yyyy-MM-dd')
    if (uploadRange?.to) params.uploadTo = format(uploadRange.to, 'yyyy-MM-dd')
    setSearchParams(params, { replace: true })
  }, [searchKey, selectedVendors, selectedSites, billRange, uploadRange, setSearchParams])

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
        startDate: billRange?.from ? format(billRange.from, "yyyy-MM-dd'T'00:00:00.000'Z'") : null,
        endDate: billRange?.to ? format(billRange.to, "yyyy-MM-dd'T'23:59:59.999'Z'") : null,
        createdStartDate: uploadRange?.from ? format(uploadRange.from, "yyyy-MM-dd'T'00:00:00.000'Z'") : null,
        createdEndDate: uploadRange?.to ? format(uploadRange.to, "yyyy-MM-dd'T'23:59:59.999'Z'") : null,
      }

      const res = await StockUploadService.fetchBatchDetails(pageRef.current, 12, payload)
      const items = res.data.content || []

      setTableData(prev => reset ? items : [...prev, ...items])
      setTotalElements(res.data.totalElements || 0)
      
      pageRef.current += 1
      setHasMore(res.data.last !== undefined ? !res.data.last : items.length === 12)
    } catch (e) {
      console.error(e)
    } finally {
      isLoadingRef.current = false
      setIsLoading(false)
    }
  }, [searchKey, selectedVendors, selectedSites, billRange, uploadRange])

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
    setBillRange(undefined)
    setUploadRange(undefined)
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
          View
        </button>
      )
    }
  ]

  const hasAnyFilters = searchKey || selectedVendors.length > 0 || selectedSites.length > 0 || billRange?.from || uploadRange?.from

  return (
    <div className="p-4 md:p-6 max-w-[1500px] mx-auto w-full flex flex-col h-full overflow-hidden">
      <PageHeader 
        title="Bills" 
        description="View and manage all vendor bills in one place" 
        className="mb-6"
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
        <AdvancedDateRangePicker
          selectedRange={billRange}
          onRangeChange={setBillRange}
          className="w-full sm:w-auto min-w-[200px]"
          placeholder="Select bill range..."
        />

        {/* Upload Date Range */}
        <AdvancedDateRangePicker
          selectedRange={uploadRange}
          onRangeChange={setUploadRange}
          className="w-full sm:w-auto min-w-[200px]"
          placeholder="Select upload range..."
        />

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
