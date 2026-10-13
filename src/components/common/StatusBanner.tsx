import React from 'react'
import { WifiOff, ServerCrash, CheckCircle2, RotateCw, Loader2, X } from 'lucide-react'

export type BannerVariant = 'amber' | 'red' | 'green'

interface StatusBannerProps {
  variant: BannerVariant
  message: React.ReactNode
  actionText?: string
  onAction?: () => void
  isLoading?: boolean
  showLoaderOnly?: boolean
  loaderText?: string
  onDismiss?: () => void
}

export const StatusBanner: React.FC<StatusBannerProps> = ({
  variant,
  message,
  actionText = 'Retry now',
  onAction,
  isLoading = false,
  showLoaderOnly = false,
  loaderText,
  onDismiss,
}) => {
  const styles = {
    amber: {
      container: 'bg-amber-50/95 border-amber-200 text-amber-900 dark:bg-[#241705]/95 dark:border-amber-500/30 dark:text-amber-200 shadow-sm',
      icon: <WifiOff className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />,
      button: 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-500 text-white shadow-xs',
      loader: 'text-amber-600 dark:text-amber-400',
    },
    red: {
      container: 'bg-red-50/95 border-red-200 text-red-900 dark:bg-[#260a0a]/95 dark:border-red-500/30 dark:text-red-200 shadow-sm',
      icon: <ServerCrash className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />,
      button: 'bg-red-600 hover:bg-red-700 active:bg-red-800 dark:bg-red-600 dark:hover:bg-red-500 text-white shadow-xs',
      loader: 'text-red-600 dark:text-red-400',
    },
    green: {
      container: 'bg-emerald-50/95 border-emerald-200 text-emerald-900 dark:bg-[#09220e]/95 dark:border-emerald-500/30 dark:text-emerald-200 shadow-sm',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />,
      button: 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white shadow-xs',
      loader: 'text-emerald-600 dark:text-emerald-400',
    },
  }[variant]

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-0 left-0 right-0 z-[9999] border-b backdrop-blur-md px-4 py-2.5 transition-all duration-300 ease-out flex items-center justify-between gap-4 shadow-sm ${styles.container}`}
    >
      {/* Icon + Message */}
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        {styles.icon}
        <div className="text-[13px] font-medium leading-tight">{message}</div>
      </div>

      {/* Action / Loader / Dismiss */}
      <div className="flex items-center gap-2 shrink-0">
        {showLoaderOnly ? (
          <div className="flex items-center gap-2 px-2 py-1 text-[12px] font-medium opacity-90">
            <Loader2 className={`w-4 h-4 animate-spin ${styles.loader}`} />
            {loaderText && <span className="hidden sm:inline">{loaderText}</span>}
          </div>
        ) : onAction && variant !== 'green' ? (
          <button
            type="button"
            onClick={onAction}
            disabled={isLoading}
            className={`px-3 py-1 text-[12px] font-semibold rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-60 cursor-pointer ${styles.button}`}
          >
            <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Checking...' : actionText}</span>
          </button>
        ) : null}

        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss banner"
            className="p-1 text-current opacity-60 hover:opacity-100 rounded-md transition-opacity cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}
