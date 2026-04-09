import { FileText } from "lucide-react"

/* ===== Mock: Ledger ===== */
export const LedgerMock = () => {
  const rows = [
    { date: '08 Apr', ref: 'INV-892', vendor: 'UltraTech Dealers', amt: '₹45,000', paid: '₹20,000', bal: '₹25,000', st: 'partial' },
    { date: '05 Apr', ref: 'BILL-14A', vendor: 'JSW Steel Dist.', amt: '₹12,400', paid: '₹12,400', bal: '₹0', st: 'paid' },
    { date: '28 Mar', ref: 'GST-992', vendor: 'Asian Paints', amt: '₹8,500', paid: '₹0', bal: '₹8,500', st: 'overdue' },
    { date: '25 Mar', ref: 'TX-102', vendor: 'Local Sand Supplier', amt: '₹15,000', paid: '₹15,000', bal: '₹0', st: 'paid' },
  ]
  return (
    <div className="bg-[#fafafa] rounded-2xl overflow-hidden border border-neutral-200 hover:-translate-y-1 transition-all duration-400">
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#e8e8e8] border-b border-[#ddd]">
        <div className="flex gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#ff605c]" /><span className="w-2.5 h-2.5 rounded-full bg-[#ffbd44]" /><span className="w-2.5 h-2.5 rounded-full bg-[#00ca4e]" /></div>
        <span className="px-10 py-1 bg-[#f5f5f5] border border-[#ddd] rounded-md text-[11px] text-neutral-500">app.invensync.in/ledger</span>
        <div className="w-14" />
      </div>
      <div className="p-5 font-body max-h-[350px] overflow-hidden relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-16 after:bg-gradient-to-t after:from-[#fafafa] after:to-transparent">
        <div className="mb-5 flex items-center justify-between">
          <div><h3 className="text-[17px] font-bold text-neutral-900 font-display">Vendor Ledger</h3><p className="text-[11px] text-neutral-400">Manage vendor payments and dues</p></div>
          <div className="text-right shrink-0 ml-2">
            <div className="text-[9px] text-neutral-400 uppercase font-bold tracking-wider mb-0.5">Total Payable</div>
            <div className="text-[20px] font-bold text-red-600 tracking-tight leading-none">₹33,500</div>
          </div>
        </div>

        <div className="border border-neutral-200 rounded-lg overflow-x-auto">
          <div className="min-w-[500px]">
            <div className="flex px-3 py-2.5 gap-1 text-[9px] font-bold uppercase tracking-wide text-neutral-500 bg-neutral-50 border-b border-neutral-200">
              <span className="w-12 block">Date</span><span className="flex-1 block">Vendor</span><span className="w-16 text-right block">Amount</span><span className="w-16 text-right block">Balance</span><span className="w-16 text-right block flex justify-end">Status</span>
            </div>
            {rows.map((r, i) => (
              <div key={i} className="flex px-3 py-3 gap-1 text-[10px] text-neutral-600 border-b border-neutral-100 last:border-none items-center hover:bg-neutral-50 transition-colors">
                <span className="w-12 block">{r.date}</span>
                <span className="flex-1 font-semibold text-neutral-800 flex flex-col gap-0.5">
                  {r.vendor}
                  <span className="text-[8px] text-neutral-400 font-normal flex items-center gap-1"><FileText size={8} /> {r.ref}</span>
                </span>
                <span className="w-16 text-right block">{r.amt}</span>
                <span className="w-16 text-right font-bold text-neutral-900 block">{r.bal}</span>
                <span className="w-16 flex justify-end">
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold tracking-wide border ${r.st === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : r.st === 'partial' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                    {r.st === 'paid' ? 'Paid' : r.st === 'partial' ? 'Partial' : 'Overdue'}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
