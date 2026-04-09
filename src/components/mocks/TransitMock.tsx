import { CheckCircle, Truck } from "lucide-react"

/* ===== Mock: Transit ===== */
export const TransitMock = () => {
  const rows = [
    { ref: 'TRF/26-27/001', from: 'Warehouse Alpha', to: 'Site Beta', date: 'Apr 7, 2026', amt: '₹3,465', st: 'transit' },
    { ref: 'TRF/26-27/002', from: 'Main Depot', to: 'Project Gamma', date: 'Apr 5, 2026', amt: '₹1,840', st: 'transit' },
    { ref: 'TRF/26-27/003', from: 'Supplier Node', to: 'Site Beta', date: 'Aug 9, 2025', amt: '₹1,050', st: 'completed' },
    { ref: 'TRF/26-27/004', from: 'Warehouse Alpha', to: 'Omega Zone', date: 'Mar 25, 2026', amt: '₹3,660', st: 'completed' },
  ]

  return (
    <div className="bg-[#fafafa] rounded-2xl overflow-hidden border border-neutral-200 hover:-translate-y-1 transition-all duration-400">
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#e8e8e8] border-b border-[#ddd]">
        <div className="flex gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#ff605c]" /><span className="w-2.5 h-2.5 rounded-full bg-[#ffbd44]" /><span className="w-2.5 h-2.5 rounded-full bg-[#00ca4e]" /></div>
        <span className="px-10 py-1 bg-[#f5f5f5] border border-[#ddd] rounded-md text-[11px] text-neutral-500">app.invensync.in/transit</span>
        <div className="w-14" />
      </div>
      <div className="p-5 font-body max-h-[320px] overflow-hidden relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-16 after:bg-gradient-to-t after:from-[#fafafa] after:to-transparent">
        <div className="mb-3"><h3 className="text-[17px] font-bold text-neutral-900 font-display">Transit Management</h3><p className="text-[11px] text-neutral-400">Track inventory transfers between sites</p></div>
        <div className="border border-neutral-200 rounded-lg overflow-x-auto">
          <div className="min-w-[500px]">
            <div className="flex px-3 py-2 gap-1.5 text-[9px] font-bold uppercase tracking-wide text-neutral-500 bg-neutral-50 border-b border-neutral-200">
              <span className="flex-[1.5] min-w-0">Reference</span><span className="flex-[1.2] min-w-0">From</span><span className="flex-[1.2] min-w-0">To</span><span className="flex-1 min-w-0">Date</span><span className="flex-[0.8] text-right min-w-0">Amount</span><span className="flex-1 text-right min-w-0">Status</span>
            </div>
            {rows.map((r, i) => (
              <div key={i} className="flex px-3 py-2.5 gap-1.5 text-[10px] text-neutral-600 border-b border-neutral-100 last:border-none items-center hover:bg-neutral-50 transition-colors">
                <span className="flex-[1.5] font-semibold text-neutral-800 whitespace-nowrap min-w-0 truncate">{r.ref}</span>
                <span className="flex-[1.2] min-w-0 truncate">● {r.from}</span>
                <span className="flex-[1.2] min-w-0 truncate">● {r.to}</span>
                <span className="flex-1 min-w-0 whitespace-nowrap truncate">{r.date}</span>
                <span className="flex-[0.8] text-right font-semibold text-neutral-800 min-w-0">{r.amt}</span>
                <span className="flex-1 text-right flex justify-end shrink-0">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-semibold whitespace-nowrap ${r.st === 'transit' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                    {r.st === 'transit' ? <><Truck size={9} /> In Transit</> : <><CheckCircle size={9} /> Done</>}
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
