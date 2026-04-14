import { useState, useCallback, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Search, Plus, ScrollText } from 'lucide-react'
import { InfiniteScrollTable, type Column } from '../../components/common/InfiniteScrollTable'
import { SitesService, type ConsumptionUnit } from '../../services/sitesService'
import { CreateUnitDialog } from '../../components/consumption/CreateUnitDialog'

const formatValue = (v: number) => {
  if (!v) return '₹0'
  if (v >= 100_000) return `₹${(v / 100_000).toFixed(2)} L`
  if (v >= 1_000) return `₹${(v / 1_000).toFixed(2)} K`
  return `₹${v.toFixed(2)}`
}


export default function SiteConsumptionPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const siteId = Number(searchParams.get('id'))
  const siteName = searchParams.get('name') || ''

  const [searchTerm, setSearchTerm] = useState('')
  const [data, setData] = useState<ConsumptionUnit[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [totalElements, setTotalElements] = useState(0)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

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
      const res = await SitesService.listConsumptionUnits(siteId, searchTerm, pageRef.current, 10)
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
  }, [siteId, searchTerm])

  useEffect(() => {
    if (!siteId) return
    const timer = setTimeout(() => loadData(true), 400)
    return () => clearTimeout(timer)
  }, [loadData, siteId])

  const handleCreateSuccess = () => {
    setIsCreateOpen(false)
    loadData(true)
  }

  const columns: Column<ConsumptionUnit>[] = [
    {
      header: 'No.',
      key: 'no',
      width: '60px',
      render: (_, index) => (
        <span className="text-[12px] font-bold text-[var(--text-muted)]">{(index ?? 0) + 1}</span>
      ),
    },
    {
      header: 'Unit Info',
      key: 'unitInfo',
      render: (row) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-[13px] font-black text-[var(--text-primary)] leading-tight">{row.dsrNo}</span>
          <span className="text-[11px] font-medium text-[var(--text-muted)]">{row.label}</span>
        </div>
      ),
    },
    {
      header: 'Description',
      key: 'description',
      render: (row) => (
        <span className="text-[12px] font-medium text-[var(--text-secondary)]">{row.description}</span>
      ),
    },
    {
      header: 'Consumed Value',
      key: 'consumedValue',
      className: 'text-right',
      width: '160px',
      render: (row) => (
        <span className="text-[13px] font-black text-[var(--text-primary)] tracking-tight">{formatValue(row.consumedValue)}</span>
      ),
    },
    {
      header: 'Action',
      key: 'action',
      className: 'text-right',
      width: '120px',
      render: (row) => (
        <button
          onClick={() => navigate(`/app/panel/sites/${encodeURIComponent(siteName)}/consumption/${encodeURIComponent(row.dsrNo)}?siteId=${siteId}&cuId=${row.id}&dsrNo=${encodeURIComponent(row.dsrNo)}`)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-lg text-[11px] font-black text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-header)] transition-colors cursor-pointer"
        >
          <ScrollText size={11} /> View Logs
        </button>
      ),
    },
  ]

  if (!siteId) {
    return (
      <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
        No site selected.{' '}
        <button onClick={() => navigate('/app/panel/sites')} className="ml-1 text-blue-500 underline">Go back</button>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-[1500px] mx-auto w-full flex flex-col h-full overflow-hidden">
      {/* Page Header Row */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-black text-[var(--text-primary)] tracking-tight">Consumption Units</h1>
          <p className="text-[13px] font-medium text-[var(--text-muted)] mt-0.5">
            Manage the consumption units and their associated costs for this site.
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-[13px] font-black rounded-xl hover:opacity-90 transition-opacity cursor-pointer shrink-0"
        >
          <Plus size={15} /> Create Unit
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative group w-full max-w-[340px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--text-secondary)]" />
          <input
            type="text"
            placeholder="Search units..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full h-[38px] pl-9 pr-4 bg-[var(--bg-surface)] border border-[var(--border-main)] rounded-lg text-[12px] font-bold text-[var(--text-primary)] outline-none focus:border-[var(--text-secondary)] transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <InfiniteScrollTable<ConsumptionUnit>
          columns={columns}
          data={data}
          isLoading={isLoading}
          hasMore={hasMore}
          onLoadMore={() => loadData(false)}
          keyExtractor={(row) => row.id}
          totalElements={totalElements}
          itemName="units"
          minWidth="700px"
        />
      </div>

      {/* Create Unit Dialog */}
      {isCreateOpen && (
        <CreateUnitDialog
          siteId={siteId}
          onClose={() => setIsCreateOpen(false)}
          onSuccess={handleCreateSuccess}
        />
      )}
    </div>
  )
}
