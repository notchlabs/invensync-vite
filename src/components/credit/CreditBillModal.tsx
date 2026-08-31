import { useRef } from 'react'
import { motion } from 'framer-motion'
import {
  X,
  FileText,
  Calendar,
  User,
  Phone,
  Wallet,
  Coffee,
  Info,
  ExternalLink,
  FileSpreadsheet,
} from 'lucide-react'
import type { CreditCustomer, CreditTransaction } from '../../services/creditCustomerService'
import { formatIndianCurrency } from '../../utils/numberFormat'
import { exportCreditBillToExcel } from '../../utils/creditExcelExporter'

interface CreditBillModalProps {
  customer: CreditCustomer
  transactions: CreditTransaction[]
  onClose: () => void
  onOpenSettleModal: () => void
}

const PASTEL_ICONS = [
  { bg: 'bg-[#ffedd5] text-[#f97316]', icon: Coffee },
  { bg: 'bg-[#dcfce7] text-[#16a34a]', icon: Coffee },
  { bg: 'bg-[#f3e8ff] text-[#9333ea]', icon: Coffee },
  { bg: 'bg-[#fef3c7] text-[#d97706]', icon: Coffee },
  { bg: 'bg-[#ffe4e6] text-[#e11d48]', icon: Coffee },
]

