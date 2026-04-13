import { Calendar } from 'lucide-react'

interface DateRangePickerProps {
  from: string;
  to: string;
  onFromChange: (val: string) => void;
  onToChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}

export function DateRangePicker({ 
  from, 
  to, 
  onFromChange, 
  onToChange, 
  placeholder = "Select range",
  className = "" 
}: DateRangePickerProps) {
  return (
    <div className={`flex items-center bg-card border border-border-main rounded-lg h-[38px] px-3 shadow-sm transition-all hover:border-secondary-text focus-within:border-secondary-text focus-within:ring-2 focus-within:ring-accent/5 ${className}`}>
      <Calendar size={14} className="text-muted-text shrink-0 mr-2" />
      <div className="flex items-center gap-1 flex-1">
        <input 
          type="date"
          value={from}
          onChange={(e) => onFromChange(e.target.value)}
          className="bg-transparent text-[12px] font-bold text-primary-text outline-none w-[100px] cursor-pointer appearance-none"
        />
        <span className="text-muted-text/30 text-[10px] font-black uppercase">to</span>
        <input 
          type="date"
          value={to}
          onChange={(e) => onToChange(e.target.value)}
          className="bg-transparent text-[12px] font-bold text-primary-text outline-none w-[100px] cursor-pointer appearance-none"
        />
      </div>
      
      {/* Hide the default date icon in some browsers to keep it clean */}
      <style>{`
        input[type="date"]::-webkit-calendar-picker-indicator {
          opacity: 0;
          position: absolute;
          left: 0;
          right: 0;
          top: 0;
          bottom: 0;
          width: auto;
          height: auto;
          cursor: pointer;
        }
      `}</style>
    </div>
  )
}
