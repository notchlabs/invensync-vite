import { useState, useEffect } from 'react'
import { X, ExternalLink, Loader2, AlertTriangle, Check } from 'lucide-react'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import toast from 'react-hot-toast'
import { TransferService, type TransferRecord, type TransferItem } from '../../services/transferService'
import { formatIndianCurrency } from '../../utils/numberFormat'

const emailToName = (email: string): string =>
  email.split('@')[0].split('.').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

function statusCls(status: string) {
  const s = status.toLowerCase()
  if (s.includes('transit'))   return 'bg-amber-500/15 text-amber-500 border-amber-500/30'
  if (s.includes('received') || s.includes('completed')) return 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
  if (s.includes('cancel'))    return 'bg-rose-500/15 text-rose-500 border-rose-500/30'
  return 'bg-white/10 text-white/60 border-white/20'
}

// ── component ─────────────────────────────────────────────────────────────────

interface Props {
  transfer: TransferRecord
  onClose: () => void
  onStatusChange: () => void   // refresh parent list
}

export function TransitDetailModal({ transfer, onClose, onStatusChange }: Props) {
  const [items, setItems]         = useState<TransferItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [confirming, setConfirming] = useState(false)   // reject confirm state
  const [isSaving, setIsSaving]   = useState(false)

  useEffect(() => {
    setIsLoading(true)
    TransferService.fetchTransferItems(transfer.id)
      .then(res => setItems(res.data ?? []))
      .catch((err: unknown) => {
        if (!navigator.onLine) {
        } else if (
          (err instanceof Response && err.status === 502) ||
          (err && typeof err === 'object' && 'status' in err && (err as { status: number }).status === 502) ||
          (err instanceof Error && err.message.includes('502'))
        ) {}
      })
      .finally(() => setIsLoading(false))
  }, [transfer.id])

  // ── totals ────────────────────────────────────────────────────────────────
  const totalExcl  = items.reduce((s, i) => s + i.qty * i.pricePerUnit, 0)
  const totalTax   = items.reduce((s, i) => s + i.qty * i.pricePerUnit * (i.cgstInPerc + i.sgstInPerc) / 100, 0)
  const grandTotal = totalExcl + totalTax

  // ── actions ───────────────────────────────────────────────────────────────
  const handleReject = async () => {
    setIsSaving(true)
    try {
      await TransferService.rejectTransfer(transfer.id)
      toast.success('Transfer rejected')
      onStatusChange()
      onClose()
    } catch {
      toast.error('Failed to reject transfer')
    } finally {
      setIsSaving(false)
      setConfirming(false)
    }
  }

  const handleMarkReceived = async () => {
    setIsSaving(true)
    try {
      await TransferService.markAsReceived(transfer.id)
      toast.success('Transfer marked as received')
      onStatusChange()
      onClose()
    } catch {
      toast.error('Failed to update transfer')
    } finally {
      setIsSaving(false)
    }
  }

  const isActionable = transfer.status.toLowerCase().includes('transit')

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-card border border-border-main w-full max-w-[740px] max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

        {/* ── Dark header ──────────────────────────────────────────── */}
        <div className="bg-[#111] px-5 py-4 shrink-0">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-black text-white uppercase tracking-widest">Transit Details</h2>
            <div className="flex items-center gap-2">
              {transfer.billUrl && (
                <a
                  href={transfer.billUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/10 text-white text-[11px] font-bold rounded-lg transition-colors"
                >
                  <ExternalLink size={11} /> View PDF
                </a>
              )}
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-2.5">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Ref Number</span>
              <span className="text-[13px] font-bold text-white">{transfer.refNumber}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Status</span>
              <span className={`self-start px-2.5 py-0.5 rounded-full text-[11px] font-black border ${statusCls(transfer.status)}`}>
                {transfer.status}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Source Site</span>
              <span className="text-[13px] font-bold text-white">{transfer.sourceSite}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Destination Site</span>
              <span className="text-[13px] font-bold text-white">{transfer.destinationSite}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Bill Date</span>
              <span className="text-[13px] font-bold text-white">{fmtDate(transfer.billDate)}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Total Items</span>
              <span className="text-[13px] font-bold text-white">{transfer.totalItems}</span>
            </div>
            {transfer.createdBy && (
              <div className="flex flex-col gap-0.5 col-span-2">
                <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Created By</span>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-white/10 border border-white/15 flex items-center justify-center shrink-0 text-[10px] font-black text-white/70">
                    {emailToName(transfer.createdBy).split(' ').map(w => w[0]).join('').slice(0, 2)}
                  </span>
                  <span className="text-[13px] font-bold text-white">{emailToName(transfer.createdBy)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Items table ──────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {isLoading ? (
            <table className="w-full text-left table-fixed" style={{ minWidth: 600 }}>
              <colgroup>
                <col className="w-10" />
                <col />
                <col className="w-[150px]" />
                <col className="w-[90px]" />
                <col className="w-[90px]" />
                <col className="w-[100px]" />
              </colgroup>
              <thead className="bg-table-head border-b border-border-main/60">
                <tr>
                  {['No.', 'Product Name', 'Bill Details', 'Qty (Unit)', 'Price/Unit', 'Total'].map((h, i) => (
                    <th key={h} className={`px-3 py-2.5 text-[10px] font-black text-muted-text uppercase tracking-widest ${i >= 3 ? 'text-right' : ''}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-main/30">
                {(['sk-1', 'sk-2', 'sk-3', 'sk-4']).map((k) => (
                  <tr key={k}>
                    <td className="px-3 py-3"><Skeleton width={16} height={14} borderRadius={4} /></td>
                    <td className="px-3 py-3"><Skeleton width="80%" height={14} borderRadius={4} /></td>
                    <td className="px-3 py-3">
                      <Skeleton width="70%" height={12} borderRadius={4} className="mb-1" />
                      <Skeleton width="50%" height={10} borderRadius={4} />
                    </td>
                    <td className="px-3 py-3 text-right"><Skeleton width={48} height={14} borderRadius={4} /></td>
                    <td className="px-3 py-3 text-right"><Skeleton width={56} height={14} borderRadius={4} /></td>
                    <td className="px-3 py-3 text-right"><Skeleton width={56} height={14} borderRadius={4} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left table-fixed" style={{ minWidth: 600 }}>
              <colgroup>
                <col className="w-10" />
                <col />
                <col className="w-[150px]" />
                <col className="w-[90px]" />
                <col className="w-[90px]" />
                <col className="w-[100px]" />
              </colgroup>
              <thead className="bg-table-head sticky top-0 z-10 border-b border-border-main/60">
                <tr>
                  {['No.', 'Product Name', 'Bill Details', 'Qty (Unit)', 'Price/Unit', 'Total'].map((h, i) => (
                    <th
                      key={h}
                      className={`px-3 py-2.5 text-[10px] font-black text-muted-text uppercase tracking-widest ${i >= 3 ? 'text-right' : ''}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-main/30">
                {items.map((item, idx) => {
                  const taxRate  = (item.cgstInPerc + item.sgstInPerc) / 100
                  const lineNet  = item.qty * item.pricePerUnit
                  const lineGross = lineNet * (1 + taxRate)
                  return (
                    <tr key={item.id} className="hover:bg-surface/50 transition-colors">
                      <td className="px-3 py-3 text-[11px] font-bold text-muted-text">{idx + 1}</td>
                      <td className="px-3 py-3">
                        <p className="text-[12px] font-bold text-primary-text leading-tight">{item.productName}</p>
                      </td>
                      <td className="px-3 py-3">
                        <a
                          href={item.billUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] font-bold text-blue-500 hover:underline leading-tight block truncate"
                        >
                          {item.refNumber}
                        </a>
                        <p className="text-[10px] text-muted-text truncate">{item.supplierName}</p>
                      </td>
                      <td className="px-3 py-3 text-right text-[12px] font-bold text-primary-text">
                        {item.qty} {item.unit}
                      </td>
                      <td className="px-3 py-3 text-right text-[12px] font-bold text-primary-text">
                        {formatIndianCurrency(item.pricePerUnit)}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <p className="text-[12px] font-black text-primary-text">{formatIndianCurrency(lineGross)}</p>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Totals ───────────────────────────────────────────────── */}
        {!isLoading && items.length > 0 && (
          <div className="shrink-0 border-t border-border-main/50 px-5 py-3 flex flex-col gap-1.5 bg-surface/30">
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-muted-text font-medium">Total Amount (Excl. Tax)</span>
              <span className="font-bold text-primary-text">{formatIndianCurrency(totalExcl)}</span>
            </div>
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-muted-text font-medium">Total Tax</span>
              <span className="font-bold text-primary-text">{formatIndianCurrency(totalTax)}</span>
            </div>
            <div className="flex items-center justify-between text-[14px] pt-1 border-t border-border-main/40 mt-0.5">
              <span className="font-black text-primary-text">Grand Total (Incl. Tax)</span>
              <span className="font-black text-primary-text">{formatIndianCurrency(grandTotal)}</span>
            </div>
          </div>
        )}

        {/* ── Action bar ───────────────────────────────────────────── */}
        {isActionable && (
          <div className="shrink-0 border-t border-border-main px-5 py-3 flex items-center justify-end gap-3">
            {confirming ? (
              <>
                <span className="flex items-center gap-1.5 text-[12px] font-bold text-amber-500 mr-auto">
                  <AlertTriangle size={14} /> Confirm rejection?
                </span>
                <button
                  onClick={() => setConfirming(false)}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-lg border border-border-main text-[12px] font-bold text-secondary-text hover:bg-surface transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[12px] font-black transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSaving ? <Loader2 size={13} className="animate-spin" /> : null}
                  Yes, Reject
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setConfirming(true)}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-500 text-[12px] font-black transition-colors cursor-pointer disabled:opacity-50"
                >
                  Reject Transfer
                </button>
                <button
                  onClick={handleMarkReceived}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-[12px] font-black hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                  Mark as Received
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
