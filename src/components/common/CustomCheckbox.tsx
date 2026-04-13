import { Check } from 'lucide-react';

interface CustomCheckboxProps {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  readOnly?: boolean;
  className?: string;
}

export function CustomCheckbox({ checked, onChange, readOnly = false, className = '' }: CustomCheckboxProps) {
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        if (!readOnly && onChange) onChange(!checked);
      }}
      className={`w-4 h-4 rounded-[4px] border flex items-center justify-center transition-all ${
        readOnly ? '' : 'cursor-pointer'
      } ${
        checked
          ? 'bg-accent border-accent'
          : 'border-accent bg-card hover:border-secondary-text'
      } ${className}`}
    >
      {checked && <Check size={12} className="text-accent-fg" strokeWidth={4} />}
    </div>
  );
}
