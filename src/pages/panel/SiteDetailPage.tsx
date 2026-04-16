import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { MapPin, User, Calendar, ArrowRight, Pencil, ExternalLink } from 'lucide-react'
import Skeleton from 'react-loading-skeleton'
import { format } from 'date-fns'
import { SitesService, type SiteDetail } from '../../services/sitesService'
import { StockUploadService, type BatchDetail, type UploadBatch } from '../../services/stockUploadService'
import { BillViewModal } from '../../components/stock-upload/BillViewModal'

interface Stats {
  totalValue: number
  totalConsumptionValue: number
}

const formatValue = (v: number) => {
  if (!v) return '₹0'
  if (v >= 100_000) return `₹${(v / 100_000).toFixed(2)} L`
  if (v >= 1_000) return `₹${(v / 1_000).toFixed(2)} K`
  return `₹${Math.round(v)}`
}

const fmtDate = (iso: string | null) =>
  iso ? format(new Date(iso), 'dd MMM, yyyy') : ''

const getStatusBadge = (status: string) =>
  status === 'COMPLETED'
    ? { label: 'Completed', cls: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' }
    : { label: 'In Progress', cls: 'bg-amber-500/10 text-amber-600 border-amber-500/20' }

export default function SiteDetailPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const siteId = Number(searchParams.get('id'))
  const siteName = searchParams.get('name') || ''

  const [site, setSite] = useState<SiteDetail | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [bills, setBills] = useState<BatchDetail[]>([])
  const [totalBills, setTotalBills] = useState(0)
  const [isLoadingSite, setIsLoadingSite] = useState(true)
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [isLoadingBills, setIsLoadingBills] = useState(true)
  const [selectedBill, setSelectedBill] = useState<UploadBatch | null>(null)

  const toUploadBatch = (bill: BatchDetail): UploadBatch => ({
    id: bill.id,
    supplierName: bill.supplierName,
    refNo: bill.refNumber,
    totalPrice: bill.totalAmount,
    state: "COMPLETED",
    siteNames: bill.siteTransferred?.join(', ') || '',
    createdAt: bill.createdAt,
    billUrl: bill.billUrl,
  })

  useEffect(() => {
    if (!siteName) return
    SitesService.getSiteByName(siteName)
      .then(res => setSite(res.data))
      .catch(console.error)
      .finally(() => setIsLoadingSite(false))
  }, [siteName])

  useEffect(() => {
    if (!siteId) return
    SitesService.fetchInventoryStats(siteId)
      .then(res => setStats(res.data))
      .catch(console.error)
      .finally(() => setIsLoadingStats(false))
  }, [siteId])

  useEffect(() => {
    if (!siteId) return
    StockUploadService.fetchBatchDetails(0, 3, {
      searchKey: null,
      vendor: [],
      site: [siteId],
      startDate: null,
      endDate: null,
      createdStartDate: null,
      createdEndDate: null,
    })
      .then(res => {
        setBills(res.data.content || [])
        setTotalBills(res.data.totalElements || 0)
      })
      .catch(console.error)
      .finally(() => setIsLoadingBills(false))
  }, [siteId])

  return (
    <div className="w-full flex flex-col h-full overflow-y-auto">

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <div className="relative w-full shrink-0 overflow-hidden" style={{ minHeight: 210 }}>
        <img
          src="/site-head.jpeg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50 z-0" />

        {/* Edit button */}
        <button
          onClick={() => navigate(`/app/panel/sites/edit?name=${encodeURIComponent(siteName)}`)}
          className="absolute top-4 right-4 z-10 flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-[12px] font-bold rounded-lg transition-colors backdrop-blur-sm border border-white/10"
        >
          <Pencil size={12} /> Edit
        </button>

        <div className="relative z-10 flex items-end justify-between h-full p-6 md:p-8 pt-16 gap-4">
          {isLoadingSite ? (
            <div className="flex flex-col gap-2">
              <Skeleton width={260} height={28} borderRadius={6} baseColor="#334155" highlightColor="#475569" />
              <Skeleton width={340} height={13} borderRadius={4} baseColor="#334155" highlightColor="#475569" />
              <Skeleton width={200} height={13} borderRadius={4} baseColor="#334155" highlightColor="#475569" />
            </div>
          ) : site ? (
            <>
              <div className="flex flex-col min-w-0 flex-1">
                <h1 className="text-white text-[24px] font-black tracking-tight mb-2 leading-tight">
                  {site.name}
                </h1>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
                  {site.address && (
                    <div className="flex items-center gap-1.5 text-slate-300 text-[12px] font-semibold">
                      <MapPin size={12} className="shrink-0" />
                      <span className="truncate max-w-[300px]">{site.address}</span>
                    </div>
                  )}
                  {site.managerNames?.length > 0 && (
                    <div className="flex items-center gap-1.5 text-slate-300 text-[12px] font-semibold">
                      <User size={12} className="shrink-0" />
                      <span>{site.managerNames.join(', ')}</span>
                    </div>
                  )}
                  {site.startDate && (
                    <div className="flex items-center gap-1.5 text-slate-300 text-[12px] font-semibold">
                      <Calendar size={12} className="shrink-0" />
                      <span>
                        {fmtDate(site.startDate)}
                        {' – '}
                        {site.endDate ? fmtDate(site.endDate) : ''}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              {(() => {
                const badge = getStatusBadge(site.status)
                return (
                  <span className={`shrink-0 px-4 py-1.5 rounded-full text-[12px] font-black border ${badge.cls}`}>
                    {badge.label}
                  </span>
                )
              })()}
            </>
          ) : null}
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────── */}
      <div className="flex-1 p-4 md:p-6 max-w-[1500px] mx-auto w-full flex flex-col gap-6">

        {/* ── Stats ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Available Inventory */}
          <div className="bg-card border border-border-main rounded-2xl p-5 shadow-sm">
            <p className="text-[10px] font-black text-muted-text uppercase tracking-wider mb-3">
              Available Inventory Value
            </p>
            {isLoadingStats ? (
              <Skeleton width={120} height={36} borderRadius={6} />
            ) : (
              <div className="flex items-end justify-between">
                <p className="text-[32px] font-black text-primary-text leading-none">
                  {formatValue(stats?.totalValue ?? 0)}
                </p>
                <div className="w-10 h-10 rounded-xl bg-surface border border-border-main flex items-center justify-center text-muted-text text-[16px] font-black">
                  ₹
                </div>
              </div>
            )}
            <button
              onClick={() => navigate('/app/panel/inventory')}
              className="mt-3 flex items-center gap-1.5 text-[12px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
            >
              View Inventory <ArrowRight size={12} />
            </button>
          </div>

          {/* Total Consumption */}
          <div className="bg-card border border-border-main rounded-2xl p-5 shadow-sm">
            <p className="text-[10px] font-black text-muted-text uppercase tracking-wider mb-3">
              Total Consumption Value
            </p>
            {isLoadingStats ? (
              <Skeleton width={140} height={36} borderRadius={6} />
            ) : (
              <div className="flex items-end justify-between">
                <p className="text-[32px] font-black text-primary-text leading-none">
                  {formatValue(stats?.totalConsumptionValue ?? 0)}
                </p>
                <div className="w-10 h-10 rounded-xl bg-surface border border-border-main flex items-center justify-center text-muted-text text-[16px] font-black">
                  ₹
                </div>
              </div>
            )}
            <button
              onClick={() => navigate(`/app/panel/sites/consumption?id=${siteId}&name=${encodeURIComponent(siteName)}`)}
              className="mt-3 flex items-center gap-1.5 text-[12px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
            >
              View Consumptions <ArrowRight size={12} />
            </button>
          </div>
        </div>

        {/* ── Purchase Bills ─────────────────────────────────────── */}
        <div>
          <div className="mb-3">
            <h2 className="text-[16px] font-black text-primary-text">Purchase Bills</h2>
            <p className="text-[12px] font-medium text-muted-text mt-0.5">
              These are the most recent bill uploads for this project.
            </p>
          </div>

          <div className="bg-card border border-border-main rounded-2xl overflow-hidden shadow-sm">
            {/* Table header — desktop only */}
            <div className="hidden md:grid grid-cols-[1.2fr_1.2fr_1.4fr_0.9fr_72px] gap-4 px-5 py-3 border-b border-border-main/50 bg-surface/60">
              {['Bill Date', 'Vendor / Supplier', 'Uploaded By', 'Amount', 'Actions'].map(h => (
                <p key={h} className="text-[10px] font-black text-muted-text uppercase tracking-wider">{h}</p>
              ))}
            </div>

            {isLoadingBills ? (
              <div className="flex flex-col divide-y divide-border-main/30">
                {[0, 1, 2].map(i => (
                  <div key={i} className="px-5 py-4 flex flex-col gap-2 md:grid md:grid-cols-[1.2fr_1.2fr_1.4fr_0.9fr_72px] md:gap-4">
                    <Skeleton height={14} borderRadius={4} />
                    <Skeleton height={14} borderRadius={4} />
                    <Skeleton height={12} borderRadius={4} width="60%" />
                    <Skeleton height={14} borderRadius={4} />
                    <Skeleton height={14} borderRadius={4} width={48} />
                  </div>
                ))}
              </div>
            ) : bills.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <p className="text-[13px] font-semibold text-muted-text">No bills found for this site.</p>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-border-main/30">
                {bills.map(bill => (
                  <div
                    key={bill.id}
                    className="px-5 py-4 hover:bg-surface/50 transition-colors md:grid md:grid-cols-[1.2fr_1.2fr_1.4fr_0.9fr_72px] md:gap-4 md:items-center"
                  >
                    {/* Mobile layout */}
                    <div className="flex items-start justify-between gap-3 md:contents">
                      {/* Bill Date */}
                      <div className="min-w-0">
                        <p className="text-[12px] font-bold text-primary-text">
                          {format(new Date(bill.billDate), 'dd MMM, yyyy')}
                        </p>
                        <p className="text-[10px] text-muted-text mt-0.5">{bill.refNumber}</p>
                      </div>
                      {/* Amount — right side on mobile */}
                      <div className="text-right md:hidden shrink-0">
                        <p className="text-[13px] font-black text-primary-text">
                          {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
                            .format(bill.totalAmountIncTax).replace('INR', '₹')}
                        </p>
                        <p className="text-[10px] text-muted-text">{bill.totalItems} item{bill.totalItems !== 1 ? 's' : ''}</p>
                      </div>
                    </div>

                    {/* Vendor */}
                    <p className="text-[12px] font-semibold text-secondary-text mt-2 md:mt-0 md:self-center">{bill.supplierName}</p>

                    {/* Uploaded By */}
                    <div className="mt-1 md:mt-0 md:self-center">
                      <p className="text-[11px] font-semibold text-secondary-text">{bill.createdBy.split('@')[0]}</p>
                      <p className="text-[10px] text-muted-text truncate hidden md:block">{bill.createdBy}</p>
                    </div>

                    {/* Amount — desktop only */}
                    <div className="hidden md:block md:self-center">
                      <p className="text-[13px] font-black text-primary-text">
                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
                          .format(bill.totalAmountIncTax).replace('INR', '₹')}
                      </p>
                      <p className="text-[10px] text-muted-text">{bill.totalItems} item{bill.totalItems !== 1 ? 's' : ''}</p>
                    </div>

                    {/* Action */}
                    <div className="mt-3 md:mt-0 md:self-center md:flex md:justify-end">
                      <button
                        onClick={() => setSelectedBill(toUploadBatch(bill))}
                        className="text-[11px] font-black text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                      >
                        View <ExternalLink size={10} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Footer */}
            {totalBills > 3 && (
              <div className="px-5 py-3 border-t border-border-main/50 flex justify-end">
                <button
                  onClick={() => {
                    const sitesParam = JSON.stringify([{ id: siteId, name: siteName, city: site?.city || '', state: site?.state || '' }])
                    navigate(`/app/panel/bills?sites=${encodeURIComponent(sitesParam)}`)
                  }}
                  className="text-[12px] font-black text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  View all {totalBills} bills <ArrowRight size={12} />
                </button>
              </div>
            )}
          </div>
        </div>

      </div>

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
