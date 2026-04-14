import { authenticatedFetch } from './apiClient';
import { ENV } from '../../config/env';

export class ApiService {
  /**
   * Universal request handler
   */
  private static async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    endpoint: string,
    body?: unknown,
    options: RequestInit = {}
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

    const config: RequestInit = {
      ...options,
      method,
      headers,
    };

    if (body) {
      config.body = body instanceof FormData ? body : JSON.stringify(body);
    }

    const response = await authenticatedFetch(url, config);

    if (!response.ok) {
      // Try to parse error response
      const errorData = await response.json().catch(() => ({ message: 'An unexpected error occurred' }));
      throw errorData;
    }

    // Return JSON by default
    return response.json();
  }

  static async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>('GET', endpoint, undefined, options);
  }

  static async post<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>('POST', endpoint, body, options);
  }

  static async put<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>('PUT', endpoint, body, options);
  }

  static async patch<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>('PATCH', endpoint, body, options);
  }

  static async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>('DELETE', endpoint, undefined, options);
  }
}
