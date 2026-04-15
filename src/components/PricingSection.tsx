import { useState } from 'react'
import { Check, Minus } from 'lucide-react'

/* ─── Plan data ──────────────────────────────────────────────────── */

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    tagline: 'Best for small businesses getting started.',
    priceMonthly: 1499,
    priceAnnually: 1199,
    annualBilled: 14388,
    annualSaving: 3600,
    cta: 'Start Free Trial',
    ctaSecondary: null as string | null,
    popular: false,
    features: [
      '1 Site / Location',
      '2 User Licenses',
      '50 AI Bill Credits / month',
      '10 Transfers / day',
      '50 Consumptions / day',
      '30-day Audit Log',
      'Email Support',
    ],
  },
  {
    id: 'professional',
    name: 'Professional',
    tagline: 'Best for growing businesses with multiple sites.',
    priceMonthly: 3499,
    priceAnnually: 2799,
    annualBilled: 33588,
    annualSaving: 8400,
    cta: 'Start Free Trial',
    ctaSecondary: null as string | null,
    popular: true,
    features: [
      'Up to 5 Sites',
      '5 User Licenses',
      '500 AI Bill Credits / month',
      '100 Transfers / day',
      'Unlimited Consumptions',
      '1-Year Audit Log',
      'Smart Restock Orders',
      'Priority Chat Support',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tagline: 'Best for large-scale operations and full oversight.',
    priceMonthly: 8999,
    priceAnnually: 7199,
    annualBilled: 86388,
    annualSaving: 21600,
    cta: 'Start Free Trial',
    ctaSecondary: 'Talk to Sales' as string | null,
    popular: false,
    features: [
      'Unlimited Sites',
      'Unlimited Users',
      'Unlimited AI Credits',
      'Unlimited Transfers',
      'Unlimited Consumptions',
      'Lifetime Audit Log',
      'Smart Restock Orders',
      'Capital & P&L Reports',
      'Custom Role Permissions',
      '24/7 Phone + Dedicated CSM',
    ],
  },
]

/* ─── Comparison table data ──────────────────────────────────────── */

type CellValue = string | boolean

const COMPARE_SECTIONS: {
  heading: string
  rows: { label: string; values: [CellValue, CellValue, CellValue] }[]
}[] = [
  {
    heading: 'Inventory',
    rows: [
      { label: 'Sites / Locations',         values: ['1',          'Up to 5',    'Unlimited'] },
      { label: 'User Licenses',              values: ['2',          '5',          'Unlimited'] },
      { label: 'Stock Items',                values: ['Unlimited',  'Unlimited',  'Unlimited'] },
      { label: 'AI Bill Credits / month',    values: ['50',         '500',        'Unlimited'] },
      { label: 'Transfers / day',            values: ['10',         '100',        'Unlimited'] },
      { label: 'Consumptions / day',         values: ['50',         'Unlimited',  'Unlimited'] },
    ],
  },
  {
    heading: 'Intelligence',
    rows: [
      { label: 'Daily Profit View',          values: [true,  true,  true]  },
      { label: 'Vendor Ledger Management',   values: [true,  true,  true]  },
      { label: 'Transit Tracking',           values: [true,  true,  true]  },
      { label: 'Smart Restock Orders',       values: [false, true,  true]  },
      { label: 'Capital & P&L Reports',      values: [false, true,  true]  },
      { label: 'Per-site Reports',           values: [false, true,  true]  },
      { label: 'Custom Report Export',       values: [false, false, true]  },
    ],
  },
  {
    heading: 'Reports & Logs',
    rows: [
      { label: 'Activity History',           values: ['30 days',        '1 year',        'Unlimited']  },
      { label: 'Transaction Reports',        values: ['30-day limit',   '1-year limit',  'Unlimited']  },
      { label: 'Inventory Summary Reports',  values: [true,  true,  true]  },
      { label: 'Low Stock Reports',          values: [true,  true,  true]  },
      { label: 'Saved & Scheduled Reports',  values: [false, false, true]  },
    ],
  },
  {
    heading: 'Access & Permissions',
    rows: [
      { label: 'Role-based Access',               values: [true,  true,  true]  },
      { label: 'Customizable Role Permissions',    values: [false, false, true]  },
      { label: 'Multi-user Collaboration',         values: [false, true,  true]  },
    ],
  },
  {
    heading: 'Support',
    rows: [
      { label: 'Email Support',                            values: [true,  true,  true]  },
      { label: 'Priority Chat Support',                    values: [false, true,  true]  },
      { label: 'Phone Support',                            values: [false, false, true]  },
      { label: 'Dedicated Customer Success Manager',       values: [false, false, true]  },
      { label: 'Onboarding Assistance',                    values: [false, true,  true]  },
    ],
  },
]

