import { useEffect, useRef, useState } from 'react'
import { ClipboardList, Calculator, CalendarClock, EyeOff, X, Check } from 'lucide-react'

const timelineData = [
  { time: '8:00 AM', title: 'Bills Arrive', manual: 'Photographing bills, WhatsApp-ing to accountant, hoping nothing gets lost', sync: 'Phone camera snaps bill → AI extracts data in 30 sec → auto-filed' },
  { time: '12:00 PM', title: 'Stock Check', manual: 'Walking to godown, counting bags by hand, writing in a register', sync: 'Dashboard shows live stock with color-coded alerts' },
  { time: '6:00 PM', title: 'Day End', manual: 'Handwritten register, calculator, headache, prayer that numbers add up', sync: 'Auto-generated daily summary with profit card' },
  { time: 'End of Month', title: 'Monthly Close', manual: '12 days of manual Tally entry, errors creep in', sync: 'One-click export to Tally-compatible format. Done in 10 min.' },
]

const painPoints = [
  { title: '"Same cement, 5 different names on 5 vendor bills."', desc: 'Item normalization chaos — your inventory is a mess of duplicates.', Icon: ClipboardList },
  { title: '"Vendor bills you in kilos, register tracks tonnes."', desc: 'Unit conversion nightmares that lead to invisible stock errors.', Icon: Calculator },
  { title: '"GST deadline in 3 days, bills still in a drawer."', desc: 'Compliance panic that costs late fees and sleepless nights.', Icon: CalendarClock },
  { title: '"No idea if today was profitable — you\'ll know next month."', desc: 'Zero profit visibility until it\'s too late to course-correct.', Icon: EyeOff },
]

