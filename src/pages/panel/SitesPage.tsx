import { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, RotateCw, MapPin, Calendar, User, Pencil, Plus } from 'lucide-react'
import Skeleton from 'react-loading-skeleton'
import { PageHeader } from '../../components/common/PageHeader'
import { CustomSelect } from '../../components/common/CustomSelect'
import { SitesService, type SiteListItem } from '../../services/sitesService'

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'INPROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
]

const formatInventoryValue = (value: number) => {
  if (!value || value === 0) return '₹0'
  const lakhs = value / 100000
  return `₹${lakhs % 1 === 0 ? lakhs.toFixed(0) : lakhs.toFixed(2)} L`
}

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const getStatusBadge = (status: string) => {
  if (status === 'COMPLETED') {
    return {
      label: 'Completed',
      className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    }
  }
  return {
    label: 'In Progress',
    className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  }
}

export default function SitesPage() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const [sites, setSites] = useState<SiteListItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [totalElements, setTotalElements] = useState(0)

  const pageRef = useRef(0)
  const isLoadingRef = useRef(false)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const loadData = useCallback(async (reset = false) => {
    if (isLoadingRef.current) return
    isLoadingRef.current = true
    setIsLoading(true)

    try {
      if (reset) {
        pageRef.current = 0
        setHasMore(true)
      }

      const res = await SitesService.listSites(pageRef.current, 12, {
        searchTerm,
        status: statusFilter,
      })

      const items = res.data.content || []
      setSites(prev => (reset ? items : [...prev, ...items]))
      setTotalElements(res.data.totalElements || 0)
      pageRef.current += 1
      setHasMore(!res.data.last)
    } catch (e) {
      console.error(e)
    } finally {
      isLoadingRef.current = false
      setIsLoading(false)
    }
  }, [searchTerm, statusFilter])

  useEffect(() => {
    const timer = setTimeout(() => loadData(true), 400)
    return () => clearTimeout(timer)
  }, [loadData])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingRef.current) {
          loadData(false)
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, loadData])

  const handleClearFilters = () => {
    setSearchTerm('')
    setStatusFilter('')
  }

  const hasAnyFilters = searchTerm || statusFilter

  return (
    <div className="p-4 md:p-6 max-w-[1500px] mx-auto w-full flex flex-col h-full overflow-hidden">
      {/* Page Header */}
      <div className="flex items-start justify-between mb-6">
        <PageHeader
          title="All Sites"
          description="Manage and monitor all your sites"
        />
        <button
          onClick={() => navigate('/app/panel/sites/create')}
          className="flex items-center gap-2 px-4 py-2.5 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-[13px] font-bold rounded-xl hover:opacity-90 transition-opacity shrink-0"
        >
          <Plus size={15} />
          Create Site
        </button>
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {/* Search */}
        <div className="relative group flex-1 min-w-[200px] max-w-[340px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-text group-focus-within:text-secondary-text" />
          <input
            type="text"
            placeholder="Search by site name or address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-[38px] pl-9 pr-4 bg-surface border border-border-main rounded-lg text-[12px] font-bold text-primary-text outline-none focus:border-secondary-text focus:ring-2 focus:ring-accent/5 transition-all"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-[12px] font-semibold text-secondary-text whitespace-nowrap">
            Filter by status:
          </span>
          <div className="h-[38px] w-[160px] border border-border-main rounded-lg">
            <CustomSelect
              placeholder="All Status"
              options={STATUS_OPTIONS}
              value={statusFilter}
              onChange={setStatusFilter}
              className="rounded-lg border-none h-[38px]"
            />
          </div>
        </div>

        {/* Clear Filters */}
        {hasAnyFilters && (
          <button
            onClick={handleClearFilters}
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all h-[38px]"
          >
            <RotateCw size={12} /> Clear
          </button>
        )}
      </div>

      {/* Count */}
      <p className="text-[13px] font-semibold text-secondary-text mb-4">
        Showing {sites.length} of {totalElements} sites
      </p>

      {/* Card Grid */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 pb-4">
          {sites.map((site) => {
            const badge = getStatusBadge(site.status)
            const startDateStr = formatDate(site.startDate)
            const endDateStr = formatDate(site.endDate)

            return (
              <div
                key={site.id}
                className="relative bg-card border border-border-main rounded-2xl p-5 shadow-sm flex flex-col gap-3 hover:shadow-md transition-shadow"
              >
                {/* Stretched card click target */}
                <button
                  onClick={() => navigate(`/app/panel/sites/detail?id=${site.id}&name=${encodeURIComponent(site.name)}`)}
                  className="absolute inset-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer"
                  aria-label={`View details for ${site.name}`}
                />

                {/* Header */}
                <div className="relative z-10 flex items-start justify-between">
                  <h3 className="text-[15px] font-bold text-primary-text leading-snug">
                    {site.name}
                  </h3>
                  <button
                    onClick={e => { e.stopPropagation(); navigate(`/app/panel/sites/edit?name=${encodeURIComponent(site.name)}`) }}
                    className="p-1.5 hover:bg-surface rounded-lg transition-colors text-muted-text hover:text-secondary-text ml-2 shrink-0"
                  >
                    <Pencil size={13} />
                  </button>
                </div>

                {/* Location */}
                <div className="relative z-10 flex items-center gap-1.5 text-[12px] font-semibold text-secondary-text">
                  <MapPin size={13} className="shrink-0 text-muted-text" />
                  <span>{site.city}, {site.state}</span>
                </div>

                {/* Date Range */}
                <div className="relative z-10 flex items-center gap-1.5 text-[12px] font-semibold text-secondary-text">
                  <Calendar size={13} className="shrink-0 text-muted-text" />
                  <span>
                    {startDateStr}
                    {' – '}
                    {endDateStr || ''}
                  </span>
                </div>

                {/* Manager */}
                <div className="relative z-10 flex items-center gap-1.5 text-[12px] font-semibold text-secondary-text">
                  <User size={13} className="shrink-0 text-muted-text" />
                  <span>{site.managerName || '–'}</span>
                </div>

                {/* Divider */}
                <div className="relative z-10 border-t border-border-main/50 mt-auto" />

                {/* Footer */}
                <div className="relative z-10 flex items-center justify-between">
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${badge.className}`}>
                    {badge.label}
                  </span>
                  <div className="text-right">
                    <p className="text-[10px] font-semibold text-muted-text">Inventory Value</p>
                    <p className="text-[14px] font-black text-primary-text">
                      {formatInventoryValue(site.totalValueIncTax)}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}

          {/* Skeleton cards while loading */}
          {isLoading &&
            ['sk-0', 'sk-1', 'sk-2', 'sk-3', 'sk-4', 'sk-5'].slice(0, sites.length === 0 ? 6 : 3).map((key) => (
              <div
                key={key}
                className="bg-card border border-border-main rounded-2xl p-5 flex flex-col gap-3"
              >
                {/* Title row */}
                <div className="flex items-start justify-between">
                  <Skeleton width="65%" height={16} borderRadius={6} />
                  <Skeleton width={24} height={24} borderRadius={8} />
                </div>
                {/* Location */}
                <Skeleton width="55%" height={12} borderRadius={4} />
                {/* Date */}
                <Skeleton width="50%" height={12} borderRadius={4} />
                {/* Manager */}
                <Skeleton width="60%" height={12} borderRadius={4} />
                {/* Divider */}
                <div className="border-t border-border-main/50 mt-auto" />
                {/* Footer */}
                <div className="flex items-center justify-between">
                  <Skeleton width={80} height={24} borderRadius={999} />
                  <div className="flex flex-col items-end gap-1">
                    <Skeleton width={70} height={10} borderRadius={4} />
                    <Skeleton width={60} height={16} borderRadius={4} />
                  </div>
                </div>
              </div>
            ))}
        </div>

        {/* Empty state */}
        {!isLoading && sites.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-[15px] font-bold text-primary-text mb-1">No sites found</p>
            <p className="text-[13px] font-medium text-secondary-text">
              Try adjusting your search or filter.
            </p>
          </div>
        )}

        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} className="h-4" />
      </div>
    </div>
  )
}
