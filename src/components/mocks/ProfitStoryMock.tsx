import { Box, Factory, PenTool, Tag, Trophy, Users } from "lucide-react"

/* ===== Mock: Profit Story ===== */
export const ProfitStoryMock = () => {
    return (
        <div className="bg-app rounded-2xl overflow-hidden border border-border-main hover:-translate-y-1 transition-all duration-500 group">
           <div className="flex items-center justify-between px-4 py-2.5 bg-header border-b border-border-main">
               <div className="flex gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#ff605c]" /><span className="w-2.5 h-2.5 rounded-full bg-[#ffbd44]" /><span className="w-2.5 h-2.5 rounded-full bg-[#00ca4e]" /></div>
               <span className="px-10 py-1 bg-surface border border-border-main rounded-md text-[11px] text-muted-text">app.invensync.in/flow</span>
               <div className="w-14" />
           </div>

           <div className="p-8 bg-card max-md:p-5 h-[380px] flex items-center overflow-x-auto relative custom-scrollbar">

               {/* Animated flow line */}
               <div className="absolute top-1/2 left-10 w-[800px] h-[2px] bg-border-main -translate-y-1/2 z-[1]" />
               <div className="absolute top-1/2 left-10 w-[800px] h-[2px] bg-gradient-to-r from-orange-400 via-blue-500 to-emerald-500 -translate-y-1/2 z-[2] animate-[slide-right-fast_3s_linear_infinite]" style={{ backgroundSize: '200% 100%' }} />

               <div className="flex items-center gap-12 min-w-max relative z-10 px-4 h-full">

                   {/* 1. Raw Materials */}
                   <div className="flex flex-col items-center bg-card p-2 hover:-translate-y-2 transition-transform duration-300">
                       <span className="text-[9px] font-bold text-muted-text uppercase tracking-widest mb-3 hover:text-secondary-text transition-colors">Raw Materials</span>
                       <div className="w-24 h-24 rounded-full bg-card border border-border-main shadow-sm flex flex-col items-center justify-center p-3 relative bg-clip-padding">
                           <div className="flex flex-wrap justify-center gap-1.5 mb-1.5 text-muted-text">
                              <Box size={14} /><PenTool size={14} /><Users size={14} />
                           </div>
                           <div className="text-[7px] font-bold text-muted-text text-center leading-tight">WOOD, PAINT, LABOR</div>
                       </div>
                       <div className="mt-4 bg-surface border border-border-main rounded-lg px-3 py-2 text-center w-[130px]">
                           <div className="text-[11px] font-bold text-primary-text tracking-wide">₹8k <span className="text-muted-text font-normal">+ 0.5k</span><br /> <span className="text-muted-text font-normal">+ 1.2k + 3k</span></div>
                       </div>
                   </div>

                   {/* 2. Production */}
                   <div className="flex flex-col items-center bg-card p-2 hover:-translate-y-2 transition-transform duration-300 delay-75">
                       <span className="text-[9px] font-bold text-muted-text uppercase tracking-widest mb-3 hover:text-secondary-text transition-colors">Production</span>
                       <div className="w-20 h-20 rounded-2xl bg-card border border-blue-200 shadow-sm flex flex-col items-center justify-center p-3 relative group-hover:border-blue-400 transition-colors">
                           <Factory size={26} className="text-blue-500" />
                       </div>
                       <div className="mt-4 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-center w-[120px]">
                           <div className="text-[9px] text-blue-600 font-bold uppercase tracking-wider mb-0.5">Total Cost</div>
                           <div className="text-[13px] font-bold text-blue-900 tracking-wide">₹12,700</div>
                       </div>
                   </div>

                   {/* 3. Sale */}
                   <div className="flex flex-col items-center bg-card p-2 hover:-translate-y-2 transition-transform duration-300 delay-150">
                       <span className="text-[9px] font-bold text-muted-text uppercase tracking-widest mb-3 hover:text-secondary-text transition-colors">Sale</span>
                       <div className="w-20 h-20 rounded-2xl bg-card border border-purple-200 shadow-sm flex flex-col items-center justify-center p-3 relative group-hover:border-purple-400 transition-colors">
                           <Tag size={26} className="text-purple-500" />
                       </div>
                       <div className="mt-4 bg-purple-50 border border-purple-100 rounded-lg px-3 py-2 text-center w-[120px]">
                           <div className="text-[9px] text-purple-600 font-bold uppercase tracking-wider mb-0.5">Sold At</div>
                           <div className="text-[13px] font-bold text-purple-900 tracking-wide">₹20,000</div>
                       </div>
                   </div>

                   {/* 4. Profit */}
                   <div className="flex flex-col items-center bg-card p-2 hover:-translate-y-2 transition-transform duration-300 delay-200">
                       <span className="text-[9px] font-bold text-muted-text uppercase tracking-widest mb-3 hover:text-secondary-text transition-colors">Profit</span>
                       <div className="w-24 h-24 rounded-full bg-card border border-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.15)] flex flex-col items-center justify-center p-3 relative group-hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all">
                           <Trophy size={28} className="text-emerald-500 mb-1" />
                           <div className="text-[8px] font-bold text-emerald-600 uppercase tracking-widest">Net Margin</div>
                       </div>
                       <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 text-center min-w-[140px] relative overflow-hidden">
                           <div className="absolute inset-0 bg-emerald-400/10 animate-[pulse-glow_2s_infinite]" />
                           <div className="text-[9px] text-emerald-700 font-bold uppercase tracking-widest mb-1 relative z-10">Net Profit</div>
                           <div className="text-[18px] font-bold text-emerald-600 tracking-tight leading-none relative z-10">₹7,300</div>
                       </div>
                   </div>
               </div>
           </div>
        </div>
    )
}
