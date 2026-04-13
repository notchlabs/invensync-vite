/**
 * Environment Variables & API Configuration
 * 
 * Vite exposes env variables on the special `import.meta.env` object.
 * Prefixing variables with `VITE_` makes them available to the client build.
 */

// Centralize ENV access to prevent repeating `import.meta.env` throughout the app 
// and provide safe fallbacks.
export const ENV = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8090/api/v1',
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,
  MICROSOFT_CLIENT_ID: import.meta.env.VITE_MICROSOFT_CLIENT_ID || '',
  MICROSOFT_AUTHORITY_URI: import.meta.env.VITE_MICROSOFT_AUTHORITY_URI || '',
  MICROSOFT_REDIRECT_URI: import.meta.env.VITE_MICROSOFT_REDIRECT_URI || '',
  DEFAULT_SITE_ID: import.meta.env.VITE_DEFAULT_SITE_ID || '29',
  DEFAULT_CUSTOMER_ID: import.meta.env.VITE_DEFAULT_CUSTOMER_ID || '28',
}

// Map out backend API endpoint paths here to keep network calls clean
export const API_ENDPOINTS = {
  // Example:
  // LOGIN: `${ENV.API_BASE_URL}/auth/login`,
  // REGISTER: `${ENV.API_BASE_URL}/auth/register`,
  
  // Future endpoints can be added here
}
