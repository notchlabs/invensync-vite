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
    <div className="bg-app rounded-2xl overflow-hidden border border-border-main hover:-translate-y-1 transition-all duration-400">
      <div className="flex items-center justify-between px-4 py-2.5 bg-header border-b border-border-main">
        <div className="flex gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#ff605c]" /><span className="w-2.5 h-2.5 rounded-full bg-[#ffbd44]" /><span className="w-2.5 h-2.5 rounded-full bg-[#00ca4e]" /></div>
        <span className="px-10 py-1 bg-surface border border-border-main rounded-md text-[11px] text-muted-text">app.invensync.in/transit</span>
        <div className="w-14" />
      </div>
      <div className="p-5 font-body max-h-[320px] overflow-hidden relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-16 after:bg-gradient-to-t after:from-app after:to-transparent">
        <div className="mb-3"><h3 className="text-[17px] font-bold text-primary-text font-display">Transit Management</h3><p className="text-[11px] text-muted-text">Track inventory transfers between sites</p></div>
        <div className="border border-border-main rounded-lg overflow-x-auto">
          <div className="min-w-[500px]">
            <div className="flex px-3 py-2 gap-1.5 text-[9px] font-bold uppercase tracking-wide text-muted-text bg-surface border-b border-border-main">
              <span className="flex-[1.5] min-w-0">Reference</span><span className="flex-[1.2] min-w-0">From</span><span className="flex-[1.2] min-w-0">To</span><span className="flex-1 min-w-0">Date</span><span className="flex-[0.8] text-right min-w-0">Amount</span><span className="flex-1 text-right min-w-0">Status</span>
            </div>
            {rows.map((r, i) => (
              <div key={i} className="flex px-3 py-2.5 gap-1.5 text-[10px] text-secondary-text border-b border-border-main/50 last:border-none items-center hover:bg-surface transition-colors">
                <span className="flex-[1.5] font-semibold text-primary-text whitespace-nowrap min-w-0 truncate">{r.ref}</span>
                <span className="flex-[1.2] min-w-0 truncate">● {r.from}</span>
                <span className="flex-[1.2] min-w-0 truncate">● {r.to}</span>
                <span className="flex-1 min-w-0 whitespace-nowrap truncate">{r.date}</span>
                <span className="flex-[0.8] text-right font-semibold text-primary-text min-w-0">{r.amt}</span>
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
