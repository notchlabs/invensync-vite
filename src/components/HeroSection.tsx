import { useEffect, useRef } from 'react'
import {
  ArrowRight, CheckCircle, Search,
  Filter, Plus, ScanLine, Edit2
} from 'lucide-react'

const features = [
  'AI-powered bill extraction',
  'Real-time inventory tracking',
  'Multi-site management',
  'Instant profit visibility',
]

/* ===== Browser Mockup ===== */
const HeroBrowserMock = () => {
  const products = [
    { name: 'UltraTech Cement 50kg', vendor: 'Reliance Retail Ltd', site: 'WildBean Cafe', qty: '80 Bags', price: '₹348.50', total: '₹27,880' },
    { name: 'JSW Steel TMT Bar 12mm', vendor: 'JSW Steel Dealers', site: 'Office Store', qty: '120 Pcs', price: '₹62.40', total: '₹7,488' },
    { name: 'Asian Paints Tractor Emu.', vendor: 'Asian Paints Dist.', site: 'Singh Fuel Center', qty: '15 Ltrs', price: '₹185.00', total: '₹2,775' },
    { name: 'Havells Wire 2.5mm', vendor: 'Havells India Ltd', site: 'WildBean Cafe', qty: '28 Mtrs', price: '₹24.70', total: '₹691.60' },
    { name: 'Birla A1 Cement PPC', vendor: 'Mishra Enterprises', site: 'Office Store', qty: '43 Bags', price: '₹365.00', total: '₹15,695' },
  ]

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-neutral-200 hover:-translate-y-1 transition-all duration-400">
      {/* Chrome bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-neutral-100 border-b border-neutral-200">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ff605c]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd44]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#00ca4e]" />
        </div>
        <div className="inline-flex px-10 py-1 bg-white border border-neutral-200 rounded-md text-[11px] text-neutral-500 font-body">
          app.invensync.in
        </div>
        <div className="w-14" />
      </div>

      {/* Body */}
      <div className="p-5 text-neutral-700 font-body max-h-[400px] overflow-hidden relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[70px] after:bg-gradient-to-t after:from-white after:to-transparent after:pointer-events-none">
        {/* Header */}
        <div className="flex items-start justify-between mb-3.5">
          <div>
            <h3 className="text-[17px] font-bold text-neutral-900 font-display mb-0.5">Inventory Management</h3>
            <p className="text-[11px] text-neutral-500">Track and manage your stock across all sites</p>
          </div>
          <div className="flex gap-1.5">
            <button className="inline-flex items-center gap-1 px-3 py-1.5 text-[10px] font-semibold bg-white text-neutral-700 border border-neutral-200 rounded-md cursor-default"><ScanLine size={11} /> Consumption</button>
            <button className="inline-flex items-center gap-1 px-3 py-1.5 text-[10px] font-semibold bg-black text-white rounded-md cursor-default"><Plus size={11} /> Prepare Product</button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-1.5 mb-2.5">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-neutral-200 rounded-md text-[10px] text-neutral-500 min-w-[140px]"><Search size={11} /><span>Search...</span></div>
          <div className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-neutral-200 rounded-md text-[10px] text-neutral-500"><Filter size={9} /> Select Site(s)</div>
          <div className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-neutral-200 rounded-md text-[10px] text-neutral-500"><Filter size={9} /> Select Vendor(s)</div>
        </div>

        <p className="text-[10px] text-neutral-500 mb-2">Showing <strong className="text-neutral-800">10</strong> of <strong className="text-neutral-800">2,939</strong> available products</p>

        {/* Table */}
        <div className="border border-neutral-200 rounded-lg overflow-hidden overflow-x-auto">
          <div className="min-w-[600px]">
            <div className="flex px-3 py-2 gap-1.5 text-[9px] font-bold uppercase tracking-wide text-neutral-500 bg-neutral-50 border-b border-neutral-200">
              <span className="w-7 flex items-center"><span className="w-3.5 h-3.5 border-[1.5px] border-neutral-300 rounded-sm" /></span>
              <span className="flex-[2.2] min-w-0">Product Name</span>
              <span className="flex-1">Site</span>
              <span className="flex-[0.8]">Qty</span>
              <span className="flex-[0.8] text-right">Price</span>
              <span className="flex-[0.9] text-right">Total</span>
            </div>
            {products.map((p, i) => (
              <div key={i} className="flex px-3 py-2.5 gap-1.5 text-[10px] text-neutral-600 border-b border-neutral-100 last:border-b-0 items-center hover:bg-neutral-50 transition-colors">
                <span className="w-7 flex items-center"><span className="w-3.5 h-3.5 border-[1.5px] border-neutral-300 rounded-sm" /></span>
                <span className="flex-[2.2] flex items-center gap-2 min-w-0">
                  <span className="w-[30px] h-[30px] bg-neutral-100 border border-neutral-200 rounded-[5px] shrink-0" />
                  <span className="min-w-0">
                    <span className="flex items-center gap-1 font-semibold text-neutral-900 text-[11px] whitespace-nowrap overflow-hidden text-ellipsis">{p.name} <Edit2 size={9} className="text-neutral-400" /></span>
                    <span className="block text-[9px] text-neutral-500">{p.vendor}</span>
                  </span>
                </span>
                <span className="flex-1 text-neutral-600 truncate">{p.site}</span>
                <span className="flex-[0.8]"><span className="inline-flex px-1.5 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded text-[9px] font-semibold">{p.qty}</span></span>
                <span className="flex-[0.8] text-right font-semibold text-neutral-800">{p.price}</span>
                <span className="flex-[0.9] text-right font-bold text-neutral-950">{p.total}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ===== Hero ===== */
const HeroSection = () => {
  const heroRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!heroRef.current) return
      const x = (e.clientX / window.innerWidth - 0.5) * 12
      const y = (e.clientY / window.innerHeight - 0.5) * 12
      heroRef.current.style.setProperty('--mx', `${x}px`)
      heroRef.current.style.setProperty('--my', `${y}px`)
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <section ref={heroRef} className="relative flex flex-col items-center overflow-hidden pt-[140px] pb-20 bg-white" id="hero">
      {/* Ambient glows (light mode tweaked to be subtle colored dots) */}
      <div className="absolute top-[0%] left-[10%] w-[600px] h-[600px] rounded-full blur-[120px] pointer-events-none bg-[radial-gradient(circle,rgba(59,130,246,0.06)_0%,transparent_70%)] transition-transform duration-[1500ms]" style={{ transform: 'translate(var(--mx,0),var(--my,0))' }} />
      <div className="absolute bottom-[10%] right-[5%] w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none bg-[radial-gradient(circle,rgba(168,85,247,0.06)_0%,transparent_70%)] transition-transform duration-[1500ms]" style={{ transform: 'translate(var(--mx,0),var(--my,0))' }} />

      {/* Grid pattern (light theme grid) */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_70%_50%_at_50%_30%,black_20%,transparent_100%)]" />

      {/* Content */}
      <div className="relative z-10 text-center flex flex-col items-center gap-5 mb-16 max-w-[1200px] mx-auto px-6">
        <div className="inline-flex items-center gap-2 px-[18px] py-[7px] text-[13px] font-semibold text-neutral-700 bg-neutral-50 border border-neutral-200 rounded-full tracking-wide animate-[fadeInDown_0.8s_ease]">
          <span className="w-[7px] h-[7px] bg-blue-600 rounded-full animate-[pulse-dot_2s_ease-in-out_infinite]" />
          Built for Indian Businesses
        </div>

        <h1 className="text-[64px] max-lg:text-[50px] max-md:text-[38px] font-bold tracking-[-2.5px] max-md:tracking-[-1.5px] leading-[1.05] text-black max-w-[800px] animate-[fadeInUp_0.8s_ease_0.1s_both] font-display">
          Your Bills, Stock &amp; Profits<br />
          <span className="text-neutral-400">All in One Place.</span>
        </h1>

        <p className="text-[18px] max-md:text-[16px] leading-relaxed text-neutral-600 max-w-[600px] animate-[fadeInUp_0.8s_ease_0.25s_both]">
          InvenSync uses AI to digitize your bills, track inventory in real-time,
          and give you instant profit visibility — so you can run your business, not chase numbers.
        </p>

        <div className="flex items-center gap-4 mt-2 animate-[fadeInUp_0.8s_ease_0.4s_both] max-md:flex-col max-md:w-full max-md:px-5">
          <a href="#contact" className="inline-flex items-center gap-2.5 px-[32px] py-[16px] text-[15px] font-semibold text-white bg-black rounded-xl hover:-translate-y-0.5 transition-all max-md:w-full max-md:justify-center">
            <span>Book a Walkthrough</span>
            <ArrowRight size={18} />
          </a>
        </div>

        <div className="flex flex-wrap justify-center gap-6 mt-3 animate-[fadeInUp_0.8s_ease_0.55s_both] max-md:flex-col max-md:items-center max-md:gap-3">
          {features.map((f, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 text-[14px] text-neutral-600 font-medium">
              <CheckCircle size={16} strokeWidth={2.5} className="text-neutral-400" />
              {f}
            </span>
          ))}
        </div>
      </div>

      {/* Browser Mock */}
      <div className="relative z-10 max-w-[1200px] mx-auto px-6 w-full animate-[fadeInUp_1s_ease_0.7s_both]">
        <HeroBrowserMock />
      </div>
    </section>
  )
}

export default HeroSection
