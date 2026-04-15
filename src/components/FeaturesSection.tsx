import { useEffect, useRef, useState, lazy, Suspense } from 'react'
import { CheckCircle } from 'lucide-react'

// ─── Lazy-load every mock — none are above the fold ──────────────────────────
const AddStockMock      = lazy(() => import('./mocks/AddStockMock').then(m => ({ default: m.AddStockMock })))
const DailySalesMock    = lazy(() => import('./mocks/DailySalesMock').then(m => ({ default: m.DailySalesMock })))
const ProfitStoryMock   = lazy(() => import('./mocks/ProfitStoryMock').then(m => ({ default: m.ProfitStoryMock })))
const TransitMock       = lazy(() => import('./mocks/TransitMock').then(m => ({ default: m.TransitMock })))
const SitesMock         = lazy(() => import('./mocks/SitesMock').then(m => ({ default: m.SitesMock })))
const LedgerMock        = lazy(() => import('./mocks/LedgerMock').then(m => ({ default: m.LedgerMock })))
const PurchaseOrderMock = lazy(() => import('./mocks/PurchaseOrderMock').then(m => ({ default: m.PurchaseOrderMock })))
const DashboardMock     = lazy(() => import('./mocks/DashboardMock').then(m => ({ default: m.DashboardMock })))

const MockSkeleton = () => (
  <div className="bg-[#fafafa] rounded-2xl border border-neutral-200 w-full h-[320px] animate-pulse" />
)

const featureBlocks = [
  {
    label: 'AI Extraction',
    title: 'Snap a Bill. Data Extracted.',
    desc: 'Upload any invoice — handwritten, printed, or digital. Our AI reads it in seconds, extracts every line item, maps it to your inventory, and files it automatically. No manual data entry, ever.',
    bullets: ['Works with handwritten bills', 'Auto-maps to existing inventory', 'Supports Hindi & English'],
    Mock: AddStockMock,
  },
  {
    label: 'Daily Profit',
    title: 'Track Every Rupee, Every Day.',
    desc: 'Get a real-time ledger of your daily sales, purchases, and exact profit margins. Drill down into individual product sales to see exactly what is driving your revenue and what needs optimization.',
    bullets: ['Exact margin calculation', 'Granular billing breakup', 'Real-time product tracking'],
    Mock: DailySalesMock,
  },
  {
    label: 'The Profit Story',
    title: 'See exactly what goes into making your product.',
    desc: 'No surprises. No "I think we made money this month." A transparent, end-to-end view of your exact material, production, and sale costs converging into a verified net profit.',
    bullets: ['Material cost tracking', 'Labor & overhead inclusion', 'Per-unit profitability verified'],
    Mock: ProfitStoryMock,
  },
  {
    label: 'Transit Tracking',
    title: 'Every Transfer. Tracked End-to-End.',
    desc: 'Move stock between sites with full audit trails. Know exactly what left, when it arrived, and who received it. No more "it must be somewhere" conversations.',
    bullets: ['Real-time transfer status', 'Automatic stock adjustments', 'Complete audit trail'],
    Mock: TransitMock,
  },
  {
    label: 'Multi-Site',
    title: 'All Your Sites. One Portal.',
    desc: "Whether you manage 2 sites or 20 — see every location's inventory value, status, and activity in a single unified view.",
    bullets: ['Unified inventory view', 'Role-based access control', 'Per-site financial reports'],
    Mock: SitesMock,
  },
  {
    label: 'Ledger Management',
    title: 'Never Overpay a Vendor Again.',
    desc: 'Keep complete track of every vendor invoice, partial payment, and overdue balance. Easily reconcile statements with a single click, keeping your cash flow healthy.',
    bullets: ['Automated outstanding balance tracking', 'Partial payment handling', 'Detailed vendor history'],
    Mock: LedgerMock,
  },
  {
    label: 'Smart Restocking',
    title: 'Intelligent Restock Recommendations.',
    desc: 'AI analyzes consumption patterns, current stock levels, lead times, and historical vendor performance to generate purchase order recommendations, optimizing for cost, delivery reliability, and project timelines.',
    bullets: ['Consumption-driven reorder triggers', 'Vendor performance scoring', 'Budget-aware order generation'],
    Mock: PurchaseOrderMock,
  },
  {
    label: 'Capital & Profit',
    title: 'Capital & Profit Clarity.',
    desc: 'Understand exactly where your money is and how your business is performing—without digging through reports. Track total capital invested across fixed and working costs, monitor recovery through profits, and see how close you are to break-even.',
    bullets: ['Capital tracking (fixed + working)', 'Break-even & recovery progress', 'Expense & burn monitoring'],
    Mock: DashboardMock,
  },
]

