import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useMsal, useIsAuthenticated } from '@azure/msal-react'
import { InteractionStatus } from '@azure/msal-browser'
import { loginRequest } from '../config/msal'
import { Loader2 } from 'lucide-react'

const AuthGuard = () => {
  const { instance, inProgress } = useMsal()
  const isAuthenticated = useIsAuthenticated()

  useEffect(() => {
    // Only trigger login if no interaction is currently in progress
    if (!isAuthenticated && inProgress === InteractionStatus.None) {
      instance.loginRedirect(loginRequest).catch((error) => {
        console.error('AuthGuard: Login redirect failed', error)
      })
    }
  }, [isAuthenticated, inProgress, instance])

  // MSAL is still initialising / handling a redirect / refreshing tokens — wait silently
  if (inProgress !== InteractionStatus.None) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-app">
        <Loader2 size={28} className="animate-spin text-muted-text" />
      </div>
    )
  }

  // MSAL is idle and user is definitively not authenticated — redirect to login
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-app gap-4">
        <Loader2 size={28} className="animate-spin text-muted-text" />
        <p className="text-[13px] font-medium text-muted-text">Redirecting to login...</p>
      </div>
    )
  }

  // Authenticated — render the protected child route
  return <Outlet />
}

export default AuthGuard

