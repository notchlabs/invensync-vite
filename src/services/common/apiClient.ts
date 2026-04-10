import { InteractionRequiredAuthError, CacheLookupPolicy } from '@azure/msal-browser';
import { msalInstance, loginRequest, protectedResources } from '../../config/msal';

/**
 * Checks if a given URL matches any of our protected resources
 * and returns the scopes needed for that resource.
 */
const getScopesForEndpoint = (endpoint: string): string[] | null => {
  if (endpoint.includes(protectedResources.graphMe.endpoint)) {
    return protectedResources.graphMe.scopes;
  }
  if (endpoint.includes(protectedResources.graphUsers.endpoint)) {
    return protectedResources.graphUsers.scopes;
  }
  // Any backend API call to our own server (environment.invensynccore.baseUrl)
  if (endpoint.includes(protectedResources.apiCore.endpoint)) {
    return protectedResources.apiCore.scopes;
  }
  return null;
};

/**
 * A custom fetch wrapper that automatically dynamically attaches Azure AD MSAL Bearer tokens
 * to outgoing API requests if the endpoint is mapped in our protected resources. 
 * This effectively replaces Angular's HTTP_INTERCEPTOR.
 */
export const authenticatedFetch = async (
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> => {
  const endpoint = typeof input === 'string' ? input : (input as Request).url;
  let authToken = '';

  // 1. Determine if this endpoint requires a token
  const requiredScopes = getScopesForEndpoint(endpoint);

  // 2. If it does, try to silently acquire a token
  if (requiredScopes) {
    const account = msalInstance.getActiveAccount() ?? msalInstance.getAllAccounts()[0];

    if (account) {
      try {
        const response = await msalInstance.acquireTokenSilent({
          scopes: requiredScopes,
          account: account,
          // Only use cache + refresh token. Do NOT fall back to hidden iframe.
          // The iframe approach causes Chrome sandbox warnings and fails when
          // the Azure AD session doesn't exist (AADSTS160021).
          cacheLookupPolicy: CacheLookupPolicy.AccessTokenAndRefreshToken,
        });
        authToken = response.accessToken;
      } catch (error) {
        // If the error requires user interaction (expired session, consent needed, etc.)
        // redirect to login instead of popup — popups are blocked when not triggered
        // by a direct user click (e.g. from useEffect / API calls).
        if (error instanceof InteractionRequiredAuthError) {
          console.warn('Token requires interaction — redirecting to login');
          await msalInstance.acquireTokenRedirect({
            ...loginRequest,
            scopes: requiredScopes,
            account: account
          });
          // acquireTokenRedirect navigates away — execution won't continue past here.
          // When the user returns, handleRedirectPromise picks up the new tokens.
          throw new Error('Redirecting to login for token renewal');
        }
        console.error('Silent token acquisition failed with unexpected error', error);
        throw new Error('Authentication required');
      }
    } else {
      console.warn("No active account found. Redirecting to login.");
      await msalInstance.loginRedirect(loginRequest);
      throw new Error('Redirecting to login');
    }
  }

  // 3. Clone headers and attach token if we got one
  const headers = new Headers(init?.headers);
  if (authToken) {
    headers.set('Authorization', `Bearer ${authToken}`);
  }

  // 4. Fire the actual request
  return fetch(input, {
    ...init,
    headers,
  });
};

