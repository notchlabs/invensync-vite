import { useState, useEffect, useRef } from 'react'
import { HardHat, Coffee, Wrench, Clock, Percent, FileCheck, BellRing } from 'lucide-react'

const useCases = [
  {
    id: 'construction',
    label: 'Construction',
    icon: HardHat,
    bgClass: 'bg-stone-50',
    accentClass: 'bg-stone-800 text-white',
    tabClass: 'text-stone-700 hover:bg-stone-100',
    activeTabClass: 'bg-white border-stone-200 text-stone-900 border-b-2 border-b-stone-800',
    title: "Rajesh prevents BOQ overruns in real-time.",
    story: "Rajesh runs 5 sites with 150+ vendor bills pouring in every day. Before InvenSync, he'd discover BOQ overruns only at the end-of-month review — by then, lakhs had already been wasted. Now? He gets a real-time alert the moment any line item crosses 80% of its budget.",
    metrics: [
      { label: 'Bill Processing', before: '12 mins', after: '30 secs', icon: Clock },
      { label: 'Stock Accuracy', before: '75%', after: '99%', icon: Percent },
      { label: 'GST Prep', before: '12 days', after: '1 day', icon: FileCheck },
      { label: 'Overrun Alert', before: 'Monthly', after: 'Real-time', icon: BellRing },
    ],
    Visual: () => (
      <div className="w-full h-full min-h-[220px] sm:min-h-[300px] flex items-center justify-center p-4 sm:p-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,theme(colors.stone.400)_2px,transparent_0)]" style={{ backgroundSize: '24px 24px' }}></div>
        <div className="relative z-10 flex flex-col gap-4 sm:gap-6 w-full max-w-[280px]">
          <div className="bg-white border border-stone-200 rounded-lg p-3 sm:p-4 rotate-[-2deg] flex gap-3 items-center">
            <span className="w-6 h-6 sm:w-8 sm:h-8 rounded bg-red-100 text-red-600 flex items-center justify-center"><BellRing size={14} /></span>
            <div><div className="text-[9px] sm:text-[10px] font-bold text-stone-400 uppercase">Alert</div><div className="text-[11px] sm:text-[13px] font-bold text-stone-800">Cement BOQ @ 85%</div></div>
          </div>
          <div className="bg-white border border-stone-200 rounded-lg p-3 sm:p-4 rotate-[1deg] ml-8 flex gap-3 items-center">
            <span className="w-6 h-6 sm:w-8 sm:h-8 rounded bg-emerald-100 text-emerald-600 flex items-center justify-center"><HardHat size={14} /></span>
            <div><div className="text-[9px] sm:text-[10px] font-bold text-stone-400 uppercase">Site 3</div><div className="text-[11px] sm:text-[13px] font-bold text-stone-800">Delivery Approved</div></div>
          </div>
          <div className="bg-white border border-stone-200 rounded-lg p-3 sm:p-4 flex flex-col gap-2 rotate-[-1deg] mr-4">
            <div className="flex justify-between items-center"><span className="text-[9px] sm:text-[10px] font-bold text-stone-400 uppercase">Monthly Spend</span><span className="text-[11px] sm:text-[13px] font-bold text-stone-800">₹14.2 L</span></div>
            <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden"><div className="bg-stone-800 w-[65%] h-full" /></div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'cafe',
    label: 'Cafe / Restaurant',
    icon: Coffee,
    bgClass: 'bg-orange-50',
    accentClass: 'bg-orange-600 text-white',
    tabClass: 'text-orange-700 hover:bg-orange-100',
    activeTabClass: 'bg-white border-orange-200 text-orange-900 border-b-2 border-b-orange-600',
    title: "Amit cut his food costs by 18% in Month 1.",
    story: "Amit owns 3 cafe outlets and a menu of 45+ items. He had zero idea which dishes were profitable. Turns out, his signature pasta was a loss-maker. InvenSync's dashboard now shows him daily profit per dish — and AI auto-orders ingredients.",
    metrics: [
      { label: 'Bill Processing', before: '15 mins', after: '45 secs', icon: Clock },
      { label: 'Stock Accuracy', before: '60%', after: '98%', icon: Percent },
      { label: 'Supplier Reorder', before: 'Manual', after: 'Automated', icon: FileCheck },
      { label: 'Profit View', before: 'Monthly', after: 'Daily', icon: BellRing },
    ],
    Visual: () => (
      <div className="w-full h-full min-h-[220px] sm:min-h-[300px] flex items-center justify-center p-4 sm:p-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,theme(colors.orange.400)_2px,transparent_0)]" style={{ backgroundSize: '24px 24px' }}></div>
        <div className="relative z-10 flex flex-col gap-4 sm:gap-6 w-full max-w-[280px]">
          <div className="bg-white border border-orange-200 rounded-lg p-3 sm:p-4 rotate-[2deg] flex gap-3 items-center">
             <span className="w-6 h-6 sm:w-8 sm:h-8 rounded bg-orange-100 text-orange-600 flex items-center justify-center"><Coffee size={14} /></span>
             <div><div className="text-[9px] sm:text-[10px] font-bold text-orange-400 uppercase">Item Profit</div><div className="text-[11px] sm:text-[13px] font-bold text-neutral-800">Pasta: 62% Margin</div></div>
          </div>
          <div className="bg-white border border-orange-200 rounded-lg p-3 sm:p-4 rotate-[-1deg] ml-6 flex flex-col gap-2">
            <div className="flex justify-between items-center"><span className="text-[9px] sm:text-[10px] font-bold text-orange-400 uppercase">Cheese Stock</span><span className="text-[10px] sm:text-[11px] font-semibold text-red-500">Low (2kg)</span></div>
            <button className="py-1.5 w-full rounded bg-orange-50 text-orange-600 text-[10px] font-bold border border-orange-100 uppercase">Auto-Reorder Sent</button>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'manufacturing',
    label: 'Manufacturing',
    icon: Wrench,
    bgClass: 'bg-slate-50',
    accentClass: 'bg-slate-800 text-white',
    tabClass: 'text-slate-700 hover:bg-slate-100',
    activeTabClass: 'bg-white border-slate-200 text-slate-900 border-b-2 border-b-slate-800',
    title: "Sunita gets exact cost breakdowns for quotes.",
    story: "Sunita makes custom furniture. She used to quote prices based on gut feeling. Now, every door, table, and shelf has a complete cost breakdown — wood, fittings, paint, labor — and she knows her exact margin before quoting.",
    metrics: [
      { label: 'Quote Prep', before: '4 hours', after: '5 mins', icon: Clock },
      { label: 'Margin Variance', before: '±15%', after: '±1%', icon: Percent },
      { label: 'Cost Tracking', before: 'Guesswork', after: 'Ledger', icon: FileCheck },
      { label: 'Waste Material', before: 'High', after: 'Tracked', icon: BellRing },
    ],
    Visual: () => (
      <div className="w-full h-full min-h-[220px] sm:min-h-[300px] flex items-center justify-center p-4 sm:p-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,theme(colors.slate.400)_2px,transparent_0)]" style={{ backgroundSize: '24px 24px' }}></div>
        <div className="relative z-10 flex flex-col gap-4 sm:gap-5 w-full max-w-[280px]">
          <div className="bg-white border border-slate-200 rounded-lg p-3 sm:p-4 flex gap-3 items-center">
            <span className="w-6 h-6 sm:w-8 sm:h-8 rounded bg-slate-100 text-slate-600 flex items-center justify-center"><Wrench size={14} /></span>
            <div className="flex-1"><div className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase">Teak Door Quote</div><div className="flex justify-between mt-0.5"><span className="text-[11px] sm:text-[13px] font-bold text-neutral-800">Cost: ₹4,200</span><span className="text-[10px] sm:text-[11px] font-bold text-emerald-600">32% Mar</span></div></div>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-3 sm:p-4 ml-4 flex flex-col gap-2 text-[9px] sm:text-[10px]">
            <div className="flex justify-between border-b border-slate-100 pb-1"><span className="text-slate-500">Wood</span><strong className="text-slate-800">₹2,100</strong></div>
            <div className="flex justify-between border-b border-slate-100 pb-1"><span className="text-slate-500">Brass Fittings</span><strong className="text-slate-800">₹800</strong></div>
            <div className="flex justify-between"><span className="text-slate-500">Labor</span><strong className="text-slate-800">₹1,300</strong></div>
          </div>
        </div>
      </div>
    )
  }
]

const AnimatedBeforeAfter = ({ before, after, inView }: { before: string, after: string, inView: boolean }) => {
  return (
    <div className="flex flex-col">
      <div className="text-[12px] font-bold text-neutral-400 line-through decoration-neutral-300 decoration-2 mb-0.5">{before}</div>
      <div className={`text-[16px] sm:text-[18px] font-display font-black tracking-tight leading-none transition-all duration-700 ease-out flex items-center ${inView ? 'opacity-100 translate-y-0 text-emerald-600' : 'opacity-0 translate-y-4'}`}>
        <span className="inline-block relative">
          {after}
          <div className="absolute inset-0 bg-emerald-400 blur-[8px] opacity-20 -z-10" />
        </span>
      </div>
    </div>
  )
}

const UseCasesSection = () => {
  const [activeIdx, setActiveIdx] = useState(0)
  const activeCase = useCases[activeIdx]
  
  const [inView, setInView] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Reveal Observer for metrics animation
    const visibilityObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) setInView(true)
      },
      { threshold: 0.1 }
    )

    // Scroll scrubbing logic
    const handleScroll = () => {
      if (!containerRef.current) return
      
      const { top, height } = containerRef.current.getBoundingClientRect()
      const windowHeight = window.innerHeight

      // If top is positive, we haven't reached the sticky portion yet
      if (top > 0) {
        setActiveIdx(0)
        return
      }

      const maxScroll = height - windowHeight
      if (maxScroll <= 0) return

      // Progress goes from 0 (just hit top) to 1 (about to un-stick from bottom)
      let progress = -top / maxScroll
      progress = Math.max(0, Math.min(1, progress))

      // Tab selection based on scroll progress (thirds)
      if (progress < 0.33) {
        setActiveIdx(0)
      } else if (progress < 0.66) {
        setActiveIdx(1)
      } else {
        setActiveIdx(2)
      }
    }

    if (containerRef.current) visibilityObserver.observe(containerRef.current)
    window.addEventListener('scroll', handleScroll, { passive: true })
    
    // Initial calls
    handleScroll()
    
    return () => {
      visibilityObserver.disconnect()
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const handleTabClick = (idx: number) => {
     if (!containerRef.current) return
     const windowHeight = window.innerHeight
     const maxScroll = containerRef.current.offsetHeight - windowHeight
     const rect = containerRef.current.getBoundingClientRect()
     const elementTop = window.scrollY + rect.top
     
     let targetProgress = 0
     if (idx === 1) targetProgress = 0.35
     if (idx === 2) targetProgress = 0.69
     
     window.scrollTo({
        top: elementTop + (maxScroll * targetProgress),
        behavior: 'smooth'
     })
  }

  return (
    // 300vh allows for essentially 3 "screens" worth of scrolling while the inner container stays sticky
    <div ref={containerRef} className="relative h-[300vh] w-full" id="use-cases">
      <div className={`sticky top-0 h-[100dvh] w-full flex flex-col justify-center max-md:justify-start max-md:pt-[12dvh] overflow-hidden transition-colors duration-700 ease-in-out border-y border-neutral-200 ${activeCase.bgClass}`}>
        
        <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 flex flex-col gap-4 sm:gap-8">
          
          {/* Header */}
          <div className="text-center relative z-10 w-full">
            <span className="inline-block text-[10px] sm:text-[12px] font-bold tracking-[2.5px] uppercase text-neutral-600 mb-2 sm:mb-4 px-3 sm:px-[18px] py-1 sm:py-1.5 bg-white border border-neutral-200 rounded-full">
              See Yourself in the Story
            </span>
            <h2 className="text-[28px] sm:text-[48px] font-bold text-black tracking-tight font-display mb-1 sm:mb-4">
              Real-World ROI
            </h2>
          </div>

          {/* Tab Switcher */}
          <div className="flex gap-2 max-w-[800px] mx-auto bg-white/60 p-1.5 sm:p-2 border border-neutral-200 rounded-xl backdrop-blur-md justify-center">
            {useCases.map((uc, i) => {
              const isActive = i === activeIdx
              return (
                <button
                  key={uc.id}
                  onClick={() => handleTabClick(i)}
                  title={uc.label}
                  className={`flex shrink-0 justify-center items-center gap-1.5 sm:gap-2 p-2.5 sm:py-3 sm:px-4 rounded-lg text-[13px] font-bold uppercase tracking-wider transition-all duration-300 min-w-[60px] sm:min-w-[160px] border border-transparent ${
                    isActive ? uc.activeTabClass : uc.tabClass
                  }`}
                >
                  <uc.icon size={20} strokeWidth={2.5} className="sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">{uc.label}</span>
                </button>
              )
            })}
          </div>

          {/* Content Area */}
          <div className="grid grid-cols-1 lg:grid-cols-2 overflow-hidden bg-white border border-neutral-200 rounded-2xl w-full max-md:flex-1 max-md:max-h-[60dvh] max-md:overflow-y-auto">
            
            {/* Visual Side */}
            <div className={`relative border-b lg:border-r lg:border-b-0 border-neutral-200 transition-colors duration-700 min-h-[180px] sm:min-h-[220px] lg:h-auto ${activeCase.bgClass}`}>
              <div key={activeIdx} className="w-full h-full animate-[fadeIn_0.5s_ease-in-out]">
                <activeCase.Visual />
              </div>
            </div>
            
            {/* Story Side */}
            <div className="p-6 sm:p-8 lg:p-12 flex flex-col justify-center bg-white relative">
              <div key={`text-${activeIdx}`} className="animate-[fadeInRight_0.5s_ease-out]">
                <div className="mb-4 sm:mb-6">
                  <h3 className="text-[20px] sm:text-[28px] font-bold text-black leading-tight mb-2 sm:mb-4 font-display">
                    {activeCase.title}
                  </h3>
                  <p className="text-[13px] sm:text-[15px] text-neutral-600 leading-relaxed">
                    {activeCase.story}
                  </p>
                </div>

                {/* Before/After Metrics */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-3 sm:mt-8 pt-3 sm:pt-6 border-t border-neutral-100">
                  {activeCase.metrics.map((m, idx) => (
                    <div key={idx} className="flex gap-2 sm:gap-3 items-start">
                      <div className="shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded bg-neutral-50 border border-neutral-200 flex items-center justify-center text-neutral-500 mt-0.5 sm:mt-1">
                        <m.icon size={12} className="sm:w-3.5 sm:h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wide text-neutral-500 mb-0.5 truncate">{m.label}</div>
                        <AnimatedBeforeAfter before={m.before} after={m.after} inView={inView} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

export default UseCasesSection
