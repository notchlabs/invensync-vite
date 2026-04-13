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

  // Not authenticated and no interaction in progress — will trigger redirect on next render
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-4">
        <Loader2 size={32} className="animate-spin text-neutral-400" />
        <p className="text-[14px] font-medium text-neutral-500">Redirecting to login...</p>
      </div>
    )
  }

  // Authenticated — render the protected child route
  return <Outlet />
}

export default AuthGuard

