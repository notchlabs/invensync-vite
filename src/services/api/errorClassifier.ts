export type ClassifiedErrorType =
  | 'offline'
  | 'server'
  | 'timeout'
  | 'notfound'
  | 'forbidden'
  | 'unauthorized'
  | 'unknown'

export interface ClassifiedError {
  type: ClassifiedErrorType
  status?: number
  message: string
  isTransient: boolean
  originalError: unknown
}

export function classifyError(error: unknown, status?: number): ClassifiedError {
  // 1. Device is offline
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return {
      type: 'offline',
      message: 'No internet connection',
      isTransient: true,
      originalError: error,
    }
  }

  // 2. Status code checks
  if (status) {
    if (status === 401) {
      return {
        type: 'unauthorized',
        status,
        message: 'Your session has expired. Please sign in again to continue.',
        isTransient: false,
        originalError: error,
      }
    }

    if (status === 403) {
      return {
        type: 'forbidden',
        status,
        message: "You don't have permission to access this resource.",
        isTransient: false,
        originalError: error,
      }
    }

    if (status === 404) {
      return {
        type: 'notfound',
        status,
        message: "This record or resource couldn't be found.",
        isTransient: false,
        originalError: error,
      }
    }

    if (status === 502 || status === 503) {
      return {
        type: 'server',
        status,
        message: 'Server is getting refreshed, kindly wait 1–2 mins',
        isTransient: true,
        originalError: error,
      }
    }

    if (status >= 500) {
      return {
        type: 'server',
        status,
        message: "We're having trouble reaching the server — retrying...",
        isTransient: true,
        originalError: error,
      }
    }
  }

  // 3. Network or timeout errors
  const errStr = String(error).toLowerCase()
  if (errStr.includes('internet_disconnected') || (typeof navigator !== 'undefined' && !navigator.onLine)) {
    return {
      type: 'offline',
      message: 'No internet connection',
      isTransient: true,
      originalError: error,
    }
  }

  if (errStr.includes('network') || errStr.includes('failed to fetch') || errStr.includes('refused')) {
    return {
      type: navigator.onLine ? 'server' : 'offline',
      message: navigator.onLine
        ? "We're having trouble reaching the server — retrying..."
        : 'No internet connection',
      isTransient: true,
      originalError: error,
    }
  }

  if (errStr.includes('timeout') || errStr.includes('aborted')) {
    return {
      type: 'timeout',
      message: 'The server took longer than expected to respond.',
      isTransient: true,
      originalError: error,
    }
  }

  return {
    type: 'unknown',
    status,
    message: 'Unable to complete this request right now.',
    isTransient: false,
    originalError: error,
  }
}
