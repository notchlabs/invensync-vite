import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { MsalProvider } from '@azure/msal-react';
import { EventType, type AuthenticationResult } from '@azure/msal-browser';
import { msalInstance } from './config/msal';
import { ThemeProvider } from './context/ThemeContext.tsx';

// Initialize MSAL instance before rendering (required for MSAL v3)
msalInstance.initialize().then(async () => {

  // ── Set active account on login events ───────────────────────────────
  msalInstance.addEventCallback((event) => {
    if (
      (event.eventType === EventType.LOGIN_SUCCESS ||
       event.eventType === EventType.ACQUIRE_TOKEN_SUCCESS) &&
      event.payload
    ) {
      const result = event.payload as AuthenticationResult;
      if (result.account) {
        msalInstance.setActiveAccount(result.account);
      }
    }
  });

  // ── Handle redirect (code exchange + navigate back to original page) ─
  // This MUST run before React renders so MSAL can:
  //   1. Exchange the #code= for tokens
  //   2. Navigate back to the original URL the user was on before login
  // If the code is stale (no matching cache entry), we just clear the URL.
  try {
    const response = await msalInstance.handleRedirectPromise();
    if (response) {
      msalInstance.setActiveAccount(response.account);
    }
  } catch (error: unknown) {
    const err = error as { errorCode?: string }
    if (err?.errorCode === 'no_token_request_cache_error') {
      // Stale auth code from a previous attempt — clean URL silently
      console.warn('MSAL: Stale auth code removed');
    } else {
      console.error('MSAL redirect error:', error);
    }
    // Clean the URL so the app can proceed without the bad hash
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }

  // ── Restore cached session (returning user, no redirect) ─────────────
  if (!msalInstance.getActiveAccount()) {
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length > 0) {
      msalInstance.setActiveAccount(accounts[0]);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ThemeProvider>
        <MsalProvider instance={msalInstance}>
          <App />
        </MsalProvider>
      </ThemeProvider>
    </StrictMode>,
  );
});
