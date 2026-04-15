import { Sparkles } from "lucide-react"

const rows = [
  { name: 'CADBURY GEMS SURP CHCLT BL TY 14.69G PET', qty: 150, packets: 10, lotSize: 15 },
  { name: 'NESTLE MUNCH MAX CHOCOLATE', qty: 100, packets: 10, lotSize: 10 },
  { name: 'BINGO ACHARI MASTI MAD ANGLES 60G', qty: 100, packets: 10, lotSize: 10 },
  { name: 'KURKURE PUFFCORN CHEESE 52g PP', qty: 100, packets: 10, lotSize: 10 },
  { name: 'AMUL KOOL CAFE FLAVOURED MILK 200ML PET', qty: 100, packets: 5, lotSize: 20 },
  { name: 'CAMPA JEERA UP MASALA 150ML PET', qty: 100, packets: 5, lotSize: 20 },
]

export const PurchaseOrderMock = () => {
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
          app.invensync.in/purchase-orders
        </span>
        <div className="w-14" />
      </div>

      <div className="p-5 font-body max-h-[340px] overflow-hidden relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-16 after:bg-gradient-to-t after:from-[#fafafa] after:to-transparent">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="text-[17px] font-bold text-neutral-900 font-display">Purchase Order</h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 border border-blue-100 rounded-full text-[9px] font-bold text-blue-600 uppercase tracking-wide">
                <Sparkles size={8} /> AI Powered
              </span>
            </div>
            <p className="text-[11px] text-neutral-400">Select vendors, set your budget, and let AI generate optimised orders.</p>
          </div>
        </div>

        {/* AI Strategy Analysis box */}
        <div className="bg-white border border-neutral-200 rounded-xl p-3 mb-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Sparkles size={11} className="text-blue-500" />
            <span className="text-[11px] font-bold text-neutral-800">AI Strategy Analysis</span>
          </div>
          <p className="text-[10px] text-neutral-500 leading-relaxed line-clamp-2">
            The recommended purchase order focuses on rapidly replenishing zero-stock items that exhibit the highest daily consumption rates. Top priorities include fast-moving chocolates, high-turnover snacks, and critical low-inventory items.
          </p>
        </div>

        {/* Table */}
        <div className="border border-neutral-200 rounded-lg overflow-hidden">
          <div className="flex px-3 py-2 gap-2 text-[9px] font-bold uppercase tracking-wide text-neutral-500 bg-neutral-50 border-b border-neutral-200">
            <span className="w-5 shrink-0">#</span>
            <span className="flex-1 min-w-0">Product</span>
            <span className="w-10 text-right shrink-0">QTY</span>
            <span className="w-12 text-right shrink-0">Packets</span>
            <span className="w-14 text-right shrink-0">Lot Size</span>
          </div>
          {rows.map((r, i) => (
            <div key={i} className="flex px-3 py-2 gap-2 text-[10px] border-b border-neutral-100 last:border-none items-center hover:bg-neutral-50 transition-colors">
              <span className="w-5 shrink-0 text-neutral-400 font-medium">{i + 1}</span>
              <span className="flex-1 min-w-0 truncate font-semibold text-neutral-800">{r.name}</span>
              <span className="w-10 text-right font-bold text-neutral-900 shrink-0">{r.qty}</span>
              <span className="w-12 text-right text-neutral-600 shrink-0">{r.packets}</span>
              <span className="w-14 text-right text-neutral-600 shrink-0">{r.lotSize}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
