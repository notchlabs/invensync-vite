import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { MsalProvider } from '@azure/msal-react';
import { EventType, type AuthenticationResult } from '@azure/msal-browser';
import { msalInstance } from './config/msal';
import { ThemeProvider } from './context/ThemeContext.tsx';

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Root element #root not found')
const root = createRoot(rootEl)

// ─── Render immediately — landing page is fully visible at once ───────────────
root.render(
  <StrictMode>
    <ThemeProvider>
      <MsalProvider instance={msalInstance}>
        <App />
      </MsalProvider>
    </ThemeProvider>
  </StrictMode>,
)

// ─── Initialize MSAL in background — does not block first paint ───────────────
msalInstance.initialize().then(async () => {
  msalInstance.addEventCallback((event) => {
    if (
      (event.eventType === EventType.LOGIN_SUCCESS ||
       event.eventType === EventType.ACQUIRE_TOKEN_SUCCESS) &&
      event.payload
    ) {
      const result = event.payload as AuthenticationResult
      if (result.account) {
        msalInstance.setActiveAccount(result.account)
      }
    }
  })

  try {
    const response = await msalInstance.handleRedirectPromise()
    if (response) {
      msalInstance.setActiveAccount(response.account)
    }
  } catch (error: unknown) {
    const err = error as { errorCode?: string }
    if (err?.errorCode === 'no_token_request_cache_error') {
      console.warn('MSAL: Stale auth code removed')
    } else {
      console.error('MSAL redirect error:', error)
    }
    window.history.replaceState(null, '', window.location.pathname + window.location.search)
  }

  if (!msalInstance.getActiveAccount()) {
    const accounts = msalInstance.getAllAccounts()
    if (accounts.length > 0) {
      msalInstance.setActiveAccount(accounts[0])
    }
  }
})
