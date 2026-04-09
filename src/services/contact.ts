import { ENV } from '../config/env';
import type { ApiResponse } from '../types/api';

/**
 * Helper to get the base domain correctly if VITE_API_BASE_URL includes /api/v1
 * as the contact public endpoints sit at /api/public instead.
 */
const getBaseDomain = () => {
  try {
    const url = new URL(ENV.API_BASE_URL);
    return url.origin;
  } catch (e) {
    return ENV.API_BASE_URL.replace('/api/v1', '');
  }
};

const BASE_URL = getBaseDomain();

export interface ContactFormPayload {
  fullName: string;
  emailAddress: string;
  phoneNumber?: string;
  primaryUseCase?: string;
  interestedPlan?: string;
  recaptchaToken: string;
  additionalMessage?: string;
}

export const ContactService = {
  /**
   * Retrieves the reCAPTCHA site key from the backend
   */
  getRecaptchaSiteKey: async (): Promise<ApiResponse<string>> => {
    const response = await fetch(`${BASE_URL}/api/public/contact-form/recaptcha/site-key`);
    if (!response.ok) {
      throw new Error('Failed to fetch reCAPTCHA site key');
    }
    return response.json();
  },

  /**
   * Submits the contact form to the backend
   */
  submitContactForm: async (payload: ContactFormPayload): Promise<ApiResponse<any>> => {
    const response = await fetch(`${BASE_URL}/api/public/contact-form/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fullName: payload.fullName,
        emailAddress: payload.emailAddress,
        phoneNumber: payload.phoneNumber || '',
        primaryUseCase: payload.primaryUseCase || '',
        interestedPlan: payload.interestedPlan || '',
        recaptchaToken: payload.recaptchaToken,
        additionalMessage: payload.additionalMessage || '',
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to submit contact form');
    }
    
    return response.json();
  }
};
