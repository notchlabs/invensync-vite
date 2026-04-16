import { useEffect, useRef, useState } from 'react'
import { Zap, Target, Clock } from 'lucide-react'

const metrics = [
  { value: '30',   suffix: 'sec', label: 'Bill Processing Time', desc: 'AI extracts data from any bill format instantly',    Icon: Zap    },
  { value: '99.5', suffix: '%',   label: 'Accuracy Rate',        desc: 'Smart extraction with built-in validation',          Icon: Target },
  { value: '12',   suffix: 'hrs', label: 'Saved Per Month',      desc: 'No more manual data entry or register updates',      Icon: Clock  },
]

const AnimatedNumber = ({ value, suffix, inView }: { value: string; suffix: string; inView: boolean }) => {
  const [display, setDisplay] = useState('0')

  useEffect(() => {
    if (!inView) return
    const target = parseFloat(value)
    const start = performance.now()
    const animate = (now: number) => {
      const p = Math.min((now - start) / 2000, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setDisplay(value.includes('.') ? (target * eased).toFixed(1) : Math.floor(target * eased).toString())
      if (p < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [value, inView])

  return (
    <span className="font-display text-[52px] max-md:text-[40px] font-bold text-primary-text leading-none mb-2.5 tracking-tight">
      {display}<span className="text-[22px] text-muted-text ml-1 font-semibold">{suffix}</span>
    </span>
  )
}

const TrustBar = () => {
  const [inView, setInView] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.disconnect() } },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section className="relative py-24 bg-app border-t border-b border-border-main overflow-hidden" ref={ref}>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[180px] bg-[radial-gradient(ellipse,rgba(0,0,0,0.03)_0%,transparent_70%)] pointer-events-none" />
      <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-3 max-md:grid-cols-1 gap-6 relative z-[1]">
        {metrics.map((m, i) => (
          <div
            key={i}
            className={`flex flex-col items-center text-center p-10 max-md:p-7 bg-card border border-border-main rounded-2xl transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 ${
              inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[30px]'
            }`}
            style={{ transitionDelay: `${i * 0.15}s` }}
          >
            <span className="flex items-center justify-center w-14 h-14 bg-surface border border-border-main rounded-[14px] mb-4 text-primary-text">
              <m.Icon size={28} strokeWidth={1.8} />
            </span>
            <AnimatedNumber value={m.value} suffix={m.suffix} inView={inView} />
            <span className="text-[17px] font-semibold text-primary-text mb-1.5">{m.label}</span>
            <span className="text-[14px] text-secondary-text leading-relaxed max-w-[220px]">{m.desc}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

export default TrustBar
