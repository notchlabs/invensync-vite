import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { HealthPoller, type HealthStatus } from '../services/api/healthCheck'
import { StatusBanner } from '../components/common/StatusBanner'

export type ConnectionState = 'online' | 'offline' | 'server-error' | 'reconnected'

interface ConnectionContextValue {
  state: ConnectionState
  isRetrying: boolean
  retryNow: () => Promise<void>
  notifyDegraded: (type: 'offline' | 'server' | 'timeout', status?: number) => void
  registerRetryAction: (retryFn: () => void | Promise<void>) => () => void
}

const ConnectionContext = createContext<ConnectionContextValue | null>(null)

// Global dispatcher so any API caller (e.g. ApiService) can signal a degraded state
let globalNotifyDegraded: ((type: 'offline' | 'server' | 'timeout', status?: number) => void) | null = null

export function triggerDegradedState(type: 'offline' | 'server' | 'timeout', status?: number) {
  globalNotifyDegraded?.(type, status)
}

export const ConnectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<ConnectionState>('online')
  const [serverStatusCode, setServerStatusCode] = useState<number | undefined>(undefined)
  const [isRetrying, setIsRetrying] = useState(false)

  const retryQueueRef = useRef<Set<() => void | Promise<void>>>(new Set())
  const pollerRef = useRef<HealthPoller | null>(null)
  const reconnectedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const replayPendingRequests = useCallback(() => {
    retryQueueRef.current.forEach((fn) => {
      try {
        fn()
      } catch (err) {
        console.error('Failed to replay request:', err)
      }
    })
  }, [])

  const handleRecovered = useCallback(() => {
    setState('reconnected')
    setServerStatusCode(undefined)
    replayPendingRequests()

    if (reconnectedTimerRef.current) clearTimeout(reconnectedTimerRef.current)
    reconnectedTimerRef.current = setTimeout(() => {
      setState('online')
    }, 3000)
  }, [replayPendingRequests])

  const notifyDegraded = useCallback((type: 'offline' | 'server' | 'timeout', status?: number) => {
    // Prefer 'offline' whenever navigator.onLine is false or when there's no response
    if (type === 'offline' || !navigator.onLine) {
      setServerStatusCode(undefined)
      setState('offline')
      pollerRef.current?.scheduleRetry(4000)
    } else if (type === 'server') {
      if (status) setServerStatusCode(status)
      setState((prev) => {
        if (prev === 'offline') return prev
        return 'server-error'
      })
      pollerRef.current?.scheduleRetry(status === 502 ? 10000 : 10000)
    }
  }, [])

  // Callback whenever HealthPoller completes a check (both heartbeat and recovery)
  const handleHealthStatus = useCallback((status: HealthStatus) => {
    if (status.isHealthy) {
      setServerStatusCode(undefined)
      setState((prev) => {
        // If we were previously degraded, show the green reconnected banner!
        if (prev === 'offline' || prev === 'server-error') {
          handleRecovered()
          return 'reconnected'
        }
        return 'online'
      })
    } else if (status.isServerError && navigator.onLine) {
      setServerStatusCode(status.statusCode)
      setState('server-error')
    } else {
      setServerStatusCode(undefined)
      setState('offline')
    }
  }, [handleRecovered])

  // Initialize Poller on mount & start continuous heartbeat
  useEffect(() => {
    globalNotifyDegraded = notifyDegraded
    pollerRef.current = new HealthPoller(handleHealthStatus)
    pollerRef.current.start() // Runs immediately, then continuous heartbeat every 15s

    return () => {
      pollerRef.current?.stop()
      globalNotifyDegraded = null
    }
  }, [handleHealthStatus, notifyDegraded])

  // Listen to wake from sleep / tab focus / visibility change
  useEffect(() => {
    const handleWakeOrFocus = () => {
      if (document.visibilityState === 'visible') {
        // User woke computer from sleep or returned to tab: probe immediately!
        pollerRef.current?.probeNow()
      }
    }

    document.addEventListener('visibilitychange', handleWakeOrFocus)
    window.addEventListener('focus', handleWakeOrFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleWakeOrFocus)
      window.removeEventListener('focus', handleWakeOrFocus)
    }
  }, [])

  // Window network events
  useEffect(() => {
    const handleBrowserOffline = () => {
      notifyDegraded('offline')
    }

    const handleBrowserOnline = async () => {
      // Device reconnected to Wi-Fi/network: probe backend immediately
      const status = await pollerRef.current?.probeNow()
      if (status?.isHealthy) {
        handleRecovered()
      } else if (status?.isServerError) {
        notifyDegraded('server', status?.statusCode)
      } else {
        notifyDegraded('offline')
      }
    }

    window.addEventListener('offline', handleBrowserOffline)
    window.addEventListener('online', handleBrowserOnline)

    return () => {
      window.removeEventListener('offline', handleBrowserOffline)
      window.removeEventListener('online', handleBrowserOnline)
    }
  }, [handleRecovered, notifyDegraded])

  const retryNow = async () => {
    setIsRetrying(true)
    try {
      await pollerRef.current?.probeNow()
    } finally {
      setIsRetrying(false)
    }
  }

  const registerRetryAction = useCallback((retryFn: () => void | Promise<void>) => {
    retryQueueRef.current.add(retryFn)
    return () => {
      retryQueueRef.current.delete(retryFn)
    }
  }, [])

  return (
    <ConnectionContext.Provider value={{ state, isRetrying, retryNow, notifyDegraded, registerRetryAction }}>
      {/* ── Banners ── */}
      {state === 'offline' && (
        <StatusBanner
          variant="amber"
          message={
            <span>
              No internet. Wait for reconnection, or{' '}
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="underline font-semibold hover:opacity-80 cursor-pointer inline transition-opacity"
              >
                reload the window
              </button>
            </span>
          }
          showLoaderOnly={true}
        />
      )}

      {state === 'server-error' && (
        <StatusBanner
          variant="red"
          message={
            serverStatusCode === 502 || serverStatusCode === 503
              ? 'Server is getting refreshed, kindly wait 1–2 mins'
              : "We're having trouble reaching the server — retrying..."
          }
          actionText="Retry now"
          isLoading={isRetrying}
          onAction={retryNow}
        />
      )}

      {state === 'reconnected' && (
        <StatusBanner
          variant="green"
          message="Back online. Resuming where you left off."
          onDismiss={() => setState('online')}
        />
      )}

      {/* Push layout down when a banner is displayed */}
      <div className={`transition-all duration-300 ${state !== 'online' ? 'pt-10' : ''}`}>
        {children}
      </div>
    </ConnectionContext.Provider>
  )
}

export function useConnection() {
  const ctx = useContext(ConnectionContext)
  if (!ctx) throw new Error('useConnection must be used within a ConnectionProvider')
  return ctx
}
