import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Plus,
  CreditCard,
  Phone,
  X,
  CheckCircle2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import {
  CreditCustomerService,
  type CreditCustomer,
} from '../../services/creditCustomerService'
import { formatIndianCurrency } from '../../utils/numberFormat'
import { PageHeader } from '../../components/common/PageHeader'
import Skeleton from 'react-loading-skeleton'

export default function CreditCustomersPage() {
  const navigate = useNavigate()
  const [customers, setCustomers] = useState<CreditCustomer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')

  const refreshData = () => {
    setIsLoading(true)
    CreditCustomerService.fetchCustomersFromApi()
      .then(data => setCustomers(data))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    refreshData()
  }, [])

  // Modal states
  const [showAddCustomer, setShowAddCustomer] = useState(false)
  const [showCreditEntry, setShowCreditEntry] = useState(false)

  // Form fields
  const [newCustName, setNewCustName] = useState('')
  const [newCustPhone, setNewCustPhone] = useState('')

  // Credit entry fields (Defaults to Loyalty)
  const [creditCustomerId, setCreditCustomerId] = useState('')
  const [creditAmount, setCreditAmount] = useState('')
  const [creditNotes, setCreditNotes] = useState('')

  // Filtered customer list
  const filteredCustomers = useMemo(() => {
    const term = search.toLowerCase().trim()
    if (!term) return customers
    return customers.filter(
      c => c.name.toLowerCase().includes(term) || c.phone.toLowerCase().includes(term)
    )
  }, [customers, search])

  // Handlers
  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCustName.trim()) {
      toast.error('Customer name is required')
      return
    }
    const cleanPhone = newCustPhone.replace(/\D/g, '')
    if (cleanPhone && cleanPhone.length !== 10) {
      toast.error('Phone number must be exactly 10 digits')
      return
    }
    CreditCustomerService.addCustomer(newCustName, cleanPhone)
    toast.success(`Customer "${newCustName.trim()}" added successfully`)
    setNewCustName('')
    setNewCustPhone('')
    setShowAddCustomer(false)
    setTimeout(() => refreshData(), 400)
  }

  const handleRecordCredit = (e: React.FormEvent) => {
    e.preventDefault()
    const amt = parseFloat(creditAmount)
    if (!creditCustomerId) {
      toast.error('Please select a customer')
      return
    }
    if (!amt || amt <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    CreditCustomerService.recordLoyaltyCredit(creditCustomerId, amt, creditNotes)
    toast.success(`Recorded Loyalty Credit of ${formatIndianCurrency(amt)}`)
    setCreditAmount('')
    setCreditNotes('')
    setShowCreditEntry(false)
    setTimeout(() => refreshData(), 400)
  }


  const openHistory = (cust: CreditCustomer) => {
    navigate(`/app/panel/credit-customers/${cust.id}/view`)
  }

  return (
    <div className="flex-1 p-4 lg:p-8 w-full space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Credit Customers"
        description="Manage customer credit balances and log total amount entries consumed under Loyalty."
      />

      {/* ── Main Content Area: Search & Table ─────────────────────────────────── */}
      <div className="bg-card rounded-2xl border border-border-main/60 shadow-xs overflow-hidden">
        {/* Search Header */}
        <div className="p-4 border-b border-border-main/60">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-text pointer-events-none" />
              <input
                type="text"
                placeholder="Search by customer name or phone..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-surface rounded-xl text-xs lg:text-sm font-medium text-primary-text border border-border-main outline-none focus:border-accent transition-all"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowAddCustomer(true)}
              className="px-3.5 py-2.5 bg-primary-text text-card rounded-xl font-bold text-xs lg:text-sm hover:opacity-90 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden xs:inline whitespace-nowrap">Add Customer</span>
            </button>
          </div>
        </div>

        {/* Customer Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs lg:text-sm">
            <thead className="bg-surface/60 text-secondary-text uppercase font-bold text-[11px] tracking-wider border-b border-border-main/60">
              <tr>
                <th className="py-3.5 px-6">Customer</th>
                <th className="py-3.5 px-6 text-right">Credit Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main/40 text-primary-text font-medium">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <Skeleton circle width={36} height={36} />
                        <div className="flex-1 space-y-1">
                          <Skeleton width={130} height={16} />
                          <Skeleton width={90} height={12} />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Skeleton width={80} height={18} />
                    </td>
                  </tr>
                ))
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={2} className="py-12 text-center text-secondary-text">
                    No credit customers found matching "{search}".
                  </td>
                </tr>
              ) : (
                filteredCustomers.map(cust => (
                  <tr
                    key={cust.id}
                    onClick={() => openHistory(cust)}
                    className="hover:bg-surface/60 transition-colors cursor-pointer group"
                  >
                    {/* Name + Avatar + Phone */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-accent/10 text-accent font-black flex items-center justify-center text-xs shrink-0 group-hover:scale-105 transition-transform">
                          {cust.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-primary-text group-hover:text-accent transition-colors">
                            {cust.name}
                          </span>
                          {cust.phone ? (
                            <span className="text-xs text-secondary-text font-mono flex items-center gap-1">
                              <Phone className="w-3 h-3 text-muted-text" />
                              {cust.phone}
                            </span>
                          ) : (
                            <span className="text-[10px] text-muted-text font-normal">Click to view ledger</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Credit Balance */}
                    <td className="py-4 px-6 text-right">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-lg font-black text-xs ${
                          cust.creditBalance > 0
                            ? 'bg-amber-500/10 text-amber-500'
                            : 'bg-emerald-500/10 text-emerald-500'
                        }`}
                      >
                        {formatIndianCurrency(cust.creditBalance || 0)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal 1: Add New Customer ───────────────────────────────────────── */}
      <AnimatePresence>
        {showAddCustomer && (
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
                <h3 className="text-lg font-black text-primary-text">Add Credit Customer</h3>
                <button
                  onClick={() => setShowAddCustomer(false)}
                  className="p-1 text-muted-text hover:text-primary-text cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddCustomer} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-secondary-text mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rajesh Kumar"
                    value={newCustName}
                    onChange={e => setNewCustName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-surface rounded-xl text-sm font-medium text-primary-text border border-border-main outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-secondary-text mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="e.g. 9876543210"
                    value={newCustPhone}
                    onChange={e => setNewCustPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="w-full px-3.5 py-2.5 bg-surface rounded-xl text-sm font-medium text-primary-text border border-border-main outline-none focus:border-accent"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddCustomer(false)}
                    className="px-4 py-2.5 rounded-xl border border-border-main text-xs font-bold text-primary-text hover:bg-surface cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-primary-text text-card text-xs font-bold hover:opacity-90 cursor-pointer"
                  >
                    Save Customer
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modal 2: Quick Credit Entry (Defaulted to Loyalty) ────────────────── */}
      <AnimatePresence>
        {showCreditEntry && (
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
                  Quick Credit Entry
                </h3>
                <button
                  onClick={() => setShowCreditEntry(false)}
                  className="p-1 text-muted-text hover:text-primary-text cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleRecordCredit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-secondary-text mb-1">
                    Customer Name *
                  </label>
                  <select
                    value={creditCustomerId}
                    onChange={e => setCreditCustomerId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-surface rounded-xl text-sm font-medium text-primary-text border border-border-main outline-none focus:border-accent cursor-pointer"
                  >
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.phone ? `(${c.phone})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

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

                {/* Default Payment Mode Info Banner */}
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                  Payment mode is automatically set to <strong>Loyalty</strong> for this entry.
                </div>

                <div>
                  <label className="block text-xs font-bold text-secondary-text mb-1">
                    Notes / Consumption Items (Optional)
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
                    onClick={() => setShowCreditEntry(false)}
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

    </div>
  )
}
