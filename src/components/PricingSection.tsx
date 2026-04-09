import { useState } from 'react'
import { Check } from 'lucide-react'

const pricingPlans = [
  {
    name: 'Starter',
    desc: 'Perfect for small contractors managing a single project.',
    priceMonthly: '1,499',
    priceAnnually: '1,199',
    button: 'Start Free Trial',
    popular: false,
    features: [
      { name: '1 Site limit', included: true },
      { name: '50 AI Credits / month', included: true },
      { name: '10 Transfers / day', included: true },
      { name: '50 Consumptions / day', included: true },
      { name: '30-day Audit Log', included: true },
      { name: 'Email Support', included: true },
    ]
  },
  {
    name: 'Professional',
    desc: 'The ideal plan for growing businesses with multiple sites.',
    priceMonthly: '3,499',
    priceAnnually: '2,799',
    button: 'Get Professional',
    popular: true,
    features: [
      { name: 'Up to 5 Sites', included: true },
      { name: '500 AI Credits / month', included: true },
      { name: '100 Transfers / day', included: true },
      { name: 'Unlimited Consumptions', included: true },
      { name: '1-Year Audit Log', included: true },
      { name: 'Priority Chat Support', included: true },
    ]
  },
  {
    name: 'Enterprise',
    desc: 'Advanced tools and limits for large-scale operations.',
    priceMonthly: '8,999',
    priceAnnually: '7,199',
    button: 'Talk to Sales',
    popular: false,
    features: [
      { name: 'Unlimited Sites', included: true },
      { name: 'Unlimited AI Credits', included: true },
      { name: 'Unlimited Transfers', included: true },
      { name: 'Unlimited Consumptions', included: true },
      { name: 'Lifetime Audit Log', included: true },
      { name: '24/7 Phone & CSM', included: true },
    ]
  }
]

const PricingSection = () => {
  const [annual, setAnnual] = useState(true)

  return (
    <section className="py-24 max-md:py-16 bg-white relative overflow-hidden" id="pricing">
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-neutral-200 to-transparent" />
      
      <div className="max-w-[1200px] mx-auto px-6 relative z-10">
        <div className="text-center mb-16 max-md:mb-12">
          <span className="inline-block text-[12px] font-bold tracking-[2.5px] uppercase text-neutral-600 mb-4 px-[18px] py-1.5 bg-neutral-50 border border-neutral-200 rounded-full">
            Pricing
          </span>
          <h2 className="text-[48px] max-md:text-[34px] font-bold text-black tracking-tight mb-5 font-display">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg max-md:text-base text-neutral-600 max-w-[540px] mx-auto leading-relaxed mb-8">
            Choose the plan that fits your business scale. No hidden fees.
          </p>
          
          {/* Toggle */}
          <div className="inline-flex items-center p-1 bg-neutral-100 border border-neutral-200 rounded-lg shrink-0">
            <button 
              onClick={() => setAnnual(false)} 
              className={`px-5 py-2.5 text-[14px] font-semibold rounded-md transition-all ${!annual ? 'bg-white text-black border border-neutral-200 shadow-sm' : 'text-neutral-500 hover:text-black border border-transparent'}`}
            >
              Pay Monthly
            </button>
            <button 
              onClick={() => setAnnual(true)} 
              className={`px-5 py-2.5 text-[14px] font-semibold rounded-md transition-all flex items-center gap-2 ${annual ? 'bg-white text-black border border-neutral-200 shadow-sm' : 'text-neutral-500 hover:text-black border border-transparent'}`}
            >
              Pay Annually <span className="px-2 py-0.5 text-[10px] bg-blue-100 text-blue-700 rounded-full uppercase tracking-wider font-bold">Save 20%</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 max-lg:grid-cols-2 max-md:grid-cols-1 gap-6 max-w-[1100px] mx-auto">
          {pricingPlans.map((plan, i) => (
            <div 
              key={i} 
              className={`relative flex flex-col p-8 rounded-2xl transition-all duration-300 ${
                plan.popular 
                  ? 'bg-neutral-900 border border-black shadow-[0_8px_30px_rgba(0,0,0,0.08)] -translate-y-2 max-lg:translate-y-0 text-white' 
                  : 'bg-white border border-neutral-200 hover:-translate-y-1'
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1.5 bg-blue-500 text-white text-[11px] font-bold uppercase tracking-wider rounded-full whitespace-nowrap">
                  Most Popular
                </div>
              )}
              
              <div className="mb-6">
                <h3 className={`text-[20px] font-bold font-display mb-2 ${plan.popular ? 'text-white' : 'text-black'}`}>{plan.name}</h3>
                <p className={`text-[13px] leading-relaxed h-[40px] ${plan.popular ? 'text-neutral-400' : 'text-neutral-500'}`}>{plan.desc}</p>
              </div>

              <div className="mb-8 flex items-end gap-1">
                <span className={`text-[42px] font-bold font-display leading-[0.9] tracking-tight ${plan.popular ? 'text-white' : 'text-black'}`}>
                  ₹{annual ? plan.priceAnnually : plan.priceMonthly}
                </span>
                <span className={`text-[13px] font-medium mb-1 ${plan.popular ? 'text-neutral-400' : 'text-neutral-500'}`}>/mo</span>
              </div>

              <a href="#contact" className={`w-full py-3.5 mb-8 rounded-xl text-[14px] font-semibold transition-all inline-flex justify-center items-center ${
                plan.popular 
                  ? 'bg-blue-500 text-white hover:bg-blue-600' 
                  : 'bg-neutral-100 text-black border border-neutral-200 hover:bg-neutral-200'
              }`}>
                {plan.button}
              </a>

              <div className="flex flex-col gap-4 mt-auto">
                {plan.features.map((feature, j) => (
                  <div key={j} className="flex items-center gap-3">
                    <span className={`shrink-0 w-5 h-5 flex items-center justify-center rounded-full ${plan.popular ? 'bg-neutral-800 text-blue-400' : 'bg-neutral-100 text-neutral-600'}`}>
                      <Check size={12} strokeWidth={3} />
                    </span>
                    <span className={`text-[14px] font-medium ${plan.popular ? 'text-neutral-300' : 'text-neutral-600'}`}>{feature.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default PricingSection
