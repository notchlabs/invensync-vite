import { ENV } from '../../config/env'

/**
 * Resolves the backend health endpoint URL from ENV.API_BASE_URL.
 * Normalizes whether API_BASE_URL includes /api/v1 or not:
 * - "http://localhost:8090/api/v1" -> "http://localhost:8090/api/v1/health"
 * - "http://localhost:8090"        -> "http://localhost:8090/api/v1/health"
 */
export function getHealthEndpointUrl(): string {
  const base = (ENV.API_BASE_URL || 'http://localhost:8090/api/v1').trim().replace(/\/+$/, '')
  if (base.endsWith('/api/v1')) {
    return `${base}/health`
  }
  return `${base}/api/v1/health`
}

export interface HealthStatus {
  isHealthy: boolean
  isServerError: boolean // true only if server actually responded with 5xx
  statusCode?: number
}

/**
 * Detailed probe distinguishing between:
 * 1. Healthy (200 + 'OK')
 * 2. Server 5xx (500, 502, 503, 504) -> server error
 * 3. No response / connection failure / offline -> offline
 */
export async function checkHealthDetailed(timeoutMs = 5000): Promise<HealthStatus> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  const url = getHealthEndpointUrl()

  try {
    const res = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      headers: { Accept: 'text/plain' },
      signal: controller.signal,
    })

    if (res.status >= 500) {
      return { isHealthy: false, isServerError: true, statusCode: res.status }
    }

    if (!res.ok) {
      return { isHealthy: false, isServerError: false, statusCode: res.status }
    }

    const text = await res.text()
    const isOk = text.trim() === 'OK'
    return { isHealthy: isOk, isServerError: false, statusCode: res.status }
  } catch {
    // Network down, DNS fail, offline, or connection refused -> NO response
    return { isHealthy: false, isServerError: false }
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Simple boolean probe for reachability.
 */
export async function checkHealth(timeoutMs = 5000): Promise<boolean> {
  const result = await checkHealthDetailed(timeoutMs)
  return result.isHealthy
}

export type HealthCallback = (status: HealthStatus) => void

/**
 * Continuous health poller:
 * - When healthy: continuous heartbeat every 15s so it NEVER stops checking status.
 * - When no internet connection: checks every 4s.
 * - When 502 / server error: checks every 10s.
 * - Immediate on-demand probe for user wake / focus / manual retry.
 */
export class HealthPoller {
  private offlineInterval = 4000 // 4s when no internet connection
  private serverErrorInterval = 10000 // 10s for 502 / server error
  private healthyInterval = 15000 // 15s heartbeat while user is viewing the website
  private timerId: ReturnType<typeof setTimeout> | null = null
  private isRunning = false
  private onStatusCallback: HealthCallback

  constructor(onStatus: HealthCallback) {
    this.onStatusCallback = onStatus
  }

  public start(): void {
    if (this.isRunning) return
    this.isRunning = true
    this.scheduleNextProbe(0) // Probe immediately on start
  }

  public stop(): void {
    this.isRunning = false
    if (this.timerId) {
      clearTimeout(this.timerId)
      this.timerId = null
    }
  }

  public async probeNow(): Promise<HealthStatus> {
    if (this.timerId) {
      clearTimeout(this.timerId)
      this.timerId = null
    }
    const status = await checkHealthDetailed()
    this.onStatusCallback(status)

    if (this.isRunning) {
      const nextDelay = this.getNextDelay(status)
      this.scheduleNextProbe(nextDelay)
    }
    return status
  }

  public scheduleRetry(delayMs?: number): void {
    if (!this.isRunning) return
    const delay = delayMs ?? this.offlineInterval
    this.scheduleNextProbe(delay)
  }

  public getNextDelay(status: HealthStatus): number {
    if (status.isHealthy) {
      return this.healthyInterval
    }
    if (status.statusCode === 502 || status.isServerError) {
      return this.serverErrorInterval
    }
    return this.offlineInterval
  }

  private scheduleNextProbe(delayMs: number): void {
    if (this.timerId) clearTimeout(this.timerId)
    this.timerId = setTimeout(async () => {
      if (!this.isRunning) return

      const status = await checkHealthDetailed()
      this.onStatusCallback(status)

      const nextDelay = this.getNextDelay(status)
      this.scheduleNextProbe(nextDelay)
    }, delayMs)
  }

  public get active(): boolean {
    return this.isRunning
  }
}
