import { useState, useEffect, useRef } from 'react'
import { ChevronDown, Check } from 'lucide-react'

export function CompactCustomSelect({
  value,
  onChange,
  options,
  className = '',
}: {
  value: string
  onChange: (val: string) => void
  options: { label: string; value: string }[]
  className?: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedOption = options.find(o => o.value === value)

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`pl-2.5 pr-6 py-1 bg-card hover:bg-surface border border-border-main text-primary-text font-bold text-xs rounded-lg outline-none cursor-pointer flex items-center gap-1 transition-all shadow-2xs relative ${className}`}
      >
        <span className="truncate">{selectedOption ? selectedOption.label : value}</span>
        <ChevronDown
          size={12}
          className={`text-secondary-text transition-transform duration-200 absolute right-1.5 top-1/2 -translate-y-1/2 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-[calc(100%+4px)] left-0 min-w-[110px] w-full bg-card border border-border-main rounded-xl shadow-xl p-1 z-[160] animate-[fadeInUp_0.15s_ease-out_both] space-y-0.5 max-h-52 overflow-y-auto">
          {options.map(opt => {
            const isSelected = opt.value === value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value)
                  setIsOpen(false)
                }}
                className={`w-full text-left px-2.5 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold'
                    : 'text-primary-text hover:bg-surface'
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && <Check size={12} strokeWidth={2.5} className="shrink-0 text-emerald-600 dark:text-emerald-400" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
