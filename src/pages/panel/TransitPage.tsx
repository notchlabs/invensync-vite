import { useState, useCallback, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, RotateCw, Download, FileSpreadsheet, ReceiptText } from 'lucide-react'
import { InfiniteScrollTable, type Column } from '../../components/common/InfiniteScrollTable'
import { PageHeader } from '../../components/common/PageHeader'
import { SiteFilter } from '../../components/filters/SiteFilter'
import { DateRangePicker } from '../../components/common/DateRangePicker'
import { TransferService, type TransferRecord } from '../../services/transferService'
import { TransitDetailModal } from '../../components/transit/TransitDetailModal'
import type { Site } from '../../types/inventory'

// ── helpers ───────────────────────────────────────────────────────────────────

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
    .format(n)
    .replace('INR', '₹')

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })

async function exportToExcel(rows: TransferRecord[], filename = 'transfers.xlsx') {
  const ExcelJS = (await import('exceljs')).default
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Transfers')

  ws.columns = [
    { header: 'Ref Number',    key: 'ref',    width: 22 },
    { header: 'From Site (-)', key: 'from',   width: 30 },
    { header: 'To Site (+)',   key: 'to',     width: 30 },
    { header: 'Taxable Amount', key: 'amount', width: 18 },
  ]

  // Header styling
  const headerRow = ws.getRow(1)
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 }
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF111827' } }
  headerRow.height = 22
  headerRow.alignment = { vertical: 'middle' }

  rows.forEach((r, i) => {
    const row = ws.addRow({
      ref:    r.refNumber,
      from:   r.sourceSite,
      to:     r.destinationSite,
      amount: r.totalAmount,
    })
    row.height = 18
    if (i % 2 === 1) {
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } }
    }
  })

  ws.eachRow(row => {
    row.eachCell(cell => {
      cell.border = {
        top:    { style: 'thin', color: { argb: 'FFE5E7EB' } },
        bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        left:   { style: 'thin', color: { argb: 'FFE5E7EB' } },
        right:  { style: 'thin', color: { argb: 'FFE5E7EB' } },
      }
    })
  })

  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ── page ──────────────────────────────────────────────────────────────────────

// parse a JSON Site array stored in a URL param, silently returning [] on failure
function parseSites(raw: string | null): Site[] {
  if (!raw) return []
  try {
    return (JSON.parse(raw) as { id: number; name: string; city: string; state: string }[])
      .map(s => ({
        id: s.id, name: s.name, city: s.city ?? '', state: s.state ?? '',
        address: '', country: '', zipCode: 0, gpsLat: 0, gpsLng: 0,
        startDate: null, endDate: null, projectType: '', status: '', searchKey: '',
      }))
  } catch { return [] }
}

