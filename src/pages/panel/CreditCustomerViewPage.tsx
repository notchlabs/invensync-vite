import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  ArrowDownLeft,
  Calendar,
  Search,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  X,
  Receipt,
  FileText,
  CheckSquare,
} from 'lucide-react'
import toast from 'react-hot-toast'
import {
  CreditCustomerService,
  type CreditCustomer,
  type CreditTransaction,
} from '../../services/creditCustomerService'
import { formatIndianCurrency } from '../../utils/numberFormat'
import { PageHeader } from '../../components/common/PageHeader'
import { CreditBillModal } from '../../components/credit/CreditBillModal'
import Skeleton from 'react-loading-skeleton'

export default function CreditCustomerViewPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [customer, setCustomer] = useState<CreditCustomer | null>(null)
  const [transactions, setTransactions] = useState<CreditTransaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Selection State
  const [selectedTxnIds, setSelectedTxnIds] = useState<string[]>([])

  // Modals
  const [showCreditModal, setShowCreditModal] = useState(false)
  const [showSettleModal, setShowSettleModal] = useState(false)
  const [showBillModal, setShowBillModal] = useState(false)

  // Credit modal fields
  const [creditAmount, setCreditAmount] = useState('')
  const [creditNotes, setCreditNotes] = useState('')

  // Settle modal fields
  const [settleAmount, setSettleAmount] = useState('')
  const [settleMode, setSettleMode] = useState<'Cash' | 'UPI'>('Cash')
  const [settleNotes, setSettleNotes] = useState('')
  const [clearingDate, setClearingDate] = useState<string>(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  })

  const loadData = () => {
    if (!id) return
    setIsLoading(true)

    // Load customer profile & transactions from API
    Promise.all([
      CreditCustomerService.fetchCustomersFromApi(),
      CreditCustomerService.fetchTransactionsFromApi(id),
    ])
      .then(([customers, txns]) => {
        const found = customers.find(c => c.id === id) || null
        setCustomer(found)
        setTransactions(txns)
        if (found) {
          setSettleAmount(found.creditBalance.toString())
        }
      })
      .catch(err => {
        console.error('Failed to load customer ledger page:', err)
        toast.error('Failed to load customer details')
      })
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    loadData()
  }, [id])

  // Pending Unsettled Credit Transactions (Settled entries are cleared/removed)
  const pendingTransactions = useMemo(() => {
    if (!customer || customer.creditBalance <= 0) {
      return []
    }

    const creditEntries = transactions.filter(t => t.type === 'CONSUMPTION_CREDIT')
    const totalSettlements = transactions
      .filter(t => t.type === 'PAYMENT_SETTLEMENT')
      .reduce((sum, t) => sum + (t.amount || 0), 0)

    if (totalSettlements === 0) {
      return [...creditEntries].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )
    }

    let remainingSettlement = totalSettlements

    // FIFO cover oldest entries
    const chronological = [...creditEntries].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    const unsettledItems: CreditTransaction[] = []
    chronological.forEach(item => {
      const itemAmt = item.amount || 0
      if (itemAmt > 0 && remainingSettlement >= itemAmt) {
        remainingSettlement -= itemAmt
      } else {
        unsettledItems.push(item)
      }
    })

    // Return in reverse chronological order (newest first for display)
    return unsettledItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [transactions, customer])

  // Filtered transactions list
  const filteredTransactions = useMemo(() => {
    return pendingTransactions.filter(txn => {
      const matchesSearch =
        !search ||
        (txn.productName && txn.productName.toLowerCase().includes(search.toLowerCase())) ||
        (txn.notes && txn.notes.toLowerCase().includes(search.toLowerCase())) ||
        txn.paymentMode.toLowerCase().includes(search.toLowerCase())

      return matchesSearch
    })
  }, [pendingTransactions, search])



  const selectedTransactions = useMemo(() => {
    return transactions.filter(t => selectedTxnIds.includes(t.id))
  }, [transactions, selectedTxnIds])

  const selectedTotalAmount = useMemo(() => {
    return selectedTransactions.reduce((acc, t) => acc + (t.amount || 0), 0)
  }, [selectedTransactions])



  const toggleSelectTxn = (txnId: string) => {
    setSelectedTxnIds(prev =>
      prev.includes(txnId) ? prev.filter(i => i !== txnId) : [...prev, txnId]
    )
  }

  const openSettleForSelected = () => {
    if (selectedTxnIds.length === 0) {
      toast.error('Please select at least one item from the table to settle')
      return
    }

    const today = new Date().toISOString().split('T')[0]
    setClearingDate(today)

    setSettleAmount(selectedTotalAmount.toString())
    const itemNames = selectedTransactions
      .map(t => t.productName || t.notes || 'Credit Item')
      .filter(Boolean)
      .join(', ')
    setSettleNotes(`Settling ${selectedTransactions.length} item(s): ${itemNames}`)
    setShowSettleModal(true)
  }

  // Handlers
  const handleRecordCredit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customer) return
    const amt = parseFloat(creditAmount)
    if (!amt || amt <= 0) {
      toast.error('Please enter a valid credit amount')
      return
    }

    CreditCustomerService.recordLoyaltyCredit(customer.id, amt, creditNotes)
    toast.success(`Recorded Loyalty Credit of ${formatIndianCurrency(amt)}`)
    setCreditAmount('')
    setCreditNotes('')
    setShowCreditModal(false)
    setTimeout(() => loadData(), 400)
  }

  const handleSettle = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customer) return

    if (selectedTxnIds.length === 0) {
      toast.error('Please select at least one item from the table to settle')
      return
    }

    const amt = parseFloat(settleAmount)
    if (!amt || amt <= 0) {
      toast.error('Please enter a valid settlement amount')
      return
    }

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }

    const isoDate = clearingDate ? new Date(clearingDate + 'T12:00:00').toISOString() : undefined

    try {
      const res = await CreditCustomerService.settleBalance(
        customer.id,
        amt,
        settleMode,
        settleNotes,
        undefined,
        isoDate,
        selectedTxnIds
      )

      if (res) {
        toast.success(`Settled ${formatIndianCurrency(amt)} via ${settleMode}`)
        setSelectedTxnIds([])
        setSettleAmount('')
        setSettleNotes('')
        setShowSettleModal(false)
        await loadData()
      } else {
        toast.error('Failed to settle balance. Please try again.')
      }
    } catch {
      toast.error('Failed to settle balance. Please try again.')
    }
  }

  if (isLoading && !customer) {
    return (
      <div className="p-3 sm:p-6 lg:p-8 pb-24 w-full space-y-4 sm:space-y-6">
        {/* Header Skeleton */}
        <PageHeader title={<Skeleton width={180} height={24} />} description={<Skeleton width={240} height={14} />} />

        {/* 2 Summary Cards Skeletons */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="bg-card p-3.5 sm:p-5 rounded-2xl border border-border-main/60 flex items-center gap-2.5 sm:gap-4 shadow-xs">
            <Skeleton circle width={36} height={36} />
            <div className="flex-1 space-y-1">
              <Skeleton width={80} height={12} />
              <Skeleton width={100} height={20} />
            </div>
          </div>
          <div className="bg-card p-3.5 sm:p-5 rounded-2xl border border-border-main/60 flex items-center gap-2.5 sm:gap-4 shadow-xs">
            <Skeleton circle width={36} height={36} />
            <div className="flex-1 space-y-1">
              <Skeleton width={90} height={12} />
              <Skeleton width={100} height={20} />
            </div>
          </div>
        </div>

        {/* Ledger Table Container Skeleton */}
        <div className="bg-card rounded-2xl border border-border-main/60 p-4 sm:p-5 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b border-border-main/60">
            <Skeleton width={180} height={24} />
            <div className="flex items-center gap-2">
              <Skeleton width={140} height={32} borderRadius={12} />
              <Skeleton width={160} height={32} borderRadius={12} />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-border-main/30">
                <Skeleton width={140} height={16} />
                <Skeleton width={90} height={20} borderRadius={12} />
                <Skeleton width={180} height={16} />
                <Skeleton width={80} height={16} />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!customer && !isLoading) {
    return (
      <div className="p-6 sm:p-8 w-full text-center space-y-4">
        <p className="text-lg font-bold text-primary-text">Customer not found</p>
        <button
          onClick={() => navigate('/app/panel/credit-customers')}
          className="px-4 py-2 bg-accent text-white font-bold rounded-xl text-xs"
        >
          Back to Credit Customers
        </button>
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-6 lg:p-8 pb-24 w-full space-y-4 sm:space-y-6">
      {/* Page Header */}
      <PageHeader
        title={
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/app/panel/credit-customers')}
              className="p-1 rounded-lg border border-border-main/60 bg-card hover:bg-surface text-primary-text transition-all cursor-pointer shadow-2xs mr-1"
              title="Back to Credit Customers"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <span>{customer?.name}</span>
            {customer && customer.creditBalance > 0 ? (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-bold text-[10px]">
                Active Credit
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-bold text-[10px]">
                Cleared
              </span>
            )}
          </div>
        }
        description={customer?.phone ? `Phone: ${customer.phone} • Customer Ledger Account` : 'Customer Ledger Account'}
      />

      {/* ── Customer Summary Cards ─────────────────────────────────────────── */}
      {customer && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {/* Credit Outstanding */}
          <div className="bg-card p-3.5 sm:p-5 rounded-2xl border border-border-main/60 flex items-start gap-2.5 sm:gap-4 shadow-xs">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <AlertCircle className="w-4.5 h-4.5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] sm:text-xs font-semibold text-secondary-text truncate">Current Credit Due</p>
              <p className="text-base sm:text-xl lg:text-2xl font-black text-amber-500 mt-0.5 truncate">
                {formatIndianCurrency(customer.creditBalance)}
              </p>
              <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-[10px] inline-block mt-1">
                Due Now
              </span>
            </div>
          </div>

          {/* Total Loyalty Consumed */}
          <div className="bg-card p-3.5 sm:p-5 rounded-2xl border border-border-main/60 flex items-start gap-2.5 sm:gap-4 shadow-xs">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
              <CreditCard className="w-4.5 h-4.5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] sm:text-xs font-semibold text-secondary-text truncate">Total Loyalty Credit</p>
              <p className="text-base sm:text-xl lg:text-2xl font-black text-emerald-500 mt-0.5 truncate">
                {formatIndianCurrency(customer.totalLoyaltyConsumed)}
              </p>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] inline-block mt-1">
                Available
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Ledger Table Container ────────────────────────────────────── */}
      <div className="bg-card rounded-2xl border border-border-main/60 shadow-xs overflow-hidden space-y-4 p-4 sm:p-5">
        {/* Search & Filter Header */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-border-main/60">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-accent" />
              <h2 className="text-base font-black text-primary-text">Ledger Transactions</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                {filteredTransactions.length} entries
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-text" />
              <input
                type="text"
                placeholder="Search ledger entries..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-surface text-primary-text border border-border-main rounded-xl text-xs focus:outline-hidden focus:border-accent"
              />
            </div>
          </div>
        </div>

        {/* Selection Card matching mock design */}
        {selectedTxnIds.length > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 space-y-3.5 shadow-2xs">
            {/* Top row: Checkbox Icon (Clickable to deselect), Title/Subtitle & Total Amount */}
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-amber-500/20">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedTxnIds([])}
                  className="w-7 h-7 rounded-lg bg-amber-500 hover:bg-amber-600 active:scale-95 text-white flex items-center justify-center font-black shrink-0 shadow-2xs cursor-pointer transition-all"
                  title="Click to deselect all items"
                >
                  <CheckSquare className="w-4.5 h-4.5" />
                </button>
                <div>
                  <h4 className="text-sm font-bold text-primary-text">
                    {selectedTxnIds.length} {selectedTxnIds.length === 1 ? 'Item' : 'Items'} Selected
                  </h4>
                  <p className="text-xs text-secondary-text font-medium">Total Amount</p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-base sm:text-lg font-black text-amber-500">
                  {formatIndianCurrency(selectedTotalAmount)}
                </span>
              </div>
            </div>

            {/* Bottom row: Generate Bill & Settle Selected */}
            <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center pt-0.5">
              <button
                onClick={() => setShowBillModal(true)}
                className="px-3.5 py-2 bg-card hover:bg-surface border border-border-main/70 text-primary-text rounded-xl font-bold text-xs cursor-pointer flex items-center justify-center gap-2 shadow-2xs min-w-0"
              >
                <FileText className="w-4 h-4 text-accent shrink-0" />
                <div className="text-left leading-tight truncate">
                  <div className="font-bold truncate">Generate Bill</div>
                  <div className="text-[10px] text-muted-text font-medium truncate">for Selected</div>
                </div>
              </button>

              <button
                onClick={openSettleForSelected}
                className="px-4 py-2.5 bg-primary-text text-card hover:opacity-90 rounded-xl font-bold text-xs cursor-pointer flex items-center justify-center gap-2 shadow-xs min-w-0"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Settle</span>
              </button>
            </div>
          </div>
        )}

        {/* Ledger Transaction Cards List */}
        <div className="space-y-3 pt-1">
          {filteredTransactions.length === 0 ? (
            <div className="py-12 text-center text-secondary-text">
              {customer?.creditBalance === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2">
                  <CheckCircle2 className="w-9 h-9 text-emerald-500" />
                  <span className="font-bold text-primary-text text-sm">All credit balance cleared!</span>
                  <span className="text-xs text-secondary-text">No pending credit items.</span>
                </div>
              ) : (
                'No pending credit entries match your criteria.'
              )}
            </div>
          ) : (
            filteredTransactions.map(txn => {
              const isSelected = selectedTxnIds.includes(txn.id)
              return (
                <div
                  key={txn.id}
                  onClick={() => toggleSelectTxn(txn.id)}
                  className={`bg-card rounded-2xl border p-3.5 sm:p-4 flex items-center justify-between gap-3 sm:gap-4 transition-all cursor-pointer select-none border-l-4 ${
                    isSelected
                      ? 'border-border-main border-l-emerald-500 bg-emerald-500/5 shadow-xs'
                      : 'border-border-main/70 border-l-emerald-500/50 hover:bg-surface/50'
                  }`}
                >
                  {/* Left: Checkbox */}
                  <div className="flex items-center shrink-0 pl-1">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={e => {
                        e.stopPropagation()
                        toggleSelectTxn(txn.id)
                      }}
                      onClick={e => e.stopPropagation()}
                      className="w-4 h-4 rounded border-border-main text-accent focus:ring-accent cursor-pointer accent-neutral-900 dark:accent-neutral-100 shrink-0"
                    />
                  </div>

                  {/* Middle: Info */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <span className="font-bold text-sm text-primary-text truncate block">
                      {txn.productName || (txn.notes && txn.notes !== 'Credit Item Consumption' ? txn.notes : 'Credit Item')}
                    </span>

                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-secondary-text">
                      <Calendar className="w-3.5 h-3.5 text-muted-text shrink-0" />
                      <span>
                        {new Date(txn.date).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {txn.notes && txn.notes !== 'Credit Item Consumption' && txn.notes !== txn.productName && (
                      <p className="text-xs text-muted-text truncate pt-0.5">{txn.notes}</p>
                    )}
                  </div>

                  {/* Right: Quantity (above) + Amount (below) */}
                  <div className="text-right shrink-0 flex flex-col items-end justify-center space-y-1.5">
                    {txn.qty && (
                      <span className="text-[11px] font-bold text-secondary-text bg-surface border border-border-main/70 px-2 py-0.5 rounded-lg inline-block shadow-2xs">
                        Qty: {txn.qty} {txn.unit || ''}
                      </span>
                    )}
                    <p className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400">
                      + {formatIndianCurrency(txn.amount)}
                    </p>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* ── Modal 1: Record Loyalty Credit ───────────────────────────────────── */}
      <AnimatePresence>
        {showCreditModal && customer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card w-full max-w-md rounded-2xl border border-border-main p-6 shadow-xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-primary-text flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-500" />
                  Record Loyalty Credit
                </h3>
                <button
                  onClick={() => setShowCreditModal(false)}
                  className="p-1 text-muted-text hover:text-primary-text cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3 bg-surface rounded-xl border border-border-main/60 text-xs space-y-1">
                <p className="text-secondary-text">
                  Customer: <strong className="text-primary-text">{customer.name}</strong>
                </p>
              </div>

              <form onSubmit={handleRecordCredit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-secondary-text mb-1">
                    Total Amount (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="Enter total amount (e.g. 500)"
                    value={creditAmount}
                    onChange={e => setCreditAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-surface rounded-xl text-sm font-bold text-primary-text border border-border-main outline-none focus:border-accent"
                  />
                </div>

                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                  Payment mode is automatically set to <strong>Loyalty</strong>.
                </div>

                <div>
                  <label className="block text-xs font-bold text-secondary-text mb-1">
                    Notes / Item Details (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Filter Coffee & Snacks"
                    value={creditNotes}
                    onChange={e => setCreditNotes(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-surface rounded-xl text-sm font-medium text-primary-text border border-border-main outline-none focus:border-accent"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreditModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-border-main text-xs font-bold text-primary-text hover:bg-surface cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 cursor-pointer shadow-xs"
                  >
                    Consume in Loyalty
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modal 2: Settle Balance ──────────────────────────────────────────── */}
      <AnimatePresence>
        {showSettleModal && customer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => (document.activeElement as HTMLElement)?.blur()}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-card w-full max-w-md rounded-2xl border border-border-main p-6 shadow-xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-primary-text flex items-center gap-2">
                  <ArrowDownLeft className="w-5 h-5 text-emerald-500" />
                  Settle Credit Balance
                </h3>
                <button
                  onClick={() => {
                    (document.activeElement as HTMLElement)?.blur()
                    setShowSettleModal(false)
                  }}
                  className="p-1 text-muted-text hover:text-primary-text cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3 bg-surface rounded-xl border border-border-main/60 text-xs space-y-1">
                <p className="text-secondary-text">
                  Customer: <strong className="text-primary-text">{customer.name}</strong>
                </p>
                <p className="text-secondary-text">
                  Current Credit Due:{' '}
                  <strong className="text-amber-500">
                    {formatIndianCurrency(customer.creditBalance)}
                  </strong>
                </p>
              </div>

              <form onSubmit={handleSettle} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-secondary-text mb-1">
                    Settlement Amount (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={settleAmount}
                    onFocus={() => (document.activeElement as HTMLElement)?.blur()}
                    onChange={e => setSettleAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-surface rounded-xl text-sm font-bold text-primary-text border border-border-main outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-secondary-text mb-1">
                    Payment Mode
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        ;(document.activeElement as HTMLElement)?.blur()
                        setSettleMode('Cash')
                      }}
                      className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        settleMode === 'Cash'
                          ? 'bg-primary-text text-card border-primary-text'
                          : 'bg-surface border-border-main text-primary-text'
                      }`}
                    >
                      Cash
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        ;(document.activeElement as HTMLElement)?.blur()
                        setSettleMode('UPI')
                      }}
                      className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        settleMode === 'UPI'
                          ? 'bg-primary-text text-card border-primary-text'
                          : 'bg-surface border-border-main text-primary-text'
                      }`}
                    >
                      UPI
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-secondary-text mb-1">
                    Clearing / Settlement Date
                  </label>
                  <input
                    type="text"
                    value={clearingDate}
                    disabled
                    readOnly
                    placeholder="YYYY-MM-DD"
                    className="w-full px-3.5 py-2.5 bg-surface/50 rounded-xl text-sm font-medium text-secondary-text border border-border-main/60 outline-none cursor-not-allowed select-none opacity-80"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-secondary-text mb-1">
                    Notes (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Paid in full via Cash"
                    value={settleNotes}
                    onChange={e => setSettleNotes(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-surface rounded-xl text-sm font-medium text-primary-text border border-border-main outline-none focus:border-accent"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowSettleModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-border-main text-xs font-bold text-primary-text hover:bg-surface cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 cursor-pointer shadow-xs"
                  >
                    Confirm Settlement
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Credit Statement Bill Modal */}
      {showBillModal && customer && (
        <CreditBillModal
          customer={customer}
          transactions={selectedTxnIds.length > 0 ? selectedTransactions : transactions}
          onClose={() => setShowBillModal(false)}
          onOpenSettleModal={openSettleForSelected}
        />
      )}
    </div>
  )
}
