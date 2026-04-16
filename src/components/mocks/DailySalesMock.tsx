import { CreditCard, FileText, Package, Store, TrendingUp } from "lucide-react"

export /* ===== Mock: Daily Sales ===== */
const DailySalesMock = () => {
  return (
    <div className="bg-app rounded-2xl overflow-hidden border border-border-main hover:-translate-y-1 transition-all duration-400">
      <div className="flex items-center justify-between px-4 py-2.5 bg-header border-b border-border-main">
        <div className="flex gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#ff605c]" /><span className="w-2.5 h-2.5 rounded-full bg-[#ffbd44]" /><span className="w-2.5 h-2.5 rounded-full bg-[#00ca4e]" /></div>
        <span className="px-10 py-1 bg-surface border border-border-main rounded-md text-[11px] text-muted-text">app.invensync.in/daily-sales</span>
        <div className="w-14" />
      </div>
      <div className="font-body max-h-[380px] overflow-hidden overflow-y-auto custom-scrollbar bg-card p-5 relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-16 after:bg-gradient-to-t after:from-card after:to-transparent">
        <div className="flex justify-between items-center pb-3 border-b border-border-main mb-4 pb-4">
            <div>
                <div className="text-[14px] font-bold text-primary-text">09 Apr 2026</div>
                <div className="text-[10px] text-muted-text font-medium">Thursday</div>
            </div>
            <div className="flex gap-5 text-[11px]">
                <div className="hidden sm:block"><span className="text-muted-text uppercase tracking-widest text-[8px] font-bold mr-1.5">Sale</span><strong className="text-primary-text">₹1,673</strong></div>
                <div className="border-l border-border-main pl-5 hidden sm:block"><span className="text-muted-text uppercase tracking-widest text-[8px] font-bold mr-1.5">Purchase</span><strong className="text-primary-text">₹957.79</strong></div>
                <div className="text-right border-l border-border-main pl-5">
                    <span className="text-muted-text uppercase tracking-widest text-[8px] font-bold mr-1.5">Profit</span><strong className="text-primary-text">₹715.21</strong>
                    <div className="text-emerald-500 font-bold text-[10px] mt-0.5">+43%</div>
                </div>
            </div>
        </div>

        <div className="mb-4">
            <h4 className="text-[16px] font-bold text-primary-text font-display">Day Report – 09 Apr</h4>
            <p className="text-[10px] text-muted-text mb-4">Detailed breakdown of sales and performance</p>

            <div className="bg-[#1f1f1f] text-white rounded-xl p-5 relative overflow-hidden flex flex-col justify-center mb-4">
                <div className="text-[10px] text-neutral-400 mb-1 font-bold tracking-wide">Day's Profit</div>
                <div className="text-[32px] font-bold tracking-tight leading-none mb-2 font-display">₹715.21</div>
                <div className="text-[12px] text-emerald-400 font-medium">42.8% margin</div>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 p-2.5 bg-white/10 rounded-xl backdrop-blur-sm"><TrendingUp size={20} className="text-emerald-400" /></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4"></div>
            </div>

            <div className="grid grid-cols-3 max-sm:grid-cols-1 gap-2.5 mb-6">
                <div className="border border-border-main rounded-xl p-3 bg-surface flex flex-col">
                    <div className="text-[10px] font-bold text-primary-text mb-3 flex items-center gap-1.5"><Store size={12} className="text-blue-500" /> Sale Formation</div>
                    <div className="flex justify-between text-[10px] mb-1"><span className="text-secondary-text">WBC Sale</span><strong>₹0</strong></div>
                    <div className="flex justify-between text-[10px] mb-2"><span className="text-secondary-text">W Store Sale</span><strong>₹0</strong></div>
                    <div className="flex justify-between text-[11px] pt-2 border-t border-border-main mt-auto"><strong className="text-primary-text">Total Sale</strong><strong>₹0</strong></div>
                </div>
                <div className="border border-border-main rounded-xl p-3 bg-surface flex flex-col">
                    <div className="text-[10px] font-bold text-primary-text mb-3 flex items-center gap-1.5"><FileText size={12} className="text-orange-500" /> Billing Breakup</div>
                    <div className="flex justify-between text-[10px] mb-1"><span className="text-secondary-text">Billed (MOP)</span><strong>₹0</strong></div>
                    <div className="flex justify-between text-[10px] mb-3"><span className="text-secondary-text">Non-Billed</span><strong>₹0</strong></div>
                    <div className="w-full h-1 bg-border-main rounded-full mt-auto overflow-hidden"><div className="w-0 h-full bg-orange-400" /></div>
                    <div className="text-[9px] text-muted-text mt-1.5 font-semibold">0% billed</div>
                </div>
                <div className="border border-border-main rounded-xl p-3 bg-surface flex flex-col">
                    <div className="text-[10px] font-bold text-primary-text mb-3 flex items-center gap-1.5"><CreditCard size={12} className="text-purple-500" /> Payment Mode</div>
                    <div className="flex justify-between text-[10px] mb-1"><span className="text-secondary-text">UPI / Card</span><strong>₹0</strong></div>
                    <div className="flex justify-between text-[10px] mb-1"><span className="text-secondary-text">Cash</span><strong>₹0</strong></div>
                    <div className="flex justify-between text-[10px] mb-2"><span className="text-secondary-text">Loyalty</span><strong>₹0</strong></div>
                    <div className="flex justify-between text-[9px] text-muted-text font-semibold mt-auto pt-2 border-t border-border-main"><span>0% Digital</span><span>0% Cash</span></div>
                </div>
            </div>

            <div className="text-[13px] font-bold text-primary-text mb-3">Products Sold (30)</div>
            <div className="flex flex-col gap-2 pb-10">
                <div className="border border-border-main rounded-xl p-3 flex justify-between items-center hover:border-muted-text transition-colors">
                   <div className="flex gap-3 items-center">
                      <div className="w-9 h-9 bg-purple-50 rounded-lg flex items-center justify-center relative border border-purple-100 shrink-0">
                         <span className="absolute -top-1.5 -right-1.5 bg-neutral-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full border-2 border-card">x2</span>
                         <Package size={16} className="text-purple-600" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                         <strong className="text-[12px] text-primary-text">Munch 5/-</strong>
                         <div className="text-[9px] text-muted-text flex flex-wrap gap-x-2 gap-y-0.5 mt-0.5"><span className="font-semibold text-secondary-text">Cash ₹10</span><span>UPI ₹0</span><span>No Bill ₹0</span></div>
                         <div className="text-[9px] text-muted-text">Purchase <span className="line-through decoration-muted-text/30">₹9.07</span></div>
                      </div>
                   </div>
                   <div className="text-right shrink-0">
                      <div className="text-[10px] text-muted-text font-medium mb-1">07:54 AM</div>
                      <strong className="text-[14px] text-primary-text font-display">₹10</strong>
                   </div>
                </div>
                <div className="border border-border-main rounded-xl p-3 flex justify-between items-center hover:border-muted-text transition-colors">
                   <div className="flex gap-3 items-center">
                      <div className="w-9 h-9 bg-orange-50 rounded-lg flex items-center justify-center relative border border-orange-100 shrink-0">
                         <span className="absolute -top-1.5 -right-1.5 bg-neutral-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full border-2 border-card">x1</span>
                         <Package size={16} className="text-orange-600" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                         <strong className="text-[12px] text-primary-text">Magic Masala Makhana</strong>
                         <div className="text-[9px] text-muted-text flex flex-wrap gap-x-2 gap-y-0.5 mt-0.5"><span>Cash ₹0</span><span className="font-semibold text-secondary-text">UPI ₹149</span><span>No Bill ₹0</span></div>
                         <div className="text-[9px] text-muted-text">Purchase <span className="line-through decoration-muted-text/30">₹121.29</span></div>
                      </div>
                   </div>
                   <div className="text-right shrink-0">
                      <div className="text-[10px] text-muted-text font-medium mb-1">08:55 AM</div>
                      <strong className="text-[14px] text-primary-text font-display">₹149</strong>
                   </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  )
}
