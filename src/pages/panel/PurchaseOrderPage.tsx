import { useState, useRef, useCallback } from 'react'
import {
  Sparkles, Settings2, ImageUp, ChevronDown, Download, PlusCircle, ArrowLeft, AlertCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'
import {
  PurchaseOrderService,
  type ExtractedProduct,
  type GeneratePOResponse,
  type POOrderItem,
  type ExtractResponse,
} from '../../services/purchaseOrderService'
import type { ApiResponse } from '../../types/api'
import { VendorFilter } from '../../components/filters/VendorFilter'
import type { Vendor } from '../../types/inventory'
import { FileChip } from '../../components/purchase-order/FileChip'
import { ResultSkeleton } from '../../components/purchase-order/ResultSkeleton'
import { OrderRow } from '../../components/purchase-order/OrderRow'


function exportCSV(orders: POOrderItem[]) {
  const header = ['#', 'Ref No', 'Product', 'QTY', 'Packets', 'Lot Size']
  const rows = orders.map((o, i) =>
    [i + 1, o.refNo, `"${o.name}"`, o.qtyToOrder, o.packets, o.lotSize].join(',')
  )
  const csv = [header.join(','), ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `purchase-order-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
}




/* ── Extraction status box (shown inside dropzone during generation) ── */
function ExtractionStatusBox({
  fileCount, done, found,
}: Readonly<{ fileCount: number; done: boolean; found: number }>) {
  const borderCls = done ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-violet-500/30 bg-violet-500/10'
  return (
    <div className={`border-2 border-dashed rounded-xl h-[130px] flex flex-col items-center justify-center gap-2 transition-all select-none ${borderCls}`}>
      {done ? (
        <>
          <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <p className="text-[13px] font-bold text-emerald-700">Extraction done</p>
          <p className="text-[11px] text-emerald-600 font-semibold">
            Found {found} product{found !== 1 ? 's' : ''}
          </p>
        </>
      ) : (
        <>
          <svg className="animate-spin text-violet-500" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          <p className="text-[13px] font-bold text-violet-700">
            Extracting {fileCount} file{fileCount !== 1 ? 's' : ''}…
          </p>
          <p className="text-[11px] text-violet-500 font-medium">Reading supplier stock list</p>
        </>
      )}
    </div>
  )
}

/* ── Interactive file dropzone ───────────────────────────── */
function FileDropZone({
  files, isDragOver, fileInputRef, onAddFiles, onDragOver, onDragLeave,
}: Readonly<{
  files: File[]
  isDragOver: boolean
  fileInputRef: React.RefObject<HTMLInputElement | null>
  onAddFiles: (list: FileList | null) => void
  onDragOver: () => void
  onDragLeave: () => void
}>) {
  const borderCls = isDragOver
    ? 'border-violet-500/30 bg-violet-500/10'
    : files.length > 0
      ? 'border-emerald-500/30 bg-emerald-500/10'
      : 'border-border-main hover:border-secondary-text bg-surface/50'

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    onDragLeave()
    onAddFiles(e.dataTransfer.files)
  }

  const trigger = () => fileInputRef.current?.click()

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={trigger}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); trigger() } }}
      onDragOver={e => { e.preventDefault(); onDragOver() }}
      onDragLeave={onDragLeave}
      onDrop={handleDrop}
      className={`relative border-2 border-dashed rounded-xl h-[130px] flex flex-col items-center justify-center gap-2 cursor-pointer transition-all select-none ${borderCls}`}
    >
      {files.length > 0 ? (
        <>
          <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <p className="text-[13px] font-bold text-emerald-700">
            {files.length} file{files.length !== 1 ? 's' : ''} selected
          </p>
          <p className="text-[11px] text-emerald-600 font-medium">Click to add more</p>
        </>
      ) : (
        <>
          <ImageUp size={24} className="text-muted-text" />
          <p className="text-[13px] font-bold text-secondary-text">
            {isDragOver ? 'Drop files here' : 'Click or drag files here'}
          </p>
          <p className="text-[11px] text-muted-text font-medium">
            Images or PDFs of your supplier's stock list
          </p>
        </>
      )}
    </div>
  )
}

/* ── Page ───────────────────────────────────────────────── */
type Phase = 'config' | 'generating' | 'result'

export default function PurchaseOrderPage() {
  const [vendors, setVendors]           = useState<Vendor[]>([])
  const [minOrderValue, setMinOrderValue] = useState('')
  const [files, setFiles]               = useState<File[]>([])
  const [stockOpen, setStockOpen]       = useState(true)
  const [phase, setPhase]               = useState<Phase>('config')
  const [btnLabel, setBtnLabel]         = useState('')
  const [result, setResult]             = useState<GeneratePOResponse | null>(null)
  const [extractedCount, setExtractedCount] = useState(0)
  const [isDragOver, setIsDragOver]     = useState(false)
  const [extractionResult, setExtractionResult] = useState<{ found: number } | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const addFiles = useCallback((incoming: FileList | null) => {
    if (!incoming) return
    const arr = Array.from(incoming)
    setFiles(prev => {
      const existing = new Set(prev.map(f => f.name + f.size))
      const fresh = arr.filter(f => !existing.has(f.name + f.size))
      return [...prev, ...fresh]
    })
  }, [])

  const removeFile = (idx: number) => setFiles(prev => prev.filter((_, i) => i !== idx))

  const canGenerate = vendors.length > 0 && minOrderValue.trim() !== '' && Number(minOrderValue) > 0

  const handleGenerate = async () => {
    if (!canGenerate) return
    setPhase('generating')

    try {
      let products: ExtractedProduct[] = []
      let type: 'INVOICE_BILL' | 'STOCK_REPORT' = 'STOCK_REPORT'

      if (files.length > 0) {
        type = 'INVOICE_BILL'
        setBtnLabel('Extracting stock list…')

        const results = await Promise.allSettled(
          files.map(f => PurchaseOrderService.extractStockList(f))
        )
        const failed = results.filter(r => r.status === 'rejected').length
        if (failed > 0) toast.error(`${failed} file(s) failed to extract — continuing with the rest`)

        products = results
          .filter((r): r is PromiseFulfilledResult<ApiResponse<ExtractResponse>> => r.status === 'fulfilled')
          .flatMap(r => r.value?.data?.products ?? [])

        setExtractedCount(products.length)
        setExtractionResult({ found: products.length })
        // Hold the "Extraction done · Found X products" state visible briefly
        await new Promise(resolve => setTimeout(resolve, 1800))
      }

      setBtnLabel('Generating purchase order…')
      const res = await PurchaseOrderService.generatePO({
        supplierIds: vendors.map(v => v.id),
        minOrderValue: Number(minOrderValue),
        products,
        type,
      })

      setResult(res.data)
      setPhase('result')
    } catch (e: unknown) {
      console.error(e)
      const error = e as { message?: string }
      toast.error(error.message ?? 'Failed to generate purchase order')
      setPhase('config')
    } finally {
      setBtnLabel('')
    }
  }

  const handleReset = () => {
    setPhase('config')
    setResult(null)
    setExtractedCount(0)
    setExtractionResult(null)
  }

  return (
    <div className="p-4 md:p-6 max-w-[1500px] mx-auto w-full flex flex-col gap-5 overflow-y-auto h-full">

      {/* ── Header ───────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-[24px] font-bold text-primary-text tracking-tight leading-none">
              Purchase Order
            </h1>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 text-[10px] font-black uppercase tracking-wide">
              <Sparkles size={9} />
              AI Powered
            </span>
          </div>
          <p className="text-[13px] font-medium text-secondary-text">
            Select vendors, set your budget, and let AI generate optimised orders.
          </p>
        </div>
        {phase === 'result' && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-[12px] font-bold text-secondary-text hover:text-primary-text transition-colors cursor-pointer shrink-0"
          >
            <ArrowLeft size={13} />
            New Order
          </button>
        )}
      </div>

      {/* ── Config section ───────────────────────────────── */}
      {phase !== 'result' && (
        <>
          {/* Order Configuration */}
          <div className="bg-card border border-border-main rounded-2xl">
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border-main">
              <div className="w-7 h-7 rounded-lg bg-surface flex items-center justify-center">
                <Settings2 size={14} className="text-secondary-text" />
              </div>
              <div>
                <p className="text-[13px] font-black text-primary-text">Order Configuration</p>
                <p className="text-[11px] text-muted-text font-medium">Choose suppliers and set minimum order value</p>
              </div>
            </div>

            <div className="p-5 grid grid-cols-1 sm:grid-cols-[1fr_200px] gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-muted-text uppercase tracking-wider">
                  Select Vendor(s) <span className="text-red-500">*</span>
                </label>
                <VendorFilter selectedItems={vendors} onSelectionChange={setVendors} className="w-full" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-muted-text uppercase tracking-wider">
                  Min. Order Value <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] font-bold text-muted-text">₹</span>
                  <input
                    type="number"
                    placeholder="40000"
                    value={minOrderValue}
                    onChange={e => setMinOrderValue(e.target.value)}
                    className="w-full h-[38px] pl-7 pr-3 bg-surface border border-border-main rounded-lg text-[13px] font-bold text-primary-text outline-none focus:border-secondary-text focus:ring-2 focus:ring-accent/5 transition-all placeholder:font-normal placeholder:text-muted-text"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Stock Availability Data */}
          <div className="bg-card border border-border-main rounded-2xl overflow-hidden">
            <button
              onClick={() => setStockOpen(o => !o)}
              className="w-full flex items-center gap-2.5 px-5 py-4 hover:bg-surface/50 transition-colors cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-surface flex items-center justify-center">
                <ImageUp size={14} className="text-secondary-text" />
              </div>
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <p className="text-[13px] font-black text-primary-text">Stock Availability Data</p>
                  <span className="text-[9px] font-black uppercase tracking-wider text-muted-text border border-border-main rounded-md px-1.5 py-0.5">
                    Optional
                  </span>
                </div>
                <p className="text-[11px] text-muted-text font-medium">
                  Upload screenshots or files from your vendor's stock list for smarter suggestions
                </p>
              </div>
              <ChevronDown
                size={15}
                className={`text-muted-text transition-transform shrink-0 ${stockOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {stockOpen && (
              <div className="px-5 pb-5 flex flex-col gap-3">
                {phase === 'generating' && files.length > 0 ? (
                  <ExtractionStatusBox
                    fileCount={files.length}
                    done={extractionResult !== null}
                    found={extractionResult?.found ?? 0}
                  />
                ) : (
                  <FileDropZone
                    files={files}
                    isDragOver={isDragOver}
                    fileInputRef={fileInputRef}
                    onAddFiles={addFiles}
                    onDragOver={() => setIsDragOver(true)}
                    onDragLeave={() => setIsDragOver(false)}
                  />
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={e => addFiles(e.target.files)}
                />

                {/* File chips */}
                {files.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {files.map((f, i) => (
                      <FileChip key={`${f.name}-${f.size}`} file={f} onRemove={() => removeFile(i)} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Validation hint */}
          {!canGenerate && (vendors.length === 0 || !minOrderValue) && (
            <div className="flex items-center gap-2 text-[12px] text-amber-600 font-medium px-1">
              <AlertCircle size={13} />
              {vendors.length === 0 ? 'Select at least one vendor to continue.' : 'Enter a minimum order value to continue.'}
            </div>
          )}

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={!canGenerate || phase === 'generating'}
            className={[
              'w-full h-[48px] rounded-xl text-[14px] font-black tracking-tight flex items-center justify-center gap-2.5 transition-all cursor-pointer',
              canGenerate && phase !== 'generating'
                ? 'bg-secondary hover:opacity-90 active:scale-[0.99]'
                : 'bg-surface border border-border-main text-muted-text cursor-not-allowed',
            ].join(' ')}
          >
            {phase === 'generating' ? (
              <>
                <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                {btnLabel || 'Processing…'}
              </>
            ) : (
              <>
                <Sparkles size={15} />
                Generate Purchase Order
              </>
            )}
          </button>
          <p className="text-[11px] text-muted-text font-medium text-center -mt-3">
            Will use your existing inventory data, this may take 2 to 3 mins
          </p>
        </>
      )}

      {/* ── Result section ───────────────────────────────── */}
      {phase === 'generating' && <ResultSkeleton />}

      {phase === 'result' && result && (
        <div className="flex flex-col gap-5">
          {/* Extracted count badge */}
          {extractedCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-violet-500/10 border border-violet-500/20 rounded-xl text-[12px] font-semibold text-violet-700">
              <Sparkles size={13} />
              Using {extractedCount} extracted products + your inventory
            </div>
          )}

          {/* AI Strategy Analysis */}
          {result.analysis && (
            <div className="bg-card border border-border-main rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-violet-500/20 flex items-center justify-center">
                  <Sparkles size={13} className="text-violet-600" />
                </div>
                <p className="text-[13px] font-black text-primary-text">AI Strategy Analysis</p>
              </div>
              <p className="text-[13px] text-secondary-text font-medium leading-relaxed">
                {result.analysis}
              </p>
            </div>
          )}

          {/* Recommended Orders table */}
          <div className="bg-card border border-border-main rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border-main">
              <div>
                <p className="text-[13px] font-black text-primary-text">Recommended Orders</p>
                <p className="text-[11px] text-muted-text font-medium mt-0.5">
                  {result.recommended_changes.length} item{result.recommended_changes.length !== 1 ? 's' : ''}
                  {extractedCount > 0 ? ` · ${extractedCount} uploaded` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => exportCSV(result.recommended_changes)}
                  className="flex items-center gap-1.5 px-3 h-8 rounded-lg border border-border-main bg-surface text-[11px] font-bold text-secondary-text hover:text-primary-text hover:bg-card transition-colors cursor-pointer"
                >
                  <Download size={12} />
                  Excel
                </button>
                <button
                  onClick={() => toast.success('Purchase order created!')}
                  className="flex items-center gap-1.5 px-3 h-8 rounded-lg bg-primary-text text-card text-[11px] font-bold hover:opacity-90 transition-all cursor-pointer"
                >
                  <PlusCircle size={12} />
                  Create PO
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full" style={{ minWidth: '580px' }}>
                <thead>
                  <tr className="border-b border-border-main bg-surface">
                    <th className="px-4 py-3 text-left text-[10px] font-black text-muted-text uppercase tracking-wider w-10">#</th>
                    <th className="px-4 py-3 text-left text-[10px] font-black text-muted-text uppercase tracking-wider">Product</th>
                    <th className="px-4 py-3 text-center text-[10px] font-black text-muted-text uppercase tracking-wider w-20">QTY</th>
                    <th className="px-4 py-3 text-center text-[10px] font-black text-muted-text uppercase tracking-wider w-20">Packets</th>
                    <th className="px-4 py-3 text-center text-[10px] font-black text-muted-text uppercase tracking-wider w-24">Lot Size</th>
                  </tr>
                </thead>
                <tbody>
                  {result.recommended_changes.map((o, i) => (
                    <OrderRow key={`${o.refNo}-${i}`} order={o} index={i} />
                  ))}
                </tbody>
              </table>

              {result.recommended_changes.length === 0 && (
                <p className="text-[13px] text-muted-text font-medium text-center py-12">
                  No orders recommended
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
