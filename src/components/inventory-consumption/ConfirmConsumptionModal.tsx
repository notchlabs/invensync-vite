// ── ConfirmConsumptionModal ───────────────────────────────────────────────────

import { useState } from "react"
import { motion } from "framer-motion"
import { X } from "lucide-react"
import type { CartEntry, ItemSettings } from "./types"
import { formatIndianCurrency } from "../../utils/numberFormat"
import { ProductImage } from "./ProductImage"

export function ConfirmConsumptionModal({
    cart, onClose, onRemove, onConfirm,
  }: {
    cart: Map<number, CartEntry>
    onClose: () => void
    onRemove: (id: number) => void
    onConfirm: (settings: Map<number, ItemSettings>) => void
  }) {
    const entries = Array.from(cart.values())
  
    // Per-item settings — initialised from cart
    const [settings, setSettings] = useState<Map<number, ItemSettings>>(() => {
      const m = new Map<number, ItemSettings>()
      entries.forEach(e => m.set(e.productId, {
        amount: String(e.price > 0 ? e.price : 0),
        paymentMode: 'UPI',
        noBill: false,
        loyalty: false,
      }))
      return m
    })
  
    const updateSetting = <K extends keyof ItemSettings>(id: number, key: K, value: ItemSettings[K]) => {
      setSettings(prev => {
        const next = new Map(prev)
        const cur  = next.get(id)
        if (cur) next.set(id, { ...cur, [key]: value })
        return next
      })
    }
  
    const overallTotal = entries.reduce((s, e) => {
      const amt = parseFloat(settings.get(e.productId)?.amount ?? '0') || 0
      return s + amt
    }, 0)
  
    const noBillTotal = entries.reduce((s, e) => {
      const cfg = settings.get(e.productId)
      if (!cfg?.noBill) return s
      return s + (parseFloat(cfg.amount) || 0)
    }, 0)
  
    return (
      <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2 }}
          className="bg-card w-full max-w-[560px] rounded-3xl shadow-2xl flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
            <h2 className="text-[20px] font-black text-primary-text">Confirm Consumption</h2>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-surface text-muted-text hover:text-primary-text transition-colors cursor-pointer">
              <X size={18} />
            </button>
          </div>
  
          {/* Item list */}
          <div className="flex-1 overflow-y-auto px-6 flex flex-col gap-3 pb-3">
            {entries.map(entry => {
              const cfg = settings.get(entry.productId)
              if (!cfg) return null
              return (
                <div key={entry.productId} className="bg-surface rounded-2xl p-4 flex flex-col gap-3 border border-border-main/60">
                  {/* Row 1: image + name + qty + remove */}
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-card border border-border-main/60 flex items-center justify-center shrink-0">
                      <ProductImage src={entry.imageUrl} name={entry.productName} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-black text-primary-text uppercase tracking-tight leading-snug line-clamp-1">
                        {entry.productName}
                      </p>
                      <p className="text-[11px] text-muted-text font-medium capitalize">{entry.source}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[12px] font-bold text-primary-text">Qty: {entry.qty}</span>
                      <button
                        onClick={() => onRemove(entry.productId)}
                        className="p-1 text-muted-text hover:text-rose-500 transition-colors cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
  
                  {/* Row 2: amount + payment mode + checkboxes */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Amount input */}
                    <input
                      type="number"
                      value={cfg.amount}
                      onChange={e => updateSetting(entry.productId, 'amount', e.target.value)}
                      className="w-24 h-10 px-3 bg-card border border-border-main rounded-xl text-[14px] font-bold text-primary-text outline-none focus:border-secondary-text focus:ring-2 focus:ring-accent/5 transition-all"
                    />
  
                    {/* UPI */}
                    <button
                      onClick={() => updateSetting(entry.productId, 'paymentMode', 'UPI')}
                      className={`h-10 px-4 rounded-xl text-[13px] font-black transition-all cursor-pointer ${
                        cfg.paymentMode === 'UPI'
                          ? 'bg-primary-text text-card'
                          : 'bg-card border border-border-main text-primary-text hover:bg-surface'
                      }`}
                    >
                      UPI
                    </button>
  
                    {/* Cash */}
                    <button
                      onClick={() => updateSetting(entry.productId, 'paymentMode', 'Cash')}
                      className={`h-10 px-4 rounded-xl text-[13px] font-black transition-all cursor-pointer ${
                        cfg.paymentMode === 'Cash'
                          ? 'bg-primary-text text-card'
                          : 'bg-card border border-border-main text-primary-text hover:bg-surface'
                      }`}
                    >
                      Cash
                    </button>
  
                    {/* No Bill */}
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={cfg.noBill}
                        onChange={e => updateSetting(entry.productId, 'noBill', e.target.checked)}
                        className="w-4 h-4 rounded border-border-main cursor-pointer accent-primary-text"
                      />
                      <span className="text-[13px] font-medium text-primary-text">No Bill</span>
                    </label>
  
                    {/* Loyalty */}
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={cfg.loyalty}
                        onChange={e => updateSetting(entry.productId, 'loyalty', e.target.checked)}
                        className="w-4 h-4 rounded border-border-main cursor-pointer accent-primary-text"
                      />
                      <span className="text-[13px] font-medium text-primary-text">loyalty</span>
                    </label>
                  </div>
                </div>
              )
            })}
          </div>
  
          {/* Totals */}
          <div className="px-6 py-3 border-t border-border-main/60 flex items-center justify-between shrink-0">
            <span className="text-[13px] font-medium text-secondary-text">
              Total Items: <span className="font-black text-primary-text">{entries.length}</span>
            </span>
            <div className="text-right flex flex-col gap-0.5">
              <span className="text-[12px] font-medium text-secondary-text">
                No Bill Total: <span className="font-black text-rose-500">{formatIndianCurrency(noBillTotal)}</span>
              </span>
              <span className="text-[13px] font-medium text-secondary-text">
                Overall Total: <span className="font-black text-primary-text">{formatIndianCurrency(overallTotal)}</span>
              </span>
            </div>
          </div>
  
          {/* Footer actions */}
          <div className="px-6 pb-6 pt-2 grid grid-cols-2 gap-3 shrink-0">
            <button
              onClick={onClose}
              className="py-3.5 rounded-2xl border border-border-main text-[14px] font-black text-primary-text hover:bg-surface transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(settings)}
              className="py-3.5 rounded-2xl bg-primary-text text-card text-[14px] font-black hover:opacity-90 transition-opacity cursor-pointer"
            >
              Confirm Consumption
            </button>
          </div>
        </motion.div>
      </div>
    )
  }
  