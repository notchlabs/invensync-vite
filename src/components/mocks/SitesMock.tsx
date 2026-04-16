import { Clock, Edit2, MapPin, Plus } from "lucide-react"

/* ===== Mock: Sites ===== */
export const SitesMock = () => {
  const sites = [
    { name: 'Site Alpha', loc: 'Downtown District', date: '01 Nov, 2025 –', val: '₹0', st: 'active' },
    { name: 'Warehouse Beta', loc: 'Industrial Park', date: '15 Oct, 2025 –', val: '₹2.39 L', st: 'active' },
    { name: 'Gamma Facility', loc: 'Northern Division', date: '20 Mar, 2025 –', val: '₹72.58 L', st: 'active' },
    { name: 'Delta Office', loc: 'Central Zone', date: '08 Jul, 2025 –', val: '₹30.57 L', st: 'active' },
    { name: 'Omega Site', loc: 'East Sector', date: '08 Jul, 2025 –', val: '₹14 L', st: 'active' },
    { name: 'Sigma Block', loc: 'West End', date: 'Jan \'22 – Jul \'23', val: '₹3.11 L', st: 'done' },
  ]

  return (
    <div className="bg-app rounded-2xl overflow-hidden border border-border-main hover:-translate-y-1 transition-all duration-400">
      <div className="flex items-center justify-between px-4 py-2.5 bg-header border-b border-border-main">
        <div className="flex gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#ff605c]" /><span className="w-2.5 h-2.5 rounded-full bg-[#ffbd44]" /><span className="w-2.5 h-2.5 rounded-full bg-[#00ca4e]" /></div>
        <span className="px-10 py-1 bg-surface border border-border-main rounded-md text-[11px] text-muted-text">app.invensync.in/sites</span>
        <div className="w-14" />
      </div>
      <div className="p-5 font-body max-h-[360px] overflow-hidden overflow-y-auto custom-scrollbar relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-16 after:bg-gradient-to-t after:from-app after:to-transparent">
        <div className="flex items-start justify-between mb-3">
          <div><h3 className="text-[17px] font-bold text-primary-text font-display">All Sites</h3><p className="text-[11px] text-muted-text">Manage and monitor all your sites</p></div>
          <button className="inline-flex items-center gap-1 px-3 py-1.5 text-[10px] font-semibold bg-neutral-900 text-white rounded-md cursor-default shrink-0"><Plus size={11} /> Create Site</button>
        </div>
        <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-3 pb-8">
          {sites.map((s, i) => (
            <div key={i} className="bg-card border border-border-main rounded-xl p-3.5 hover:-rotate-1 hover:border-muted-text transition-all duration-300">
              <div className="flex justify-between items-center mb-2">
                <strong className="text-[13px] text-primary-text truncate pr-2">{s.name}</strong>
                <span className="w-7 h-7 shrink-0 flex items-center justify-center border border-border-main rounded-md"><Edit2 size={10} className="text-muted-text" /></span>
              </div>
              <div className="flex flex-col gap-0.5 text-[10px] text-muted-text mb-3">
                <span className="flex items-center gap-1"><MapPin size={10} className="shrink-0" /> <span className="truncate">{s.loc}</span></span>
                <span className="flex items-center gap-1"><Clock size={10} className="shrink-0" /> <span className="truncate">{s.date}</span></span>
              </div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2">
                <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${s.st === 'active' ? 'bg-orange-50 border border-orange-100 text-orange-600' : 'bg-emerald-50 border border-emerald-100 text-emerald-600'}`}>
                  {s.st === 'active' ? 'In Progress' : 'Completed'}
                </span>
                <span className="text-left sm:text-right text-[10px] text-muted-text">Inventory Value<br /><strong className="text-[13px] text-primary-text">{s.val}</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
