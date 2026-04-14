import { useState, useRef, useEffect } from 'react'
import { DayPicker, type DateRange } from 'react-day-picker'
import { format } from 'date-fns'
import { Calendar as CalendarIcon, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import 'react-day-picker/style.css'

interface AdvancedDateRangePickerProps {
  selectedRange: DateRange | undefined
  onRangeChange: (range: DateRange | undefined) => void
  placeholder?: string
  label?: string
  className?: string
}

export function AdvancedDateRangePicker({ 
  selectedRange, 
  onRangeChange, 
  placeholder = "Select date range",
  label,
  className = "" 
}: AdvancedDateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const displayText = selectedRange?.from 
    ? `${format(selectedRange.from, 'MMM d, yyyy')}${selectedRange.to ? ` - ${format(selectedRange.to, 'MMM d, yyyy')}` : ''}`
    : placeholder

  return (
    <div className={`flex flex-col gap-1 ${className}`} ref={containerRef}>
      {label && <span className="text-[9px] font-black text-muted-text uppercase tracking-tighter pl-1">{label}</span>}
      
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full h-[38px] px-3 bg-card border border-border-main rounded-lg flex items-center justify-between text-[12px] font-bold transition-all hover:border-secondary-text shadow-sm ${isOpen ? 'ring-2 ring-accent/5 border-secondary-text' : ''} ${selectedRange?.from ? 'text-primary-text' : 'text-muted-text/50'}`}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <CalendarIcon size={14} className="text-muted-text shrink-0" />
            <span className="truncate">{displayText}</span>
          </div>
          {selectedRange?.from && (
            <X 
              size={12} 
              className="text-muted-text hover:text-rose-500 cursor-pointer ml-2 shrink-0 transition-colors" 
              onClick={(e) => {
                e.stopPropagation()
                onRangeChange(undefined)
              }}
            />
          )}
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute top-[calc(100%+8px)] left-0 z-50 p-4 bg-card border border-border-main rounded-2xl shadow-2xl shadow-left animate-in"
            >
              <DayPicker
                mode="range"
                selected={selectedRange}
                onSelect={onRangeChange}
                className="custom-daypicker"
                classNames={{
                  months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                  month: "space-y-4",
                  month_caption: "flex justify-center pt-1 relative items-center mb-2",
                  caption_label: "text-[13px] font-black text-primary-text uppercase tracking-widest",
                  nav: "flex items-center",
                  button_previous: "absolute left-1 h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 transition-opacity z-10",
                  button_next: "absolute right-1 h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 transition-opacity z-10",
                  month_grid: "w-full border-collapse space-y-1",
                  weekdays: "flex",
                  weekday: "text-muted-text rounded-md w-9 font-black text-[10px] uppercase",
                  week: "flex w-full mt-2",
                  day: "h-9 w-9 p-0 font-bold aria-selected:opacity-100 hover:bg-surface rounded-lg transition-all text-primary-text flex items-center justify-center",
                  day_button: "h-full w-full p-0 font-bold text-inherit bg-transparent border-none outline-none cursor-pointer flex items-center justify-center",
                  selected: "bg-accent text-accent-fg hover:bg-accent hover:text-accent-fg focus:bg-accent focus:text-accent-fg",
                  today: "bg-surface text-accent font-black border border-accent/20",
                  outside: "text-muted-text/20 opacity-50",
                  disabled: "text-muted-text/20 opacity-50",
                  range_middle: "aria-selected:bg-accent/10 aria-selected:text-accent !rounded-none",
                  range_start: "day-range-start !rounded-r-none",
                  range_end: "day-range-end !rounded-l-none",
                  hidden: "invisible",
                }}
                components={{
                  Chevron: (props) => {
                    if (props.orientation === 'left') return <ChevronLeft size={16} />
                    return <ChevronRight size={16} />
                  }
                }}
              />
              
              <div className="mt-4 pt-4 border-t border-border-main flex justify-between items-center">
                <button 
                  onClick={() => onRangeChange(undefined)}
                  className="text-[11px] font-black text-rose-500 uppercase tracking-widest hover:underline"
                >
                  Clear Range
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-1.5 bg-accent text-accent-fg rounded-lg text-[11px] font-black uppercase tracking-widest hover:opacity-90 transition-opacity shadow-sm"
                >
                  Apply
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
