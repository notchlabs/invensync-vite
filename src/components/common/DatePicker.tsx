import { useState, useRef, useEffect } from 'react'
import { DayPicker } from 'react-day-picker'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { format, parse, isValid } from 'date-fns'

interface DatePickerProps {
  value: string          // yyyy-MM-dd
  onChange: (value: string) => void
  placeholder?: string
  min?: string           // yyyy-MM-dd
  max?: string           // yyyy-MM-dd
  label?: string
  required?: boolean
  disabled?: boolean
}

const POPOVER_H = 340 // approximate popover height px
const POPOVER_W = 296 // approximate popover width px
const GAP = 8

type Placement = { vertical: 'down' | 'up'; horizontal: 'left' | 'right' }

export function DatePicker({
  value,
  onChange,
  placeholder = 'Select date',
  min,
  max,
  disabled = false,
}: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const [placement, setPlacement] = useState<Placement>({ vertical: 'down', horizontal: 'left' })
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const selected = value ? parse(value, 'yyyy-MM-dd', new Date()) : undefined
  const displayValue = selected && isValid(selected)
    ? format(selected, 'd MMM, yyyy')
    : null

  const minDate = min ? parse(min, 'yyyy-MM-dd', new Date()) : undefined
  const maxDate = max ? parse(max, 'yyyy-MM-dd', new Date()) : undefined

  const computePlacement = () => {
    const rect = triggerRef.current?.getBoundingClientRect()
    if (!rect) return
    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top
    const spaceRight = window.innerWidth - rect.left
    setPlacement({
      vertical: spaceBelow >= POPOVER_H + GAP || spaceBelow >= spaceAbove ? 'down' : 'up',
      horizontal: spaceRight >= POPOVER_W ? 'left' : 'right',
    })
  }

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const popoverPos: React.CSSProperties =
    placement.vertical === 'down'
      ? { top: `calc(100% + ${GAP}px)` }
      : { bottom: `calc(100% + ${GAP}px)` }

  const popoverAlign: React.CSSProperties =
    placement.horizontal === 'left' ? { left: 0 } : { right: 0 }

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!open) computePlacement()
          setOpen(v => !v)
        }}
        className={`
          w-full h-[42px] px-4 flex items-center justify-between gap-3
          bg-surface border rounded-lg text-[13px] font-semibold transition-all
          disabled:opacity-50 disabled:cursor-not-allowed
          ${open
            ? 'border-secondary-text ring-2 ring-accent/5'
            : 'border-border-main hover:border-secondary-text'
          }
          ${displayValue ? 'text-primary-text' : 'text-muted-text'}
        `}
      >
        <span>{displayValue ?? placeholder}</span>
        <CalendarDays size={15} className={open ? 'text-primary-text' : 'text-muted-text'} />
      </button>

      {/* Popover */}
      {open && (
        <div
          style={{ ...popoverPos, ...popoverAlign }}
          className="absolute z-[200] bg-card border border-border-main rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.25)] p-4 select-none"
        >
          <DayPicker
            mode="single"
            selected={selected && isValid(selected) ? selected : undefined}
            onSelect={(day) => {
              if (day) {
                onChange(format(day, 'yyyy-MM-dd'))
                setOpen(false)
              }
            }}
            defaultMonth={selected && isValid(selected) ? selected : new Date()}
            disabled={[
              ...(minDate ? [{ before: minDate }] : []),
              ...(maxDate ? [{ after: maxDate }] : []),
            ]}
            classNames={{
              root: 'w-[280px]',
              months: 'flex flex-col',
              month: 'flex flex-col gap-3',
              month_caption: 'flex items-center justify-between px-1 mb-1',
              caption_label: 'text-[15px] font-black text-primary-text tracking-tight',
              nav: 'flex items-center gap-1',
              button_previous: 'w-8 h-8 flex items-center justify-center rounded-xl border border-border-main text-muted-text hover:bg-surface hover:text-primary-text transition-colors',
              button_next: 'w-8 h-8 flex items-center justify-center rounded-xl border border-border-main text-muted-text hover:bg-surface hover:text-primary-text transition-colors',
              month_grid: 'w-full border-collapse',
              weekdays: 'flex mb-1',
              weekday: 'flex-1 text-center text-[10px] font-black text-muted-text uppercase tracking-widest py-1.5',
              week: 'flex mt-1',
              day: 'flex-1 flex items-center justify-center',
              day_button: `
                w-8 h-8 rounded-xl text-[13px] font-bold transition-all cursor-pointer
                text-primary-text hover:bg-surface
              `,
              selected: '[&>button]:!bg-primary-text [&>button]:!text-card [&>button]:shadow-sm',
              today: '[&>button]:ring-2 [&>button]:ring-secondary-text/40 [&>button]:font-black',
              outside: '[&>button]:!text-muted-text/30 [&>button]:pointer-events-none',
              disabled: '[&>button]:!text-muted-text/20 [&>button]:!cursor-not-allowed [&>button]:hover:bg-transparent',
              hidden: 'invisible',
            }}
            components={{
              Chevron: ({ orientation }) =>
                orientation === 'left'
                  ? <ChevronLeft size={15} strokeWidth={2.5} />
                  : <ChevronRight size={15} strokeWidth={2.5} />,
            }}
          />
        </div>
      )}
    </div>
  )
}