export default function TransitPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  // Filters — lazy-initialised from URL
  const [search, setSearch]       = useState(() => searchParams.get('search') ?? '')
  const [fromDate, setFromDate]   = useState(() => searchParams.get('fromDate') ?? '')
  const [toDate, setToDate]       = useState(() => searchParams.get('toDate') ?? '')
  const [fromSites, setFromSites] = useState<Site[]>(() => parseSites(searchParams.get('fromSites')))
  const [toSites, setToSites]     = useState<Site[]>(() => parseSites(searchParams.get('toSites')))

  // Table data
  const [data, setData]               = useState<TransferRecord[]>([])
  const [isLoading, setIsLoading]     = useState(false)
  const [hasMore, setHasMore]         = useState(true)
  const [totalElements, setTotalElements] = useState(0)

  // Selection
  const [selectedKeys, setSelectedKeys] = useState<Set<number>>(new Set())
  const [isExporting, setIsExporting]   = useState(false)

  // Detail modal
  const [selectedTransfer, setSelectedTransfer] = useState<TransferRecord | null>(null)
  // id from URL to auto-open once data loads (stored in a ref so it doesn't re-trigger effects)
  const pendingOpenId = useRef<number | null>(
    searchParams.get('id') ? Number(searchParams.get('id')) : null
  )

  const pageRef      = useRef(0)
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
      const res = await TransferService.fetchTransfers(pageRef.current, 12, {
        search,
        fromDate,
        toDate,
        fromSiteId: fromSites.length ? fromSites.map(s => s.id) : null,
        toSiteId:   toSites.length   ? toSites.map(s => s.id)   : null,
      })
      const items = res.data.content || []
      setData(prev => reset ? items : [...prev, ...items])
      setTotalElements(res.data.totalElements || 0)
      pageRef.current += 1
      setHasMore(!res.data.isLast)
    } catch (e) {
      console.error(e)
    } finally {
      isLoadingRef.current = false
      setIsLoading(false)
    }
  }, [search, fromDate, toDate, fromSites, toSites])

  useEffect(() => {
    const t = setTimeout(() => loadData(true), 350)
    return () => clearTimeout(t)
  }, [loadData])

  // Sync filters → URL params
  useEffect(() => {
    setSearchParams(prev => {
      const p = new URLSearchParams(prev)
      search ? p.set('search', search) : p.delete('search')
      fromDate ? p.set('fromDate', fromDate) : p.delete('fromDate')
      toDate ? p.set('toDate', toDate) : p.delete('toDate')
      fromSites.length
        ? p.set('fromSites', JSON.stringify(fromSites.map(s => ({ id: s.id, name: s.name, city: s.city, state: s.state }))))
        : p.delete('fromSites')
      toSites.length
        ? p.set('toSites', JSON.stringify(toSites.map(s => ({ id: s.id, name: s.name, city: s.city, state: s.state }))))
        : p.delete('toSites')
      return p
    }, { replace: true })
  }, [search, fromDate, toDate, fromSites, toSites, setSearchParams])

  // Auto-open modal when the pending id from URL is found in loaded data
  useEffect(() => {
    if (!pendingOpenId.current || isLoading || data.length === 0) return
    const found = data.find(r => r.id === pendingOpenId.current)
    if (found) {
      setSelectedTransfer(found)
      pendingOpenId.current = null
    }
  }, [data, isLoading])

  // Reset selection on filter change
  useEffect(() => { setSelectedKeys(new Set()) }, [search, fromDate, toDate, fromSites, toSites])

  const handleToggleSelect = (key: string | number) => {
    setSelectedKeys(prev => {
      const next = new Set(prev)
      if (next.has(key as number)) next.delete(key as number)
      else next.add(key as number)
      return next
    })
  }

  const handleToggleSelectAll = (selectAll: boolean) => {
    setSelectedKeys(selectAll ? new Set(data.map(r => r.id)) : new Set())
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const rows = selectedKeys.size > 0
        ? data.filter(r => selectedKeys.has(r.id))
        : data
      const ts = new Date().toISOString().slice(0, 10)
      await exportToExcel(rows, `transfers-${ts}.xlsx`)
    } finally {
      setIsExporting(false)
    }
  }

  const handleOpenTransfer = (row: TransferRecord) => {
    setSelectedTransfer(row)
    setSearchParams(prev => { const p = new URLSearchParams(prev); p.set('id', String(row.id)); return p }, { replace: true })
  }

  const handleCloseTransfer = () => {
    setSelectedTransfer(null)
    setSearchParams(prev => { const p = new URLSearchParams(prev); p.delete('id'); return p }, { replace: true })
  }

  const handleClearFilters = () => {
    setSearch('')
    setFromDate('')
    setToDate('')
    setFromSites([])
    setToSites([])
  }

  const hasFilters = search || fromDate || toDate || fromSites.length > 0 || toSites.length > 0

  const columns: Column<TransferRecord>[] = [
    {
      header: 'Reference Number',
      key: 'ref',
      width: '15%',
      render: row => (
        <button onClick={() => handleOpenTransfer(row)} className="cursor-pointer flex items-center gap-2 group text-left">
          <span className="text-[13px] font-black text-primary-text tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {row.refNumber}
          </span>
          <ReceiptText size={13} className="text-muted-text/40 group-hover:text-blue-500 transition-colors shrink-0" />
        </button>
      ),
    },
    {
      header: 'Total Items',
      key: 'items',
      width: '9%',
      className: 'text-center',
      render: row => (
        <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full bg-surface border border-border-main text-[12px] font-bold text-secondary-text">
          {row.totalItems}
        </span>
      ),
    },
    {
      header: 'From Site',
      key: 'from',
      width: '20%',
      render: row => (
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
          <span className="text-[12px] font-bold text-primary-text truncate">{row.sourceSite}</span>
        </div>
      ),
    },
    {
      header: 'To Site',
      key: 'to',
      width: '20%',
      render: row => (
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
          <span className="text-[12px] font-bold text-primary-text truncate">{row.destinationSite}</span>
        </div>
      ),
    },
    {
      header: 'Transfer Date & Time',
      key: 'date',
      width: '12%',
      render: row => (
        <div className="flex flex-col gap-0.5">
          <span className="text-[12px] font-bold text-primary-text">{fmtDate(row.billDate)}</span>
          <span className="text-[11px] text-muted-text">{fmtTime(row.billDate)}</span>
        </div>
      ),
    },
    {
      header: 'Total Amount (Inc. Tax)',
      key: 'amount',
      width: '15%',
      className: 'text-right',
      render: row => (
        <span className="text-[13px] font-black text-primary-text tracking-tight">
          {fmtCurrency(row.totalAmountIncTax)}
        </span>
      ),
    },
    {
      header: 'Status',
      key: 'status',
      width: '12%',
      render: row => {
        const s = row.status.toLowerCase()
        if (s.includes('transit'))
          return (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-black border border-blue-500/40 text-blue-600 dark:text-blue-400">
              {row.status}
            </span>
          )
        if (s.includes('completed') || s.includes('received') || s.includes('delivered'))
          return (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-black text-emerald-600 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              {row.status}
            </span>
          )
        if (s.includes('cancel'))
          return (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-black text-rose-500">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
              {row.status}
            </span>
          )
        return <span className="text-[11px] font-bold text-secondary-text">{row.status}</span>
      },
    },
  ]

  const exportLabel = selectedKeys.size > 0
    ? `Export ${selectedKeys.size} selected`
    : `Export${data.length > 0 ? ` all ${data.length}` : ''}`

  return (
    <div className="p-4 md:p-6 max-w-[1500px] mx-auto w-full flex flex-col h-full overflow-hidden">

      {/* Header */}
      <div className="flex items-start justify-between mb-5 gap-4">
        <PageHeader
          title="Transit"
          description="Track all stock transfers between sites"
        />
        <button
          onClick={handleExport}
          disabled={isExporting || data.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-[13px] font-black rounded-xl transition-colors cursor-pointer disabled:cursor-not-allowed shrink-0"
        >
          {isExporting
            ? <><Download size={14} className="animate-bounce" /> Exporting...</>
            : <><FileSpreadsheet size={14} /> {exportLabel}</>}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border-main rounded-2xl p-4 mb-4 flex flex-wrap items-end gap-3 shadow-sm">
        {/* Search */}
        <div className="relative group flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-text group-focus-within:text-secondary-text transition-colors" />
          <input
            type="text"
            placeholder="Search by ref..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-[38px] pl-9 pr-4 bg-surface border border-border-main rounded-lg text-[12px] font-bold text-primary-text outline-none focus:border-secondary-text focus:ring-2 focus:ring-accent/5 transition-all"
          />
        </div>

        {/* Date range */}
        <div className="min-w-[220px]">
          <p className="text-[10px] font-black text-muted-text uppercase tracking-widest mb-1">Bill Date</p>
          <DateRangePicker
            from={fromDate}
            to={toDate}
            onFromChange={setFromDate}
            onToChange={setToDate}
            placeholder="Select range"
          />
        </div>

        {/* From site */}
        <div className="min-w-[190px]">
          <p className="text-[10px] font-black text-muted-text uppercase tracking-widest mb-1">From Site</p>
          <SiteFilter selectedItems={fromSites} onSelectionChange={setFromSites} />
        </div>

        {/* To site */}
        <div className="min-w-[190px]">
          <p className="text-[10px] font-black text-muted-text uppercase tracking-widest mb-1">To Site</p>
          <SiteFilter selectedItems={toSites} onSelectionChange={setToSites} />
        </div>

        {hasFilters && (
          <button
            onClick={handleClearFilters}
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all h-[38px] mt-auto"
          >
            <RotateCw size={12} /> Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <InfiniteScrollTable<TransferRecord>
          columns={columns}
          data={data}
          isLoading={isLoading}
          hasMore={hasMore}
          onLoadMore={() => loadData(false)}
          keyExtractor={row => row.id}
          totalElements={totalElements}
          itemName="transfers"
          selectable
          selectedKeys={selectedKeys as Set<string | number>}
          onToggleSelect={handleToggleSelect}
          onToggleSelectAll={handleToggleSelectAll}
          minWidth="820px"
          onClearFilters={hasFilters ? handleClearFilters : undefined}
        />
      </div>

      {selectedTransfer && (
        <TransitDetailModal
          transfer={selectedTransfer}
          onClose={handleCloseTransfer}
          onStatusChange={() => loadData(true)}
        />
      )}
    </div>
  )
}
