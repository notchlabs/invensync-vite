import { useMemo } from 'react'
import { Calendar, ChevronDown } from 'lucide-react'

interface FriendlyDateTimePickerProps {
  value: string // YYYY-MM-DDTHH:mm
  onChange: (value: string) => void
  label?: string
  className?: string
}

export function FriendlyDateTimePicker({ value, onChange, label, className = '' }: FriendlyDateTimePickerProps) {

  const formatFriendly = (val: string) => {
    if (!val) return ''
    const date = new Date(val)
    if (isNaN(date.getTime())) return val

    const day = date.getDate()
    const month = date.toLocaleString('en-US', { month: 'long' })
    const year = date.getFullYear()
    const time = date.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase()

    const getOrdinal = (n: number) => {
      const s = ['th', 'st', 'nd', 'rd']
      const v = n % 100
      return n + (s[(v - 20) % 10] || s[v] || s[0])
    }

    return `${getOrdinal(day)} ${month} ${year}, ${time}`
  }

  const friendlyValue = useMemo(() => formatFriendly(value), [value])

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && <label className="text-[12px] font-black text-primary-text uppercase tracking-wider">{label}</label>}
      
      <div className="relative group">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-text group-hover:text-primary-text transition-colors">
          <Calendar size={16} />
        </div>
        
        <input
          type="datetime-local"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-[48px] pl-10 pr-10 bg-surface border border-border-main rounded-xl text-[13px] font-bold text-primary-text focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-secondary-text transition-all appearance-none cursor-pointer shadow-sm"
        />

        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-muted-text">
          <ChevronDown size={14} />
        </div>

        {/* Friendly Overlay - This makes it look like the requested format while keeping native picker functionality */}
        <div className="absolute inset-0 pl-10 pr-10 bg-surface border border-border-main rounded-xl flex items-center text-[13px] font-bold text-primary-text pointer-events-none group-focus-within:opacity-0 transition-opacity">
          {friendlyValue}
        </div>
      </div>
    </div>
  )
}