const ProblemSection = () => {
  const timelineRef = useRef<HTMLDivElement>(null)
  const cardsRef = useRef<(HTMLDivElement | null)[]>([])
  const [visibleTimeline, setVisibleTimeline] = useState<Set<number>>(new Set())
  const [visibleCards, setVisibleCards] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (!timelineRef.current) return
    const rows = timelineRef.current.querySelectorAll('[data-tl-index]')
    const observer = new IntersectionObserver(
      (entries) => { entries.forEach(e => { if (e.isIntersecting) setVisibleTimeline(prev => new Set(prev).add(parseInt(e.target.getAttribute('data-tl-index') || '0'))) }) },
      { threshold: 0.2 }
    )
    rows.forEach(r => observer.observe(r))
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => { entries.forEach(e => { if (e.isIntersecting) setVisibleCards(prev => new Set(prev).add(parseInt(e.target.getAttribute('data-card-index') || '0'))) }) },
      { threshold: 0.25 }
    )
    cardsRef.current.forEach(ref => ref && observer.observe(ref))
    return () => observer.disconnect()
  }, [])

  return (
    <section className="relative py-28 max-md:py-16 overflow-hidden bg-[#fafafa] border-t border-b border-neutral-200" id="problem">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_40%_at_50%_0%,rgba(0,0,0,0.02)_0%,transparent_60%)] pointer-events-none" />

      {/* Header */}
      <div className="text-center mb-20 relative z-[1] max-w-[1200px] mx-auto px-6">
        <span className="inline-block text-[12px] font-bold tracking-[2.5px] uppercase text-neutral-600 mb-4 px-[18px] py-1.5 bg-white border border-neutral-200 rounded-full">
          The Problem
        </span>
        <h2 className="text-[48px] max-md:text-[34px] font-bold text-black mb-4 tracking-tight font-display">
          A Day <span className="text-neutral-400">Without</span> InvenSync
        </h2>
        <p className="text-lg max-md:text-base text-neutral-600 max-w-[540px] mx-auto leading-relaxed">
          Every day without automation is a day of lost time, lost money, and frustration.
        </p>
      </div>

      {/* Timeline */}
      <div className="max-w-[1200px] mx-auto px-6 mb-28 max-md:mb-16 relative z-[1]" ref={timelineRef}>
        {/* Headers */}
        <div className="grid grid-cols-[140px_1fr_1fr] max-lg:hidden gap-[4px] mb-[4px]">
          <div />
          <div className="flex items-center gap-2 px-5 py-3 text-[13px] font-bold uppercase tracking-wide text-neutral-600 bg-white border border-neutral-200 border-b-0 rounded-t-lg">
            <X size={14} strokeWidth={3} /> Manual Process
          </div>
          <div className="flex items-center gap-2 px-5 py-3 text-[13px] font-bold uppercase tracking-wide text-black bg-neutral-100 border border-neutral-200 border-b-0 rounded-t-lg">
            <Check size={14} strokeWidth={3} className="text-blue-600" /> With InvenSync
          </div>
        </div>

        {timelineData.map((row, i) => (
          <div
            key={i}
            data-tl-index={i}
            className={`grid grid-cols-[140px_1fr_1fr] max-lg:grid-cols-1 gap-[4px] mb-[4px] transition-all duration-600 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              visibleTimeline.has(i) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
            }`}
            style={{ transitionDelay: `${i * 0.1}s` }}
          >
            <div className="flex flex-col max-lg:flex-row items-start max-lg:items-center justify-center px-3 py-5 gap-1 max-lg:gap-2.5 max-lg:px-4 max-lg:py-3">
              <span className="font-display text-[13px] font-bold text-neutral-900 bg-white border border-neutral-200 px-2.5 py-1 rounded-md tracking-wide">{row.time}</span>
              <span className="text-[11px] text-neutral-500 font-medium uppercase tracking-wide">{row.title}</span>
            </div>

            <div className="flex items-start gap-4 px-6 py-6 bg-white border border-neutral-200 border-l-[3px] border-l-red-400 rounded-md text-sm text-neutral-600 leading-relaxed">
              <span className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-red-50 text-red-500 mt-0.5">
                <X size={12} strokeWidth={3} />
              </span>
              <span>{row.manual}</span>
            </div>

            <div className="flex items-start gap-4 px-6 py-6 bg-neutral-50 border border-neutral-200 border-l-[3px] border-l-blue-500 rounded-md text-sm text-neutral-800 leading-relaxed">
              <span className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 mt-0.5">
                <Check size={12} strokeWidth={3} />
              </span>
              <span className="font-medium">{row.sync}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Pain Cards */}
      <div className="max-w-[1200px] mx-auto px-6 relative z-[1]">
        <div className="text-center mb-16">
          <span className="inline-block text-[12px] font-bold tracking-[2.5px] uppercase text-neutral-500 mb-2">
            The Reality
          </span>
          <h3 className="text-[40px] max-md:text-[28px] font-bold text-black tracking-tight font-display">
            Sound Familiar?
          </h3>
        </div>
        <div className="grid grid-cols-2 max-md:grid-cols-1 gap-6">
          {painPoints.map((card, i) => (
            <div
              key={i}
              ref={el => { cardsRef.current[i] = el }}
              data-card-index={i}
              className={`flex items-start gap-5 p-8 max-md:p-6 bg-white border border-neutral-200 border-l-4 border-l-blue-500 rounded-2xl hover:bg-neutral-50 hover:-translate-y-1 hover:border-blue-600 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                visibleCards.has(i) ? 'opacity-100 translate-x-0 rotate-0' : `opacity-0 ${i % 2 === 0 ? '-translate-x-12 -rotate-2' : 'translate-x-12 rotate-2'}`
              }`}
              style={{ transitionDelay: `${i * 0.12}s` }}
            >
              <span className="shrink-0 w-14 h-14 flex items-center justify-center text-blue-600 bg-blue-50 border border-blue-100 rounded-xl">
                <card.Icon size={26} strokeWidth={1.8} />
              </span>
              <div>
                <h4 className="text-[16px] font-bold text-neutral-900 mb-2 leading-snug italic">{card.title}</h4>
                <p className="text-[14px] text-neutral-600 leading-relaxed">{card.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default ProblemSection
