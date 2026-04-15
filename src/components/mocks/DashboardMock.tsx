import { TrendingUp, TrendingDown, BarChart2, ShoppingCart } from "lucide-react"

const months = [
  { label: 'Oct 2025', val: '₹7,018', pos: true },
  { label: 'Nov 2025', val: '₹25,779', pos: true },
  { label: 'Dec 2025', val: '₹45,394', pos: true },
  { label: 'Jan 2026', val: '₹28,959', pos: true },
  { label: 'Feb 2026', val: '-₹33,123', pos: false },
  { label: 'Mar 2026', val: '-₹35,475', pos: false },
  { label: 'Apr 2026', val: '₹466', pos: true, now: true },
]

export const DashboardMock = () => {
  return (
    <div className="bg-[#fafafa] rounded-2xl overflow-hidden border border-neutral-200 hover:-translate-y-1 transition-all duration-400">
      {/* Browser chrome */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#e8e8e8] border-b border-[#ddd]">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ff605c]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd44]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#00ca4e]" />
        </div>
        <span className="px-10 py-1 bg-[#f5f5f5] border border-[#ddd] rounded-md text-[11px] text-neutral-500">
          app.invensync.in/dashboard
        </span>
        <div className="w-14" />
      </div>

      <div className="p-5 font-body max-h-[380px] overflow-hidden relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-16 after:bg-gradient-to-t after:from-[#fafafa] after:to-transparent">
        {/* Page title */}
        <div className="mb-4">
          <h3 className="text-[17px] font-bold text-neutral-900 font-display">Dashboard</h3>
          <p className="text-[10px] text-neutral-400">Site performance at a glance</p>
        </div>

        {/* Top stats row */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[
            { label: "Today's Consumption", val: '315.58', trend: '-93%', down: true, Icon: ShoppingCart },
            { label: 'Consumption till date', val: '70,392', trend: '+11%', down: false, Icon: BarChart2 },
            { label: 'Projected Consumption', val: '1,40,784', trend: '+5%', down: false, Icon: TrendingUp },
            { label: 'Projected Sales', val: '2,11,763', trend: '+2%', down: false, Icon: TrendingUp },
          ].map((s, i) => (
            <div key={i} className="bg-white border border-neutral-200 rounded-xl p-2.5">
              <p className="text-[8px] text-neutral-400 font-semibold mb-1 leading-tight">{s.label}</p>
              <p className="text-[13px] font-bold text-neutral-900 leading-none mb-1">{s.val}</p>
              <span className={`text-[8px] font-bold ${s.down ? 'text-red-500' : 'text-emerald-500'}`}>{s.trend}</span>
            </div>
          ))}
        </div>

        {/* Capital & Recovery */}
        <p className="text-[11px] font-bold text-neutral-800 mb-1">Capital &amp; Recovery</p>
        <p className="text-[9px] text-neutral-400 mb-2.5">Investment breakdown and break-even tracking</p>

        <div className="grid grid-cols-3 gap-2 mb-4">
          {/* Capital Invested */}
          <div className="bg-white border border-neutral-200 rounded-xl p-3 col-span-1">
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-5 h-5 rounded-md bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                <BarChart2 size={10} className="text-indigo-500" />
              </div>
              <span className="text-[8px] font-bold text-neutral-500 uppercase tracking-wide">Capital Invested</span>
            </div>
            <p className="text-[18px] font-bold text-neutral-900 leading-none mb-2.5">₹11.18 L</p>
            <div className="w-full h-1 rounded-full bg-neutral-100 overflow-hidden mb-1.5">
              <div className="h-full bg-indigo-400 rounded-full" style={{ width: '89%' }} />
            </div>
            <div className="flex justify-between text-[8px] text-neutral-500 font-medium">
              <span>Fixed <strong className="text-neutral-700">₹9.95 L</strong></span>
              <span>Working <strong className="text-neutral-700">₹1.22 L</strong></span>
            </div>
          </div>

          {/* Expense + Burn */}
          <div className="flex flex-col gap-2">
            <div className="bg-white border border-neutral-200 rounded-xl p-2.5 flex-1">
              <p className="text-[7.5px] font-bold text-neutral-500 uppercase tracking-wide mb-1">This Month Expense</p>
              <p className="text-[16px] font-bold text-neutral-900 leading-none">₹1.07 L</p>
            </div>
            <div className="bg-white border border-neutral-200 rounded-xl p-2.5 flex-1">
              <p className="text-[7.5px] font-bold text-neutral-500 uppercase tracking-wide mb-1">Avg Burn / Month</p>
              <p className="text-[16px] font-bold text-neutral-900 leading-none">₹1.05 L</p>
              <span className="text-[7.5px] font-bold text-amber-500">↑ Above avg</span>
            </div>
          </div>

          {/* Recovery donut */}
          <div className="bg-white border border-neutral-200 rounded-xl p-3 flex flex-col items-center justify-center">
            <p className="text-[7.5px] font-bold text-neutral-500 uppercase tracking-wide mb-2">Recovery</p>
            {/* Simple SVG donut */}
            <div className="relative w-14 h-14 mb-2">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="14" fill="none" stroke="#f3f4f6" strokeWidth="4" />
                <circle cx="18" cy="18" r="14" fill="none" stroke="#6366f1" strokeWidth="4"
                  strokeDasharray="87.96" strokeDashoffset="74.27" strokeLinecap="round" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-neutral-900">16%</span>
            </div>
            <p className="text-[9px] font-bold text-neutral-700">Recovered <span className="text-indigo-600">₹1.73 L</span></p>
            <p className="text-[8px] text-neutral-400 mt-0.5">~39 months to break-even</p>
          </div>
        </div>

        {/* Profit / Loss Overview */}
        <p className="text-[11px] font-bold text-neutral-800 mb-1">Profit / Loss Overview</p>
        <p className="text-[9px] text-neutral-400 mb-2.5">Monthly profit and loss breakdown</p>

        <div className="flex gap-2 flex-wrap">
          {months.map((m, i) => (
            <div key={i} className={`flex flex-col gap-1 px-2.5 py-2 rounded-lg border text-[9px] font-medium min-w-[70px] ${
              m.now
                ? 'border-neutral-300 bg-neutral-900 text-white'
                : m.pos
                  ? 'border-emerald-100 bg-emerald-50 text-neutral-700'
                  : 'border-red-100 bg-red-50 text-neutral-700'
            }`}>
              {m.now && <span className="text-[7px] font-bold text-neutral-400 uppercase tracking-wide">NOW</span>}
              <span className={m.now ? 'text-neutral-400' : 'text-neutral-500'}>{m.label}</span>
              <span className={`font-bold text-[10px] ${m.now ? 'text-white' : m.pos ? 'text-emerald-600' : 'text-red-500'}`}>
                {m.pos ? <TrendingUp size={8} className="inline mr-0.5" /> : <TrendingDown size={8} className="inline mr-0.5" />}
                {m.val}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
