import { Bot, Upload } from "lucide-react";

/* ===== Mock: Add Stock ===== */
export const AddStockMock = () => (
  <div className="bg-[#fafafa] rounded-2xl overflow-hidden border border-neutral-200 hover:-translate-y-1 transition-all duration-400">
    <div className="flex items-center justify-between px-4 py-2.5 bg-[#e8e8e8] border-b border-[#ddd]">
      <div className="flex gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#ff605c]" /><span className="w-2.5 h-2.5 rounded-full bg-[#ffbd44]" /><span className="w-2.5 h-2.5 rounded-full bg-[#00ca4e]" /></div>
      <span className="px-10 py-1 bg-[#f5f5f5] border border-[#ddd] rounded-md text-[11px] text-neutral-500">app.invensync.in/add-stock</span>
      <div className="w-14" />
    </div>
    <div className="p-5 font-body max-h-[380px] overflow-hidden relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-16 after:bg-gradient-to-t after:from-[#fafafa] after:to-transparent">
      <div className="grid grid-cols-[1fr_0.8fr] max-md:grid-cols-1 gap-5">
        <div>
          <div className="bg-white border border-neutral-200 rounded-xl p-4">
            <div className="flex items-center justify-between text-[13px] font-semibold text-neutral-800 mb-3">
              <span className="flex items-center gap-1.5"><Bot size={13} /> Upload Product Bill</span>
              <span className="text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 bg-purple-100 text-purple-600 rounded">AI Powered</span>
            </div>
            <div className="flex flex-col items-center gap-2 py-6 px-4 border-2 border-dashed border-neutral-200 rounded-xl text-neutral-400 text-center">
              <Upload size={24} strokeWidth={1.5} />
              <span className="text-[13px] font-semibold text-neutral-700">Upload your bills & invoices</span>
              <span className="text-[10px] text-neutral-400">Drag and drop · JPG, PNG, PDF up to 10MB</span>
              <div className="flex items-center gap-3 text-[10px] text-neutral-400 mt-1">
                <span><span className="text-emerald-500">●</span> Secure</span>
                <span><span className="text-blue-500">●</span> AI Powered</span>
                <span><span className="text-purple-500">●</span> Auto Extract</span>
              </div>
              <button className="inline-flex items-center gap-1 px-4 py-1.5 text-[10px] font-semibold bg-neutral-900 text-white rounded-md mt-1 cursor-default"><Upload size={11} /> Choose Files</button>
            </div>
          </div>
        </div>
        <div className="bg-white border border-neutral-200 rounded-xl p-4">
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="px-3 py-1 bg-neutral-900 text-white rounded-md text-[11px] font-semibold flex items-center">Today <strong className="bg-white/20 px-1.5 py-0.5 rounded ml-1">2</strong></span>
            <span className="px-3 py-1 bg-neutral-100 border border-neutral-200 rounded-md text-[11px] text-neutral-500">Yesterday</span>
          </div>
          <p className="text-[13px] font-bold text-neutral-900 mb-1">Recently Uploaded Bills</p>
          <p className="text-[10px] text-neutral-400 mb-3 block">Click any entry to review.</p>
          {[{ id: 'SELF-01', amt: '₹5,664' }, { id: 'SELF-02', amt: '₹7,801' }].map((b, i) => (
            <div key={i} className="flex justify-between items-center p-3 border border-neutral-100 rounded-lg mb-2 text-[12px]">
              <div><strong className="text-neutral-900">{b.id}</strong><br /><span className="text-[10px] text-neutral-400">Trilochan Dash · Singh Fuel</span></div>
              <div className="text-right"><strong className="text-neutral-900 text-[13px]">{b.amt}</strong><br /><span className="text-[10px] text-neutral-400">09/04/2026</span></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
)