export function CreditBillModal({
  customer,
  transactions,
  onClose,
  onOpenSettleModal,
}: CreditBillModalProps) {
  const printRef = useRef<HTMLDivElement>(null)

  // Filter pending credit items (LOYALTY credit entries)
  const pendingCreditItems = transactions.filter(t => t.type === 'CONSUMPTION_CREDIT')
  const totalBillAmount = pendingCreditItems.reduce((sum, item) => sum + (item.amount || 0), 0)

  const issueDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
  const issueTime = new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      {/* Print CSS rules so only the bill printable container prints cleanly */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #credit-bill-printable, #credit-bill-printable * {
            visibility: visible;
          }
          #credit-bill-printable {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white border border-gray-200 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh] text-gray-900"
      >
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-white no-print">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#ecfdf5] text-[#059669] flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
                Pending Credit Bill Statement
              </h2>
              <p className="text-xs text-gray-400 font-medium">
                Generate and print credit statement for {customer.name}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl border border-gray-200 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Bill Content Container */}
        <div
          className="p-5 sm:p-7 overflow-y-auto flex-1 space-y-5 bg-white"
          id="credit-bill-printable"
          ref={printRef}
        >
          {/* Statement Date & Time Row */}
          <div className="flex items-center justify-between text-xs py-1.5 px-1 border-b border-gray-100 text-gray-500">
            <div className="flex items-center gap-2 font-medium">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span>Statement Date & Time</span>
            </div>
            <span className="font-bold text-gray-800">
              {issueDate}, {issueTime}
            </span>
          </div>

          {/* Customer Profile & Credit Due Row */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3.5">
            {/* Left Card: Billed To (Customer) */}
            <div className="sm:col-span-3 bg-white border border-gray-200/80 rounded-2xl p-4 space-y-2 shadow-2xs">
              <p className="text-[10px] font-extrabold tracking-wider text-[#059669] uppercase">
                BILLED TO (CUSTOMER)
              </p>
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 border border-gray-200">
                  <User className="w-3.5 h-3.5" />
                </div>
                <span className="font-extrabold text-base text-gray-900">
                  {customer.name}
                </span>
              </div>
              {customer.phone && (
                <div className="flex items-center gap-2 text-xs text-gray-500 pl-9 font-mono">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  <span>{customer.phone}</span>
                </div>
              )}
            </div>

            {/* Right Card: Total Credit Due */}
            <div className="sm:col-span-2 bg-white border border-gray-200/80 rounded-2xl p-4 flex items-center gap-3.5 shadow-2xs">
              <div className="w-11 h-11 rounded-2xl bg-[#ffedd5] text-[#f97316] flex items-center justify-center shrink-0">
                <Wallet className="w-5.5 h-5.5" />
              </div>
              <div>
                <p className="text-[10px] font-extrabold tracking-wider text-[#059669] uppercase">
                  TOTAL CREDIT DUE
                </p>
                <p className="text-2xl font-black text-amber-500 mt-0.5">
                  {formatIndianCurrency(totalBillAmount)}
                </p>
              </div>
            </div>
          </div>

          {/* Itemized Pending Credit Consumptions Section */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5">
              <h3 className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">
                ITEMIZED PENDING CREDIT CONSUMPTIONS
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-[#dcfce7] text-[#15803d] font-extrabold text-[10px] uppercase">
                {pendingCreditItems.length} ITEMS
              </span>
            </div>

            {/* Table Container */}
            <div className="border border-gray-200/80 rounded-2xl overflow-hidden bg-white">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-[#ecfdf5] text-[#065f46] font-extrabold text-[11px] tracking-wider border-b border-gray-200/80">
                  <tr>
                    <th className="py-3 px-3 text-center w-10">#</th>
                    <th className="py-3 px-4">DATE & TIME</th>
                    <th className="py-3 px-4">ITEM / PRODUCT NAME</th>
                    <th className="py-3 px-4 text-center">QTY</th>
                    <th className="py-3 px-4 text-right">AMOUNT (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-gray-900 bg-white">
                  {pendingCreditItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-400">
                        No pending credit items found.
                      </td>
                    </tr>
                  ) : (
                    pendingCreditItems.map((item, idx) => {
                      const iconStyle = PASTEL_ICONS[idx % PASTEL_ICONS.length]
                      const IconComp = iconStyle.icon
                      const dt = new Date(item.date)
                      const dateStr = dt.toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })
                      const timeStr = dt.toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })

                      // Clean up productName / notes display
                      let nameDisplay = item.productName || item.notes || 'Loyalty Credit Consumption'
                      if (nameDisplay.startsWith('Consumption: ')) {
                        nameDisplay = nameDisplay.replace('Consumption: ', '')
                      }

                      return (
                        <tr key={item.id || idx} className="hover:bg-gray-50/60 transition-colors">
                          {/* Index Badge */}
                          <td className="py-3.5 px-3 text-center">
                            <div className="w-7 h-7 rounded-lg bg-[#ecfdf5] text-[#047857] font-extrabold text-xs flex items-center justify-center mx-auto">
                              {idx + 1}
                            </div>
                          </td>

                          {/* Date & Time */}
                          <td className="py-3.5 px-4 text-xs whitespace-nowrap text-gray-500">
                            <div className="font-semibold text-gray-800">{dateStr}</div>
                            <div className="text-[11px] text-gray-400 mt-0.5">{timeStr}</div>
                          </td>

                          {/* Product Name + Icon */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${iconStyle.bg}`}
                              >
                                <IconComp className="w-4 h-4" />
                              </div>
                              <span className="font-bold text-gray-900 text-sm">
                                {nameDisplay}
                              </span>
                            </div>
                          </td>

                          {/* Qty Badge */}
                          <td className="py-3.5 px-4 text-center">
                            <span className="px-2.5 py-1 rounded-lg bg-gray-100 border border-gray-200/60 text-gray-700 font-semibold text-xs inline-block">
                              {item.qty ? `${item.qty} ${item.unit || ''}`.trim() : '1'}
                            </span>
                          </td>

                          {/* Amount */}
                          <td className="py-3.5 px-4 text-right font-black text-amber-500 text-sm whitespace-nowrap">
                            {formatIndianCurrency(item.amount)}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3.5 pt-1">
            {/* Left Notice to Customer */}
            <div className="sm:col-span-3 bg-[#f0f9ff] border border-[#e0f2fe] rounded-2xl p-4 flex gap-3 shadow-2xs">
              <div className="w-6 h-6 rounded-full bg-[#0284c7] text-white flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                <Info className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-gray-900 mb-0.5">Notice to Customer</h4>
                <p className="text-[11.5px] text-gray-500 leading-relaxed">
                  Please review and settle this pending credit statement. Thank you for your continued business!
                </p>
              </div>
            </div>

            {/* Right Total Amount Due */}
            <div className="sm:col-span-2 bg-gray-50/80 border border-gray-200/80 rounded-2xl p-4 flex flex-col justify-center items-center text-center shadow-2xs">
              <p className="text-[10px] font-extrabold tracking-wider text-gray-400 uppercase">
                TOTAL AMOUNT DUE
              </p>
              <p className="text-2xl font-black text-amber-500 mt-1">
                {formatIndianCurrency(totalBillAmount)}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions (Hidden during print) */}
        <div className="p-4 sm:p-5 border-t border-gray-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 no-print">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl font-bold text-xs cursor-pointer transition-all flex items-center justify-center gap-1.5"
          >
            <X className="w-4 h-4" />
            <span>Close</span>
          </button>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {customer.creditBalance > 0 && (
              <button
                onClick={() => {
                  onClose()
                  onOpenSettleModal()
                }}
                className="flex-1 sm:flex-none px-4 py-2.5 border border-[#10b981]/30 text-[#059669] bg-[#ecfdf5] hover:bg-[#dcfce7] rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Settle Balance Now</span>
              </button>
            )}

            <button
              onClick={() => exportCreditBillToExcel(customer, pendingCreditItems)}
              className="flex-1 sm:flex-none px-5 py-2.5 bg-[#059669] hover:bg-[#047857] text-white rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-white" />
              <span>Export Excel (.xlsx)</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
