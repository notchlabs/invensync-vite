import { type Configuration, PublicClientApplication } from '@azure/msal-browser';
import { ENV } from './env';

/**
 * Configuration object to be passed to MSAL instance on creation. 
 * For a full list of MSAL.js configuration parameters, visit:
 * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/configuration.md 
 */
export const msalConfig: Configuration = {
  auth: {
    clientId: ENV.MICROSOFT_CLIENT_ID,
    authority: ENV.MICROSOFT_AUTHORITY_URI,
    redirectUri: ENV.MICROSOFT_REDIRECT_URI,
    postLogoutRedirectUri: ENV.MICROSOFT_REDIRECT_URI,
  },
  cache: {
    cacheLocation: 'localStorage', // This configures where your cache will be stored
  },
};

/**
 * Scopes you add here will be prompted for user consent during sign-in.
 * By default, MSAL.js will add OIDC scopes (openid, profile, email) to any login request.
 */
export const loginRequest = {
  scopes: [
    'api://ba463cd3-2636-4bc3-a12c-b98ff35ce87c/access_as_user',
    'User.Read',
    'openid',
    'profile',
    'offline_access'
  ]
};

/**
 * Add here the endpoints and scopes when obtaining an access token for protected web APIs.
 * This mimics the functionality of the MsalInterceptor protectedResourceMap in Angular.
 */
export const protectedResources = {
  graphMe: {
    endpoint: "https://graph.microsoft.com/v1.0/me",
    scopes: ["User.Read"],
  },
  graphUsers: {
    endpoint: "https://graph.microsoft.com/v1.0/users",
    scopes: ["User.Read.All"],
  },
  apiCore: {
    endpoint: ENV.API_BASE_URL, // e.g. http://localhost:8090/api/v1
    scopes: ["api://ba463cd3-2636-4bc3-a12c-b98ff35ce87c/access_as_user"],
  }
};

export const msalInstance = new PublicClientApplication(msalConfig);
