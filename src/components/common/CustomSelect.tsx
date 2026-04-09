import { ChevronDown } from "lucide-react"
import { useEffect, useRef, useState } from "react"

export const CustomSelect = ({ 
  icon: Icon, 
  placeholder, 
  options, 
  value, 
  onChange,
  className = ""
}: { 
  icon?: any, 
  placeholder: string, 
  options: { label: string, value: string }[],
  value: string,
  onChange: (val: string) => void,
  className?: string
}) => {
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
      {Icon && (
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10">
          <Icon size={16} className="text-neutral-400" />
        </div>
      )}
      <button 
        type="button" 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full ${Icon ? 'pl-10' : 'pl-3.5'} pr-8 py-2 ${isOpen ? 'bg-card border-border-main ring-4 ring-accent/5' : 'bg-surface hover:bg-sidebar border-transparent'} text-[13px] font-medium text-left focus:outline-none transition-all cursor-pointer relative h-full flex items-center ${className}`}
      >
        <span className={`block truncate ${selectedOption ? "text-secondary-text" : "text-muted-text"}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
      </button>
      <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none z-10">
        <ChevronDown size={14} className={`text-muted-text transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute top-[calc(100%+6px)] left-0 right-0 bg-card border border-border-main shadow-md rounded-xl overflow-hidden z-50 animate-[fadeInUp_0.15s_ease-out_both] min-w-max w-full">
          <div className="max-h-60 overflow-y-auto p-1.5 w-full flex flex-col">
            <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-text mb-0.5">{placeholder}</div>
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value)
                  setIsOpen(false)
                }}
                className={`w-full text-left px-2.5 py-2 text-[13px] font-medium rounded-lg transition-colors ${
                  value === opt.value ? 'bg-surface text-primary-text' : 'text-secondary-text hover:bg-surface hover:text-primary-text'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
