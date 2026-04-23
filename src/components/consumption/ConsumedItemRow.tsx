import { Trash2, Clock } from 'lucide-react';
import type { BucketItem } from '../../services/consumptionService';

const fmtTime = (iso?: string) => {
  if (!iso) return null
  // Server sends IST time incorrectly tagged as +00:00, so parse directly
  const match = iso.match(/T(\d{2}):(\d{2})/)
  if (!match) return null
  let h = parseInt(match[1])
  const m = match[2]
  const ampm = h >= 12 ? 'PM' : 'AM'
  h = h % 12 || 12
  return `${h}:${m} ${ampm}`
}

const fmtName = (email?: string) => {
  if (!email) return 'Unknown'
  const local = email.split('@')[0]
  const [first, last] = local.split('.')
  const cap = (s?: string) => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : ''
  return last ? `${cap(first)} ${cap(last)}` : cap(first)
}

const FIELDS: { label: string; field: keyof BucketItem }[] = [
  { label: 'Cash',    field: 'cash'    },
  { label: 'UPI',     field: 'upi'     },
  { label: 'No Bill', field: 'noBill'  },
  { label: 'Loyalty', field: 'loyalty' },
]

interface ConsumedItemRowProps {
  item: BucketItem;
  idx: number;
  isConcluded: boolean;
  updateItem: (index: number, field: keyof BucketItem, value: number) => void;
  handleRevertItem: (cuBillId: number) => void;
}

export const ConsumedItemRow = ({
  item,
  idx,
  isConcluded,
  updateItem,
  handleRevertItem,
}: ConsumedItemRowProps) => {
  const isAlt = idx % 2 === 1;
  const time  = fmtTime(item.consumedDate)
  const isWbc = item.vendorNames?.toLowerCase().includes('wild bean')

  const baseRow = `border-b border-border-main/50 last:border-0 transition-colors ${isAlt ? 'bg-black/[0.01] dark:bg-white/[0.01]' : 'bg-transparent'} hover:bg-black/[0.02] dark:hover:bg-white/[0.02]`

  const inputs = (
    <div className="grid grid-cols-4 gap-2">
      {FIELDS.map(({ label, field }) => (
        <div key={field} className="flex flex-col gap-1 min-w-0">
          <label className="text-[10px] text-muted-text font-bold uppercase tracking-wider font-display">{label}</label>
          <input
            type="number"
            disabled={isConcluded}
            value={item[field] as number}
            onFocus={(e) => e.target.select()}
            onChange={(e) => updateItem(idx, field, Number(e.target.value))}
            className="w-full h-9 lg:h-8 px-2 text-[13px] font-bold text-primary-text bg-surface border border-border-main rounded-lg outline-none focus:border-primary-text focus:bg-card focus:ring-2 focus:ring-primary-text/5 transition-all font-display disabled:opacity-50"
          />
        </div>
      ))}
    </div>
  )

  return (
    <div className={baseRow}>

      {/* ── Mobile ──────────────────────────────────────── */}
      <div className="lg:hidden p-3 flex flex-col gap-3">
        {/* top row: image+amount + info + trash */}
        <div className="flex items-center gap-3">
          {/* Image stacked with amount below — fixed width matches image */}
          <div className="w-11 shrink-0 flex flex-col items-center gap-1">
            <div className="w-11 h-11 rounded-xl border border-border-main bg-surface flex items-center justify-center overflow-hidden">
              {item.imageUrl
                ? <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-contain" />
                : <span className="text-[12px] font-black text-muted-text/50">{item.productName.charAt(0)}</span>
              }
            </div>
            <span className="w-full text-center text-[10px] font-black border border-[#065f46] text-[#065f46] bg-green-50/40 dark:bg-green-900/20 px-1 py-0.5 rounded-md truncate">
              ₹{item.price.toFixed(0)}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-text/60 leading-none mb-0.5 truncate">
              {fmtName(item.consumedByEmail)}
            </p>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[14px] font-bold text-primary-text font-display leading-snug">{item.productName}</span>
              {isWbc && <span className="text-[8px] font-black tracking-wider bg-black text-white px-1.5 py-0.5 rounded uppercase">WBC</span>}
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {time && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-text">
                  <Clock size={11} className="text-muted-text/50" />{time}
                </span>
              )}
              <span className="text-[11px] font-semibold text-muted-text">{item.qty} {item.unit}</span>
            </div>
          </div>

          {!isConcluded && (
            <button
              onClick={() => handleRevertItem(item.cuBillId)}
              className="p-1.5 text-muted-text/40 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors shrink-0 mt-0.5"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>

        {inputs}
      </div>

      {/* ── Desktop ─────────────────────────────────────── */}
      <div className="hidden lg:grid lg:grid-cols-[auto_minmax(160px,1fr)_auto_auto_420px] lg:items-center">

        {/* Col 1: trash + image */}
        <div className="flex items-center gap-3 px-3 py-3">
          <div className="w-6 flex justify-center shrink-0">
            {!isConcluded && (
              <button
                onClick={() => handleRevertItem(item.cuBillId)}
                className="p-1.5 text-muted-text/40 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
          <div className="w-10 h-10 shrink-0 rounded-xl border border-border-main bg-surface flex items-center justify-center overflow-hidden">
            {item.imageUrl
              ? <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-contain" />
              : <span className="text-[11px] font-black text-muted-text/50">{item.productName.charAt(0)}</span>
            }
          </div>
        </div>

        {/* Col 2: name label + product + WBC */}
        <div className="flex flex-col min-w-0 px-2 py-3">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-text/60 leading-none mb-1 whitespace-nowrap truncate">
            {fmtName(item.consumedByEmail)}
          </span>
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[13px] font-bold text-primary-text font-display leading-tight truncate">{item.productName}</span>
            {isWbc && <span className="shrink-0 text-[8px] font-black tracking-wider bg-black text-white px-1.5 py-0.5 rounded uppercase">WBC</span>}
          </div>
        </div>

        {/* Col 3: time */}
        <div className="px-4">
          {time && (
            <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-muted-text whitespace-nowrap">
              <Clock size={12} className="text-muted-text/50" />{time}
            </span>
          )}
        </div>

        {/* Col 4: qty + amount */}
        <div className="flex items-center gap-3 px-4">
          <span className="text-[12px] font-semibold text-muted-text whitespace-nowrap">{item.qty} {item.unit}</span>
          <span className="text-[13px] font-black border border-[#065f46] text-[#065f46] bg-green-50/40 dark:bg-green-900/20 px-3 py-1.5 rounded-lg whitespace-nowrap">
            ₹{item.price.toFixed(2)}
          </span>
        </div>

        {/* Col 5: inputs with left divider */}
        <div className="border-l border-border-main ml-2 pl-4 pr-3 py-2.5">
          {inputs}
        </div>
      </div>

    </div>
  );
};
