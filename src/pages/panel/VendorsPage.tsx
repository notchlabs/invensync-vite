import { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, RotateCw, Mail, Phone, ShoppingBag } from 'lucide-react'
import { InfiniteScrollTable, type Column } from '../../components/common/InfiniteScrollTable'
import { PageHeader } from '../../components/common/PageHeader'
import { InventoryService, type VendorStat } from '../../services/inventoryService'

const formatCurrency = (n: number) => {
  if (!n) return '₹0'
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(2)} L`
  if (n >= 1_000) return `₹${(n / 1_000).toFixed(2)} K`
  return `₹${n.toFixed(2)}`
}

function VendorAvatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()

  return (
    <div className="w-9 h-9 rounded-xl bg-surface border border-border-main flex items-center justify-center shrink-0">
      <span className="text-[12px] font-black text-secondary-text">{initials}</span>
    </div>
  )
}

export default function VendorsPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [data, setData] = useState<VendorStat[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [totalElements, setTotalElements] = useState(0)

  const pageRef = useRef(0)
  const isLoadingRef = useRef(false)

  const loadData = useCallback(async (reset = false) => {
    if (isLoadingRef.current) return
    isLoadingRef.current = true
    setIsLoading(true)
    try {
      if (reset) {
        pageRef.current = 0
        setHasMore(true)
      }
      const res = await InventoryService.fetchVendorStats(pageRef.current, 15, search)
      const items = res.data.content || []
      setData(prev => reset ? items : [...prev, ...items])
      setTotalElements(res.data.totalElements || 0)
      pageRef.current += 1
      setHasMore(!res.data.last)
    } catch (e) {
      console.error(e)
    } finally {
      isLoadingRef.current = false
      setIsLoading(false)
    }
  }, [search])

  useEffect(() => {
    const timer = setTimeout(() => loadData(true), 350)
    return () => clearTimeout(timer)
  }, [loadData])

  const columns: Column<VendorStat>[] = [
    {
      header: 'Vendor',
      key: 'vendor',
      render: (row) => (
        <div className="flex items-center gap-3">
          <VendorAvatar name={row.supplierName} />
          <div className="min-w-0">
            <button
              onClick={() => navigate(`/app/panel/vendors/detail?id=${row.id}&name=${encodeURIComponent(row.supplierName)}`)}
              className="text-[13px] font-bold text-primary-text leading-tight truncate hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition-colors text-left cursor-pointer"
            >
              {row.supplierName}
            </button>
            <p className="text-[11px] text-muted-text truncate mt-0.5">{row.address}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'GST',
      key: 'gst',
      width: '16%',
      render: (row) => (
        <span className="text-[12px] font-mono font-bold text-secondary-text tracking-wide">
          {row.gst || '—'}
        </span>
      ),
    },
    {
      header: 'Contact',
      key: 'contact',
      width: '22%',
      render: (row) => (
        <div className="flex flex-col gap-1">
          {row.email && (
            <a
              href={`mailto:${row.email}`}
              className="flex items-center gap-1.5 text-[11px] font-medium text-secondary-text hover:text-primary-text transition-colors group"
            >
              <Mail size={11} className="text-muted-text group-hover:text-primary-text shrink-0" />
              <span className="truncate">{row.email}</span>
            </a>
          )}
          {row.phone && (
            <a
              href={`tel:${row.phone.split(',')[0].trim()}`}
              className="flex items-center gap-1.5 text-[11px] font-medium text-secondary-text hover:text-primary-text transition-colors group"
            >
              <Phone size={11} className="text-muted-text group-hover:text-primary-text shrink-0" />
              <span className="truncate">{row.phone}</span>
            </a>
          )}
          {!row.email && !row.phone && (
            <span className="text-[11px] text-muted-text">—</span>
          )}
        </div>
      ),
    },
    {
      header: 'Orders',
      key: 'orders',
      width: '10%',
      className: 'text-center',
      render: (row) => (
        <div className="flex flex-col items-center gap-0.5">
          <span className="flex items-center gap-1 text-[13px] font-black text-primary-text">
            <ShoppingBag size={12} className="text-muted-text" />
            {row.orders}
          </span>
          <span className="text-[10px] text-muted-text">bill{row.orders !== 1 ? 's' : ''}</span>
        </div>
      ),
    },
    {
      header: 'Order Value',
      key: 'orderValue',
      width: '14%',
      className: 'text-right',
      render: (row) => (
        <div className="flex flex-col items-end">
          <span className="text-[14px] font-black text-primary-text tracking-tight">
            {formatCurrency(row.orderValue)}
          </span>
          <span className="text-[10px] text-muted-text">inc. tax</span>
        </div>
      ),
    },
  ]

  return (
    <div className="p-4 md:p-6 max-w-[1500px] mx-auto w-full flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <PageHeader
          title="Vendors"
          description="All suppliers and their purchase summary"
        />
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative group w-full max-w-[340px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-text group-focus-within:text-secondary-text transition-colors" />
          <input
            type="text"
            placeholder="Search vendors..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-[38px] pl-9 pr-4 bg-surface border border-border-main rounded-lg text-[12px] font-bold text-primary-text outline-none focus:border-secondary-text focus:ring-2 focus:ring-accent/5 transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-text hover:text-primary-text transition-colors"
            >
              <RotateCw size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <InfiniteScrollTable<VendorStat>
          columns={columns}
          data={data}
          isLoading={isLoading}
          hasMore={hasMore}
          onLoadMore={() => loadData(false)}
          keyExtractor={(row) => row.id}
          totalElements={totalElements}
          itemName="vendors"
          minWidth="760px"
        />
      </div>
    </div>
  )
}
