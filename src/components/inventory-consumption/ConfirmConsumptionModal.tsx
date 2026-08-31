import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  X,
  Banknote,
  Gift,
  ShoppingCart,
  ArrowRight,
  Minus,
  Plus,
  User,
  Check,
  Info,
  CreditCard,
  Trash2,
  CheckCircle2,
  FileText,
} from 'lucide-react'
import toast from 'react-hot-toast'
import type { CartEntry, ItemSettings } from './types'
import { formatIndianCurrency } from '../../utils/numberFormat'
import { ProductImage } from './ProductImage'
import { ConsumptionService } from '../../services/consumptionService'
import { ENV } from '../../config/env'
import { CreditCustomerService, type CreditCustomer } from '../../services/creditCustomerService'

import { CompactCustomSelect } from './CompactCustomSelect'

export function ConfirmConsumptionModal({
  cart,
  onClose,
  onRemove,
  onSuccess,
  onUpdateQty,
}: {
  cart: Map<number, CartEntry>
  onClose: () => void
  onRemove: (id: number) => void
  onSuccess: () => void
  onUpdateQty?: (id: number, qty: number) => void
}) {
  const entries = Array.from(cart.values())

  const [isConfirming, setIsConfirming] = useState(false)
  const [emptyIds, setEmptyIds] = useState<Set<number>>(new Set())
  const [creditCustomers, setCreditCustomers] = useState<CreditCustomer[]>(() => CreditCustomerService.getCustomers())
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('')
  const [itemCustomerMap, setItemCustomerMap] = useState<Map<number, string>>(
    () => new Map()
  )
  const [globalPaymentMode, setGlobalPaymentMode] = useState<ItemSettings['paymentMode'] | null>('UPI')

  useEffect(() => {
    CreditCustomerService.fetchCustomersFromApi().then(custs => {
      setCreditCustomers(custs)
      if (custs.length > 0) {
        setSelectedCustomerId(prev => prev || custs[0].id)
      }
    })
  }, [])

  // Per-item settings — initialised from cart
  const [settings, setSettings] = useState<Map<number, ItemSettings>>(() => {
    const m = new Map<number, ItemSettings>()
    entries.forEach(e => {
      const displayPrice = (e.mrp && e.mrp > 0) ? e.mrp : e.price
      m.set(e.productId, {
        amount: String(displayPrice > 0 ? displayPrice * e.qty : 0),
        paymentMode: 'UPI',
        noBill: false,
        loyalty: false,
      })
    })
    return m
  })

  const updateSetting = <K extends keyof ItemSettings>(
    id: number,
    key: K,
    value: ItemSettings[K]
  ) => {
    if (key === 'amount')
      setEmptyIds(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    setSettings(prev => {
      const next = new Map(prev)
      const cur = next.get(id)
      if (cur) next.set(id, { ...cur, [key]: value })
      return next
    })
  }

  const applyGlobalPaymentMode = (mode: ItemSettings['paymentMode']) => {
    setGlobalPaymentMode(mode)
    setSettings(prev => {
      const next = new Map(prev)
      next.forEach((cfg, id) => {
        next.set(id, { ...cfg, paymentMode: mode })
      })
      return next
    })
  }

  const handleQtyChange = (productId: number, newQty: number) => {
    if (newQty <= 0) {
      onRemove(productId)
      return
    }
    const entry = cart.get(productId)
    if (!entry) return

    if (onUpdateQty) {
      onUpdateQty(productId, newQty)
    } else {
      entry.qty = newQty
    }

    const baseUnitPrice = (entry.mrp && entry.mrp > 0) ? entry.mrp : (entry.price || 0)
    const currentAmt = parseFloat(settings.get(productId)?.amount || '0')

    let unitPrice = baseUnitPrice
    if (!isNaN(currentAmt) && currentAmt > 0 && entry.qty > 0) {
      const calculatedCurrent = baseUnitPrice * entry.qty
      if (Math.abs(currentAmt - calculatedCurrent) > 0.01) {
        unitPrice = currentAmt / entry.qty
      }
    }

    const calculatedNew = unitPrice * newQty
    const formattedAmount = Number.isInteger(calculatedNew)
      ? String(calculatedNew)
      : calculatedNew.toFixed(2)

    updateSetting(productId, 'amount', formattedAmount)
  }

  const handleConfirm = async () => {
    if (isConfirming) return

    const invalid = new Set<number>()
    entries.forEach(e => {
      const amt = parseFloat(settings.get(e.productId)?.amount ?? '')
      if (isNaN(amt) || amt < 0) invalid.add(e.productId)
    })
    if (invalid.size > 0) {
      setEmptyIds(invalid)
      return
    }

    const missingCreditCustomer = entries.some(e => {
      const s = settings.get(e.productId)
      if (s?.paymentMode === 'Credit') {
        const custId = itemCustomerMap.get(e.productId) || selectedCustomerId
        return !custId
      }
      return false
    })

    if (missingCreditCustomer) {
      toast.error('Please select a credit customer for all credit items')
      return
    }

    setIsConfirming(true)
    try {
      const now = new Date()
      const consumptionDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

      const inventoryEntries = Array.from(cart.values()).filter(
        e => e.source === 'inventory'
      )
      const preparationEntries = Array.from(cart.values()).filter(
        e => e.source === 'preparation'
      )

      if (inventoryEntries.length > 0) {
        const records = inventoryEntries.map(e => {
          const s = settings.get(e.productId)
          const amount = parseFloat(s?.amount || '0')
          const isLoyalty = s?.paymentMode === 'Loyalty'
          const isCredit = s?.paymentMode === 'Credit'
          const custId = isCredit ? (itemCustomerMap.get(e.productId) || selectedCustomerId) : undefined
          const costAmount = (e.price || 0) * e.qty
          return {
            sourceSiteId: Number(ENV.DEFAULT_SITE_ID),
            productId: e.productId,
            productName: e.productName,
            quantity: e.qty,
            amountIncTax: costAmount * ((e.cgstInPerc || 0) / 100 + (e.sgstInPerc || 0) / 100 + 1),
            upi: s?.paymentMode === 'UPI' ? amount : 0,
            cash: s?.paymentMode === 'Cash' ? amount : 0,
            noBill: s?.noBill ?? false,
            loyalty: isLoyalty,
            creditCustomerId: custId ? Number(custId) : undefined,
            total: amount,
          }
        })
        await ConsumptionService.consumeStock({
          consumptionUnitId: Number(ENV.DEFAULT_CONSUMPTION_UNIT_ID),
          consumptionDate,
          saveDetails: true,
          records,
        })
      }

      if (preparationEntries.length > 0) {
        for (const e of preparationEntries) {
          const s = settings.get(e.productId)
          const amount = parseFloat(s?.amount || '0')
          const cash = s?.paymentMode === 'Cash' ? amount : 0
          const upi = s?.paymentMode === 'UPI' ? amount : 0
          const loyalty = s?.paymentMode === 'Loyalty'
          const noBill = s?.noBill ?? false
          const isCredit = s?.paymentMode === 'Credit'
          const custId = isCredit ? (itemCustomerMap.get(e.productId) || selectedCustomerId) : undefined

          await ConsumptionService.prepareAndConsume({
            compositeProductId: e.productId,
            siteId: Number(ENV.DEFAULT_SITE_ID),
            quantityToPrepare: e.qty,
            consumptionUnitId: Number(ENV.DEFAULT_CONSUMPTION_UNIT_ID),
            rawMaterials: [],
            extraCharges: {},
            consumptionDate,
            saveDetails: true,
            amountIncTax: amount,
            cash,
            upi,
            loyalty,
            noBill,
            isWbc: false,
            creditCustomerId: custId ? Number(custId) : undefined,
            total: amount,
          })
        }
      }

      toast.success('Stock consumed successfully!')
      onSuccess()
    } catch {
      toast.error('Failed to consume stock. Please try again.')
    } finally {
      setIsConfirming(false)
    }
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

  const hasCreditItem = Array.from(settings.values()).some(
    s => s.paymentMode === 'Credit'
  )

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[130] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 40 }}
        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        className="bg-card w-full h-full sm:h-auto max-w-[660px] rounded-none sm:rounded-3xl shadow-[0_20px_50px_rgb(0,0,0,0.3)] flex flex-col sm:max-h-[92vh] overflow-hidden border-0 sm:border border-border-main p-4 sm:p-5 space-y-3 sm:space-y-3.5 text-primary-text"
      >
        {/* ── Header ───────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-primary-text leading-tight">
                Confirm Consumption
              </h2>
              <p className="text-[11px] font-normal text-secondary-text mt-0.5">
                Review your items and proceed
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-surface hover:bg-border-main/40 text-primary-text flex items-center justify-center transition-colors cursor-pointer shadow-2xs shrink-0 border border-border-main"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Top Green Summary Banner ─────────────────────────────────────── */}
        <div className="bg-emerald-50 dark:bg-emerald-950 rounded-xl px-3 py-2 flex items-center justify-between border border-emerald-200 dark:border-emerald-800 shrink-0">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 fill-emerald-600 dark:fill-emerald-400 stroke-white dark:stroke-black shrink-0" />
            <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-200">
              {entries.length} {entries.length === 1 ? 'item' : 'items'} added
            </span>
          </div>
          <div className="text-[11px] text-secondary-text font-medium">
            No Bill Total: <span className="font-bold text-emerald-800 dark:text-emerald-300">{formatIndianCurrency(noBillTotal)}</span>
          </div>
        </div>

        {/* ── Item List ────────────────────────────────────────────────────── */}
        <div className="flex-1 min-h-0 overflow-y-auto pr-0.5 space-y-3">
          <div className="text-[10px] font-bold text-secondary-text tracking-wider uppercase px-0.5">
            ITEMS
          </div>

          {entries.map(entry => {
            const cfg = settings.get(entry.productId)
            if (!cfg) return null

            const isCredit = cfg.paymentMode === 'Credit'
            const currentAmt = parseFloat(cfg.amount) || 0
            const unitPrice = entry.qty > 0 ? currentAmt / entry.qty : ((entry.mrp && entry.mrp > 0) ? entry.mrp : (entry.price || 0))

            return (
              <div
                key={entry.productId}
                className="bg-card rounded-2xl p-3 border border-border-main flex flex-col gap-2.5 shadow-2xs transition-all"
              >
                {/* Row 1: Image + Title + Source + Trash Button */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-surface border border-border-main flex items-center justify-center shrink-0">
                      <ProductImage
                        src={entry.imageUrl}
                        name={entry.productName}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12px] font-bold text-primary-text uppercase tracking-tight leading-snug line-clamp-1">
                        {entry.productName}
                      </p>
                      <p className="text-[10px] text-secondary-text font-normal capitalize mt-0.5">
                        {entry.source}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemove(entry.productId)}
                    className="w-7 h-7 rounded-lg bg-surface border border-border-main hover:bg-rose-500/10 hover:border-rose-500/30 text-secondary-text hover:text-rose-600 dark:hover:text-rose-400 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Row 2: Quantity Stepper (Left) + Editable Total Amount & Per Unit Price (Right) */}
                <div className="flex items-center justify-between gap-3">
                  {/* Quantity Stepper */}
                  <div className="flex items-center bg-surface border border-border-main rounded-xl p-0.5 gap-0.5 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => handleQtyChange(entry.productId, entry.qty - 1)}
                      className="w-6 h-6 rounded-lg bg-card border border-border-main hover:bg-surface text-primary-text flex items-center justify-center font-bold transition-colors cursor-pointer"
                      title="Decrease quantity"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={entry.qty}
                      onChange={e => {
                        const val = parseInt(e.target.value, 10)
                        handleQtyChange(entry.productId, isNaN(val) ? 0 : val)
                      }}
                      className="w-9 text-center bg-transparent text-[12px] font-bold text-primary-text outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleQtyChange(entry.productId, entry.qty + 1)}
                      className="w-6 h-6 rounded-lg bg-card border border-border-main hover:bg-surface text-primary-text flex items-center justify-center font-bold transition-colors cursor-pointer"
                      title="Increase quantity"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Editable Total Amount + Per Unit Price */}
                  <div className="flex flex-col items-end gap-0.5">
                    <div className="flex items-center gap-1 bg-surface border border-border-main rounded-xl px-2.5 py-1 shadow-2xs focus-within:border-accent">
                      <span className="text-[12px] font-bold text-muted-text">₹</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={cfg.amount}
                        onChange={e =>
                          updateSetting(entry.productId, 'amount', e.target.value)
                        }
                        className={`w-20 text-right bg-transparent text-[13px] font-bold text-primary-text outline-none ${
                          emptyIds.has(entry.productId) ? 'text-rose-500' : ''
                        }`}
                        placeholder="0.00"
                      />
                    </div>
                    <span className="text-[10px] font-medium text-secondary-text tracking-tight pr-0.5">
                      {formatIndianCurrency(unitPrice)} per unit
                    </span>
                  </div>
                </div>

                {/* Row 3: Payment Mode Selector Dropdown (Left) + No Bill Checkbox (Right) */}
                <div className="border-t border-border-main pt-2 flex items-center justify-between gap-2">
                  {/* Payment Mode Selector Dropdown */}
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="w-4 h-4 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <CreditCard className="w-3 h-3" />
                    </div>
                    <span className="text-[11px] font-medium text-secondary-text shrink-0">Payment:</span>
                    <CompactCustomSelect
                      value={cfg.paymentMode}
                      onChange={val => {
                        updateSetting(
                          entry.productId,
                          'paymentMode',
                          val as ItemSettings['paymentMode']
                        )
                        setGlobalPaymentMode(null)
                      }}
                      options={[
                        { label: 'UPI', value: 'UPI' },
                        { label: 'Cash', value: 'Cash' },
                        { label: 'Loyalty', value: 'Loyalty' },
                        { label: 'Credit', value: 'Credit' },
                      ]}
                    />
                  </div>

                  {/* No Bill Checkbox */}
                  <label className="flex items-center gap-1.5 cursor-pointer select-none shrink-0">
                    <input
                      type="checkbox"
                      checked={cfg.noBill}
                      onChange={e =>
                        updateSetting(
                          entry.productId,
                          'noBill',
                          e.target.checked
                        )
                      }
                      className="w-3.5 h-3.5 rounded border-border-main accent-emerald-600 cursor-pointer"
                    />
                    <span className="text-[11px] font-medium text-secondary-text">
                      No Bill
                    </span>
                  </label>
                </div>

                {/* In-Card Credit Customer Selector */}
                {isCredit && (
                  <div className="mt-1 p-2.5 sm:p-3 rounded-2xl bg-surface border border-border-main flex flex-col gap-1 transition-all">
                    <label className="text-[10px] font-bold text-secondary-text">
                      Credit to customer
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <User
                          size={13}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-text pointer-events-none z-10"
                        />
                        <CompactCustomSelect
                          value={itemCustomerMap.get(entry.productId) || selectedCustomerId}
                          onChange={val => {
                            setSelectedCustomerId(val)
                            setItemCustomerMap(prev => new Map(prev).set(entry.productId, val))
                          }}
                          options={creditCustomers.map(c => ({
                            label: `${c.name}${c.phone ? ` (${c.phone})` : ''}`,
                            value: c.id,
                          }))}
                          className="w-full pl-8 text-left justify-between"
                        />
                      </div>

                      <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                        <Check size={12} strokeWidth={3} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {/* ── Global Payment Selection Section (Only if > 1 item) ─────────── */}
          {entries.length > 1 && (
            <div className="pt-1.5 space-y-2">
              <div className="px-0.5">
                <span className="text-[10px] font-bold text-secondary-text tracking-wider uppercase">
                  PAYMENT SELECTION
                </span>
              </div>

              {/* 4 Cards Grid */}
              <div className="grid grid-cols-4 gap-1.5">
                {/* UPI */}
                <div
                  onClick={() => applyGlobalPaymentMode('UPI')}
                  className={`px-2 py-2 rounded-xl border flex items-center justify-between gap-1 cursor-pointer transition-all ${
                    globalPaymentMode === 'UPI'
                      ? 'bg-emerald-50 dark:bg-emerald-950 border-2 border-emerald-600 dark:border-emerald-500 shadow-2xs'
                      : 'bg-card border-border-main hover:bg-surface'
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="text-[11px] font-bold text-primary-text whitespace-nowrap">UPI</span>
                  </div>
                  {globalPaymentMode === 'UPI' && (
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 fill-emerald-600 dark:fill-emerald-400 stroke-white dark:stroke-black shrink-0" />
                  )}
                </div>

                {/* Cash */}
                <div
                  onClick={() => applyGlobalPaymentMode('Cash')}
                  className={`px-2 py-2 rounded-xl border flex items-center justify-between gap-1 cursor-pointer transition-all ${
                    globalPaymentMode === 'Cash'
                      ? 'bg-emerald-50 dark:bg-emerald-950 border-2 border-emerald-600 dark:border-emerald-500 shadow-2xs'
                      : 'bg-card border-border-main hover:bg-surface'
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Banknote className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="text-[11px] font-bold text-primary-text whitespace-nowrap">Cash</span>
                  </div>
                  {globalPaymentMode === 'Cash' && (
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 fill-emerald-600 dark:fill-emerald-400 stroke-white dark:stroke-black shrink-0" />
                  )}
                </div>

                {/* Loyalty */}
                <div
                  onClick={() => applyGlobalPaymentMode('Loyalty')}
                  className={`px-2 py-2 rounded-xl border flex items-center justify-between gap-1 cursor-pointer transition-all ${
                    globalPaymentMode === 'Loyalty'
                      ? 'bg-emerald-50 dark:bg-emerald-950 border-2 border-emerald-600 dark:border-emerald-500 shadow-2xs'
                      : 'bg-card border-border-main hover:bg-surface'
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Gift className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="text-[11px] font-bold text-primary-text whitespace-nowrap">Loyalty</span>
                  </div>
                  {globalPaymentMode === 'Loyalty' && (
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 fill-emerald-600 dark:fill-emerald-400 stroke-white dark:stroke-black shrink-0" />
                  )}
                </div>

                {/* Credit */}
                <div
                  onClick={() => applyGlobalPaymentMode('Credit')}
                  className={`px-2 py-2 rounded-xl border flex items-center justify-between gap-1 cursor-pointer transition-all ${
                    globalPaymentMode === 'Credit'
                      ? 'bg-emerald-50 dark:bg-emerald-950 border-2 border-emerald-600 dark:border-emerald-500 shadow-2xs'
                      : 'bg-card border-border-main hover:bg-surface'
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <CreditCard className="w-3.5 h-3.5 text-primary-text shrink-0" />
                    <span className="text-[11px] font-bold text-primary-text whitespace-nowrap">Credit</span>
                  </div>
                  {globalPaymentMode === 'Credit' && (
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 fill-emerald-600 dark:fill-emerald-400 stroke-white dark:stroke-black shrink-0" />
                  )}
                </div>
              </div>

              {/* Bottom info note */}
              <div className="flex items-center gap-1.5 px-0.5">
                <Info className="w-3 h-3 text-secondary-text shrink-0" />
                <span className="text-[10px] font-normal text-secondary-text">
                  You can also change payment method for individual items above.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ── Totals Summary Card ───────────────────────────────────────────── */}
        <div className="bg-surface rounded-2xl p-3 border border-border-main flex items-start gap-3 shrink-0 shadow-2xs">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4" />
          </div>

          <div className="flex-1 min-w-0 space-y-0.5">
            <div className="flex items-center justify-between text-[11px] font-medium text-secondary-text">
              <span>Total Items</span>
              <span className="font-bold text-primary-text">{entries.length}</span>
            </div>

            <div className="flex items-center justify-between text-[11px] font-medium text-secondary-text">
              <span>No Bill Total</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatIndianCurrency(noBillTotal)}</span>
            </div>

            <div className="border-t border-dashed border-border-main pt-1.5 mt-1 flex items-center justify-between">
              <span className="text-xs font-bold text-primary-text">Overall Total</span>
              <span className="text-sm font-bold text-primary-text">
                {formatIndianCurrency(overallTotal)}
              </span>
            </div>
          </div>
        </div>

        {/* ── Credit Alert Banner ───────────────────────────────────────── */}
        {hasCreditItem && (
          <div className="p-2.5 sm:p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300 text-xs font-medium flex items-center gap-2 shrink-0">
            <Info className="w-4 h-4 text-blue-500 shrink-0" />
            <span>
              Items marked with <strong>Credit</strong> will be added as credit to the selected customer.
            </span>
          </div>
        )}

        {/* ── Action Buttons Footer ────────────────────────────────────────── */}
        <div className="flex items-center gap-2.5 shrink-0 pt-0.5">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2.5 rounded-2xl border border-border-main bg-card hover:bg-surface text-primary-text font-bold text-[11px] text-center flex-1 transition-colors cursor-pointer shadow-2xs"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isConfirming}
            className="px-3 py-2.5 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-[11px] flex-[2] flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {isConfirming ? (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin shrink-0" />
            ) : (
              <>
                <span>Confirm & Proceed</span>
                <span>{formatIndianCurrency(overallTotal)}</span>
                <ArrowRight className="w-3.5 h-3.5 text-white shrink-0" />
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}