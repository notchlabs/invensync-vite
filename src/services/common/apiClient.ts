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
    const account = msalInstance.getAllAccounts()[0]; // Assumes single-account scenario 

    if (account) {
      try {
        const response = await msalInstance.acquireTokenSilent({
          ...loginRequest,
          scopes: requiredScopes,
          account: account
        });
        authToken = response.accessToken;
      } catch (error) {
        console.warn("Silent token acquisition failed. Requesting interaction.", error);
        // Fallback to interaction if silent fails (e.g. expired refresh token)
        try {
          const response = await msalInstance.acquireTokenPopup({
            ...loginRequest,
            scopes: requiredScopes
          });
          authToken = response.accessToken;
        } catch (popupError) {
          console.error("Popup authentication failed", popupError);
          // If popup fails, throw or redirect to login.
          throw new Error('Authentication required');
        }
      }
    } else {
      console.warn("No active account found. Proceeding without MSAL token for:", endpoint);
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
