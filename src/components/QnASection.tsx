import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const FAQS = [
  { q: 'What is InvenSync?', a: 'InvenSync is an AI-powered inventory management platform built for Indian businesses. It digitizes bills using AI, tracks stock in real-time across multiple sites, and provides instant profit visibility — all in one place.' },
  { q: 'How does the AI bill extraction work?', a: "You upload any invoice — handwritten, printed, or digital. InvenSync's AI reads it in seconds, extracts every line item, maps it to your inventory, and files it automatically. It works with both Hindi and English bills." },
  { q: 'What types of businesses use InvenSync?', a: 'InvenSync is used by construction companies, cafes and restaurants, manufacturing units, and multi-branch retail businesses across India. Any business that tracks physical stock and wants real-time visibility will benefit.' },
  { q: 'How much does InvenSync cost?', a: 'InvenSync offers three plans: Starter at ₹1,499/month (1 site), Professional at ₹3,499/month (up to 5 sites), and Enterprise at ₹8,999/month (unlimited sites). Annual billing saves 20%.' },
  { q: 'Does InvenSync support multiple locations?', a: 'Yes. InvenSync supports multi-site inventory management, allowing you to track stock transfers between sites, view per-site reports, and manage role-based access for each location.' },
  { q: 'Is my data secure?', a: 'Absolutely. All data is encrypted in transit and at rest. Access is role-based so each team member only sees what they need. We follow industry-standard security practices and are hosted on enterprise-grade cloud infrastructure.' },
  { q: 'Can I try InvenSync before committing?', a: "Yes — reach out via the contact form and we'll set up a personalised demo walkthrough for your business. Early access users also get onboarding support at no extra cost." },
  { q: 'What happens if I want to cancel?', a: 'You can cancel anytime by notifying us before the 1st of the next month. There are no lock-in contracts. Your data remains accessible for 30 days after cancellation for export.' },
]

const FAQItem = ({ q, a, isOpen, onToggle }: { q: string; a: string; isOpen: boolean; onToggle: () => void }) => (
  <div className="border-b border-border-main/60 last:border-0">
    <button onClick={onToggle} className="w-full flex items-center justify-between gap-4 py-5 text-left group" aria-expanded={isOpen}>
      <span className={`text-[15px] font-semibold leading-snug transition-colors ${isOpen ? 'text-primary-text' : 'text-secondary-text group-hover:text-primary-text'}`}>
        {q}
      </span>
      <ChevronDown size={18} className={`shrink-0 text-muted-text transition-transform duration-200 ${isOpen ? 'rotate-180 text-primary-text' : ''}`} />
    </button>
    <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[400px] pb-5' : 'max-h-0'}`}>
      <p className="text-[14px] leading-relaxed text-secondary-text">{a}</p>
    </div>
  </div>
)

export const QnASection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0)
  const toggle = (i: number) => setOpenIndex(prev => (prev === i ? null : i))
  const half  = Math.ceil(FAQS.length / 2)
  const left  = FAQS.slice(0, half)
  const right = FAQS.slice(half)

  return (
    <section id="faq" className="py-24 bg-card">
      <div className="max-w-[1100px] mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-14">
          <span className="inline-block px-3 py-1 rounded-full bg-header text-[11px] font-semibold text-muted-text uppercase tracking-widest mb-4">
            FAQ
          </span>
          <h2 className="text-[36px] md:text-[44px] font-display font-bold text-primary-text leading-tight tracking-tight">
            Questions? We have answers.
          </h2>
          <p className="mt-3 text-[16px] text-secondary-text max-w-[480px] mx-auto">
            Everything you need to know about InvenSync before you get started.
          </p>
        </div>

        {/* Two-column FAQ grid */}
        <div className="grid md:grid-cols-2 gap-x-12">
          <div className="bg-surface rounded-2xl px-6">
            {left.map((item, i) => (
              <FAQItem key={i} q={item.q} a={item.a} isOpen={openIndex === i} onToggle={() => toggle(i)} />
            ))}
          </div>
          <div className="bg-surface rounded-2xl px-6">
            {right.map((item, i) => (
              <FAQItem key={i + half} q={item.q} a={item.a} isOpen={openIndex === i + half} onToggle={() => toggle(i + half)} />
            ))}
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-[14px] text-muted-text">
            Still have questions?{' '}
            <a href="#contact" className="font-semibold text-primary-text hover:underline underline-offset-2">Talk to us →</a>
          </p>
        </div>
      </div>
    </section>
  )
}
