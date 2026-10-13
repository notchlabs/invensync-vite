import { authenticatedFetch, type AuthenticatedFetchOptions } from './apiClient';
import { ENV } from '../../config/env';
import toast from 'react-hot-toast';
import { triggerDegradedState } from '../../context/ConnectionContext';

export class ApiService {
  /**
   * Universal request handler
   */
  private static async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    endpoint: string,
    body?: unknown,
    options: AuthenticatedFetchOptions = {}
  ): Promise<T> {
    // Construct full URL if endpoint is relative
    const url = endpoint.startsWith('http')
      ? endpoint
      : `${ENV.API_BASE_URL}${endpoint}`;

    const headers = new Headers(options.headers);

    // Automatically set Content-Type to JSON if not FormData or already set
    if (body && !(body instanceof FormData) && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const config: AuthenticatedFetchOptions = {
      ...options,
      method,
      headers,
    };

    if (body) {
      config.body = body instanceof FormData ? body : JSON.stringify(body);
    }

    let response: Response;
    try {
      response = await authenticatedFetch(url, config);
    } catch (err) {
      // Network failure / connection refused / no internet -> trigger health polling & banner!
      const errStr = String(err).toLowerCase();
      const isOffline = !navigator.onLine || errStr.includes('internet_disconnected') || errStr.includes('offline');
      triggerDegradedState(isOffline ? 'offline' : 'server');
      throw new Error('NETWORK_ERROR');
    }

    if (response.status >= 500) {
      triggerDegradedState('server', response.status);
      if (response.status === 502 || response.status === 503) {
        toast.error('Server is getting refreshed, kindly wait 1–2 mins', {
          id: 'server-deploying',
          duration: 6000,
        });
        throw new Error('SERVER_DEPLOYING');
      }
      throw new Error('SERVER_ERROR');
    }

    if (!response.ok) {
      // Try to parse error response
      const errorData = await response.json().catch(() => ({ message: 'An unexpected error occurred' }));
      throw errorData;
    }

    // Return JSON by default
    return response.json();
  }

  static async get<T>(endpoint: string, options?: AuthenticatedFetchOptions): Promise<T> {
    return this.request<T>('GET', endpoint, undefined, options);
  }

  static async post<T>(endpoint: string, body?: unknown, options?: AuthenticatedFetchOptions): Promise<T> {
    return this.request<T>('POST', endpoint, body, options);
  }

  static async put<T>(endpoint: string, body?: unknown, options?: AuthenticatedFetchOptions): Promise<T> {
    return this.request<T>('PUT', endpoint, body, options);
  }

  static async patch<T>(endpoint: string, body?: unknown, options?: AuthenticatedFetchOptions): Promise<T> {
    return this.request<T>('PATCH', endpoint, body, options);
  }

  static async delete<T>(endpoint: string, options?: AuthenticatedFetchOptions): Promise<T> {
    return this.request<T>('DELETE', endpoint, undefined, options);
  }
}
