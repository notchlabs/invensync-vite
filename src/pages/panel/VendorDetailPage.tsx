import { useState, useCallback, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Mail, Phone, MapPin, ShoppingBag, TrendingUp, Hash, Calendar, User, Building2, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'
import type { DateRange } from 'react-day-picker'
import { InfiniteScrollTable, type Column } from '../../components/common/InfiniteScrollTable'
import { AdvancedDateRangePicker } from '../../components/common/AdvancedDateRangePicker'
import { InventoryService, type VendorStat } from '../../services/inventoryService'
import { StockUploadService, type BatchDetail, type UploadBatch } from '../../services/stockUploadService'
import { BillViewModal } from '../../components/stock-upload/BillViewModal'
import Skeleton from 'react-loading-skeleton'

const fmtCurrency = (n: number) => {
  if (!n) return '₹0'
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(2)} L`
  if (n >= 1_000) return `₹${(n / 1_000).toFixed(2)} K`
  return `₹${n.toFixed(2)}`
}

const toUploadBatch = (b: BatchDetail): UploadBatch => ({
  id: b.id,
  supplierName: b.supplierName,
  refNo: b.refNumber,
  totalPrice: b.totalAmount,
  state: null,
  siteNames: b.siteTransferred?.join(', ') || '',
  createdAt: b.createdAt,
  billUrl: b.billUrl,
})

function StatCard({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
  return (
    <div className="flex flex-col gap-1 bg-white/5 rounded-xl px-4 py-3 border border-white/10 min-w-[120px]">
      <span className="flex items-center gap-1.5 text-[10px] font-black text-white/40 uppercase tracking-widest">
        <Icon size={10} /> {label}
      </span>
      <span className="text-[20px] font-black text-white tracking-tight leading-none">{value}</span>
    </div>
  )
}

export default function VendorDetailPage() {
  const [searchParams] = useSearchParams()
  const vendorId = Number(searchParams.get('id'))
  const vendorName = searchParams.get('name') || ''

  // Vendor info
  const [vendor, setVendor] = useState<VendorStat | null>(null)
  const [isLoadingVendor, setIsLoadingVendor] = useState(true)

  // Bills
  const [bills, setBills] = useState<BatchDetail[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [totalElements, setTotalElements] = useState(0)
  const [billRange, setBillRange] = useState<DateRange | undefined>()
  const [uploadRange, setUploadRange] = useState<DateRange | undefined>()
  const [selectedBill, setSelectedBill] = useState<UploadBatch | null>(null)

  const pageRef = useRef(0)
  const isLoadingRef = useRef(false)

  // Fetch vendor details
  useEffect(() => {
    if (!vendorId) return
    InventoryService.fetchSupplierById(vendorId)
      .then(res => setVendor(res.data))
      .catch(console.error)
      .finally(() => setIsLoadingVendor(false))
  }, [vendorId])

  // Fetch bills
  const loadBills = useCallback(async (reset = false) => {
    if (isLoadingRef.current) return
    isLoadingRef.current = true
    setIsLoading(true)
    try {
      if (reset) {
        pageRef.current = 0
        setHasMore(true)
      }
      const res = await StockUploadService.fetchBatchDetails(pageRef.current, 12, {
        searchKey: null,
        vendor: [vendorId],
        site: [],
        startDate: billRange?.from ? format(billRange.from, "yyyy-MM-dd'T'00:00:00.000'Z'") : null,
        endDate: billRange?.to ? format(billRange.to, "yyyy-MM-dd'T'23:59:59.999'Z'") : null,
        createdStartDate: uploadRange?.from ? format(uploadRange.from, "yyyy-MM-dd'T'00:00:00.000'Z'") : null,
        createdEndDate: uploadRange?.to ? format(uploadRange.to, "yyyy-MM-dd'T'23:59:59.999'Z'") : null,
      })
      const items = res.data.content || []
      setBills(prev => reset ? items : [...prev, ...items])
      setTotalElements(res.data.totalElements || 0)
      pageRef.current += 1
      setHasMore(res.data.isLast !== undefined ? !res.data.isLast : items.length === 12)
    } catch (e) {
      console.error(e)
    } finally {
      isLoadingRef.current = false
      setIsLoading(false)
    }
  }, [vendorId, billRange, uploadRange])

  useEffect(() => {
    if (!vendorId) return
    const t = setTimeout(() => loadBills(true), 300)
    return () => clearTimeout(t)
  }, [loadBills, vendorId])

  const columns: Column<BatchDetail>[] = [
    {
      header: 'Invoice / Ref',
      key: 'ref',
      width: '18%',
      render: (row) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-[13px] font-black text-primary-text tracking-tight">{row.refNumber}</span>
          <span className="text-[10px] text-muted-text font-medium">{row.uniqueId}</span>
        </div>
      ),
    },
    {
      header: 'Bill Date',
      key: 'billDate',
      width: '14%',
      render: (row) => (
        <div className="flex items-center gap-1.5 text-[12px] font-bold text-secondary-text">
          <Calendar size={12} className="text-muted-text shrink-0" />
          {new Date(row.billDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
        </div>
      ),
    },
    {
      header: 'Sites',
      key: 'sites',
      width: '18%',
      render: (row) => (
        <div className="flex items-center gap-1.5 text-[12px] font-bold text-secondary-text">
          <Building2 size={12} className="text-muted-text shrink-0" />
          <span className="truncate">{row.siteTransferred?.join(', ') || '—'}</span>
        </div>
      ),
    },
    {
      header: 'Items',
      key: 'items',
      width: '10%',
      className: 'text-center',
      render: (row) => (
        <span className="text-[12px] font-bold text-secondary-text">{row.totalItems}</span>
      ),
    },
    {
      header: 'Amount',
      key: 'amount',
      width: '14%',
      className: 'text-right',
      render: (row) => (
        <div className="flex flex-col items-end">
          <span className="text-[13px] font-black text-primary-text tracking-tight">
            {fmtCurrency(row.totalAmountIncTax)}
          </span>
          <span className="text-[10px] text-muted-text">{row.totalItems} item{row.totalItems !== 1 ? 's' : ''}</span>
        </div>
      ),
    },
    {
      header: 'Uploaded By',
      key: 'uploadedBy',
      width: '16%',
      render: (row) => (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1 text-[12px] font-bold text-primary-text">
            <User size={11} className="text-muted-text shrink-0" />
            {row.createdBy.split('@')[0]}
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-text">
            <Calendar size={10} className="shrink-0" />
            {new Date(row.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
          </div>
        </div>
      ),
    },
    {
      header: '',
      key: 'action',
      width: '8%',
      className: 'text-right',
      render: (row) => (
        <button
          onClick={() => setSelectedBill(toUploadBatch(row))}
          className="text-[11px] font-black text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 ml-auto"
        >
          View <ExternalLink size={10} />
        </button>
      ),
    },
  ]

  // Initials avatar
  const initials = vendorName.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()

  return (
    <div className="flex flex-col h-full overflow-y-auto">

      {/* ── Hero Header ───────────────────────────────────────────── */}
      <div className="bg-[#0f0f0f] shrink-0 px-5 md:px-8 py-6 md:py-8">
        {isLoadingVendor ? (
          <div className="flex flex-col gap-5 max-w-[1400px] w-full mx-auto animate-pulse">
            {/* Avatar + name row */}
            <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
              {/* Avatar */}
              <Skeleton width={56} height={56} borderRadius={16} baseColor="#1f1f1f" highlightColor="#2a2a2a" />
              {/* Name / address / contacts */}
              <div className="flex flex-col gap-2.5 flex-1">
                <Skeleton width={260} height={26} borderRadius={6} baseColor="#1f1f1f" highlightColor="#2a2a2a" />
                <Skeleton width="80%" height={13} borderRadius={4} baseColor="#1f1f1f" highlightColor="#2a2a2a" />
                <Skeleton width="55%" height={13} borderRadius={4} baseColor="#1f1f1f" highlightColor="#2a2a2a" />
                {/* Contact chips */}
                <div className="flex flex-wrap gap-3 pt-1">
                  <Skeleton width={90} height={18} borderRadius={999} baseColor="#1f1f1f" highlightColor="#2a2a2a" />
                  <Skeleton width={160} height={18} borderRadius={999} baseColor="#1f1f1f" highlightColor="#2a2a2a" />
                  <Skeleton width={130} height={18} borderRadius={999} baseColor="#1f1f1f" highlightColor="#2a2a2a" />
                </div>
              </div>
            </div>
            {/* Stat cards */}
            <div className="flex flex-wrap gap-3">
              <Skeleton width={130} height={64} borderRadius={12} baseColor="#1f1f1f" highlightColor="#2a2a2a" />
              <Skeleton width={150} height={64} borderRadius={12} baseColor="#1f1f1f" highlightColor="#2a2a2a" />
            </div>
          </div>
        ) : vendor ? (
          <div className="flex flex-col gap-5 max-w-[1400px] w-full mx-auto">
            {/* Top row: avatar + name + contact */}
            <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
              {/* Avatar */}
              <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
                <span className="text-[20px] font-black text-white">{initials}</span>
              </div>

              {/* Name & Address */}
              <div className="flex-1 min-w-0">
                <h1 className="text-[22px] md:text-[26px] font-black text-white tracking-tight leading-tight">
                  {vendor.supplierName}
                </h1>
                {vendor.address && (
                  <p className="flex items-start gap-1.5 text-[12px] text-white/40 font-medium mt-1 max-w-[600px]">
                    <MapPin size={12} className="shrink-0 mt-0.5" />
                    {vendor.address}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 mt-2.5">
                  {vendor.gst && (
                    <span className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-white/50">
                      <Hash size={11} /> {vendor.gst}
                    </span>
                  )}
                  {vendor.email && (
                    <a href={`mailto:${vendor.email}`} className="flex items-center gap-1.5 text-[11px] font-medium text-white/50 hover:text-white transition-colors">
                      <Mail size={11} /> {vendor.email}
                    </a>
                  )}
                  {vendor.phone && (
                    <a href={`tel:${vendor.phone.split(',')[0].trim()}`} className="flex items-center gap-1.5 text-[11px] font-medium text-white/50 hover:text-white transition-colors">
                      <Phone size={11} /> {vendor.phone}
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap gap-3">
              <StatCard label="Total Bills" value={String(vendor.orders)} icon={ShoppingBag} />
              <StatCard label="Order Value" value={fmtCurrency(vendor.orderValue)} icon={TrendingUp} />
            </div>
          </div>
        ) : null}
      </div>

      {/* ── Bills Section ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-0 p-4 md:p-6 max-w-[1400px] w-full mx-auto">
        {/* Section header + filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            {isLoadingVendor ? (
              <div className="flex flex-col gap-1.5">
                <Skeleton width={140} height={18} borderRadius={6} />
                <Skeleton width={240} height={12} borderRadius={4} />
              </div>
            ) : (
              <>
                <h2 className="text-[16px] font-black text-primary-text tracking-tight">Purchase Bills</h2>
                <p className="text-[12px] text-muted-text font-medium mt-0.5">All bills uploaded under this vendor</p>
              </>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isLoadingVendor ? (
              <>
                <Skeleton width={160} height={38} borderRadius={10} />
                <Skeleton width={160} height={38} borderRadius={10} />
              </>
            ) : (
              <>
                <AdvancedDateRangePicker
                  selectedRange={billRange}
                  onRangeChange={setBillRange}
                  placeholder="Bill date range"
                  label="Bill Date"
                />
                <AdvancedDateRangePicker
                  selectedRange={uploadRange}
                  onRangeChange={setUploadRange}
                  placeholder="Upload date range"
                  label="Upload Date"
                />
                {(billRange || uploadRange) && (
                  <button
                    onClick={() => { setBillRange(undefined); setUploadRange(undefined) }}
                    className="px-3 py-2 text-[11px] font-black text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg uppercase tracking-widest transition-colors h-[38px]"
                  >
                    Clear
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <InfiniteScrollTable<BatchDetail>
            columns={columns}
            data={bills}
            isLoading={isLoading}
            hasMore={hasMore}
            onLoadMore={() => loadBills(false)}
            keyExtractor={(row) => row.id}
            totalElements={totalElements}
            itemName="bills"
            minWidth="800px"
          />
        </div>
      </div>

      {/* Bill View Modal */}
      {selectedBill && (
        <BillViewModal
          isOpen={true}
          onClose={() => setSelectedBill(null)}
          batch={selectedBill}
        />
      )}
    </div>
  )
}