/* ===== Component ===== */
export const FeaturesSection = () => {
  const [visible, setVisible] = useState<Set<number>>(new Set())
  const refs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const idx = parseInt(entry.target.getAttribute('data-index') || '0')
            setVisible(prev => new Set(prev).add(idx))
          }
        })
      },
      { threshold: 0.15 }
    )
    refs.current.forEach(ref => ref && observer.observe(ref))
    return () => observer.disconnect()
  }, [])

  return (
    <section className="py-24 max-md:py-16 bg-white" id="features">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center mb-20 max-md:mb-16">
          <span className="inline-block text-[12px] font-bold tracking-[2.5px] uppercase text-neutral-700 mb-4 px-[18px] py-1.5 border border-neutral-200 rounded-full">
            Features
          </span>
          <h2 className="text-[48px] max-md:text-[32px] font-bold text-black tracking-tight mb-4 font-display">
            Built for How You Actually Work
          </h2>
          <p className="text-lg max-md:text-base text-neutral-600 max-w-[540px] mx-auto leading-relaxed">
            Every feature is designed for Indian businesses dealing with real-world inventory complexity.
          </p>
        </div>

        <div className="flex flex-col gap-32 max-md:gap-20">
          {featureBlocks.map((block, i) => {
            const isVisible = visible.has(i)
            const isReversed = i % 2 !== 0
            return (
              <div
                key={i}
                ref={el => { refs.current[i] = el }}
                data-index={i}
                className={`grid grid-cols-2 max-lg:grid-cols-1 gap-14 max-lg:gap-8 items-center ${isReversed ? 'direction-rtl' : ''}`}
              >
                {/* Text */}
                <div className={`flex flex-col gap-5 max-w-[480px] transition-all duration-1000 ease-out ${isReversed ? 'max-lg:order-1 lg:order-2 lg:ml-auto' : ''} ${
                  isVisible ? 'opacity-100 translate-x-0 blur-none' : `opacity-0 blur-md ${isReversed ? 'translate-x-12' : '-translate-x-12'}`
                }`}>
                  <span className="inline-flex self-start text-[11px] font-bold tracking-[2px] uppercase text-neutral-600 px-3 py-1 bg-neutral-100 border border-neutral-200 rounded-full">
                    {block.label}
                  </span>
                  <h3 className="text-[36px] max-md:text-[28px] font-bold text-black tracking-tight leading-tight font-display">
                    {block.title}
                  </h3>
                  <p className="text-[15px] text-neutral-600 leading-relaxed mb-1">{block.desc}</p>
                  <ul className="flex flex-col gap-3">
                    {block.bullets.map((b, j) => (
                      <li key={j} className="flex items-center gap-2.5 text-[14px] text-neutral-800 font-medium tracking-wide">
                        <CheckCircle size={16} strokeWidth={2.5} className="text-blue-600 shrink-0" /> {b}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Mock — only fetched when the block enters the viewport */}
                <div className={`transition-all duration-1000 ease-out delay-150 ${isReversed ? 'max-lg:order-2 lg:order-1 min-w-0' : 'min-w-0'} ${
                  isVisible ? 'opacity-100 translate-x-0 translate-y-0 scale-100 rotate-0 blur-none' : `opacity-0 blur-md scale-95 translate-y-8 ${isReversed ? '-translate-x-12 -rotate-2' : 'translate-x-12 rotate-2'}`
                }`}>
                  <div className="relative group">
                    <div className={`absolute -inset-4 bg-gradient-to-r from-blue-500/0 via-neutral-300/20 to-purple-500/0 rounded-[2rem] blur-2xl transition-opacity duration-1000 delay-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`} />
                    <div className="relative z-10 w-full h-full transform-gpu transition-transform duration-700 hover:scale-[1.02]">
                      <Suspense fallback={<MockSkeleton />}>
                        <block.Mock />
                      </Suspense>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