/* ─── Cell ───────────────────────────────────────────────────────── */

const Cell = ({ value, popular }: { value: CellValue; popular: boolean }) => {
  if (value === true)
    return (
      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${popular ? 'bg-blue-500/10' : 'bg-emerald-50'}`}>
        <Check size={13} strokeWidth={3} className={popular ? 'text-blue-600' : 'text-emerald-600'} />
      </span>
    )
  if (value === false) return <Minus size={16} className="text-neutral-300 mx-auto" />
  return <span className={`text-[13px] font-bold ${popular ? 'text-black' : 'text-neutral-700'}`}>{value}</span>
}

/* ─── Plan card sub-components ───────────────────────────────────── */

type Plan = typeof PLANS[number]

const PriceBlock = ({ plan, annual, dk, fmt }: { plan: Plan; annual: boolean; dk: boolean; fmt: (n: number) => string }) => {
  const price = annual ? plan.priceAnnually : plan.priceMonthly
  return (
    <div className="mb-5">
      <div className="flex items-end gap-1.5 mb-1">
        <span className={`text-[13px] font-semibold mb-0.5 ${dk ? 'text-neutral-400' : 'text-neutral-500'}`}>₹</span>
        <span className={`text-[44px] font-bold font-display leading-none tracking-tight ${dk ? 'text-white' : 'text-black'}`}>
          {fmt(price)}
        </span>
        <span className={`text-[13px] font-medium mb-1 ${dk ? 'text-neutral-400' : 'text-neutral-500'}`}>INR/mo.</span>
      </div>
      {annual ? (
        <div className="flex flex-col gap-0.5">
          <span className={`text-[12px] font-semibold ${dk ? 'text-emerald-400' : 'text-emerald-600'}`}>
            You'll save ₹{fmt(plan.annualSaving)}!
          </span>
          <span className={`text-[12px] ${dk ? 'text-neutral-500' : 'text-neutral-400'}`}>
            Billed at ₹{fmt(plan.annualBilled)}/yr.
          </span>
        </div>
      ) : (
        <span className={`text-[12px] ${dk ? 'text-neutral-500' : 'text-neutral-400'}`}>
          Switch to yearly and save ₹{fmt(plan.annualSaving)}/yr.
        </span>
      )}
    </div>
  )
}

const CardCTAs = ({ plan, dk }: { plan: Plan; dk: boolean }) => (
  <div className="flex flex-col gap-2 mb-6">
    <a href="#contact" className={`w-full py-3 rounded-xl text-[14px] font-semibold text-center inline-flex justify-center items-center transition-all ${
      dk
        ? 'bg-blue-500 text-white hover:bg-blue-600 active:scale-[0.98]'
        : 'bg-black text-white hover:bg-neutral-800 active:scale-[0.98]'
    }`}>
      {plan.cta}
    </a>
    {plan.ctaSecondary && (
      <a href="#contact" className={`w-full py-2.5 rounded-xl text-[14px] font-semibold text-center inline-flex justify-center items-center border transition-all ${
        dk
          ? 'border-neutral-700 text-neutral-300 hover:border-neutral-500 hover:text-white'
          : 'border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:text-black'
      }`}>
        {plan.ctaSecondary}
      </a>
    )}
  </div>
)

/* ─── Plan card ──────────────────────────────────────────────────── */

const PlanCard = ({ plan, annual, fmt }: { plan: Plan; annual: boolean; fmt: (n: number) => string }) => {
  const dk = plan.popular

  return (
    <div className={`relative flex flex-col rounded-2xl border transition-all duration-300 ${
      dk
        ? 'bg-neutral-900 border-neutral-900 shadow-[0_20px_60px_rgba(0,0,0,0.15)] lg:-translate-y-2'
        : 'bg-white border-neutral-200 hover:border-neutral-300 hover:shadow-md'
    }`}>
      {dk && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1.5 bg-blue-500 text-white text-[11px] font-bold uppercase tracking-wider rounded-full whitespace-nowrap">
          Most Popular
        </div>
      )}

      <div className="p-7 pb-0">
        <div className="mb-5">
          <h3 className={`text-[20px] font-bold font-display mb-1 ${dk ? 'text-white' : 'text-black'}`}>{plan.name}</h3>
          <p className={`text-[13px] leading-snug ${dk ? 'text-neutral-400' : 'text-neutral-500'}`}>{plan.tagline}</p>
        </div>

        <PriceBlock plan={plan} annual={annual} dk={dk} fmt={fmt} />
        <CardCTAs plan={plan} dk={dk} />
      </div>

      <div className={`mx-7 h-[1px] ${dk ? 'bg-neutral-800' : 'bg-neutral-100'}`} />

      {/* Features list */}
      <div className="p-7 pt-5 flex flex-col gap-3 flex-1">
        {plan.features.map((f) => (
          <div key={f} className="flex items-start gap-2.5">
            <span className={`shrink-0 mt-0.5 w-[18px] h-[18px] flex items-center justify-center rounded-full ${
              dk ? 'bg-neutral-800 text-blue-400' : 'bg-neutral-100 text-neutral-500'
            }`}>
              <Check size={11} strokeWidth={3} />
            </span>
            <span className={`text-[13.5px] font-medium leading-snug ${dk ? 'text-neutral-300' : 'text-neutral-600'}`}>{f}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Main component ─────────────────────────────────────────────── */

const PricingSection = () => {
  const [annual, setAnnual] = useState(true)
  const [tableOpen, setTableOpen] = useState(false)

  const fmt = (n: number) => n.toLocaleString('en-IN')

  return (
    <section className="py-24 max-md:py-16 bg-white relative overflow-hidden" id="pricing">
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-neutral-200 to-transparent" />

      <div className="max-w-[1120px] mx-auto px-6 relative z-10">

        {/* ── Header ── */}
        <div className="text-center mb-12">
          <span className="inline-block text-[11px] font-bold tracking-[2.5px] uppercase text-neutral-500 mb-4 px-[18px] py-1.5 bg-neutral-50 border border-neutral-200 rounded-full">
            Pricing
          </span>
          <h2 className="text-[42px] max-md:text-[32px] font-bold text-black tracking-tight mb-4 font-display leading-tight">
            Start Your 14-Day Free Trial Today.
          </h2>
          <p className="text-[16px] text-neutral-500 max-w-[500px] mx-auto leading-relaxed mb-8">
            Transform how your business does inventory. Find the right InvenSync plan for you.
          </p>

          {/* Toggle */}
          <div className="inline-flex items-center gap-3">
            <span className={`text-[14px] font-medium transition-colors ${!annual ? 'text-black' : 'text-neutral-400'}`}>Monthly</span>
            <button
              onClick={() => setAnnual(v => !v)}
              className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${annual ? 'bg-black' : 'bg-neutral-300'}`}
              role="switch"
              aria-checked={annual}
            >
              <span className={`absolute top-[3px] left-[3px] w-[18px] h-[18px] bg-white rounded-full shadow transition-transform duration-200 ${annual ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
            <span className={`text-[14px] font-medium transition-colors ${annual ? 'text-black' : 'text-neutral-400'}`}>Yearly</span>
            <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-100 text-emerald-700 text-[11px] font-bold rounded-full uppercase tracking-wide">
              Save 20%
            </span>
          </div>
        </div>

        {/* ── Cards ── */}
        <div className="grid grid-cols-3 max-lg:grid-cols-1 gap-6 mb-6">
          {PLANS.map((plan) => (
            <PlanCard key={plan.id} plan={plan} annual={annual} fmt={fmt} />
          ))}
        </div>

        {/* ── Annual footnote ── */}
        {annual && (
          <p className="text-center text-[12px] text-neutral-400 mb-10">
            * Annual billing saves 20% versus monthly. All plans include a 14-day free trial — no credit card required.
          </p>
        )}

        {/* ── Compare Plans toggle ── */}
        <div className="text-center mb-6">
          <button
            onClick={() => setTableOpen(v => !v)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-neutral-200 text-[14px] font-semibold text-neutral-700 hover:border-neutral-300 hover:text-black transition-all bg-white"
          >
            {tableOpen ? 'Hide' : 'Compare'} Plans
            <span className={`transition-transform duration-200 inline-block ${tableOpen ? 'rotate-180' : ''}`}>↓</span>
          </button>
        </div>

        {/* ── Comparison Table ── */}
        {tableOpen && (
          <div className="overflow-x-auto rounded-2xl border border-neutral-200 animate-[fadeInDown_0.2s_ease-out_both]">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="text-left px-5 py-4 text-[12px] font-semibold text-neutral-500 bg-neutral-50 w-[40%]" />
                  {PLANS.map(p => (
                    <th key={p.id} className={`px-4 py-4 text-center font-bold text-[13px] ${p.popular ? 'bg-neutral-900 text-white' : 'bg-neutral-50 text-black'}`}>
                      {p.name}
                      <div className={`text-[11px] font-medium mt-0.5 ${p.popular ? 'text-neutral-400' : 'text-neutral-500'}`}>
                        ₹{fmt(annual ? p.priceAnnually : p.priceMonthly)}/mo
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARE_SECTIONS.map(section => (
                  <>
                    <tr key={`heading-${section.heading}`} className="bg-neutral-50 border-y border-neutral-200">
                      <td colSpan={4} className="px-5 py-2.5 text-[11px] font-bold uppercase tracking-widest text-neutral-400">
                        {section.heading}
                      </td>
                    </tr>
                    {section.rows.map((row) => (
                      <tr key={`${section.heading}-${row.label}`} className="border-b border-neutral-100 hover:bg-neutral-50/60 transition-colors">
                        <td className="px-5 py-3.5 text-[13px] font-medium text-neutral-700">{row.label}</td>
                        {row.values.map((val, vi) => (
                          <td key={PLANS[vi].id} className={`px-4 py-3.5 text-center ${PLANS[vi].popular ? 'bg-neutral-900/[0.03]' : ''}`}>
                            <Cell value={val} popular={PLANS[vi].popular} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-neutral-200">
                  <td className="px-5 py-4 bg-neutral-50" />
                  {PLANS.map(p => (
                    <td key={p.id} className={`px-4 py-4 text-center ${p.popular ? 'bg-neutral-900' : 'bg-neutral-50'}`}>
                      <a href="#contact" className={`inline-flex justify-center items-center w-full py-2.5 rounded-xl text-[13px] font-semibold transition-all ${
                        p.popular
                          ? 'bg-blue-500 text-white hover:bg-blue-600'
                          : 'bg-black text-white hover:bg-neutral-800'
                      }`}>
                        {p.cta}
                      </a>
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}

export default PricingSection
